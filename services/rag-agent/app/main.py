from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.database import create_pool
from app.routers.plano_alimentar import router as plano_alimentar_router
from app.services.embedding_service import EmbeddingService
from app.services.knowledge_base_service import KnowledgeBaseService
from app.services.llm_service import LLMService

settings = get_settings()

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_pool = await create_pool(settings)
    app.state.embedding_service = EmbeddingService(settings)
    app.state.knowledge_base_service = KnowledgeBaseService(settings, app.state.db_pool)
    app.state.llm_service = LLMService(settings)
    logger.info("rag-agent iniciado (env=%s, embedding_provider=%s)", settings.app_env, settings.embedding_provider)
    try:
        yield
    finally:
        await app.state.db_pool.close()


app = FastAPI(
    title="NutriDeby — Agente Clínico RAG",
    description=(
        "Serviço interno que gera rascunhos de planos alimentares e orientações "
        "nutricionais via RAG (pgvector) + Claude (Anthropic), sempre para "
        "revisão de um nutricionista habilitado."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(plano_alimentar_router)


@app.get("/health", tags=["Infra"])
async def health() -> dict:
    return {"status": "ok"}
