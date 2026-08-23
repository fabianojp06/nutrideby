import type { Bot } from "grammy";
import { vinculoRepository } from "../db/vinculoRepository";
import type { ChannelAdapter } from "./ChannelAdapter";
import type {
  BoasVindasPayload,
  LembreteConsultaPayload,
  NovoPlanoPayload,
  PacienteId,
} from "../types";

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

export class ChannelAdapterTelegram implements ChannelAdapter {
  constructor(private readonly bot: Bot) {}

  private async enviarParaPaciente(pacienteId: PacienteId, texto: string): Promise<boolean> {
    const chatId = await vinculoRepository.buscarChatIdPorPaciente(pacienteId);
    if (!chatId) {
      return false;
    }
    await this.bot.api.sendMessage(chatId, texto, { parse_mode: "HTML" });
    return true;
  }

  async enviarBoasVindas(payload: BoasVindasPayload): Promise<boolean> {
    const texto =
      `Olá, <b>${payload.pacienteNome}</b>! 👋\n\n` +
      "Sua conta foi vinculada com sucesso ao NutriDeby. " +
      "A partir de agora você recebe por aqui lembretes de consulta e avisos sobre seu plano alimentar.";
    return this.enviarParaPaciente(payload.pacienteId, texto);
  }

  async enviarLembreteConsulta(payload: LembreteConsultaPayload): Promise<boolean> {
    const dataHora = formatarDataHora(payload.dataHoraConsulta);
    const texto =
      "📅 <b>Lembrete de consulta</b>\n\n" +
      `Você tem uma consulta com ${payload.nutricionistaNome} em ${dataHora}.` +
      (payload.observacao ? `\n\n${payload.observacao}` : "");
    return this.enviarParaPaciente(payload.pacienteId, texto);
  }

  async enviarNovoPlanoDisponivel(payload: NovoPlanoPayload): Promise<boolean> {
    const texto =
      "🥗 <b>Novo plano alimentar disponível</b>\n\n" +
      `${payload.nutricionistaNome} liberou um novo plano alimentar para você.` +
      (payload.linkPlano ? `\n\nAcesse: ${payload.linkPlano}` : "\n\nAbra o app para conferir.");
    return this.enviarParaPaciente(payload.pacienteId, texto);
  }

  async enviarMensagemLivre(pacienteId: PacienteId, texto: string): Promise<boolean> {
    return this.enviarParaPaciente(pacienteId, texto);
  }
}
