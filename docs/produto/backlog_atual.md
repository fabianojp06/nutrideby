# NutriDeby — Backlog Atual (estado vivo)

Retrato do backlog em 07/09/2026. Inclui itens **concluídos** e **pendentes**. O núcleo da Fase 0 está concluído e **validado ponta a ponta em produção** (nutri registra → cria paciente → paciente loga na PWA → registra peso → aparece na nutri).

Legenda: 🔴 bloqueado · 🟡 parcial · ⚪ a iniciar · 📋 planejado · ✅ concluído · P/M/G = esforço.

---

## ✅ Fase 0 — Concluído (produção)

| Área | Item | Ref. |
|---|---|:--:|
| Onboarding | Cadastro de nutricionista + trial automático 14 dias + **validação de CRN** | US-01 |
| Onboarding | Cadastro de paciente pela nutri (loop de login validado) | US-03 |
| LGPD | Termo de Consentimento + revogação | US-04/05 |
| LGPD | Cripto em **repouso (disco Railway) / trânsito (TLS)** + log de auditoria. ⚠️ **Não há cripto de campo (application-level)** — ver item 12 | US-19/20 |
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
| Plano | **Ligar ações de plano no admin** — Aprovar/Duplicar/Rascunho IA/Editor criar+editar; ciclo da nutri fecha ponta a ponta | US-09/10, item 17 |
| Prontuário | **Editor de prontuário/antropometria no admin** — anamnese + medidas, IMC automático | item 18 |
| Compliance | **Blindar aprovação de plano** — rota dedicada `POST /:id/aprovar`; DTO de criar/editar não aceita `aprovadoPeloNutri`; `origem` imutável | item 11 (PR#53) |
| Dívida | **Fonte única de tipos (contrato OpenAPI)** — `@nestjs/swagger` gera `openapi.json` versionado; admin-web e pwa-patient consomem tipos gerados; gate de drift nos 3 pacotes | item 7 (PR#54–60) |
| IA | **Latência do rag-agent** — extended thinking off por padrão, `max_tokens` 1600, streaming, instrumentação. *Falta medir em prod* | item 19 (PR#61) |
| UX | Última consulta no dashboard + legenda/rótulos no gráfico de evolução | item 14 (PR#62) |

---

## 🎯 Fase 0 — Pendente

### P0
| # | Item | Origem | Esf. | Status |
|:-:|---|---|:--:|:--:|
| 1 | Decisão de canal + aditivo de DPA (teste do bot liberado) | US-16 | M | 🔴 Bloqueado (jurídico) |
| ~~—~~ | ~~Hospedar o rag-agent~~ | — | M | ✅ Concluído |
| ~~—~~ | ~~Validação de CRN no cadastro~~ | US-01 | P | ✅ Concluído |

### P1 — pendente
| # | Item | Esf. | Status |
|:-:|---|:--:|:--:|
| 19b | **Medir latência real do rascunho em prod** — gerar 1 rascunho pela UI (nutri Pro/Clínica + paciente c/ prontuário), ler logs `embedding/rag/llm/total ms` do rag-agent, confirmar <15s (US-08). Se não bater, o log diz o gargalo | P | 🟡 aguarda 1 rascunho real |
| — | **Deploys pós-merge** — api-gateway e rag-agent já deployados; deploy manual após cada merge que muda runtime | P | ✅ processo |

> P1 concluídos: 4 (checkout Asaas), 5 (fila aprovação), 6 (telegram-bot), 7 (fonte única de tipos), 8 (adaptador de canais), 9 (disclaimer PWA), 17 (ações de plano no admin), 18 (editor de prontuário), **20 (anamnese auto-declarada — backend PR#66, PWA PR#67, admin PR#68; recorte validado pelo nutri-domain)**.

### P2 — hardening
| Ordem | # | Item | Esf. | Status |
|:--:|:-:|---|:--:|:--:|
| **1º** | 12 | **Cripto de campo AES-256** nos modelos sensíveis. **✅ Código concluído** (PR): AES-256-GCM via extensão do Prisma (`$extends`), chave única `FIELD_ENCRYPTION_KEY` (Railway), registry única de campos + **gate no CI** (cobertura via DMMF), tolerância a texto legado e script `backfill:encrypt-health` (idempotente). **Pendente:** rollout em prod (migração Decimal→String + set da chave + backfill) — runbook em `railway-admin`, aguarda janela + OK. | G | 🟡 código pronto; rollout prod pendente |
| **2º** | 13 | Ambiente de staging — **blueprint + scaffolding prontos** (`docs/arquitetura/staging.md`, `*/.env.staging.example`, skill `deploy-nutrideby`, política de dados LGPD). **Pendente:** provisionar a infra paga (Railway env `staging` + Postgres + projetos Vercel) — aguarda OK de custo. | M | 🟡 blueprint pronto; provisionamento pendente |
| — | 16 | Estender testes de gate a `prontuarios`/`registros` + e2e HTTP dos guards (follow-up do PR#31) | P | ⚪ a iniciar |
| — | — | Migrar módulo `pacientes` para o contrato OpenAPI (item 7 não cobriu; `PacienteApi` ainda manual) | P | ⚪ a iniciar |
| — | — | `rag-agent`: `embed_query` usa `input_type="document"` (deveria ser `"query"` p/ Voyage — afeta qualidade da recuperação); upgrade SDK `anthropic` 0.68→1.x | P/M | ⚪ dívida |
| ~~1º~~ | ~~21~~ | ~~**HAZARD `db push`** — `prisma db push` do api-gateway DROPA a `knowledge_base`~~. **✅ Corrigido:** modelo `KnowledgeBase` (`@@map("knowledge_base")`) declarado no `schema.prisma` do api-gateway com `embedding Unsupported("vector(1024)")`; o `db push` agora reconhece e preserva a tabela, o índice ivfflat e a extensão `vector`. | M | ✅ concluído |

> P2 concluídos: 10 (testes do gate), 11 (blindar aprovação), 14 (menores sem dependência), 15 (mascarar cpfCnpj no log), 19 (latência rag-agent — falta medir).

**Ordem recomendada agora:**
1. **19b** — medir a latência (rápido, fecha o item 19).
2. **Item 12 (cripto de campo)** — maior peso de compliance restante; abrir a discussão de design (pgcrypto vs. `$extends`, chave no Railway).
3. **Staging (13)**.

> Núcleo funcional e sob contrato de tipos. O trabalho restante é sobretudo **blindagem de compliance** (cripto de campo) e **infra** (staging).

---

## 🔮 Fase 1/2 — Épicos de Expansão (fora da Fase 0)

Detalhe em `fase1_2_epicos_ia_exames_loja.md`. Gate de aprovação embutido; bloqueio transversal jurídico/CFN/DPA.

| Épico | O que é (gate embutido) | Depende de | Status |
|---|---|:--:|:--:|
| A · Análise de Exames | IA estrutura dados do exame (não diagnostica) → aprovação | Jurídico/DPA | 📋 Planejado |
| B · Recomendação de Produtos | IA sugere produtos como rascunho → aprovação | Épicos A+C | 📋 Planejado |
| C · Loja Virtual (e-commerce) | Catálogo/carrinho/checkout; reusa Asaas | Jurídico/DPA | 📋 Planejado |
| — · Anamnese estruturada | Campos free-text do prontuário (alergias, histórico clínico…) → estruturados (arrays). Tirado de "menores": migração de schema em dado de saúde + backfill de prod + compliance-reviewer | — | 📋 Planejado |
| — · Segunda base nutricional (TBCA) | Base da USP (~2000 alimentos) além da TACO. Decisão de schema (`fonte` na tabela vs. tabela nova) + seed + busca/cálculo multi-fonte. Talvez nem Fase 0 (TACO já atende US-11) | — | 📋 Planejado |

---

## 🛠️ Épico — Painel do Operador (WSS+13)

**Registrado em 02/09/2026.** Hoje o sistema tem só 2 papéis (`NUTRICIONISTA`, `PACIENTE`) — **não existe conta/admin do Operador**. A WSS+13 (Operadora) administra a plataforma por **acesso de infra** (Railway, banco, deploys, scripts). Suficiente na fase de testes; vira necessidade ao operar em escala.

**Escopo previsto:** papel `OPERADOR` + área de gestão da plataforma — onboarding/suporte a nutricionistas, gestão de assinaturas/cobrança, métricas da plataforma, gestão da base de conhecimento do RAG, e supervisão de auditoria/compliance.

**⚠️ Fronteira de LGPD (não-negociável no design):** a WSS+13 é **Operadora, não Controladora**. O painel **NÃO** pode dar acesso irrestrito a dado clínico do paciente (prontuários, planos). Gestão de nutris/cobrança/config da plataforma — sim; navegar dado de saúde do paciente — só com base legal/DPA específica (ex.: suporte com consentimento), nunca por default.

**Status:** 📋 Planejado (épico novo, fora da Fase 0). Não iniciar sem decisão de escopo + revisão do recorte de LGPD.

---

**P0 restante:** só a decisão de canal + DPA (jurídico — brief enviado à Controladora).

**Estado em 07/09/2026:** Fase 0 funcional e em produção, com todo o contrato de tipos gerado do backend (item 7). api-gateway e rag-agent deployados. Próximos: medir latência do rascunho em prod (19b), depois abrir o design da cripto de campo (item 12). Épicos registrados fora da Fase 0: **Painel do Operador**, **anamnese estruturada**, **TBCA**.
