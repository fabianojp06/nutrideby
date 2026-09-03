/**
 * Abstração de canal de notificação ao paciente, agnóstica de tecnologia.
 *
 * Espelha o ChannelAdapter do services/telegram-bot, mas do lado do api-gateway:
 * isola "notificar o paciente" do canal concreto (Telegram hoje; e-mail/WhatsApp
 * quando o aditivo de DPA liberar). Consumidores dependem apenas desta interface,
 * nunca de um adaptador específico.
 *
 * IMPORTANTE (compliance/DPA): implementações que fazem envio real a paciente só
 * podem ser ativadas quando o aditivo de DPA do canal estiver assinado. Enquanto
 * isso, o canal padrão é `none` (CanalNotificacaoNoop) e nada é enviado.
 */
export interface CanalNotificacao {
  /**
   * Envia um lembrete de consulta ao paciente.
   * @returns true se entregue; false se o paciente não tem canal vinculado
   *          ou se o envio está inerte (canal desativado).
   */
  enviarLembrete(payload: LembreteConsultaPayload): Promise<boolean>;

  /**
   * Notifica o paciente que um novo plano alimentar foi disponibilizado.
   * @returns true se entregue; false se não vinculado / inerte.
   */
  notificarNovoPlano(payload: NovoPlanoPayload): Promise<boolean>;
}

export interface LembreteConsultaPayload {
  pacienteId: string;
  nutricionistaNome: string;
  dataHoraConsulta: string; // ISO 8601
  observacao?: string;
}

export interface NovoPlanoPayload {
  pacienteId: string;
  nutricionistaNome: string;
  linkPlano?: string;
}

/** Token de injeção do canal resolvido por configuração. */
export const CANAL_NOTIFICACAO = Symbol('CANAL_NOTIFICACAO');
