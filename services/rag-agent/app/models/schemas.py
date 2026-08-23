"""Schemas Pydantic — contratos de entrada/saída da API."""
from __future__ import annotations

from datetime import date
from enum import Enum

from pydantic import BaseModel, Field, field_validator

DISCLAIMER_TEXT = (
    "Esta é uma sugestão para revisão do profissional. "
    "A decisão final é de responsabilidade exclusiva do nutricionista."
)


class Sexo(str, Enum):
    FEMININO = "feminino"
    MASCULINO = "masculino"
    OUTRO = "outro"


class DadosAntropometricos(BaseModel):
    peso_kg: float = Field(..., gt=0, le=500, description="Peso atual em kg")
    altura_cm: float = Field(..., gt=0, le=300, description="Altura em cm")
    idade: int = Field(..., ge=0, le=130)
    sexo: Sexo
    circunferencia_cintura_cm: float | None = Field(default=None, gt=0)
    percentual_gordura: float | None = Field(default=None, ge=0, le=100)
    imc: float | None = Field(default=None, description="Calculado se não informado")

    @field_validator("imc")
    @classmethod
    def calcula_imc_se_ausente(cls, v, info):
        if v is not None:
            return v
        data = info.data
        peso = data.get("peso_kg")
        altura = data.get("altura_cm")
        if peso and altura:
            return round(peso / ((altura / 100) ** 2), 2)
        return v


class Anamnese(BaseModel):
    queixa_principal: str | None = None
    historico_clinico: str | None = Field(
        default=None, description="Comorbidades, doenças pré-existentes, histórico familiar"
    )
    medicamentos_uso_continuo: list[str] = Field(default_factory=list)
    alergias_intolerancias: list[str] = Field(default_factory=list)
    habitos_alimentares: str | None = None
    nivel_atividade_fisica: str | None = None
    objetivo: str | None = Field(default=None, description="Ex: perda de peso, hipertrofia, controle glicêmico")
    observacoes_adicionais: str | None = None


class Prontuario(BaseModel):
    paciente_id: str = Field(..., description="Identificador interno do paciente (não expor CPF/documentos)")
    data_nascimento: date | None = None
    anamnese: Anamnese
    dados_antropometricos: DadosAntropometricos


class RascunhoPlanoAlimentarRequest(BaseModel):
    prontuario: Prontuario
    pergunta_nutricionista: str = Field(
        ..., min_length=3, max_length=4000,
        description="Pergunta ou contexto adicional fornecido pelo nutricionista responsável",
    )
    nutricionista_id: str = Field(..., description="ID do profissional solicitante — usado no log de auditoria")


class FonteContexto(BaseModel):
    source: str
    trecho: str
    similaridade: float


class RascunhoPlanoAlimentarResponse(BaseModel):
    rascunho: str = Field(..., description="Rascunho gerado pela IA para revisão do nutricionista")
    fontes_utilizadas: list[FonteContexto] = Field(default_factory=list)
    modelo_utilizado: str
    disclaimer: str = Field(
        default=DISCLAIMER_TEXT,
        frozen=True,
        description="Aviso obrigatório de compliance (Código de Ética CFN) — nunca omitido",
    )

    @field_validator("disclaimer")
    @classmethod
    def forca_disclaimer_fixo(cls, v):
        # Requisito não-negociável: o valor nunca pode ser sobrescrito por outro texto.
        return DISCLAIMER_TEXT
