/**
 * Identificador do paciente no domínio do api-gateway (Prisma: Paciente.id).
 * Mantido como string para não acoplar este serviço ao tipo exato (uuid/cuid) usado lá.
 */
export type PacienteId = string;

export interface VinculoCanal {
  pacienteId: PacienteId;
  chatId: string;
  vinculadoEm: Date;
}

export interface LembreteConsultaPayload {
  pacienteId: PacienteId;
  dataHoraConsulta: string; // ISO 8601
  nutricionistaNome: string;
  observacao?: string;
}

export interface NovoPlanoPayload {
  pacienteId: PacienteId;
  nutricionistaNome: string;
  linkPlano?: string;
}

export interface BoasVindasPayload {
  pacienteId: PacienteId;
  pacienteNome: string;
}
