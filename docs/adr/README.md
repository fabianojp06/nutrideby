# Architecture Decision Records (ADR)

Registro leve das decisões de arquitetura do NutriDeby. Cada decisão relevante (que muda estrutura, stack, fronteira de compliance ou processo) vira um ADR **antes** de ser implementada — ou, quando já foi tomada informalmente, é registrada aqui via backfill.

## Como usar
- Copie `0000-template.md` para `NNNN-titulo-em-kebab.md` (número sequencial).
- Preencha Status, Contexto, Decisão e Consequências. Seja conciso.
- ADR entra por **Pull Request** como qualquer mudança — nada vai direto na `main`.
- ADR não se edita para "mudar de ideia": crie um novo ADR que **supersede** o anterior e marque o antigo como `Substituído por ADR-XXXX`.

## Índice
- [ADR-0001](0001-monorepo-poliglota-sem-workspace.md) — Monorepo poliglota sem workspace unificado
- [ADR-0002](0002-deploys-per-pacote.md) — Deploys independentes por pacote (Railway/Vercel)
- [ADR-0003](0003-gate-aprovacao-humana-ia.md) — Gate de aprovação humana para todo output de IA
- [ADR-0004](0004-time-de-subagentes-claude-code.md) — Time de desenvolvimento como subagentes do Claude Code
- [ADR-0005](0005-epicos-fase-1-2-exames-loja.md) — Épicos Fase 1/2 (exames + loja) com gate embutido
- [ADR-0006](0006-protecao-main-e-adr.md) — Proteção da main, fluxo de PR e adoção de ADRs
