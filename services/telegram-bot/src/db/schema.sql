-- Tabela de propriedade do services/telegram-bot.
-- Vive no mesmo Postgres do api-gateway, mas fora do schema Prisma dele
-- (não é gerenciada pelas migrations do NestJS/Prisma do api-gateway).
--
-- Aplicar manualmente ou via script próprio deste serviço (não há migration runner
-- configurado nesta fase 0 — ver README.md).

CREATE TABLE IF NOT EXISTS telegram_link_token (
  token           TEXT PRIMARY KEY,
  paciente_id     TEXT NOT NULL,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em       TIMESTAMPTZ NOT NULL,
  usado_em        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS telegram_vinculo (
  paciente_id     TEXT PRIMARY KEY,
  chat_id         TEXT NOT NULL UNIQUE,
  vinculado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_token_paciente
  ON telegram_link_token (paciente_id);
