import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env";

/**
 * Autenticação simples por chave compartilhada (fase 0, sem OAuth completo).
 * O chamador (api-gateway ou um scheduler) envia o header X-Internal-Api-Key.
 */
export async function authPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.url === "/health") return;

    const chave = req.headers["x-internal-api-key"];
    if (chave !== env.internalApiKey) {
      reply.code(401).send({ error: "Não autorizado" });
    }
  });
}
