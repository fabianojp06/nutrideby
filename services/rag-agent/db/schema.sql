-- Estrutura mínima da base de conhecimento clínico usada pelo RAG.
-- Ingestão/indexação de diretrizes CFN e material clínico é um processo
-- separado (fora do escopo deste serviço) que popula esta tabela.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1024) NOT NULL, -- deve casar com EMBEDDING_DIMENSIONS
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice aproximado para busca por similaridade de cosseno em escala.
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
    ON knowledge_base USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
