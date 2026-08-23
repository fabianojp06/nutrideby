import type {
  BoasVindasPayload,
  LembreteConsultaPayload,
  NovoPlanoPayload,
  PacienteId,
} from "../types";

/**
 * Adaptador de Canais (ver arquitetura_agentes_nutrideby.mmd).
 *
 * Isola "enviar mensagem para um paciente" do canal concreto usado para entregá-la.
 * Hoje só existe ChannelAdapterTelegram. Quando o WhatsApp Business API estiver
 * liberado (US-15/US-16 dependem do DPA atualizado), uma ChannelAdapterWhatsApp
 * implementa a mesma interface e um resolvedor de canal por preferência do
 * paciente decide qual adapter usar — sem tocar nos consumidores (HTTP handlers,
 * scheduler, api-gateway).
 */
export interface ChannelAdapter {
  /** Retorna false se o paciente ainda não vinculou uma conta neste canal. */
  enviarBoasVindas(payload: BoasVindasPayload): Promise<boolean>;
  enviarLembreteConsulta(payload: LembreteConsultaPayload): Promise<boolean>;
  enviarNovoPlanoDisponivel(payload: NovoPlanoPayload): Promise<boolean>;
  enviarMensagemLivre(pacienteId: PacienteId, texto: string): Promise<boolean>;
}
