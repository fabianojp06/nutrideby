# ADR-0004 — Time de desenvolvimento como subagentes do Claude Code

- **Status:** Aceito
- **Data:** 2026-08-29
- **Decisores:** Fundadora + Claude Code

## Contexto
Operação solo (fundadora + Claude Code). Necessidade de papéis especializados sem folha de pagamento, mantendo a disciplina de compliance.

## Decisão
Montar o time como **subagentes do Claude Code** escopados no repo (`.claude/agents/`), não pessoas reais (por ora): `backend-dev`, `frontend-dev`, `dba`, `ai-engineer`, `nutri-domain` (advisory/read-only) e `compliance-reviewer` (revisor independente). Claude coordena; nenhum agente faz deploy/merge sozinho; mudança sensível passa pelo `compliance-reviewer`.

## Consequências
- Positivas: papéis especializados com contexto do projeto; revisão independente.
- Negativas: subagente inicia "frio" e re-deriva contexto (custo); agentes nomeados só são spawnáveis de uma sessão aberta em `projs/`.
- Obriga: teto de time em 6 papéis — não adicionar sem gargalo concreto.
