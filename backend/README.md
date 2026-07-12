# Revid Backend

Revid Backend 是基于 FastAPI 的 API 服务，负责认证、Admin、项目、画布、素材、额度、生成任务和 provider integration。

## V2 Database Contract

V2 只支持 MySQL。SQLite runtime、`aiosqlite`、SQLite database-backed tests、in-memory production fallback 和 MySQL-to-SQLite rollback 路径均进入 `T5-002` 退役范围。

当前源码处于过渡窗口：legacy SQLite 分支可能仍存在，但不得用于 V2 开发、验收或故障回退。权威决策见：

- [`ADR-004`](../ai/decisions/ADR-004-mysql-only-runtime-and-tests.md)
- [`T5-002`](../ai/tasks/todo/TASK-T5-002.md)
- [`CURRENT`](../ai/state/CURRENT.md)

## Technology

- FastAPI
- Pydantic Settings
- SQLAlchemy
- MySQL 8.x and PyMySQL
- Alembic
- Uvicorn
- httpx

## Structure

```text
backend/
├── api/            # Versioned route registration and API entrypoints
├── controllers/    # Business controllers and stores
├── core/           # Middleware, provider and cross-cutting behavior
├── models/         # SQLAlchemy models
├── schemas/        # Request and response schemas
├── settings/       # Runtime configuration
├── tests/          # Unit and integration tests
├── database.py     # Database lifecycle
└── main.py         # Application composition
```

## Prerequisites

- Python 3.11 or newer
- MySQL 8.x
- A dedicated local or test database with least-privilege credentials

Install dependencies from `backend/`:

```powershell
python -m pip install -r requirements.txt
```

## Runtime Configuration

Configuration uses the `REVID_` prefix. Database runtime requires these variable names:

```text
REVID_DB_HOST
REVID_DB_PORT
REVID_DB_NAME
REVID_DB_USER
REVID_DB_PASSWORD
```

During the `T5-002` transition, set `REVID_USE_SQLITE=false`. The flag will be removed when MySQL-only retirement is complete.

Inject real credential values through process environment or an ignored local secret file. Do not paste values into commands, docs, source, screenshots or issue reports. Never commit `.env` or `.env.*`.

## Schema Lifecycle

From `backend/`, apply migrations only to an explicitly selected disposable or approved database:

```powershell
python -m alembic upgrade head
python -m alembic current
```

Backend readiness requires all of the following:

- SQLAlchemy dialect is MySQL.
- Database connection succeeds.
- Current Alembic revision equals repository head.
- Required production store initializes without fallback.

If any check fails, startup and `/health` must report not ready. SQLite or in-memory fallback is not an accepted recovery path.

Do not run downgrade, destructive migration, reset, DROP, TRUNCATE or destructive DELETE against user data without explicit Human Owner authorization.

## Start

From repository root, after the approved MySQL runtime variables are available:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --reload
```

Default endpoints:

- API: `http://127.0.0.1:8000`
- OpenAPI: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## Verification

Focused test commands depend on the active Task. Common read-only or isolated checks include:

```powershell
python -m compileall api controllers core models schemas settings
python -m unittest tests.test_health
python -m unittest tests.test_mysql_runtime_cutover
```

Database-backed tests must use disposable MySQL schema lifecycle and must not point to user or production databases. Tests that still create `.db` files are legacy evidence until `T5-002` retires them; they are not a V2 MySQL acceptance gate.

## Local Database Artifacts

Ignored historical `.db` files are not V2 runtime data sources. Do not delete them automatically. Each exact path requires backup/parity evidence and Human Owner approval before removal.

## Security Note

The current `T5-002` includes a P0 source credential finding. Source cleanup must not print the candidate value, and deleting an assignment does not rotate a credential. If the value was ever real or reused, Human Owner must rotate it separately.
