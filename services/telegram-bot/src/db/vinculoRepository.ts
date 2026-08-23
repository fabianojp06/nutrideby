import { pool } from "./pool";
import type { PacienteId } from "../types";

export interface LinkTokenRow {
  token: string;
  pacienteId: PacienteId;
  expiraEm: Date;
  usadoEm: Date | null;
}

const POSTGRES_UNIQUE_VIOLATION = "23505";

// Lançado quando a conta do Telegram (chat_id) já está vinculada a outro
// paciente — um chat só pode representar um paciente por vez neste schema.
export class ChatJaVinculadoAOutroPacienteError extends Error {
  constructor() {
    super("Esta conta do Telegram já está vinculada a outro paciente.");
    this.name = "ChatJaVinculadoAOutroPacienteError";
  }
}

/**
 * Acesso à vinculação chat_id <-> paciente_id e aos tokens de convite de uso único.
 * O token em si é gerado pelo api-gateway/admin-web quando o nutricionista cadastra
 * o paciente (fora do escopo deste serviço); aqui apenas consumimos/validamos.
 */
export const vinculoRepository = {
  async buscarToken(token: string): Promise<LinkTokenRow | null> {
    const { rows } = await pool.query(
      `SELECT token, paciente_id AS "pacienteId", expira_em AS "expiraEm", usado_em AS "usadoEm"
       FROM telegram_link_token WHERE token = $1`,
      [token],
    );
    return rows[0] ?? null;
  },

  async marcarTokenUsado(token: string): Promise<void> {
    await pool.query(
      `UPDATE telegram_link_token SET usado_em = now() WHERE token = $1`,
      [token],
    );
  },

  async vincular(pacienteId: PacienteId, chatId: string): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO telegram_vinculo (paciente_id, chat_id)
         VALUES ($1, $2)
         ON CONFLICT (paciente_id) DO UPDATE SET chat_id = EXCLUDED.chat_id, vinculado_em = now()`,
        [pacienteId, chatId],
      );
    } catch (err) {
      // ON CONFLICT acima só cobre reuso do mesmo paciente_id; se o chat_id
      // já pertence a OUTRO paciente, a constraint UNIQUE (chat_id) rejeita
      // o INSERT — traduzimos para um erro de domínio em vez de deixar o
      // bot derrubar o processo com uma exceção do driver pg não tratada.
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
      ) {
        throw new ChatJaVinculadoAOutroPacienteError();
      }
      throw err;
    }
  },

  async buscarChatIdPorPaciente(pacienteId: PacienteId): Promise<string | null> {
    const { rows } = await pool.query(
      `SELECT chat_id AS "chatId" FROM telegram_vinculo WHERE paciente_id = $1`,
      [pacienteId],
    );
    return rows[0]?.chatId ?? null;
  },

  async buscarPacientePorChatId(chatId: string): Promise<PacienteId | null> {
    const { rows } = await pool.query(
      `SELECT paciente_id AS "pacienteId" FROM telegram_vinculo WHERE chat_id = $1`,
      [chatId],
    );
    return rows[0]?.pacienteId ?? null;
  },
};
