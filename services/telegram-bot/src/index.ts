import { createBot } from "./bot/createBot";
import { ChannelAdapterTelegram } from "./adapters/ChannelAdapterTelegram";
import { startHttpServer } from "./http/server";

async function main() {
  const bot = createBot();
  const channel = new ChannelAdapterTelegram(bot);

  await startHttpServer(channel);

  // long polling nesta fase; webhook do Telegram pode ser adotado depois sem
  // mudar o restante do serviço (ChannelAdapter e rotas HTTP não dependem disso)
  bot.start();

  console.log("telegram-bot: bot iniciado (long polling) e servidor HTTP no ar");
}

main().catch((err) => {
  console.error("telegram-bot: falha ao iniciar", err);
  process.exit(1);
});
