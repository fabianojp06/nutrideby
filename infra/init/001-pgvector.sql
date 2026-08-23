-- Habilita a extensão pgvector no banco nutrideby.
-- Usada pelo services/rag-agent para embeddings do Agente Clínico RAG.
CREATE EXTENSION IF NOT EXISTS vector;
