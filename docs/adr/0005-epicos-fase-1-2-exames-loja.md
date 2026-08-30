# ADR-0005 — Épicos Fase 1/2 (exames + loja) com gate embutido

- **Status:** Aceito (planejamento; implementação bloqueada por parecer jurídico)
- **Data:** 2026-08-29
- **Decisores:** Fundadora + Claude Code

## Contexto
Demanda de IA que analisa exames clínicos enviados por pacientes e sugere produtos de uma loja virtual. Nada disso estava previsto na Fase 0.

## Decisão
Formalizar 3 épicos **fora da Fase 0** (detalhe em `docs/produto/fase1_2_epicos_ia_exames_loja.md`): (A) análise de exames — IA estrutura dados, **não diagnostica**; (B) recomendação de produtos — IA **sugere** sob aprovação; (C) loja virtual (e-commerce). O gate de [ADR-0003](0003-gate-aprovacao-humana-ia.md) é embutido no design de A e B.

## Consequências
- Positivas: expansão de receita planejada sem violar o gate de aprovação.
- Negativas / bloqueio: exige parecer jurídico + CFN + aditivos de DPA (novo dado de saúde sensível + finalidade comercial) antes de produção — não é decisão de engenharia. Interpretar exame tangencia ato médico; a IA se limita a estruturar dados.
