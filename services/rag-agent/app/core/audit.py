"""Log de auditoria para operações sobre dado de saúde (requisito LGPD/compliance).

Implementação mínima: log estruturado. Em produção, persistir em tabela
`audit_log` (append-only) com paciente_id, nutricionista_id, ação, timestamp.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

audit_logger = logging.getLogger("nutrideby.audit")


def registrar_acesso_prontuario(
    *, paciente_id: str, nutricionista_id: str, acao: str
) -> None:
    audit_logger.info(
        "audit_event",
        extra={
            "audit": True,
            "paciente_id": paciente_id,
            "nutricionista_id": nutricionista_id,
            "acao": acao,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
