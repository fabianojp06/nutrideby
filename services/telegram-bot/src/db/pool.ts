import { Pool } from "pg";
import { env } from "../config/env";

/**
 * Client leve (pg) contra o mesmo Postgres do api-gateway.
 * Decisão: não usar Prisma próprio aqui para evitar dois schemas Prisma gerenciando
 * o mesmo banco (risco de migrations conflitantes). Este serviço é dono de uma única
 * tabela (telegram_vinculo) e só faz SQL direto e explícito nela — ver db/schema.sql.
 */
export const pool = new Pool({
  connectionString: env.databaseUrl,
});
