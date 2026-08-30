# ADR-0002 — Deploys independentes por pacote (Railway/Vercel)

- **Status:** Aceito
- **Data:** 2026-08-25
- **Decisores:** Fundadora + Claude Code

## Contexto
Os serviços/apps têm ciclos de vida distintos e provedores distintos. `services/api-gateway` roda no Railway; `apps/pwa-patient` e `apps/admin-web` na Vercel.

## Decisão
Cada pacote deploya de forma **independente**: Railway via `railway up --path-as-root` (root `/services/api-gateway`); Vercel com root = diretório do app, rodando `npm ci` **dentro** do pacote. O CI valida por pacote alterado via `dorny/paths-filter`.

## Consequências
- Positivas: deploys isolados, sem acoplamento entre pacotes; simples de operar solo.
- Negativas: cada deploy depende do `package-lock.json` local do pacote — por isso um workspace hoisted quebraria `npm ci` por-pasta (ver [ADR-0001](0001-monorepo-poliglota-sem-workspace.md)).
- Obriga: qualquer mudança de topologia de instalação a reconfigurar os deploys antes de mesclar.
