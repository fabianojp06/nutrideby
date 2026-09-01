# Plano de Deploy — `services/rag-agent` (Agente Clínico RAG)

> **Status: PROPOSTA — não executar sem aprovação.** Deploy toca dado de saúde
> (prontuário em trânsito) e output de IA clínica. Passa pelo `compliance-reviewer`
> antes de ir ao ar. Referência de fluxo: skill `deploy-nutrideby` (gate de CI verde).

Data: 01/09/2026 · Backlog: P0 #2 (`docs/produto/backlog_atual.md`)

---

## 1. Objetivo e estado atual

O `rag-agent` (FastAPI, Python) gera **rascunhos** de plano alimentar via RAG
(pgvector + Claude). Está **codado e testado localmente**, mas **não hospedado** —
só roda na máquina do dev (`uvicorn app.main:app`).

O `api-gateway` **já está em produção** (Railway) e sabe chamá-lo, mas aponta para
`localhost`:

```
services/api-gateway/src/planos-alimentares/rag-agent.service.ts:50
  const baseUrl = this.config.get('RAG_AGENT_BASE_URL', 'http://localhost:8000');
```

Em produção `localhost` é o próprio container do gateway — o rag-agent não existe lá.
Efeito: **a geração por IA (feature do plano Pro/Clínica) está morta em produção**;
o gate por plano (`PLANOS_COM_ACESSO_RAG`) e a aprovação da nutri já existem no gateway.

**Meta do deploy:** subir o rag-agent num host, com chaves e base de conhecimento,
em rede privada, e reapontar `RAG_AGENT_BASE_URL` no gateway para a URL real.

---

## 2. Decisões a confirmar ANTES de executar

| # | Decisão | Recomendação | Por quê |
|:-:|---|---|---|
| D1 | Onde hospedar | **Railway** (mesmo projeto do api-gateway) | Rede interna privada entre serviços (dado de saúde não sai para a internet pública); mesma conta/observabilidade; padrão já usado. |
| D2 | Banco do `knowledge_base` | **Reusar o Postgres de produção** (já tem pgvector) | Evita 2º banco e 2ª superfície de dado. `knowledge_base` não tem PII de paciente — é material clínico/diretrizes. |
| D3 | Exposição de rede | **Somente domínio interno** (sem domínio público) | O rag-agent nunca deve ser alcançável pelo paciente nem pela internet. Só o api-gateway o chama. |
| D4 | Modelo Claude | Confirmar `ANTHROPIC_MODEL` (config default: `claude-opus-5`) | Custo/latência vs. qualidade; alinhar com o DPA assinado (Anthropic é o único provedor de geração permitido). |
| D5 | Origem da base de conhecimento | Definir quem entrega as diretrizes CFN a ingerir | Sem `knowledge_base` populada, o RAG recupera vazio e o rascunho perde a fundamentação. É pré-requisito de qualidade. |

---

## 3. Pré-requisitos (bloqueadores)

- [ ] **Chaves**: `ANTHROPIC_API_KEY` e `EMBEDDING_API_KEY` (Voyage) de produção disponíveis.
- [ ] **DPA Anthropic** vigente cobrindo geração de texto clínico (compliance já registra isso).
- [ ] **Base de conhecimento** (diretrizes CFN/material clínico) pronta para ingestão (D5).
- [ ] **pgvector** habilitado no Postgres de produção (`CREATE EXTENSION vector`).
- [ ] Artefatos de deploy inexistentes hoje — **precisam ser criados** (§4).

---

## 4. Artefatos de código a criar (nova branch, PR próprio)

Hoje **não há Dockerfile / nixpacks / Procfile** no `rag-agent`. Antes do deploy:

1. **Start command / runtime** — uma das opções:
   - `Procfile`: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - ou `Dockerfile` (python:3.12-slim, `pip install -r requirements.txt`, mesmo comando).
   - Railway injeta `$PORT`; **não** fixar 8000/8001 no start.
2. **Migração de schema** — rodar `db/schema.sql` no Postgres de produção
   (via skill `railway-admin`, tcp-proxy). Cria `knowledge_base` + índice ivfflat.
3. **Ingestão da base** — script/carga separada que popula `knowledge_base`
   (embeddings com o MESMO `EMBEDDING_MODEL`/`EMBEDDING_DIMENSIONS=1024` do schema `VECTOR(1024)`).
4. **Persistência de auditoria** — `core/audit.py` hoje só loga estruturado; o
   README pede evoluir para tabela `audit_log` em produção (acesso a prontuário = LGPD).
   Avaliar se é bloqueador do go-live ou fast-follow.

> ⚠️ **Inconsistência a corrigir**: README do rag-agent documenta porta **8001**,
> mas o default do gateway é **8000**. Irrelevante em produção (usaremos `$PORT` +
> `RAG_AGENT_BASE_URL` explícito), mas alinhar a doc para não confundir.

---

## 5. Variáveis de ambiente (no host do rag-agent)

Fonte: `app/core/config.py` + `.env.example`. **Nunca** commitar valores reais.

| Variável | Obrigatória | Observação |
|---|:--:|---|
| `ANTHROPIC_API_KEY` | ✅ | Único provedor de geração (DPA). |
| `ANTHROPIC_MODEL` | — | Default `claude-opus-5`; confirmar (D4). |
| `EMBEDDING_PROVIDER` | — | Default `voyageai`. |
| `EMBEDDING_API_KEY` | ✅* | Obrigatória na prática (embeddings da consulta e da base). |
| `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS` | — | `voyage-3-large` / `1024` — **deve casar** com `VECTOR(1024)` do schema. |
| `DATABASE_URL` | ✅ | Postgres de produção com pgvector; conexão interna, TLS. |
| `APP_ENV` | — | `production`. |
| `LOG_LEVEL` | — | `INFO`. |
| `KNOWLEDGE_BASE_TOP_K` | — | Default `5`. |

E no **api-gateway** (produção), depois que o rag-agent estiver no ar:

| Variável | Novo valor |
|---|---|
| `RAG_AGENT_BASE_URL` | URL **interna** do rag-agent (ex.: `http://rag-agent.railway.internal:PORT`) |

---

## 6. Sequência de execução (ordem importa)

```
1. [código]   Criar Procfile/Dockerfile no rag-agent  → PR → CI verde → merge
2. [dados]    Rodar db/schema.sql no Postgres de prod  (railway-admin)
3. [dados]    Ingerir base de conhecimento (knowledge_base populada)
4. [deploy]   Criar serviço rag-agent no Railway, root = services/rag-agent,
              setar TODAS as env vars (§5), rede interna (sem domínio público)
5. [verify]   GET /health → {"status":"ok"}; testar POST /rascunho-plano-alimentar
              com prontuário fictício (nunca dado real de paciente em teste)
6. [religar]  Setar RAG_AGENT_BASE_URL no api-gateway (URL interna) → redeploy gateway
7. [e2e]      Nutri no plano Pro gera rascunho → confirma disclaimer, fontes,
              e que o rascunho NÃO aparece ao paciente sem aprovação (gate)
8. [review]   compliance-reviewer valida trânsito TLS, gate intacto, auditoria
```

> **Regra de ouro**: só religar o gateway (passo 6) depois de `/health` e do teste
> de rascunho passarem (passo 5). Enquanto `RAG_AGENT_BASE_URL` apontar para local-
> host, a feature simplesmente falha com erro tratado — não corrompe nada.

---

## 7. Validação de compliance (gate de go-live)

- [ ] **Trânsito**: chamada gateway→rag-agent por rede **interna/privada** + TLS. Prontuário nunca em URL/query, só no corpo.
- [ ] **Gate de aprovação intacto**: rascunho nasce `aprovadoPeloNutri=false`; rotas `/me/*` filtram aprovados. Deploy **não** cria caminho IA→paciente.
- [ ] **Disclaimer CFN**: presente e imutável (`frozen` no schema de resposta).
- [ ] **Auditoria**: todo acesso a prontuário registrado (avaliar `audit_log` — §4.4).
- [ ] **Segredos**: chaves só em env vars do host; nada no repo/log/URL.
- [ ] **Exposição**: rag-agent sem domínio público; não alcançável pelo paciente.

---

## 8. Rollback

- **Reversível e barato**: reverter `RAG_AGENT_BASE_URL` no gateway para o default
  (`localhost`) desliga a feature de IA em produção — o resto do sistema continua
  intacto (a geração de rascunho falha com erro tratado, sem afetar planos manuais).
- O serviço rag-agent pode ficar de pé sem tráfego enquanto se investiga.
- Nenhuma migração destrutiva: `schema.sql` só cria tabela/índice aditivos.

---

## 9. Riscos e pontos abertos

| Risco | Mitigação |
|---|---|
| `knowledge_base` vazia → rascunho sem fundamentação | D5: garantir ingestão ANTES do go-live (passo 3). |
| Dimensão de embedding ≠ 1024 | Travar `EMBEDDING_DIMENSIONS=1024` = `VECTOR(1024)`. |
| Custo Anthropic sem teto | Confirmar modelo (D4) e monitorar; gate por plano já limita quem usa. |
| Auditoria só em log | Decidir se `audit_log` persistente é go-live ou fast-follow (§4.4). |
| Latência da geração | `top_k` e modelo; medir no teste e2e (passo 7). |

---

## 10. Definition of Done

- rag-agent no ar (host interno), `/health` ok.
- `knowledge_base` populada; recuperação retorna fontes reais.
- api-gateway em produção com `RAG_AGENT_BASE_URL` correto; teste e2e de rascunho verde.
- Gate de aprovação e disclaimer verificados pelo `compliance-reviewer`.
- Backlog atualizado (P0 #2 → concluído).
