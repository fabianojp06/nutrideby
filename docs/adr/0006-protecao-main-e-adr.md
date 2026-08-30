# ADR-0006 — Proteção da main, fluxo de PR e adoção de ADRs

- **Status:** Aceito
- **Data:** 2026-08-29
- **Decisores:** Fundadora + Claude Code

## Contexto
Até aqui, commits iam direto na `main` (sem proteção), sem ADRs formais e sem testes automatizados de comportamento. Governança frágil para um sistema com regra de compliance não-negociável.

## Decisão
- **Proteger a `main`**: proibir push direto; exigir Pull Request e o status check agregador `ci-success` verde para mesclar; aplicar também a administradores (`enforce_admins`).
- **Adotar ADRs**: toda decisão de arquitetura relevante vira ADR (esta pasta), preferencialmente antes da implementação.
- Testes automatizados de comportamento (a começar pelo E2E do gate de aprovação) ficam como próximo item de qualidade — ver backlog P2.

## Consequências
- Positivas: nada entra na main sem PR + CI verde; decisões rastreáveis; dogfooding do próprio fluxo (este ADR entrou por PR).
- Negativas: passo extra de PR mesmo para docs; sendo solo, PRs são auto-mesclados (0 aprovações exigidas), mas o `compliance-reviewer` deve gatear mudanças sensíveis.
