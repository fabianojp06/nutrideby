---
name: deploy-nutrideby
description: Fluxo de deploy do NutriDeby — api-gateway no Railway e frontends (pwa-patient, admin-web) na Vercel — com o gate de CI verde. Use ao publicar mudanças, promover para produção, ou diagnosticar por que algo não subiu. Reforça a regra de nunca mesclar sem CI verde.
---

# Deploy — NutriDeby

Produção real (atende 430+ pacientes): **`api-gateway` (Railway) + `pwa-patient` (Vercel)**. O `admin-web` ainda é mockado — não é produção real. `rag-agent` e `telegram-bot` só rodam local.

## Regra de ouro (aprendida na marra)

**Nunca mesclar/promover sem CI verde.** Um build quebrado (erro TS6133) já foi parar em produção na Vercel por deploy sem gate — foi o que motivou o pipeline. O CI (`.github/workflows/ci.yml`) roda lint/build/test por pacote alterado via `dorny/paths-filter`. Todo commit é verificado com CI verde antes de seguir.

Como não há workspace unificado, cada pacote builda isolado — não confie que "buildou aqui" cobre os outros; confie no CI.

## api-gateway → Railway

- Projeto `nutrideby`, serviço `api-gateway`. Ver ids e infra na skill `railway-admin`.
- Deploy feito por upload direto do diretório (decisão pragmática, sem GitHub App):
  ```bash
  railway up ./services/api-gateway --path-as-root
  ```
- Root directory: `/services/api-gateway`. Build: `npx prisma generate && npm run build`. Start: `npm run start:prod`.
- Variáveis já configuradas no serviço (DATABASE_URL, JWT_SECRET/REFRESH, NODE_ENV, CORS_ORIGIN, TELEGRAM_BOT_USERNAME, ASAAS_*). **Falta** `RAG_AGENT_BASE_URL` (rag-agent não hospedado).
- Se a mudança inclui schema Prisma, aplicar a migration em produção **antes** que o novo código dependa dela — ver skill `railway-admin`.

## Frontends → Vercel

Team `fabianojp06's projects` (id `team_lkvBkKon2L6BjRV2mjHJsVKX`):

- `nutrideby` → `apps/pwa-patient` (prj_USbCFhxCLqj9qNKhYogLx5xaj4fO). `VITE_API_BASE_URL` aponta para o api-gateway do Railway.
- `nutrideby-admin-web` → `apps/admin-web` (prj_aTJv5EkplB5ng0NrOaufqzrmiZfX). Ainda mockado.

## Staging (item 13)

Antes de tocar produção com mudança de schema/deploy sensível, valide em
**staging** — ambiente `staging` no projeto Railway (api-gateway + rag-agent +
Postgres próprio) + previews/projetos Vercel de staging. Blueprint completo,
matriz de variáveis, provisionamento e fluxo de promoção em
`docs/arquitetura/staging.md`; modelos em `*/.env.staging.example`.
**Staging nunca recebe dado de saúde real** (LGPD) — só dados sintéticos + seed TACO.
Fluxo: `main` (CI verde) → deploy staging → validar → deploy produção.

## Checklist de deploy

- [ ] CI verde na branch?
- [ ] Se mudou schema: migration aplicada em produção antes do código novo?
- [ ] Se mudou contrato de API: front e back continuam compatíveis? (tipos hoje são duplicados — ver avaliação de arquitetura)
- [ ] Variáveis de ambiente novas configuradas no serviço/projeto de destino?
- [ ] Mudança que toca dado de saúde/IA passou pela skill `compliance-guard`?
