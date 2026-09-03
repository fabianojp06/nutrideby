# NutriDeby — Backlog Atual (estado vivo)

Retrato do backlog em 30/08/2026. Inclui itens **concluídos** e **pendentes**. O núcleo da Fase 0 está concluído e **validado ponta a ponta em produção** (nutri registra → cria paciente → paciente loga na PWA → registra peso → aparece na nutri).

Legenda: 🔴 bloqueado · 🟡 parcial · ⚪ a iniciar · 📋 planejado · ✅ concluído · P/M/G = esforço.

---

## ✅ Fase 0 — Concluído (produção)

| Área | Item | Ref. |
|---|---|:--:|
| Onboarding | Cadastro de nutricionista + trial automático 14 dias + **validação de CRN** | US-01 |
| Onboarding | Cadastro de paciente pela nutri (loop de login validado) | US-03 |
| LGPD | Termo de Consentimento + revogação | US-04/05 |
| LGPD | Criptografia (repouso/trânsito) + log de auditoria | US-19/20 |
| Prontuário | Gráfico de evolução antropométrica (+ peso do paciente) | US-07 |
| Plano | Cálculo nutricional TACO | US-11 |
| Plano | Duplicação de plano | US-10 |
| Plano | Aprovação obrigatória + disclaimer CFN funcional (origem IA) | US-09 / GAP#5 |
| IA | Agente Clínico RAG (rascunho, gate por plano) | US-08 |
| Monetização | Asaas (assinatura Pix/cartão, webhook, faturas) | US-02/17 |
| Monetização | Histórico de faturas + recibo (reciboUrl Asaas) | US-18 |
| Monetização | Suspensão por inadimplência + limite por plano | US-17 |
| PWA | Login, visualizar plano, diário, registro de peso | US-12/13/14 |
| Admin Web | Sai do mock (auth httpOnly + leituras reais) | — |
| Admin Web | Trial self-service + resiliência de erros (sem tela branca) | — |
| Sincronização | Peso do paciente aparece na visão da nutri | GAP#3 |
| Governança | Main protegida (PR + CI ci-success), ADRs, CI corrigido | — |
| Infra | Env do admin-web ligada ao backend (Vercel) | — |
| Onboarding | Validação de formato de CRN no cadastro (`@Matches`, mensagem no form) | US-01 |
| IA | **rag-agent hospedado** (Railway) + gateway ligado por rede interna + timeout | — |
| IA | Base de conhecimento pgvector semeada com a **TACO (597 alimentos)** | — |

---

## 🎯 Fase 0 — Pendente

### P0
| # | Item | Origem | Esf. | Status |
|:-:|---|---|:--:|:--:|
| 1 | Decisão de canal + aditivo de DPA (teste do bot liberado) | US-16 | M | 🔴 Bloqueado (jurídico) |
| ~~—~~ | ~~Hospedar o rag-agent~~ | — | M | ✅ Concluído |
| ~~—~~ | ~~Validação de CRN no cadastro~~ | US-01 | P | ✅ Concluído |

### P1
| # | Item | Origem | Esf. | Status |
|:-:|---|---|:--:|:--:|
| 7 | Fonte única de tipos (codegen) | dívida | M | ⚪ A iniciar (sessão dedicada) |
| ~~4~~ | ~~Checkout Asaas — frontend (perfil CPF/CNPJ + assinar pago)~~ | GAP#9 | M | ✅ Backend PR#24 + frontend PR#28 |
| ~~5~~ | ~~Fila de aprovação / plano por id global~~ | GAP#1 | M | ✅ Concluído (PR#23) |
| ~~6~~ | ~~Hospedar o telegram-bot~~ | US-16 | P | ✅ Concluído (para testes) |
| ~~8~~ | ~~Adaptador de Canais~~ | — | M | ✅ Concluído (PR#25, inerte/DPA) |
| ~~9~~ | ~~R2 — disclaimer de IA no PWA~~ | review GAP#5 | P | ✅ Concluído (PR#26) |

### P2 — hardening
| Ordem | # | Item | Esf. | Status |
|:--:|:-:|---|:--:|:--:|
| **1º** | 10 | Testes E2E do gate de aprovação (não-negociável) | M | ⚪ A iniciar |
| **2º** | 15 | **Compliance:** mascarar `cpfCnpj` no log de erro da Asaas (`asaas.service.ts`) — PII em log | P | ⚪ A iniciar |
| **3º** | 11 | R1 — forçar `origem` no backend (quando houver persistência de rascunho IA) | P | ⚪ A iniciar |
| **3º** | 12 | Verificação de cripto no CI | P | ⚪ A iniciar |
| **5º** | 13 | Ambiente de staging | M | ⚪ A iniciar |
| — | 14 | Menores: `ultimaConsulta`, anamnese estruturada, TBCA, rótulo do gráfico | M | ⚪ A iniciar |

**Ordem de prioridade recomendada** (definida em 02/09/2026, para retomada futura — não iniciada). O item 4 do P1 (codegen) entra no meio desta fila:
1. **Testes E2E do gate (10)** — protege a regra de compliance mais crítica (nenhum output de IA ao paciente sem aprovação); hoje sem rede de segurança automatizada.
2. **Log Asaas (15)** — correção rápida de LGPD já identificada em review; baixo esforço.
3. **R1 (11) + cripto no CI (12)** — fecham brechas de compliance; complementam os testes.
4. **Codegen (P1-7)** — elimina classe inteira de bugs de contrato; exige sessão dedicada (mexe em contrato de 3 pacotes).
5. **Staging (13)** — importante, mas maior esforço e menor urgência agora.

> Observação: 4 dos 6 itens restantes são compliance/LGPD — o núcleo já funciona; o trabalho restante é sobretudo **blindar** as regras existentes contra regressões.

---

## 🔮 Fase 1/2 — Épicos de Expansão (fora da Fase 0)

Detalhe em `fase1_2_epicos_ia_exames_loja.md`. Gate de aprovação embutido; bloqueio transversal jurídico/CFN/DPA.

| Épico | O que é (gate embutido) | Depende de | Status |
|---|---|:--:|:--:|
| A · Análise de Exames | IA estrutura dados do exame (não diagnostica) → aprovação | Jurídico/DPA | 📋 Planejado |
| B · Recomendação de Produtos | IA sugere produtos como rascunho → aprovação | Épicos A+C | 📋 Planejado |
| C · Loja Virtual (e-commerce) | Catálogo/carrinho/checkout; reusa Asaas | Jurídico/DPA | 📋 Planejado |

---

## 🛠️ Épico — Painel do Operador (WSS+13)

**Registrado em 02/09/2026.** Hoje o sistema tem só 2 papéis (`NUTRICIONISTA`, `PACIENTE`) — **não existe conta/admin do Operador**. A WSS+13 (Operadora) administra a plataforma por **acesso de infra** (Railway, banco, deploys, scripts). Suficiente na fase de testes; vira necessidade ao operar em escala.

**Escopo previsto:** papel `OPERADOR` + área de gestão da plataforma — onboarding/suporte a nutricionistas, gestão de assinaturas/cobrança, métricas da plataforma, gestão da base de conhecimento do RAG, e supervisão de auditoria/compliance.

**⚠️ Fronteira de LGPD (não-negociável no design):** a WSS+13 é **Operadora, não Controladora**. O painel **NÃO** pode dar acesso irrestrito a dado clínico do paciente (prontuários, planos). Gestão de nutris/cobrança/config da plataforma — sim; navegar dado de saúde do paciente — só com base legal/DPA específica (ex.: suporte com consentimento), nunca por default.

**Status:** 📋 Planejado (épico novo, fora da Fase 0). Não iniciar sem decisão de escopo + revisão do recorte de LGPD.

---

**P0 restante:** só a decisão de canal + DPA (jurídico — brief enviado à Controladora). A Onda 1 (itens 5, 6, 8, 9 + backend do 4) foi executada com 4 agentes em paralelo. Próximos: **Onda 2** (checkout Asaas frontend), **item 7** (codegen, sessão dedicada), e o follow-up de compliance (item 15). Épico novo registrado: **Painel do Operador**.
