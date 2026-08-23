# NutriDeby — Fase 0: Estrutura de Planos e Backlog Priorizado

## Gateway de Pagamento — Decisão
**Asaas**, recomendado por: sem mensalidade, API nativa de assinatura recorrente (Pix + cartão), boa adequação a SaaS B2B brasileiro. Não há gateway sem taxa por transação — toda opção cobra % por cobrança.

## Canal Principal de Comunicação — Decisão
**Telegram** é o canal principal (não mais WhatsApp). Implicação direta: a atualização do DPA e da Política de Privacidade para incluir o Telegram como subprocessador passa a ser **pré-requisito de lançamento** (P0), pois é o canal usado por padrão, não uma alternativa opcional.

---

## Estrutura de Planos de Assinatura (sugestão)

Modelo B2B2C: nutricionista (Controladora) paga; paciente usa de graça.

| Plano | Preço sugerido/mês | Limite de pacientes ativos | Recursos |
|---|---|---|---|
| **Starter** | R$ 49 | até 15 | Admin Web, PWA paciente, prontuário, plano alimentar manual, Telegram (lembretes básicos) |
| **Pro** | R$ 129 | até 60 | Tudo do Starter + Agente Clínico RAG (rascunho de plano por IA), agendamento com Google Calendar |
| **Clínica** | R$ 299 | ilimitado + múltiplos nutricionistas | Tudo do Pro + múltiplos profissionais na mesma conta, relatórios de faturamento consolidados |

**Racional:**
- Starter cobre o essencial pago (US-01 a US-14, US-17-20) — já monetiza sem depender de IA funcionando perfeitamente.
- IA (o diferencial mais caro em custo de API) fica reservada ao plano Pro — evita subsidiar tokens de IA no plano de entrada.
- Cobrança por limite de pacientes ativos é o eixo de upsell mais natural (cresce com o sucesso do próprio nutricionista).
- Plano Clínica antecipa o "Serviço Financeiro"/multiusuário da Fase 2, mas sem construir o módulo completo agora — só destrava limite e preço.

**Confirmado**: trial gratuito de 14 dias em qualquer plano, sem cartão obrigatório no cadastro — reduz fricção de primeiro pagamento. Cobrança inicia automaticamente ao fim do trial, com aviso 2 dias antes.

---

## Backlog Priorizado — Fase 0

Ordenado por prioridade de execução (não apenas importância) — considera dependências técnicas e o que desbloqueia receita mais rápido.

### Sprint 1-2 — Fundação e Compliance
| # | Item | Ref. | Prioridade |
|---|---|---|---|
| 1 | Atualizar DPA/Política de Privacidade incluindo Telegram como subprocessador | US-16 | P0 — bloqueia tudo |
| 2 | Infra base: banco (Postgres+pgvector), ambientes dev/staging, CI/CD | — | P0 |
| 3 | Cadastro de nutricionista + validação de CRN | US-01 | P0 |
| 4 | Cadastro de paciente + fluxo de Termo de Consentimento | US-03, US-04 | P0 |
| 5 | Criptografia em repouso/trânsito + logs de auditoria | US-19, US-20 | P0 |

### Sprint 3-4 — Core de Valor (Admin Web)
| # | Item | Ref. | Prioridade |
|---|---|---|---|
| 6 | Prontuário: anamnese + dados antropométricos | US-06 | P0 |
| 7 | Gráfico de evolução antropométrica | US-07 | P0 |
| 8 | Cálculo nutricional com base TACO/TBCA | US-11 | P0 |
| 9 | Construtor de plano alimentar + duplicação | US-10 | P0 |
| 10 | Revogação de consentimento (fluxo LGPD) | US-05 | P0 |

### Sprint 5-6 — Monetização
| # | Item | Ref. | Prioridade |
|---|---|---|---|
| 11 | Integração Asaas: assinatura recorrente (Pix/cartão) | US-02, US-17 | P0 — desbloqueia receita |
| 12 | Estrutura de planos (Starter/Pro/Clínica) com limites por plano | — | P0 |
| 13 | Histórico de faturas + recibo em PDF | US-18 | P1 |
| 14 | Suspensão de acesso por inadimplência (com tolerância) | US-17 | P1 |

### Sprint 7-8 — PWA Paciente + Telegram
| # | Item | Ref. | Prioridade |
|---|---|---|---|
| 15 | PWA instalável: login, visualizar plano alimentar | US-12 | P0 |
| 16 | Diário alimentar simples (texto/foto sem IA) | US-13 | P0 |
| 17 | Registro de peso pelo paciente | US-14 | P0 |
| 18 | Bot Telegram: lembretes de consulta e notificações | US-15/16 | P0 |
| 19 | Adaptador de Canais (abstração p/ suportar WhatsApp depois) | arquitetura | P1 |

### Sprint 9-10 — Diferencial de IA (plano Pro)
| # | Item | Ref. | Prioridade |
|---|---|---|---|
| 20 | Agente Clínico RAG: rascunho de plano alimentar via IA | US-08 | P1 — gate por plano Pro |
| 21 | Fluxo de aprovação obrigatória do nutricionista + disclaimer CFN | US-09 | P1 |
| 22 | Gate de feature por plano de assinatura (Starter sem IA) | — | P1 |

---

## Critério de "Pronto para Lançar" (Definition of Done da Fase 0)
- [ ] Nutricionista consegue se cadastrar, assinar um plano e pagar via Asaas
- [ ] Paciente consegue assinar consentimento e acessar a PWA
- [ ] Nutricionista consegue montar e enviar plano alimentar com cálculo nutricional correto
- [ ] Lembretes funcionam via Telegram
- [ ] DPA/Política de Privacidade atualizados e vigentes com Telegram
- [ ] Auditoria de segurança básica (criptografia, logs) validada
