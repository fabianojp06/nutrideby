"""Geração de embeddings — provedor configurável via EMBEDDING_PROVIDER.

Importante: a geração do rascunho clínico (LLM) usa exclusivamente a API
da Anthropic (ver llm_service.py), conforme DPA assinado. Embeddings não
envolvem geração de texto clínico ao paciente e podem usar outro provedor,
mas o texto enviado ao provedor de embeddings ainda é dado de saúde —
manter minimização de dados (não enviar identificadores diretos).
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod

from app.core.config import Settings

logger = logging.getLogger(__name__)


class EmbeddingProviderError(Exception):
    """Erro ao gerar embedding junto ao provedor configurado."""


class BaseEmbeddingClient(ABC):
    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError


class VoyageAIEmbeddingClient(BaseEmbeddingClient):
    """Cliente para a API da Voyage AI (recomendada pela própria Anthropic para embeddings)."""

    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model

    async def embed(self, text: str) -> list[float]:
        try:
            import voyageai  # import tardio: dependência opcional
        except ImportError as exc:
            raise EmbeddingProviderError(
                "Pacote 'voyageai' não instalado. Adicione-o ao requirements.txt."
            ) from exc

        client = voyageai.AsyncClient(api_key=self._api_key)
        try:
            result = await client.embed([text], model=self._model, input_type="document")
        except Exception as exc:  # noqa: BLE001 — normaliza erro de provedor externo
            logger.exception("Falha ao gerar embedding via Voyage AI")
            raise EmbeddingProviderError(str(exc)) from exc
        return result.embeddings[0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        try:
            import voyageai  # import tardio
        except ImportError as exc:
            raise EmbeddingProviderError(
                "Pacote 'voyageai' não instalado. Adicione-o ao requirements.txt."
            ) from exc

        client = voyageai.AsyncClient(api_key=self._api_key)
        try:
            result = await client.embed(texts, model=self._model, input_type="document")
        except Exception as exc:  # noqa: BLE001
            logger.exception("Falha ao gerar embeddings (lote) via Voyage AI")
            raise EmbeddingProviderError(str(exc)) from exc
        return result.embeddings


class OpenAIEmbeddingClient(BaseEmbeddingClient):
    """Cliente OpenAI — apenas para embeddings (nunca para geração de texto clínico)."""

    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model

    async def embed(self, text: str) -> list[float]:
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise EmbeddingProviderError(
                "Pacote 'openai' não instalado. Adicione-o ao requirements.txt."
            ) from exc

        client = AsyncOpenAI(api_key=self._api_key)
        try:
            response = await client.embeddings.create(input=text, model=self._model)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Falha ao gerar embedding via OpenAI")
            raise EmbeddingProviderError(str(exc)) from exc
        return response.data[0].embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise EmbeddingProviderError(
                "Pacote 'openai' não instalado. Adicione-o ao requirements.txt."
            ) from exc

        client = AsyncOpenAI(api_key=self._api_key)
        try:
            response = await client.embeddings.create(input=texts, model=self._model)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Falha ao gerar embeddings (lote) via OpenAI")
            raise EmbeddingProviderError(str(exc)) from exc
        return [d.embedding for d in response.data]


class EmbeddingService:
    """Fábrica + fachada para geração de embeddings, isolando o provedor concreto."""

    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = self._build_client(settings)

    @staticmethod
    def _build_client(settings: Settings) -> BaseEmbeddingClient:
        provider = settings.embedding_provider.lower()
        if provider == "voyageai":
            return VoyageAIEmbeddingClient(settings.embedding_api_key, settings.embedding_model)
        if provider == "openai":
            return OpenAIEmbeddingClient(settings.embedding_api_key, settings.embedding_model)
        raise ValueError(
            f"EMBEDDING_PROVIDER '{settings.embedding_provider}' não suportado. "
            "Use 'voyageai' ou 'openai'."
        )

    async def embed_query(self, text: str) -> list[float]:
        return await self._client.embed(text)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return await self._client.embed_batch(texts)
