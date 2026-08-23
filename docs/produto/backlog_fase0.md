# NutriDeby — Backlog Priorizado (Fase 0)

Trial: 14 dias grátis, sem cartão no cadastro. Planos: Starter (R$49, 15 pacientes), Pro (R$129, 60 pacientes, +IA), Clínica (R$299, ilimitado, multiusuário).

## Sprint 1-2 — Fundação e Compliance
- [ ] Atualizar DPA/Política de Privacidade incluindo Telegram como subprocessador (US-16) — **P0, bloqueia tudo**
- [ ] Infra base: Postgres+pgvector, ambientes dev/staging, CI/CD — P0
- [ ] Cadastro de nutricionista + validação de CRN (US-01) — P0
- [ ] Cadastro de paciente + Termo de Consentimento (US-03, US-04) — P0
- [ ] Criptografia em repouso/trânsito + logs de auditoria (US-19, US-20) — P0

## Sprint 3-4 — Core de Valor (Admin Web)
- [ ] Prontuário: anamnese + antropometria (US-06) — P0
- [ ] Gráfico de evolução antropométrica (US-07) — P0
- [ ] Cálculo nutricional TACO/TBCA (US-11) — P0
- [ ] Construtor de plano alimentar + duplicação (US-10) — P0
- [ ] Revogação de consentimento (US-05) — P0

## Sprint 5-6 — Monetização
- [ ] Integração Asaas: assinatura recorrente Pix/cartão (US-02, US-17) — **P0, desbloqueia receita**
- [ ] Trial de 14 dias sem cartão obrigatório — P0
- [ ] Estrutura de planos com limite por plano (Starter/Pro/Clínica) — P0
- [ ] Histórico de faturas + recibo PDF (US-18) — P1
- [ ] Suspensão por inadimplência com tolerância — P1

## Sprint 7-8 — PWA Paciente + Telegram
- [ ] PWA instalável: login, visualizar plano (US-12) — P0
- [ ] Diário alimentar simples texto/foto sem IA (US-13) — P0
- [ ] Registro de peso pelo paciente (US-14) — P0
- [ ] Bot Telegram: lembretes e notificações (US-15/16) — P0
- [ ] Adaptador de Canais (abstração p/ WhatsApp futuro) — P1

## Sprint 9-10 — Diferencial IA (plano Pro)
- [ ] Agente Clínico RAG: rascunho de plano via IA (US-08) — P1, gate por plano Pro
- [ ] Fluxo de aprovação obrigatória + disclaimer CFN (US-09) — P1
- [ ] Gate de feature por plano de assinatura — P1

## Definition of Done — Fase 0
- [ ] Nutricionista cadastra, assina plano e paga via Asaas
- [ ] Paciente assina consentimento e acessa PWA
- [ ] Plano alimentar com cálculo nutricional correto
- [ ] Lembretes via Telegram funcionando
- [ ] DPA/Política de Privacidade vigentes com Telegram
- [ ] Auditoria de segurança validada
