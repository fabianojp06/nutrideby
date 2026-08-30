# ADR-0001 — Monorepo poliglota sem workspace unificado

- **Status:** Aceito
- **Data:** 2026-08-25
- **Decisores:** Fundadora + Claude Code

## Contexto
O CLAUDE.md afirmava "monorepo com pnpm workspaces", mas o repo não tinha `pnpm-workspace.yaml`, `package.json` na raiz nem pnpm instalado — todos os 4 pacotes Node usam `npm` com `package-lock.json` próprio, e o `rag-agent` é Python. Doc drift. Avaliou-se adotar pnpm + Turborepo de verdade.

## Decisão
Manter um **monorepo poliglota sem workspace unificado**: cada pacote (`apps/*`, `services/*`) é instalado, buildado e deployado de forma independente com npm (Python à parte). **Não** adotar pnpm/Turborepo.

## Consequências
- Positivas: alinha a doc à realidade; não quebra os deploys per-pacote (ver [ADR-0002](0002-deploys-per-pacote.md)); zero nova ferramenta.
- Negativas: sem cache de tarefas unificado; tipos compartilhados exigem outra abordagem (codegen a partir do schema Prisma), não um pacote de workspace simples.
- Proíbe: introduzir workspace hoisted sem antes reconfigurar os deploys.

## Alternativas consideradas
- pnpm + Turborepo — quebraria `npm ci` por-pasta dos deploys; complexidade sem gargalo correspondente.
