"""Configuração via variáveis de ambiente.

Centraliza leitura de env vars para evitar chaves hardcoded no código
(requisito de segurança — dado de saúde/API keys nunca no repositório).
"""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Anthropic (geração — único provedor permitido pelo DPA assinado) ---
    anthropic_api_key: str = Field(..., description="Chave da API Anthropic (Claude)")
    anthropic_model: str = Field(
        default="claude-sonnet-5",
        description=(
            "Modelo Claude usado para geração dos rascunhos clínicos. Sonnet-5 "
            "por padrão: latência muito menor que Opus (~60s -> alvo <15s da US-08) "
            "e qualidade suficiente para um RASCUNHO revisado/aprovado pela nutri. "
            "Provedor segue sendo Anthropic (DPA). Override via env ANTHROPIC_MODEL "
            "(ex.: claude-opus-5) se quiser priorizar qualidade sobre velocidade."
        ),
    )

    # --- Embeddings (provedor configurável — não é geração, DPA não restringe) ---
    embedding_provider: str = Field(
        default="voyageai",
        description="Provedor de embeddings: 'voyageai', 'openai' ou 'anthropic-compatible'",
    )
    embedding_api_key: str = Field(default="", description="Chave da API do provedor de embeddings")
    embedding_model: str = Field(default="voyage-3-large", description="Modelo de embeddings")
    embedding_dimensions: int = Field(default=1024, description="Dimensão do vetor de embedding")

    # --- Banco de dados ---
    database_url: str = Field(
        ...,
        description="URL de conexão PostgreSQL (com extensão pgvector habilitada)",
    )

    # --- Aplicação ---
    app_env: str = Field(default="development")
    log_level: str = Field(default="INFO")
    knowledge_base_top_k: int = Field(default=5, description="Nº de trechos recuperados via RAG")

    # --- Compliance (não editável em runtime — apenas para asserção/testes) ---
    disclaimer_text: str = Field(
        default=(
            "Esta é uma sugestão para revisão do profissional. "
            "A decisão final é de responsabilidade exclusiva do nutricionista."
        )
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
