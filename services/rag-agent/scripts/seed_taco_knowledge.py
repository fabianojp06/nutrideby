"""Semeia a base de conhecimento (knowledge_base / pgvector) do Agente Clínico
RAG com a Tabela TACO (composição de alimentos — dado oficial e público).

Cada alimento da tabela `alimentos_taco` vira um trecho de texto descritivo
(composição por 100 g) que é embutido (embedding) e inserido em `knowledge_base`.
Assim o RAG passa a recuperar fatos nutricionais reais ao gerar rascunhos.

Idempotente: remove os trechos com source='TACO' antes de reinserir, então pode
ser rodado de novo com segurança.

Pré-requisitos (variáveis de ambiente — as mesmas do serviço):
  DATABASE_URL          Postgres com pgvector (a mesma base do api-gateway,
                        onde já existe a tabela alimentos_taco)
  EMBEDDING_PROVIDER    voyageai | openai      (default voyageai)
  EMBEDDING_API_KEY     chave do provedor de embeddings
  EMBEDDING_MODEL       ex.: voyage-3-large    (deve gerar 1024 dims)
  ANTHROPIC_API_KEY     exigido pelas settings (não usado neste script)

Uso (a partir de services/rag-agent, com o venv/deps instalados):
  python -m scripts.seed_taco_knowledge
"""
from __future__ import annotations

import asyncio
import logging
import os

import asyncpg

from app.core.config import get_settings
from app.services.embedding_service import EmbeddingService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_taco")

SOURCE = "TACO"

# (coluna, rótulo, unidade) — só entram no texto os valores não nulos.
CAMPOS = [
    ("kcal", "energia", "kcal"),
    ("proteina_g", "proteína", "g"),
    ("carboidrato_g", "carboidratos", "g"),
    ("lipideos_g", "lipídios", "g"),
    ("fibra_g", "fibra alimentar", "g"),
    ("colesterol_mg", "colesterol", "mg"),
    ("sodio_mg", "sódio", "mg"),
    ("potassio_mg", "potássio", "mg"),
    ("calcio_mg", "cálcio", "mg"),
    ("ferro_mg", "ferro", "mg"),
    ("magnesio_mg", "magnésio", "mg"),
    ("zinco_mg", "zinco", "mg"),
    ("vitamina_c_mg", "vitamina C", "mg"),
]

# nomes reais das colunas no Postgres (Prisma mapeia camelCase -> snake_case? não:
# o Prisma mantém o nome do campo; confirmamos abaixo lendo information_schema).


def montar_texto(row: asyncpg.Record) -> str:
    partes = []
    for coluna, rotulo, unidade in CAMPOS:
        valor = row.get(coluna)
        if valor is not None:
            partes.append(f"{rotulo} {valor} {unidade}")
    composicao = "; ".join(partes) if partes else "composição não informada"
    return (
        f"TACO — {row['descricao']} (categoria: {row['categoria']}; "
        f"código {row['codigo']}). Valores por 100 g: {composicao}."
    )


async def resolver_colunas(conn: asyncpg.Connection) -> dict[str, str]:
    """Mapeia nome lógico -> nome real da coluna em alimentos_taco (o Prisma pode
    ter gravado camelCase). Retorna um dict apenas com as colunas existentes."""
    rows = await conn.fetch(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'alimentos_taco'"
    )
    existentes = {r["column_name"] for r in rows}
    # candidatos: snake_case e camelCase para cada campo
    def achar(*cands: str) -> str | None:
        for c in cands:
            if c in existentes:
                return c
        return None

    mapa = {
        "codigo": achar("codigo"),
        "categoria": achar("categoria"),
        "descricao": achar("descricao"),
        "kcal": achar("kcal"),
        "proteina_g": achar("proteina_g", "proteinaG"),
        "carboidrato_g": achar("carboidrato_g", "carboidratoG"),
        "lipideos_g": achar("lipideos_g", "lipideosG"),
        "fibra_g": achar("fibra_g", "fibraG"),
        "colesterol_mg": achar("colesterol_mg", "colesterolMg"),
        "sodio_mg": achar("sodio_mg", "sodioMg"),
        "potassio_mg": achar("potassio_mg", "potassioMg"),
        "calcio_mg": achar("calcio_mg", "calcioMg"),
        "ferro_mg": achar("ferro_mg", "ferroMg"),
        "magnesio_mg": achar("magnesio_mg", "magnesioMg"),
        "zinco_mg": achar("zinco_mg", "zincoMg"),
        "vitamina_c_mg": achar("vitamina_c_mg", "vitaminaCMg"),
    }
    return {k: v for k, v in mapa.items() if v is not None}


async def main() -> None:
    settings = get_settings()
    embedder = EmbeddingService(settings)
    conn = await asyncpg.connect(dsn=settings.database_url)
    try:
        # Garante a estrutura (extensão pgvector + tabela knowledge_base) —
        # idempotente (CREATE ... IF NOT EXISTS). Assim um único comando
        # prepara e semeia a base.
        schema_path = os.path.join(os.path.dirname(__file__), "..", "db", "schema.sql")
        with open(schema_path, "r", encoding="utf-8") as fh:
            await conn.execute(fh.read())
        logger.info("schema aplicado (pgvector + knowledge_base).")

        colunas = await resolver_colunas(conn)
        if "descricao" not in colunas or "codigo" not in colunas:
            raise SystemExit("Tabela alimentos_taco não encontrada ou sem colunas esperadas.")

        # SELECT com alias para nomes lógicos (independe de camel/snake case)
        selects = ", ".join(f'"{real}" AS {logico}' for logico, real in colunas.items())
        alimentos = await conn.fetch(f"SELECT {selects} FROM alimentos_taco ORDER BY codigo")
        logger.info("Alimentos TACO encontrados: %d", len(alimentos))
        if not alimentos:
            raise SystemExit("Nenhum alimento na tabela alimentos_taco — seede a TACO primeiro.")

        # Idempotência: limpa a fatia TACO da base antes de reinserir.
        removidos = await conn.execute("DELETE FROM knowledge_base WHERE source = $1", SOURCE)
        logger.info("knowledge_base limpo (%s)", removidos)

        inseridos = 0
        for i, row in enumerate(alimentos, start=1):
            texto = montar_texto(row)
            try:
                emb = await embedder.embed_query(texto)
            except Exception:
                logger.exception("Falha ao embutir código %s — pulando", row["codigo"])
                continue
            vetor = "[" + ",".join(str(x) for x in emb) + "]"
            await conn.execute(
                "INSERT INTO knowledge_base (source, content, embedding) "
                "VALUES ($1, $2, $3::vector)",
                SOURCE,
                texto,
                vetor,
            )
            inseridos += 1
            if i % 50 == 0:
                logger.info("... %d/%d", i, len(alimentos))

        logger.info("Concluído: %d trechos TACO inseridos na knowledge_base.", inseridos)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
