import { Bot } from "grammy";
import { env } from "../config/env";
import { vinculoRepository } from "../db/vinculoRepository";
import type { ChannelAdapterTelegram } from "../adapters/ChannelAdapterTelegram";

/**
 * Cria e configura o bot grammY. O `adapter` é injetado depois de criado (ver src/index.ts)
 * porque ChannelAdapterTelegram depende da instância do bot para enviar mensagens —
 * evita import circular entre bot e adapter.
 */
export function createBot(): Bot {
  const bot = new Bot(env.telegramBotToken);

  bot.command("start", async (ctx) => {
    const token = ctx.match?.trim();

    if (!token) {
      await ctx.reply(
        "Olá! Para vincular sua conta, use o link de convite enviado pela sua nutricionista " +
          "(ex.: t.me/NomeDoBot?start=SEU_CODIGO).",
      );
      return;
    }

    const linkToken = await vinculoRepository.buscarToken(token);

    if (!linkToken) {
      await ctx.reply("Código de convite inválido. Peça um novo link à sua nutricionista.");
      return;
    }
    if (linkToken.usadoEm) {
      await ctx.reply("Este código de convite já foi utilizado. Peça um novo link caso precise reconectar.");
      return;
    }
    if (linkToken.expiraEm.getTime() < Date.now()) {
      await ctx.reply("Este código de convite expirou. Peça um novo link à sua nutricionista.");
      return;
    }

    const chatId = String(ctx.chat.id);
    await vinculoRepository.vincular(linkToken.pacienteId, chatId);
    await vinculoRepository.marcarTokenUsado(token);

    await ctx.reply(
      "✅ Conta vinculada com sucesso! A partir de agora você recebe por aqui lembretes de " +
        "consulta e avisos sobre seu plano alimentar.",
    );
  });

  bot.command("ajuda", async (ctx) => {
    await ctx.reply(
      "Comandos disponíveis:\n" +
        "/start <código> — vincula sua conta usando o link enviado pela nutricionista\n" +
        "/ajuda — mostra esta mensagem",
    );
  });

  bot.on("message:text", async (ctx) => {
    // Fase 0: bot não interpreta linguagem livre; mensagens de texto fora dos comandos
    // conhecidos apenas orientam o paciente. Futuro: encaminhar ao Agente Clínico RAG
    // (services/rag-agent) via fila, sempre com aprovação humana antes do envio (compliance).
    await ctx.reply("Não entendi. Envie /ajuda para ver os comandos disponíveis.");
  });

  return bot;
}

export type { ChannelAdapterTelegram };
