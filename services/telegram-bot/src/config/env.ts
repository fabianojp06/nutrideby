import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  databaseUrl: required("DATABASE_URL"),
  internalApiKey: required("INTERNAL_API_KEY"),
  port: Number(process.env.PORT ?? 3333),
  apiGatewayBaseUrl: process.env.API_GATEWAY_BASE_URL ?? "http://localhost:3000",
  linkTokenTtlHours: Number(process.env.LINK_TOKEN_TTL_HOURS ?? 48),
};
