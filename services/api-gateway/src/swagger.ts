import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

// Configuração única do contrato OpenAPI. Consumida em dois lugares:
// - main.ts serve a UI em /api/docs
// - scripts/generate-openapi.ts gera o openapi.json versionado, que os
//   frontends usam como fonte única de tipos (item 7).
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('NutriDeby API Gateway')
    .setDescription(
      'Contrato do api-gateway. Fonte única de tipos para admin-web e pwa-patient — não editar à mão nos clientes.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  const document = buildOpenApiDocument(app);
  // Prefixo global 'api' já aplicado → UI em /api/docs, JSON em /api/docs-json.
  SwaggerModule.setup('docs', app, document);
}
