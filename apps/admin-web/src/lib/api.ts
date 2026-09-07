/**
 * Fachada de domínio do Admin Web sobre o services/api-gateway (real).
 * Mantém as assinaturas consumidas pelas páginas (getPacientes, getPaciente,
 * getProntuario, getPlanosAlimentares, getPlanoAlimentar, getFaturas) e mapeia
 * o SHAPE real do gateway para os tipos de src/types.
 *
 * Rotas reais (confirmadas nos *.controller.ts do gateway):
 * - GET /pacientes ; GET /pacientes/:id
 * - GET /pacientes/:pacienteId/prontuarios ; /:id            (NINHADAS, não flat)
 * - GET /pacientes/:pacienteId/planos-alimentares ; /:id ; /:id/calculo
 * - GET /assinaturas/me ; GET /assinaturas/me/faturas
 * - GET /nutricionistas/me
 */

import { request, ApiError } from "@/lib/apiClient";
import type { components } from "@/lib/api-types";
import {
  Assinatura,
  Fatura,
  Nutricionista,
  Paciente,
  PlanoAlimentar,
  Prontuario,
  Refeicao,
  StatusFatura,
  StatusPaciente,
} from "@/types";

// ---------------------------------------------------------------------------
// Shapes reais do gateway (parciais, só o que consumimos).
// ---------------------------------------------------------------------------

interface PacienteApi {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  dataNascimento: string | null;
  statusConsentimento: "PENDENTE" | "ACEITO" | "REVOGADO";
  ativo: boolean;
}

// Fonte única de tipos (item 7): gerados do contrato OpenAPI do gateway.
type ProntuarioApi = components["schemas"]["ProntuarioDto"];
type PlanoAlimentarApi = components["schemas"]["PlanoAlimentarDto"];

// Retorno de GET /pacientes/:pacienteId/planos-alimentares/:id/calculo
interface CalculoApi {
  porRefeicao: {
    nome?: string;
    horario?: string;
    itens: {
      descricao?: string;
      alimentoCodigo?: number;
      quantidadeGramas?: number;
      fonte: { tabela: string; codigo: number; descricao: string } | null;
      kcal?: number;
      proteinaG?: number;
      lipideosG?: number;
      carboidratoG?: number;
    }[];
  }[];
}

// Fonte única de tipos (item 7): gerados do contrato OpenAPI do gateway.
type FaturaApi = components["schemas"]["FaturaDto"];
type AssinaturaApi = components["schemas"]["AssinaturaDto"];

// Fonte única de tipos (item 7): gerado do contrato OpenAPI do gateway.
// Rode `npm run types:gen` após mudar o backend. Não redefinir à mão.
type NutricionistaApi = components["schemas"]["NutricionistaMeDto"];

// ---------------------------------------------------------------------------
// Mapeamentos
// ---------------------------------------------------------------------------

function derivarStatusPaciente(p: PacienteApi): StatusPaciente {
  if (!p.ativo) return "inativo";
  if (p.statusConsentimento !== "ACEITO") return "aguardando_consentimento";
  return "ativo";
}

function mapPaciente(p: PacienteApi): Paciente {
  return {
    id: p.id,
    nome: p.nome,
    email: p.email,
    telefone: p.telefone ?? "",
    dataNascimento: p.dataNascimento ?? "",
    status: derivarStatusPaciente(p),
    // GAP: gateway não expõe "última consulta". Ver relatório.
    ultimaConsulta: undefined,
  };
}

export async function getPacientes(): Promise<Paciente[]> {
  const pacientes = await request<PacienteApi[]>("/pacientes");
  return pacientes.map(mapPaciente);
}

export async function getPaciente(id: string): Promise<Paciente | undefined> {
  const p = await request<PacienteApi>(`/pacientes/${id}`);
  return mapPaciente(p);
}

type RegistroPesoApi = components["schemas"]["RegistroPesoDto"];

// Peso auto-lançado pelo paciente na PWA (tabela RegistroPeso). Rota de nutri:
// GET /pacientes/:pacienteId/peso. Complementa a antropometria do prontuário —
// é o que faz o peso registrado pelo paciente aparecer na visão da nutri.
export async function getRegistrosPeso(
  pacienteId: string
): Promise<{ data: string; pesoKg: number }[]> {
  const registros = await request<RegistroPesoApi[]>(
    `/pacientes/${pacienteId}/peso`
  );
  return registros.map((r) => ({
    data: r.registradoEm.slice(0, 10),
    pesoKg: Number(r.pesoKg),
  }));
}

// O prontuário real é FLAT e é um snapshot por consulta. Reconstruímos:
// - anamnese ← campos do prontuário MAIS RECENTE;
// - antropometria[] ← série montada a partir de TODOS os prontuários com peso
//   (aproximação da série; ver GAP no relatório: a série de peso auto-lançada
//   pelo paciente vem de RegistroPeso, sem rota de nutricionista).
export async function getProntuario(
  pacienteId: string
): Promise<Prontuario | undefined> {
  const lista = await request<ProntuarioApi[]>(
    `/pacientes/${pacienteId}/prontuarios`
  );
  if (lista.length === 0) return undefined;

  // Gateway ordena criadoEm desc — o primeiro é o mais recente.
  const recente = lista[0];

  const restricoes = [recente.alergias, recente.intolerancias].filter(
    (v): v is string => Boolean(v)
  );
  const condicoesClinicas = [
    recente.historicoClinico,
    recente.usoMedicamentos,
  ].filter((v): v is string => Boolean(v));

  const antropometria = lista
    .filter((pr) => pr.pesoKg != null)
    .map((pr) => ({
      data: pr.criadoEm.slice(0, 10),
      pesoKg: Number(pr.pesoKg),
      alturaCm: pr.alturaCm != null ? Number(pr.alturaCm) : 0,
      imc: pr.imc != null ? Number(pr.imc) : 0,
    }))
    // série cronológica ascendente para o gráfico de evolução
    .reverse();

  return {
    pacienteId,
    anamnese: {
      queixaPrincipal: recente.queixaPrincipal ?? "",
      // Front usa "historicoAlimentar"; real tem "habitosAlimentares".
      historicoAlimentar: recente.habitosAlimentares ?? "",
      // GAP: restricoes/condicoesClinicas não são arrays estruturados no
      // schema — derivados de campos-texto (alergias/intolerâncias e
      // histórico clínico/medicamentos). Ver relatório.
      restricoes,
      condicoesClinicas,
      atualizadoEm: recente.atualizadoEm.slice(0, 10),
    },
    antropometria,
  };
}

// Lista planos de UM paciente (rota real é ninhada). A antiga getPlanosAlimentares()
// mockada listava todos e a página filtrava por pacienteId — agora buscamos
// direto os do paciente.
export async function getPlanosAlimentaresDoPaciente(
  pacienteId: string
): Promise<PlanoAlimentar[]> {
  const planos = await request<PlanoAlimentarApi[]>(
    `/pacientes/${pacienteId}/planos-alimentares`
  );
  return planos.map((p) => mapPlanoResumo(p));
}

function mapPlanoResumo(p: PlanoAlimentarApi): PlanoAlimentar {
  return {
    id: p.id,
    pacienteId: p.pacienteId,
    nome: p.titulo,
    criadoEm: p.criadoEm.slice(0, 10),
    origem: p.origem === "IA_RASCUNHO" ? "ia_rascunho" : "manual",
    aprovado: p.aprovadoPeloNutri,
    refeicoes: [],
  };
}

// Detalhe do plano: exige pacienteId (rota ninhada). Junta o plano com o
// resultado do endpoint /calculo (que traz os macros por item a partir da
// TACO — não estão no JSON bruto de refeicoes).
export async function getPlanoAlimentar(
  pacienteId: string,
  id: string
): Promise<PlanoAlimentar | undefined> {
  const [plano, calculo] = await Promise.all([
    request<PlanoAlimentarApi>(
      `/pacientes/${pacienteId}/planos-alimentares/${id}`
    ),
    request<CalculoApi>(
      `/pacientes/${pacienteId}/planos-alimentares/${id}/calculo`
    ),
  ]);

  const refeicoes: Refeicao[] = calculo.porRefeicao.map((r, ri) => ({
    id: `ref-${ri}`,
    nome: r.nome ?? "Refeição",
    horario: r.horario ?? "",
    itens: r.itens.map((item, ii) => ({
      id: `item-${ri}-${ii}`,
      nome: item.fonte?.descricao ?? item.descricao ?? "Item",
      quantidade:
        item.quantidadeGramas != null ? `${item.quantidadeGramas} g` : "—",
      // GAP: backend só tem TACO (TBCA não existe). fonte sempre "TACO";
      // itens sem alimentoCodigo (fonte null) entram com macros zerados.
      fonte: "TACO",
      kcal: Math.round(item.kcal ?? 0),
      proteinasG: Math.round(item.proteinaG ?? 0),
      carboidratosG: Math.round(item.carboidratoG ?? 0),
      gordurasG: Math.round(item.lipideosG ?? 0),
    })),
  }));

  return {
    id: plano.id,
    pacienteId: plano.pacienteId,
    nome: plano.titulo,
    criadoEm: plano.criadoEm.slice(0, 10),
    origem: plano.origem === "IA_RASCUNHO" ? "ia_rascunho" : "manual",
    aprovado: plano.aprovadoPeloNutri,
    refeicoes,
  };
}

// ---------------------------------------------------------------------------
// Editor de plano (item 17, fatia 4): busca TACO + leitura CRUA do plano.
// ---------------------------------------------------------------------------

// Alimento da base TACO (valores por 100g). Fonte única de tipos (item 7):
// gerado do contrato OpenAPI. Campos nutricionais são `number | null`.
export type AlimentoTaco = components["schemas"]["AlimentoTacoDto"];

// GET /alimentos?search=<termo> — busca na base TACO para o editor de plano.
export async function getAlimentos(search: string): Promise<AlimentoTaco[]> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return request<AlimentoTaco[]>(`/alimentos${query}`);
}

// Estrutura CRUA de refeições (o JSON exatamente como o gateway persiste e como
// o cálculo TACO espera). NÃO confundir com o tipo Refeicao de exibição (que já
// vem calculado via /calculo). Só os campos abaixo são reconhecidos pelo cálculo.
export interface ItemRefeicaoRaw {
  descricao?: string;
  alimentoCodigo?: number;
  quantidadeGramas?: number;
}

export interface RefeicaoRaw {
  nome?: string;
  horario?: string;
  itens?: ItemRefeicaoRaw[];
}

export interface PlanoAlimentarRaw {
  id: string;
  pacienteId: string;
  titulo: string;
  objetivo: string;
  caloriasAlvo: number | null;
  observacoes: string;
  refeicoes: RefeicaoRaw[];
  aprovadoPeloNutri: boolean;
}

// Leitura CRUA do plano para EDIÇÃO (GET /pacientes/:pacienteId/planos-alimentares/:id).
// Diferente de getPlanoAlimentar (que mapeia via /calculo para EXIBIÇÃO): aqui
// devolvemos o JSON de refeicoes intacto, para o editor reidratar os campos.
export async function getPlanoAlimentarRaw(
  pacienteId: string,
  id: string
): Promise<PlanoAlimentarRaw | undefined> {
  let plano: PlanoAlimentarApi;
  try {
    plano = await request<PlanoAlimentarApi>(
      `/pacientes/${pacienteId}/planos-alimentares/${id}`
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    throw e;
  }

  const refeicoesRaw = Array.isArray(plano.refeicoes)
    ? (plano.refeicoes as RefeicaoRaw[])
    : [];

  return {
    id: plano.id,
    pacienteId: plano.pacienteId,
    titulo: plano.titulo,
    objetivo: plano.objetivo ?? "",
    caloriasAlvo: plano.caloriasAlvo,
    observacoes: plano.observacoes ?? "",
    refeicoes: refeicoesRaw,
    aprovadoPeloNutri: plano.aprovadoPeloNutri,
  };
}

// ---------------------------------------------------------------------------
// Editor de prontuário (item 18): leitura CRUA do prontuário mais recente.
// ---------------------------------------------------------------------------

// Prontuário CRU para EDIÇÃO. Diferente de getProntuario (que mapeia p/ exibição
// e deriva restrições/condições, perdendo campos): aqui devolvemos TODOS os
// campos, com os numéricos já convertidos (backend serializa Decimal como string,
// ex.: pesoKg "90.00"). Todos opcionais/null. Usado para pré-preencher o form
// de nova consulta a partir do último registro.
export interface ProntuarioRaw {
  id: string;
  pacienteId: string;
  queixaPrincipal: string | null;
  historicoClinico: string | null;
  historicoFamiliar: string | null;
  habitosAlimentares: string | null;
  usoMedicamentos: string | null;
  alergias: string | null;
  intolerancias: string | null;
  nivelAtividadeFisica: string | null;
  observacoesGerais: string | null;
  pesoKg: number | null;
  alturaCm: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  percentualGordura: number | null;
  imc: number | null;
  criadoEm: string;
  atualizadoEm: string;
}


function numOuNull(v: string | null): number | null {
  return v != null ? Number(v) : null;
}

// GET /pacientes/:pacienteId/prontuarios → lista ordenada por criadoEm DESC.
// Devolve o [0] (mais recente) cru, ou undefined se não houver nenhum.
export async function getProntuarioRaw(
  pacienteId: string
): Promise<ProntuarioRaw | undefined> {
  const lista = await request<ProntuarioApi[]>(
    `/pacientes/${pacienteId}/prontuarios`
  );
  if (lista.length === 0) return undefined;
  const p = lista[0];
  return {
    id: p.id,
    pacienteId: p.pacienteId,
    queixaPrincipal: p.queixaPrincipal,
    historicoClinico: p.historicoClinico,
    historicoFamiliar: p.historicoFamiliar,
    habitosAlimentares: p.habitosAlimentares,
    usoMedicamentos: p.usoMedicamentos,
    alergias: p.alergias,
    intolerancias: p.intolerancias,
    nivelAtividadeFisica: p.nivelAtividadeFisica,
    observacoesGerais: p.observacoesGerais,
    pesoKg: numOuNull(p.pesoKg),
    alturaCm: numOuNull(p.alturaCm),
    circunferenciaCintura: numOuNull(p.circunferenciaCintura),
    circunferenciaQuadril: numOuNull(p.circunferenciaQuadril),
    percentualGordura: numOuNull(p.percentualGordura),
    imc: numOuNull(p.imc),
    criadoEm: p.criadoEm,
    atualizadoEm: p.atualizadoEm,
  };
}

// ---------------------------------------------------------------------------
// Assinatura / faturas / perfil
// ---------------------------------------------------------------------------

function competenciaDe(vencimento: string): string {
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const d = new Date(vencimento);
  if (Number.isNaN(d.getTime())) return vencimento;
  return `${meses[d.getMonth()]}/${d.getFullYear()}`;
}

function mapStatusFatura(s: FaturaApi["status"]): StatusFatura {
  if (s === "paga") return "paga";
  if (s === "falhou") return "falhou";
  return "pendente"; // "pendente" e "outro" (Asaas raro) caem aqui.
}

export async function getFaturas(): Promise<Fatura[]> {
  let faturas: FaturaApi[];
  try {
    faturas = await request<FaturaApi[]>("/assinaturas/me/faturas");
  } catch (e) {
    // Sem assinatura (404) ou sem plano ativo (403): não há faturas e a
    // página não deve quebrar — devolve lista vazia.
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) return [];
    throw e;
  }
  return faturas.map((f) => ({
    id: f.id,
    // GAP: gateway não retorna "competência" — derivada do vencimento.
    competencia: competenciaDe(f.vencimento),
    valor: f.valor,
    status: mapStatusFatura(f.status),
    vencimento: f.vencimento.slice(0, 10),
    reciboUrl: f.reciboUrl ?? undefined,
  }));
}

export async function getAssinatura(): Promise<Assinatura | undefined> {
  try {
    const a = await request<AssinaturaApi>("/assinaturas/me");
    return { plano: a.plano, status: a.status, trialAte: a.trialAte };
  } catch {
    // Sem assinatura ainda (404) — trata como "sem plano".
    return undefined;
  }
}

export async function getNutricionistaAtual(): Promise<Nutricionista> {
  const n = await request<NutricionistaApi>("/nutricionistas/me");
  return {
    id: n.id,
    nome: n.nome,
    email: n.email,
    crn: n.crn,
    cpfCnpj: n.cpfCnpj ?? "",
    telefone: n.telefone ?? "",
  };
}
