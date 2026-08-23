"""Busca de contexto clínico relevante via pgvector (RAG).

A base de conhecimento contém diretrizes CFN e material clínico de
referência, previamente carregados e indexados em `knowledge_base`
(coluna `embedding` do tipo vector, extensão pgvector).
"""
from __future__ import annotations

import logging

import asyncpg

from app.core.config import Settings
from app.models.schemas import FonteContexto

logger = logging.getLogger(__name__)


class KnowledgeBaseService:
    def __init__(self, settings: Settings, pool: asyncpg.Pool):
        self._settings = settings
        self._pool = pool

    async def buscar_contexto_relevante(
        self, query_embedding: list[float], top_k: int | None = None
    ) -> list[FonteContexto]:
        """Retorna os `top_k` trechos mais próximos por similaridade de cosseno.

        Usa o operador `<=>` (distância de cosseno) do pgvector. A base é
        somente-leitura a partir deste serviço — indexação/ingestão é um
        processo separado (batch/admin), fora do escopo deste endpoint.
        """
        k = top_k or self._settings.knowledge_base_top_k
        vector_literal = "[" + ",".join(str(x) for x in query_embedding) + "]"

        query = """
            SELECT
                source,
                content,
                1 - (embedding <=> $1::vector) AS similaridade
            FROM knowledge_base
            ORDER BY embedding <=> $1::vector
            LIMIT $2
        """
        try:
            async with self._pool.acquire() as conn:
                rows = await conn.fetch(query, vector_literal, k)
        except Exception:
            logger.exception("Falha ao consultar base de conhecimento (pgvector)")
            raise

        return [
            FonteContexto(source=row["source"], trecho=row["content"], similaridade=float(row["similaridade"]))
            for row in rows
        ]
