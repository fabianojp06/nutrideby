# api-gateway

Gateway/autenticação/roteamento do NutriDeby (Fase 0 — MVP Vendável). NestJS + TypeScript + Prisma/PostgreSQL.

Módulos: `auth`, `nutricionistas`, `pacientes`, `prontuarios`, `planos-alimentares`, `assinaturas`. A lógica de IA (geração de plano/anamnese assistida) fica em `services/rag-agent` — este serviço expõe apenas CRUD e autenticação.

## Pré-requisitos

- Node.js 20+
- pnpm (o monorepo usa pnpm workspaces)
- Docker (para subir o Postgres local com pgvector)

## Subindo o banco local

Na raiz do monorepo:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Isso sobe um Postgres 16 com a extensão `pgvector` habilitada, na porta `5432`, usuário/senha/banco `nutrideby`.

## Configuração do serviço

```bash
cd services/api-gateway
cp .env.example .env
# edite .env com valores locais (o padrão já aponta para o docker-compose acima)
pnpm install
pnpm prisma:generate
pnpm prisma:migrate   # cria as tabelas a partir de prisma/schema.prisma
```

## Rodando em desenvolvimento

```bash
pnpm start:dev
```

A API sobe em `http://localhost:3000/api`.

## Fluxo de autenticação

- `POST /api/auth/nutricionistas/registro` — nutricionista cria a própria conta (Controladora)
- `POST /api/auth/login` — login de nutricionista ou paciente (`role: "NUTRICIONISTA" | "PACIENTE"`), retorna JWT
- Pacientes **não se autocadastram**: são criados pelo nutricionista em `POST /api/pacientes`

## Consentimento (LGPD)

Todo paciente nasce com `statusConsentimento = PENDENTE`. Rotas que expõem dado de saúde do paciente (ex.: `GET /api/me/planos-alimentares`) são protegidas pelo `ConsentGuard` (`src/common/guards/consent.guard.ts`) e retornam `403` até o paciente aceitar o termo em:

```
POST /api/pacientes/me/consentimento
Body: { "versaoTermo": "v1.0" }
```

Novas rotas que tratam dado de saúde do paciente devem usar `@RequireConsent()` + `ConsentGuard` (ver `meus-planos-alimentares.controller.ts` como referência).

## Estrutura de pastas

```
src/
  auth/                # JWT, guards de role, login/registro
  nutricionistas/       # perfil da Controladora
  pacientes/            # CRUD de pacientes + aceite de consentimento
  prontuarios/          # anamnese e dados antropométricos (dado de saúde)
  planos-alimentares/    # CRUD manual de planos (sem geração por IA aqui)
  assinaturas/           # plano/status/trial — integração Asaas é trabalho futuro
  prisma/                # PrismaService/PrismaModule
  common/                # decorators e guards compartilhados (roles, consent)
prisma/schema.prisma      # modelo de dados
```

## Notas de compliance

- Dado de saúde (prontuário, plano alimentar) deve trafegar sob TLS 1.2+ e ser armazenado em disco criptografado (AES-256) — configuração de infraestrutura, fora do escopo deste código.
- Toda operação sobre `Prontuario` grava `AuditLog` (ver `prontuarios.service.ts`).
- Integração Asaas (assinaturas recorrentes) ainda não implementada — apenas o modelo de dados e o CRUD básico de `Assinatura` em `TRIAL`.
