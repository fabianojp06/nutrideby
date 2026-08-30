# ADR-0003 — Gate de aprovação humana para todo output de IA

- **Status:** Aceito
- **Data:** 2026-08-23 (reafirmado 2026-08-29)
- **Decisores:** Fundadora + Claude Code

## Contexto
Sistema trata dado de saúde e usa IA (Agente RAG; futuramente análise de exames e recomendação de produtos). O Código de Ética do CFN e a LGPD impõem responsabilidade clínica humana. Já houve um bug em que plano não aprovado vazou para a rota do paciente.

## Decisão
**Nenhuma saída de IA chega ao paciente sem aprovação explícita da nutricionista.** Vale para rascunho de plano, texto de resposta, análise de exame e recomendação de produto. "Automático" refere-se à geração do rascunho, **nunca ao envio ao paciente**. Rotas de paciente (`/me/*`) filtram `aprovadoPeloNutri=true`; todo output de IA carrega disclaimer CFN "sugestão para revisão do profissional"; toda operação sobre dado sensível é auditada.

## Consequências
- Positivas: conformidade CFN/LGPD; responsabilidade clínica preservada.
- Negativas: nenhuma automação end-to-end IA→paciente (por design).
- Obriga: a fila de aprovação é tabela central; recomendação/análise automática direto ao paciente está **proibida**. Reforçado pela skill `compliance-guard` e pelo agente `compliance-reviewer`.
