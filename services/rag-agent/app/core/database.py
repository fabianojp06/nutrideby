"""Pool de conexões PostgreSQL (asyncpg), compartilhado via app.state."""
from __future__ import annotations

import asyncpg

from app.core.config import Settings


async def create_pool(settings: Settings) -> asyncpg.Pool:
    return await asyncpg.create_pool(dsn=settings.database_url, min_size=1, max_size=10)
