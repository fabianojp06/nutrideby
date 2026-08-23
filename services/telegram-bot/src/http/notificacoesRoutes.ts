import type { FastifyInstance } from "fastify";
import type { ChannelAdapter } from "../adapters/ChannelAdapter";
import type { LembreteConsultaPayload, NovoPlanoPayload, BoasVindasPayload } from "../types";

/**
 * Endpoints internos chamados pelo api-gateway ou por um scheduler (ex.: cron job
 * de lembretes de consulta N horas antes). Não expostos publicamente — protegidos
 * por authPlugin (chave compartilhada).
 */
export function registerNotificacoesRoutes(app: FastifyInstance, channel: ChannelAdapter) {
  app.post<{ Body: LembreteConsultaPayload }>("/notificacoes/lembrete-consulta", async (req, reply) => {
    const payload = req.body;
    if (!payload?.pacienteId || !payload?.dataHoraConsulta || !payload?.nutricionistaNome) {
      return reply.code(400).send({ error: "Campos obrigatórios: pacienteId, dataHoraConsulta, nutricionistaNome" });
    }

    const enviado = await channel.enviarLembreteConsulta(payload);
    if (!enviado) {
      return reply.code(404).send({ error: "Paciente ainda não vinculou uma conta no Telegram" });
    }
    return reply.code(200).send({ ok: true });
  });

  app.post<{ Body: NovoPlanoPayload }>("/notificacoes/novo-plano", async (req, reply) => {
    const payload = req.body;
    if (!payload?.pacienteId || !payload?.nutricionistaNome) {
      return reply.code(400).send({ error: "Campos obrigatórios: pacienteId, nutricionistaNome" });
    }

    const enviado = await channel.enviarNovoPlanoDisponivel(payload);
    if (!enviado) {
      return reply.code(404).send({ error: "Paciente ainda não vinculou uma conta no Telegram" });
    }
    return reply.code(200).send({ ok: true });
  });

  app.post<{ Body: BoasVindasPayload }>("/notificacoes/boas-vindas", async (req, reply) => {
    const payload = req.body;
    if (!payload?.pacienteId || !payload?.pacienteNome) {
      return reply.code(400).send({ error: "Campos obrigatórios: pacienteId, pacienteNome" });
    }

    const enviado = await channel.enviarBoasVindas(payload);
    if (!enviado) {
      return reply.code(404).send({ error: "Paciente ainda não vinculou uma conta no Telegram" });
    }
    return reply.code(200).send({ ok: true });
  });

  app.get("/health", async () => ({ status: "ok" }));
}
