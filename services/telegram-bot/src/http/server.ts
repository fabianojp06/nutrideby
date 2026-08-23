import Fastify from "fastify";
import { authPlugin } from "./authPlugin";
import { registerNotificacoesRoutes } from "./notificacoesRoutes";
import type { ChannelAdapter } from "../adapters/ChannelAdapter";
import { env } from "../config/env";

export async function startHttpServer(channel: ChannelAdapter) {
  const app = Fastify({ logger: true });

  await app.register(authPlugin);
  registerNotificacoesRoutes(app, channel);

  await app.listen({ port: env.port, host: "0.0.0.0" });
  return app;
}
