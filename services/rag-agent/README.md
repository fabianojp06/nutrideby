# services/rag-agent — Agente Clínico RAG (NutriDeby)

Serviço Python + FastAPI que gera **rascunhos** de planos alimentares e
orientações nutricionais, usando RAG (PostgreSQL + pgvector) sobre uma base
de conhecimento clínico/diretrizes CFN, com geração via **API da Anthropic
(Claude)** — nunca OpenAI para geração de texto clínico, conforme DPA
assinado. O provedor de embeddings é configurável (não é geração de conteúdo
clínico enviado ao paciente).

> Toda resposta do endpoint principal inclui obrigatoriamente o campo
> `disclaimer`: *"Esta é uma sugestão para revisão do profissional. A decisão
> final é de responsabilidade exclusiva do nutricionista."* Isso é um
> requisito de compliance do Código de Ética do CFN e não pode ser removido.

## Requisitos

- Python 3.11+
- PostgreSQL com extensão `pgvector` habilitada
- Chave de API da Anthropic
- Chave de API do provedor de embeddings escolhido (padrão: Voyage AI)

## Instalação

```bash
cd services/rag-agent
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Configuração

```bash
cp .env.example .env
# edite .env com suas chaves e DATABASE_URL
```

Variáveis principais (ver `.env.example` para a lista completa):

| Variável | Descrição |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Anthropic — usada exclusivamente para geração |
| `ANTHROPIC_MODEL` | Modelo Claude (padrão `claude-opus-5`) |
| `EMBEDDING_PROVIDER` | `voyageai` ou `openai` — usado só para embeddings |
| `DATABASE_URL` | Conexão PostgreSQL com pgvector habilitado |

## Banco de dados

Crie a extensão e a tabela de conhecimento:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

A ingestão/indexação de diretrizes CFN e material clínico na tabela
`knowledge_base` é um processo de carga separado (batch/admin), fora do
escopo deste serviço.

## Rodando localmente

```bash
uvicorn app.main:app --reload --port 8001
```

Documentação interativa: `http://localhost:8001/docs`
Health check: `http://localhost:8001/health`

## Endpoint principal

`POST /rascunho-plano-alimentar`

Recebe o prontuário do paciente (anamnese + dados antropométricos) e a
pergunta/contexto do nutricionista. Fluxo interno:

1. Gera embedding da consulta (prontuário + pergunta) via `embedding_service`.
2. Busca os trechos mais relevantes na base de conhecimento (`knowledge_base_service`, pgvector).
3. Monta o prompt com o contexto recuperado e chama a API da Anthropic (`llm_service`).
4. Retorna o rascunho, as fontes usadas e o `disclaimer` fixo.

Exemplo de request (ver schema completo em `app/models/schemas.py`):

```json
{
  "nutricionista_id": "nutri_123",
  "pergunta_nutricionista": "Qual abordagem dietética considerar para este caso?",
  "prontuario": {
    "paciente_id": "paciente_456",
    "anamnese": {
      "historico_clinico": "Histórico familiar de diabetes tipo 2",
      "objetivo": "Perda de peso"
    },
    "dados_antropometricos": {
      "peso_kg": 78.5,
      "altura_cm": 165,
      "idade": 35,
      "sexo": "feminino"
    }
  }
}
```

## Estrutura

```
app/
  main.py                  # bootstrap FastAPI, lifespan, DI de serviços
  routers/
    plano_alimentar.py      # POST /rascunho-plano-alimentar
  services/
    embedding_service.py    # geração de embeddings (provedor configurável)
    knowledge_base_service.py  # busca vetorial pgvector
    llm_service.py           # geração via Claude (Anthropic)
  models/
    schemas.py               # Pydantic — request/response, disclaimer fixo
  core/
    config.py                # settings via variáveis de ambiente
    database.py               # pool asyncpg
    audit.py                  # log de auditoria (LGPD)
db/
  schema.sql                 # tabela knowledge_base + índice pgvector
```

## Compliance (não-negociável)

- `disclaimer` é fixo no schema de resposta (`frozen=True` + validator) — não
  pode ser omitido nem sobrescrito por lógica de negócio.
- Nenhuma saída deste serviço é enviada automaticamente ao paciente: a
  aprovação explícita do nutricionista é responsabilidade do serviço
  consumidor (`services/api-gateway`).
- Todo acesso a prontuário é registrado via `core/audit.py` (log estruturado
  — evoluir para persistência em tabela `audit_log` em produção).
- Dados de saúde devem trafegar sob TLS 1.2+ e estar criptografados em
  repouso no banco (responsabilidade de infraestrutura/deploy).
