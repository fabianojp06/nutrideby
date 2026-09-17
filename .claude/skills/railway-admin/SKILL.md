---
name: railway-admin
description: Rodar comandos administrativos (migration, reseed, query pontual) contra o Postgres de PRODUÇÃO do NutriDeby no Railway. Use quando precisar aplicar schema, seedar dados, inspecionar ou corrigir dados de produção do api-gateway. Cobre o workaround de tcp-proxy necessário porque railway run/ssh não funcionam a partir da máquina local Windows.
---

# Railway Admin — Postgres de produção do NutriDeby

Infra de produção do `api-gateway`:

- Projeto Railway: `nutrideby` (id `9793e639-f3ec-4560-9c48-0e51ec2fa6d1`), workspace "Fabiano Garcia's Projects", ambiente `production` (id `e31ddc56-4d8b-4523-8ffb-184ef52438a1`).
- Serviço `Postgres` (id `a52ff515-6bac-445a-b49d-3920b0c801c4`) — schema aplicado, TACO seedada (597 alimentos).
- Serviço `api-gateway` (id `7add05b2-c98d-4a96-97cd-2e059b4d25c4`) — URL `https://api-gateway-production-ec8d.up.railway.app`.

## Por que não dá pra usar o caminho óbvio

O `DATABASE_URL` interno aponta para `postgres.railway.internal`, que **só resolve de dentro da rede do Railway**:

- `railway run` local → falha (host interno não resolve).
- `railway ssh` → deu "Host key verification failed" no ambiente Windows/Git Bash.

## Caminho que funciona: TCP proxy público

1. Cria um proxy TCP público para o Postgres:
   ```bash
   railway tcp-proxy create --service Postgres --port 5432
   ```
   Retorna algo como `thomas.proxy.rlwy.net:28921`.

2. Pega usuário/senha/db do serviço Postgres:
   ```bash
   railway variable list --service Postgres --json
   ```

3. Monta a connection string manualmente com o host:porta do proxy (não o interno) e roda Prisma / psql local contra produção:
   ```bash
   # exemplo
   DATABASE_URL="postgresql://USER:SENHA@thomas.proxy.rlwy.net:28921/railway" \
     npx prisma db push
   ```

## Regras de segurança

- **Confirmar com o usuário antes de qualquer operação destrutiva** em produção (migration que dropa coluna, reseed, delete). Dado de saúde real de 430+ pacientes — nunca rodar `db push --accept-data-loss`, `migrate reset` ou DELETE em massa sem OK explícito.
- Preferir `prisma migrate` versionado a `db push` para mudanças de schema em produção. `db push` foi usado no bootstrap inicial; daqui pra frente, migrations rastreáveis.
- **`knowledge_base` (RAG/pgvector) está declarada no `schema.prisma` do api-gateway** como `Unsupported("vector(1024)")` (modelo `KnowledgeBase`) justamente para o `db push` NÃO dropá-la — corrige o incidente de 07/09. Não remover essa declaração; a tabela em si continua sendo populada pelo rag-agent (seed TACO), não pelo api-gateway.
- **Rollout da cripto de campo (item 12) — ordem obrigatória, com BACKUP antes:**
  1. Gerar a chave (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) e setá-la como secret `FIELD_ENCRYPTION_KEY` no serviço api-gateway do Railway. **Trocar a chave depois torna ilegível todo dado já cifrado.**
  2. Migrar as colunas de saúde `Decimal`/`Json` → `String` no banco (o Postgres converte o valor para texto). Preferir SQL/migration direcionada; NUNCA `db push --accept-data-loss` sem OK.
  3. Rodar o backfill idempotente: `npm run backfill:encrypt-health -- --dry-run` (confere contagem) e depois sem `--dry-run` para cifrar o texto plano existente. Pode rodar de novo com segurança (pula o que já está cifrado).
  4. Deploy do api-gateway com a chave já setada. Ordem: chave → migração → backfill → deploy.
- Fechar o tcp-proxy quando terminar, se foi criado só para a tarefa.
- Nunca colar a connection string com senha em commit, log ou arquivo versionado.

O MCP do Railway e a skill `use-railway` estão disponíveis; a skill sozinha basta para estes comandos. Se o MCP não aparecer na sessão, pode precisar reiniciar.
