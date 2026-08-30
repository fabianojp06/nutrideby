/**
 * Tipos do domínio do Admin Web.
 * Estrutura pensada para bater com o futuro contrato da API (services/api-gateway).
 */

// Catálogo estático de planos exibido na UI (chaves em minúsculo).
export type PlanoAssinatura = "starter" | "pro" | "clinica";

// Enum de plano como o gateway retorna (GET /assinaturas/me).
export type PlanoAssinaturaApi = "STARTER" | "PRO" | "CLINICA";
export type StatusAssinatura =
  | "TRIAL"
  | "ATIVA"
  | "INADIMPLENTE"
  | "CANCELADA"
  | "EXPIRADA";

export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  crn: string;
  cpfCnpj: string;
  telefone: string;
}

export interface Assinatura {
  plano: PlanoAssinaturaApi;
  status: StatusAssinatura;
  trialAte: string | null;
}

export type StatusPaciente =
  | "aguardando_consentimento"
  | "ativo"
  | "inativo";

export interface Paciente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  status: StatusPaciente;
  ultimaConsulta?: string;
}

export interface RegistroAntropometrico {
  data: string;
  pesoKg: number;
  alturaCm: number;
  imc: number;
}

export interface Anamnese {
  queixaPrincipal: string;
  historicoAlimentar: string;
  restricoes: string[];
  condicoesClinicas: string[];
  atualizadoEm: string;
}

export interface Prontuario {
  pacienteId: string;
  anamnese: Anamnese;
  antropometria: RegistroAntropometrico[];
}

export interface ItemRefeicao {
  id: string;
  nome: string;
  quantidade: string;
  fonte: "TACO" | "TBCA";
  kcal: number;
  proteinasG: number;
  carboidratosG: number;
  gordurasG: number;
}

export interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  itens: ItemRefeicao[];
}

export interface PlanoAlimentar {
  id: string;
  pacienteId: string;
  nome: string;
  criadoEm: string;
  origem: "manual" | "ia_rascunho";
  aprovado: boolean;
  refeicoes: Refeicao[];
}

export type StatusFatura = "paga" | "pendente" | "falhou";

export interface Fatura {
  id: string;
  competencia: string;
  valor: number;
  status: StatusFatura;
  vencimento: string;
  reciboUrl?: string;
}
