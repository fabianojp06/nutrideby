// Cliente real do services/api-gateway. Substitui mockApi.ts — mantém as
// mesmas interfaces (ConsentTerm, DailyProgress, WeightEntry, MealEntry)
// para minimizar mudança nas páginas que já consomem esses tipos.
import { apiClient } from './apiClient';
import { decodeJwt } from './jwt';
import type { components } from './api-types';

export interface ConsentTerm {
  id: string;
  version: string;
  title: string;
  body: string;
}

// Origem do plano vinda do gateway. `ia_rascunho` sinaliza que o plano
// nasceu de um rascunho gerado por IA (já revisado/aprovado pela nutri,
// pois o paciente só recebe planos aprovados) — dispara o disclaimer CFN.
export type PlanOrigin = 'manual' | 'ia_rascunho';

export interface DailyProgress {
  kcalGoal: number;
  kcalConsumed: number;
  kcalRemaining: number;
  macros: { protein: number; carbs: number; fat: number };
  nextMeals: { time: string; label: string }[];
  weight: { current: number; deltaLastWeek: number };
  diaryEntriesToday: number;
  // Origem do plano ativo (null quando não há plano ativo aprovado).
  planOrigin: PlanOrigin | null;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface MealEntry {
  id: string;
  time: string;
  description: string;
  photoUrl?: string;
}

// --- Termo de Consentimento ---
// Conteúdo do termo é texto legal estático (não há endpoint no backend que
// sirva o texto — só a versão é registrada no aceite). Manter aqui evita
// inventar um endpoint só para servir texto fixo.
const TERMO_ATUAL: ConsentTerm = {
  id: 'consent-2026-01',
  version: '1.0',
  title: 'Termo de Consentimento para Tratamento de Dados de Saúde',
  body:
    'Ao aceitar, você autoriza a NutriDeby a tratar seus dados de saúde ' +
    '(peso, alimentação, evolução clínica) para fins de acompanhamento ' +
    'nutricional, conforme a LGPD (Lei 13.709/2018). Seus dados são ' +
    'criptografados e acessados apenas pela equipe responsável pelo seu ' +
    'atendimento. Você pode revogar este consentimento a qualquer momento ' +
    'em Perfil > Privacidade.',
};

export async function fetchPendingConsentTerm(): Promise<ConsentTerm | null> {
  return TERMO_ATUAL;
}

export async function acceptConsentTerm(_termId: string): Promise<{ acceptedAt: string }> {
  await apiClient.request('/pacientes/me/consentimento', {
    method: 'POST',
    body: JSON.stringify({ versaoTermo: TERMO_ATUAL.version }),
  });
  return { acceptedAt: new Date().toISOString() };
}

// --- Autenticação ---

export interface LoginResult {
  token: string;
  name: string;
  statusConsentimento: 'PENDENTE' | 'ACEITO' | 'REVOGADO';
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const resposta = await apiClient.request<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha: password, role: 'PACIENTE' }),
  });

  // O backend não retorna nome do paciente no login — usamos o prefixo do
  // e-mail como nome de exibição (mesma heurística usada no mock anterior).
  const payload = decodeJwt(resposta.accessToken);
  return {
    token: resposta.accessToken,
    name: payload?.email?.split('@')[0] ?? 'Paciente',
    statusConsentimento: payload?.statusConsentimento ?? 'PENDENTE',
  };
}

// --- Peso (US-14) ---

// Fonte única de tipos (item 7): gerados do contrato OpenAPI do gateway.
type RegistroPesoApi = components['schemas']['RegistroPesoDto'];

export async function fetchWeightHistory(): Promise<WeightEntry[]> {
  const registros = await apiClient.request<RegistroPesoApi[]>('/me/peso');
  return registros.map((r) => ({ date: r.registradoEm.slice(0, 10), kg: Number(r.pesoKg) }));
}

export async function registerWeight(kg: number): Promise<WeightEntry> {
  const registro = await apiClient.request<RegistroPesoApi>('/me/peso', {
    method: 'POST',
    body: JSON.stringify({ pesoKg: kg }),
  });
  return { date: registro.registradoEm.slice(0, 10), kg: Number(registro.pesoKg) };
}

// --- Diário alimentar (US-13) ---

type RegistroDiarioApi = components['schemas']['RegistroDiarioDto'];

function mapDiario(r: RegistroDiarioApi): MealEntry {
  return {
    id: r.id,
    time: new Date(r.registradoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    description: r.texto ?? '',
    photoUrl: r.fotoUrl ?? undefined,
  };
}

export async function fetchDiaryEntries(): Promise<MealEntry[]> {
  const registros = await apiClient.request<RegistroDiarioApi[]>('/me/diario');
  const hoje = new Date().toISOString().slice(0, 10);
  return registros.filter((r) => r.registradoEm.startsWith(hoje)).map(mapDiario);
}

// `photoUrl` do formulário (Diário) hoje é um blob: local (URL.createObjectURL,
// nunca sai do navegador) — não existe serviço de upload/armazenamento de
// imagem implementado ainda, então NÃO enviamos essa URL ao backend (ela
// não resolveria para ninguém além de quem tirou a foto). Só o texto é
// persistido. Ver DiaryPage.tsx.
export async function registerMealEntry(entry: Omit<MealEntry, 'id'>): Promise<MealEntry> {
  const registro = await apiClient.request<RegistroDiarioApi>('/me/diario', {
    method: 'POST',
    body: JSON.stringify({ texto: entry.description || undefined }),
  });
  return mapDiario(registro);
}

// --- Dashboard (Home) ---

type PlanoAlimentarApi = components['schemas']['PlanoAlimentarDto'];

// `refeicoes` é JSON livre no contrato; a PWA só lê nome/horario.
type RefeicaoPwa = { nome?: string; horario?: string };

function mapOrigem(origem?: 'MANUAL' | 'IA_RASCUNHO'): PlanOrigin {
  return origem === 'IA_RASCUNHO' ? 'ia_rascunho' : 'manual';
}

type CalculoApi = components['schemas']['CalculoNutricionalDto'];

// --- Plano alimentar completo (tela "Plano") ---

export interface MealPlanItem {
  descricao: string;
  quantidadeGramas: number | null;
  kcal: number | null;
}

export interface MealPlanMeal {
  nome: string;
  horario: string;
  totalKcal: number;
  itens: MealPlanItem[];
}

export interface MealPlan {
  titulo: string;
  observacoes: string | null;
  origem: PlanOrigin;
  totalKcal: number;
  macros: { protein: number; carbs: number; fat: number };
  refeicoes: MealPlanMeal[];
}

// Plano ativo e aprovado do paciente + macros calculados pela TACO
// (GET /me/planos-alimentares -> escolhe o ativo/aprovado -> /:id/calculo).
// Retorna null quando ainda não há plano aprovado.
export async function fetchMealPlan(): Promise<MealPlan | null> {
  const planos = await apiClient.request<PlanoAlimentarApi[]>('/me/planos-alimentares');
  const plano = planos.find((p) => p.ativo && p.aprovadoPeloNutri) ?? null;
  if (!plano) return null;

  const calculo = await apiClient.request<CalculoApi>(
    `/me/planos-alimentares/${plano.id}/calculo`,
  );

  return {
    titulo: plano.titulo,
    observacoes: plano.observacoes,
    origem: mapOrigem(plano.origem),
    totalKcal: Math.round(plano.caloriasAlvo ?? calculo.total.kcal),
    macros: {
      protein: Math.round(calculo.total.proteinaG),
      carbs: Math.round(calculo.total.carboidratoG),
      fat: Math.round(calculo.total.lipideosG),
    },
    refeicoes: calculo.porRefeicao.map((r) => ({
      nome: r.nome ?? 'Refeição',
      horario: r.horario ?? '',
      totalKcal: Math.round(r.total.kcal),
      itens: r.itens.map((i) => ({
        descricao: i.fonte?.descricao ?? i.descricao ?? 'Item',
        quantidadeGramas: i.quantidadeGramas ?? null,
        kcal: i.kcal != null ? Math.round(i.kcal) : null,
      })),
    })),
  };
}

export async function fetchDailyProgress(): Promise<DailyProgress> {
  const [planos, historicoPeso, diarioHoje] = await Promise.all([
    apiClient.request<PlanoAlimentarApi[]>('/me/planos-alimentares'),
    fetchWeightHistory(),
    fetchDiaryEntries(),
  ]);

  const planoAtivo = planos.find((p) => p.ativo && p.aprovadoPeloNutri) ?? null;
  const calculo = planoAtivo
    ? await apiClient.request<CalculoApi>(`/me/planos-alimentares/${planoAtivo.id}/calculo`)
    : null;

  const kcalGoal = planoAtivo?.caloriasAlvo ?? calculo?.total.kcal ?? 0;

  const agora = new Date().toTimeString().slice(0, 5);
  const nextMeals = ((planoAtivo?.refeicoes ?? []) as RefeicaoPwa[])
    .filter((r) => r.horario && r.horario >= agora)
    .sort((a, b) => (a.horario ?? '').localeCompare(b.horario ?? ''))
    .slice(0, 3)
    .map((r) => ({ time: r.horario ?? '', label: r.nome ?? 'Refeição' }));

  const ultimoPeso = historicoPeso[historicoPeso.length - 1];
  const pesoAnterior = historicoPeso[historicoPeso.length - 2];

  return {
    kcalGoal,
    // O diário alimentar (Fase 0) é texto/foto livre, sem vínculo com a
    // TACO — não há como calcular calorias efetivamente consumidas ainda.
    // Fica 0 até o diário estruturado existir (fora do escopo desta fase).
    kcalConsumed: 0,
    kcalRemaining: kcalGoal,
    macros: {
      protein: Math.round(calculo?.total.proteinaG ?? 0),
      carbs: Math.round(calculo?.total.carboidratoG ?? 0),
      fat: Math.round(calculo?.total.lipideosG ?? 0),
    },
    nextMeals,
    weight: {
      current: ultimoPeso?.kg ?? 0,
      deltaLastWeek: ultimoPeso && pesoAnterior ? ultimoPeso.kg - pesoAnterior.kg : 0,
    },
    diaryEntriesToday: diarioHoje.length,
    planOrigin: planoAtivo ? mapOrigem(planoAtivo.origem) : null,
  };
}
