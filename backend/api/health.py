from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Return database health without exposing secrets."""
    from models.base import _engine as engine

    status = "error"
    dialect_name = None
    connection_ok = False
    alembic_current = None
    alembic_head = None
    alembic_match = None
    ready = False

    if engine is not None:
        dialect_name = engine.dialect.name
        if dialect_name != "mysql":
            return {
                "status": "wrong_dialect",
                "database": {
                    "dialect": dialect_name,
                    "connected": False,
                    "ready": False,
                    "alembic_current": None,
                    "alembic_head": None,
                    "alembic_match": False,
                },
            }
        try:
            from sqlalchemy import text

            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                connection_ok = True

                try:
                    result = conn.execute(
                        text("SELECT version_num FROM alembic_version LIMIT 1")
                    )
                    row = result.fetchone()
                    alembic_current = row[0] if row else None
                except Exception:
                    alembic_current = None

            try:
                from database import get_alembic_head_revision

                alembic_head = get_alembic_head_revision()
            except Exception:
                alembic_head = None

            alembic_match = bool(
                alembic_current
                and alembic_head
                and alembic_current == alembic_head
            )
            ready = connection_ok and alembic_match
            status = "ok" if ready else "schema_mismatch"
        except Exception:
            status = "error"
            connection_ok = False
            ready = False

    return {
        "status": status,
        "database": {
            "dialect": dialect_name or "none",
            "connected": connection_ok,
            "ready": ready,
            "alembic_current": alembic_current,
            "alembic_head": alembic_head,
            "alembic_match": alembic_match,
        },
    }
