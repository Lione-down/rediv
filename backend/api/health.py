from pathlib import Path

from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Return database health without exposing secrets."""
    from models.base import _engine as engine

    status = "ok"
    dialect_name = None
    connection_ok = False
    alembic_current = None
    alembic_head = None
    alembic_match = None

    if engine is not None:
        try:
            dialect_name = engine.dialect.name
            connection_ok = True

            # Try to read Alembic version (may not exist in SQLite mode)
            from sqlalchemy import text

            try:
                with engine.connect() as conn:
                    result = conn.execute(
                        text("SELECT version_num FROM alembic_version LIMIT 1")
                    )
                    row = result.fetchone()
                    alembic_current = row[0] if row else None
            except Exception:
                # Alembic not configured — not an error for SQLite mode
                alembic_current = None

            # Read Alembic head
            try:
                from alembic.config import Config
                from alembic.script import ScriptDirectory

                alembic_ini = Path(__file__).resolve().parent.parent / "alembic.ini"
                alembic_cfg = Config(str(alembic_ini))
                script = ScriptDirectory.from_config(alembic_cfg)
                alembic_head = script.get_current_head()
            except Exception:
                alembic_head = None

            alembic_match = (
                (alembic_current == alembic_head)
                if (alembic_current and alembic_head)
                else None
            )

            if alembic_match is False:
                status = "schema_mismatch"
        except Exception:
            status = "error"
            connection_ok = False

    return {
        "status": status,
        "database": {
            "dialect": dialect_name or "none",
            "connected": connection_ok,
            "alembic_current": alembic_current,
            "alembic_head": alembic_head,
            "alembic_match": alembic_match,
        },
    }
