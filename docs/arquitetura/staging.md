# Ambiente de Staging — NutriDeby (item 13)

Ambiente de homologação espelhando produção, para validar mudanças (schema,
deploy, integração api-gateway ↔ rag-agent, migrações sensíveis como o rollout
da cripto de campo — item 12) **antes** de tocar produção com dado real de 430+
pacientes.

> **Regra de dados (LGPD, não-negociável):** o banco de staging **NUNCA** recebe
> cópia de dado de saúde real de produção. Staging usa apenas dados
> **sintéticos** (contas de teste) + a base **TACO** (seed público). Copiar
> prod→staging exigiria base legal/DPA que não existe. Ver `compliance-guard`.

## Topologia

Espelha a produção (mesmo `docs`/skill `deploy-nutrideby`), isolada por ambiente:

| Componente | Produção | Staging |
|---|---|---|
| api-gateway (NestJS) | Railway, env `production` | Railway, env **`staging`** (mesmo projeto) |
| rag-agent (FastAPI) | Railway, env `production` | Railway, env **`staging`** |
| Postgres + pgvector | Railway `production` | Railway **`staging`** (instância separada) |
| pwa-patient (Vite) | Vercel `nutrideby` (prod) | Vercel — branch/preview de `staging` ou projeto `nutrideby-staging` |
| admin-web (Next) | Vercel `nutrideby-admin-web` (prod) | Vercel — idem |
| telegram-bot | não hospedado (bloqueio DPA) | não hospedado |

Railway modela staging como um **environment** dentro do projeto `nutrideby`
(ids na skill `railway-admin`). Cada environment tem seus próprios serviços e
variáveis; o Postgres de staging é uma instância à parte da de produção.

## Matriz de variáveis de ambiente

Valores de staging são **próprios** (segredos distintos de produção). Modelos
versionados: `services/*/.env.staging.example` e `apps/*/.env.staging.example`.

| Variável | Serviço | Observação em staging |
|---|---|---|
| `DATABASE_URL` | api-gateway, rag-agent, (telegram) | Postgres de **staging**, nunca o de prod |
| `FIELD_ENCRYPTION_KEY` | api-gateway | Chave **própria** de staging (32 bytes base64). Não reusar a de prod |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | api-gateway | Segredos próprios de staging |
| `CORS_ORIGIN` | api-gateway | URLs dos frontends de staging (Vercel) |
| `RAG_AGENT_BASE_URL` | api-gateway | URL interna do rag-agent de staging |
| `ASAAS_API_KEY` / `ASAAS_BASE_URL` | api-gateway | **Sandbox** da Asaas em staging |
| `ANTHROPIC_API_KEY` / `EMBEDDING_API_KEY` | rag-agent | Chaves próprias (idealmente com limite de gasto) |
| `APP_ENV` / `NODE_ENV` | ambos | `staging` |
| `VITE_API_BASE_URL` | pwa-patient | api-gateway de staging (`/api`) |
| `NEXT_PUBLIC_API_BASE_URL` | admin-web | api-gateway de staging (`/api`) |

## Provisionamento (uma vez) — requer OK de custo

Cria recursos pagos na conta Railway/Vercel. Passos:

1. **Railway** — criar o environment `staging` no projeto `nutrideby` (fork do
   `production` ou vazio), provisionar **Postgres** próprio (com `pgvector`),
   e criar os serviços `api-gateway` e `rag-agent` apontando para os mesmos
   diretórios-raiz de produção. Setar as variáveis da matriz acima.
2. **Schema + seed** — aplicar o schema Prisma no Postgres de staging e semear:
   TACO no `knowledge_base` (rag-agent, `scripts/seed_taco_knowledge.py`) e
   dados sintéticos de teste. Nunca importar dados de prod.
3. **Vercel** — apontar staging para a branch `staging` (Preview) ou criar
   projetos `nutrideby-staging` / `nutrideby-admin-web-staging` com Root
   Directory nos mesmos apps; setar `VITE_API_BASE_URL` /
   `NEXT_PUBLIC_API_BASE_URL` para o api-gateway de staging.

## Deploy em staging

Mesmo fluxo do `deploy-nutrideby`, trocando o alvo:
- **api-gateway** (upload direto): `railway up ./services/api-gateway --path-as-root` com o **environment `staging`** selecionado (`railway environment staging`).
- **rag-agent**: deploy no serviço de staging (mesmo `railway.json`).
- **Frontends**: push na branch `staging` publica os previews da Vercel.

Gate: **CI verde** continua obrigatório (o `.github/workflows/ci.yml` já roda
por pacote; staging não afrouxa o gate).

## Fluxo de promoção (staging → produção)

1. Mudança mesclada na `main` com CI verde.
2. Deploy em **staging**; validar (inclui migrações de schema e, quando aplicável,
   o rollout da cripto de campo — item 12 — ensaiado aqui primeiro).
3. Só então deploy em **produção**, seguindo `deploy-nutrideby` + `railway-admin`.

## Fora de escopo / notas

- `telegram-bot` continua **não hospedado** (bloqueio de DPA) — sem serviço em staging.
- Custo: staging dobra parcialmente a infra (mais um Postgres + instâncias).
  Mitigar com plano/limites menores e sleep quando ocioso, se o Railway permitir
  no plano atual.
