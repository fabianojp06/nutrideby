"""Geração do rascunho clínico via API da Anthropic (Claude).

Regra de compliance não-negociável: geração de conteúdo clínico usa
exclusivamente a Anthropic (DPA assinado). Nunca trocar por outro
provedor de LLM neste módulo.
"""
from __future__ import annotations

import logging

import anthropic

from app.core.config import Settings
from app.models.schemas import FonteContexto, Prontuario

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
Você é um assistente de IA de apoio a nutricionistas na plataforma NutriDeby.
Sua função é redigir RASCUNHOS de planos alimentares e orientações nutricionais
para revisão de um nutricionista habilitado — você nunca interage diretamente
com pacientes e nunca prescreve de forma definitiva.

Regras obrigatórias:
- Baseie-se no prontuário do paciente e no contexto clínico/diretrizes fornecidos.
- Cite a fonte (nome do documento) sempre que usar uma diretriz específica.
- Se o contexto fornecido for insuficiente ou contraditório, declare isso
  explicitamente em vez de inventar informação.
- Nunca afirme ter certeza diagnóstica; use linguagem de sugestão ("considerar",
  "sugere-se avaliar").
- A decisão final e a responsabilidade técnica são sempre do nutricionista.
- Responda em português do Brasil, em formato claro e estruturado (tópicos/seções).
"""


class LLMGenerationError(Exception):
    """Erro ao gerar o rascunho junto à API da Anthropic."""


class LLMService:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    def _montar_prompt(
        self,
        prontuario: Prontuario,
        pergunta_nutricionista: str,
        contextos: list[FonteContexto],
    ) -> str:
        contexto_formatado = "\n\n".join(
            f"[Fonte: {c.source} | similaridade: {c.similaridade:.2f}]\n{c.trecho}"
            for c in contextos
        ) or "Nenhum contexto relevante recuperado na base de conhecimento."

        return f"""\
Prontuário do paciente (uso interno, não repasse identificadores):
{prontuario.model_dump_json(indent=2)}

Contexto clínico relevante recuperado (diretrizes CFN / base de conhecimento):
{contexto_formatado}

Pergunta / contexto do nutricionista:
{pergunta_nutricionista}

Gere um rascunho de plano alimentar / orientação nutricional para revisão do nutricionista.
"""

    async def gerar_rascunho(
        self,
        prontuario: Prontuario,
        pergunta_nutricionista: str,
        contextos: list[FonteContexto],
    ) -> str:
        prompt = self._montar_prompt(prontuario, pergunta_nutricionista, contextos)
        try:
            response = await self._client.messages.create(
                model=self._settings.anthropic_model,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
        except anthropic.APIStatusError as exc:
            logger.exception("Erro da API Anthropic ao gerar rascunho")
            raise LLMGenerationError(f"Erro da API Anthropic: {exc.message}") from exc
        except anthropic.APIConnectionError as exc:
            logger.exception("Falha de conexão com a API Anthropic")
            raise LLMGenerationError("Falha de conexão com a API Anthropic") from exc

        if response.stop_reason == "refusal":
            raise LLMGenerationError(
                "O modelo recusou a geração por motivos de segurança/política de uso."
            )

        texto = next((b.text for b in response.content if b.type == "text"), "")
        if not texto:
            raise LLMGenerationError("Resposta do modelo não continha conteúdo textual.")
        return texto
