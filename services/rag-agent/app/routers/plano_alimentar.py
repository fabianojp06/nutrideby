from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.audit import registrar_acesso_prontuario
from app.core.config import Settings, get_settings
from app.models.schemas import RascunhoPlanoAlimentarRequest, RascunhoPlanoAlimentarResponse
from app.services.embedding_service import EmbeddingProviderError, EmbeddingService
from app.services.knowledge_base_service import KnowledgeBaseService
from app.services.llm_service import LLMGenerationError, LLMService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Plano Alimentar"])


@router.post(
    "/rascunho-plano-alimentar",
    response_model=RascunhoPlanoAlimentarResponse,
    status_code=status.HTTP_200_OK,
    summary="Gera rascunho de plano alimentar via RAG + Claude, para revisão do nutricionista",
)
async def gerar_rascunho_plano_alimentar(
    payload: RascunhoPlanoAlimentarRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> RascunhoPlanoAlimentarResponse:
    # Nenhuma saída deste endpoint pode ser enviada ao paciente sem aprovação
    # explícita do nutricionista — essa aprovação/envio é responsabilidade do
    # serviço consumidor (api-gateway), não deste agente.
    registrar_acesso_prontuario(
        paciente_id=payload.prontuario.paciente_id,
        nutricionista_id=payload.nutricionista_id,
        acao="gerar_rascunho_plano_alimentar",
    )

    embedding_service: EmbeddingService = request.app.state.embedding_service
    knowledge_base_service: KnowledgeBaseService = request.app.state.knowledge_base_service
    llm_service: LLMService = request.app.state.llm_service

    query_text = (
        f"Prontuário: {payload.prontuario.model_dump_json()}. "
        f"Pergunta: {payload.pergunta_nutricionista}"
    )

    try:
        query_embedding = await embedding_service.embed_query(query_text)
    except EmbeddingProviderError as exc:
        logger.exception("Falha ao gerar embedding da consulta")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao gerar embedding: {exc}",
        ) from exc

    try:
        contextos = await knowledge_base_service.buscar_contexto_relevante(query_embedding)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Falha ao consultar base de conhecimento")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Falha ao consultar base de conhecimento clínico.",
        ) from exc

    try:
        rascunho_texto = await llm_service.gerar_rascunho(
            prontuario=payload.prontuario,
            pergunta_nutricionista=payload.pergunta_nutricionista,
            contextos=contextos,
        )
    except LLMGenerationError as exc:
        logger.exception("Falha ao gerar rascunho via Claude")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao gerar rascunho: {exc}",
        ) from exc

    # O campo `disclaimer` é fixo no schema (frozen + validator) — não é
    # possível omiti-lo ou sobrescrevê-lo aqui, por design de compliance.
    return RascunhoPlanoAlimentarResponse(
        rascunho=rascunho_texto,
        fontes_utilizadas=contextos,
        modelo_utilizado=settings.anthropic_model,
    )
