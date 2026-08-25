---
name: nestjs-module
description: Criar ou estender um módulo de domínio no services/api-gateway (NestJS + Prisma) do NutriDeby seguindo as convenções já estabelecidas no repo. Use ao adicionar uma nova entidade/recurso, um endpoint, ou um DTO no api-gateway. Garante consistência com auth, DTOs validados e log de auditoria.
---

# Módulo de domínio no api-gateway (NestJS)

O `services/api-gateway` é organizado **por domínio**, um módulo por recurso. Siga o padrão existente — não invente estrutura nova.

## Estrutura de um módulo (espelhe `src/pacientes/`)

```
src/<dominio>/
  <dominio>.module.ts        # declara controller + service, importa PrismaModule e AuditModule se toca dado sensível
  <dominio>.controller.ts    # rotas HTTP; aplica guards; nunca lógica de negócio aqui
  <dominio>.service.ts       # regra de negócio; único lugar que fala com Prisma
  dto/
    create-<dominio>.dto.ts  # class-validator + class-transformer
    update-<dominio>.dto.ts
```

Depois: registrar o módulo em `src/app.module.ts` (junto de `PacientesModule`, `PlanosAlimentaresModule`, etc.).

## Convenções obrigatórias

- **DTOs sempre validados** com `class-validator` (nada de `any` cru vindo do body). `ValidationPipe` global já está ligado.
- **Prisma só no service**, nunca no controller.
- **Auth**: proteger rotas com `JwtAuthGuard`; usar `RolesGuard` (`src/auth/guards/roles.guard.ts`) quando a rota é restrita a nutricionista vs. paciente.
- **Rotas do paciente** (`/me/*`): a identidade vem do token, nunca de parâmetro. Se a rota lê plano/prontuário do próprio paciente, **filtrar `aprovadoPeloNutri=true`** — ver skill `compliance-guard`.
- **Auditoria**: se o módulo lê/escreve dado de saúde, injetar o `AuditService` de `src/common/audit/` e registrar a operação. Nunca logar auditoria à mão espalhado — reusar o serviço central (padrão já usado em `pacientes`, `planos-alimentares`, `prontuarios`, `registros`, `assinaturas`).
- **Gate por plano**: features Pro/Clínica (ex.: Agente Clínico RAG) checam o plano da Assinatura antes de liberar.

## Antes de dar por pronto

- `npm run build` verde no pacote.
- Se toca dado de saúde ou output de IA → rodar o checklist da skill `compliance-guard`.
- Migration de schema? → ver skill `railway-admin` (não aplicar em produção sem OK).
- Commit em português, Conventional Commits (`feat:`, `fix:`, `chore:`).
