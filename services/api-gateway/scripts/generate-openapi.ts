import { writeFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
// Importa do BUILD (dist/), não do src/: o plugin CLI do @nestjs/swagger injeta
// o metadata das propriedades de DTO só na compilação. Rodar via ts-node sobre
// src/ geraria schemas vazios. Exige `npm run build` antes (o CI já faz).
import { AppModule } from '../dist/src/app.module';
import { buildOpenApiDocument } from '../dist/src/swagger';

// Gera services/api-gateway/openapi.json sem subir servidor nem tocar o banco.
// O arquivo é versionado e serve de fonte única de tipos para os frontends
// (openapi-typescript). Rode `npm run openapi:generate` após mudar rota/DTO.
async function main() {
  // preview:true instancia só o grafo de metadados (rotas/DTOs) — providers
  // não sobem, então nada conecta no Postgres. Roda em CI sem banco.
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  app.setGlobalPrefix('api');
  const document = buildOpenApiDocument(app);
  const destino = join(__dirname, '..', 'openapi.json');
  writeFileSync(destino, JSON.stringify(document, null, 2) + '\n');
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`openapi.json gerado em ${destino}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
