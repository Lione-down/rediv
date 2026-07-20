# Revid Backend

Revid Backend 是基于 FastAPI 的 API 服务，负责认证、Admin、项目、画布、素材、额度、生成任务和 provider integration。

## V2 Database Contract

V2 只支持 MySQL。Runtime、Alembic、database-backed tests 和 failure handling 均使用同一数据库 contract，不提供 alternate-database 或 in-memory production fallback。

权威决策见：

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

Configuration uses the `REVID_` prefix. Runtime requires these variable names:

```text
REVID_DB_HOST
REVID_DB_PORT
REVID_DB_NAME
REVID_DB_USER
REVID_DB_PASSWORD
REVID_JWT_SECRET
REVID_RUNTIME_PROFILE
REVID_RUNTIME_BIND_HOST
REVID_ALLOW_MOCK_AUTH
```

`REVID_JWT_SECRET` must be a unique non-placeholder value of at least 32 characters. Inject real credential values through process environment or an ignored local secret file. Do not paste values into commands, docs, source, screenshots or issue reports. Never commit `.env` or `.env.*`.

Development authentication is off by default. Mock WeChat and `/admin/dev-login` require all of `REVID_RUNTIME_PROFILE=development`, loopback `REVID_RUNTIME_BIND_HOST`, and `REVID_ALLOW_MOCK_AUTH=true`; non-loopback requests are rejected. `REVID_WECHAT_MOCK_ENABLED` and `REVID_DEV_ADMIN_KEY` then opt in their individual routes. A disabled development route returns 404.

The optional admin key is sent only in the `X-Revid-Dev-Admin-Key` header, never in a query string. Password login and development-auth attempts use a MySQL-backed fixed window shared by all Uvicorn workers; limits are configured by `REVID_AUTH_LOGIN_ATTEMPT_LIMIT`, `REVID_AUTH_DEVELOPMENT_ATTEMPT_LIMIT`, and `REVID_AUTH_ATTEMPT_WINDOW_SECONDS`.

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

If any check fails, startup and `/health` must report not ready. Alternate database or in-memory fallback is not an accepted recovery path.

Do not run downgrade, destructive migration, reset, DROP, TRUNCATE or destructive DELETE against user data without explicit Human Owner authorization.

## Start

From repository root, after the approved MySQL runtime variables are available:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --reload
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

Database-backed tests require the process-supplied `REVID_TEST_MYSQL_ADMIN_URL` and use exact-name guarded disposable `revid_test_*` schemas. Pure unit tests remain database-free. Tests must never point to user or production databases.

## Local Database Artifacts

Ignored historical `.db` files are not V2 runtime data sources. Do not delete them automatically. Each exact path requires backup/parity evidence and Human Owner approval before removal.

## Security Note

The current `T5-002` includes a P0 source credential finding. Source cleanup must not print the candidate value, and deleting an assignment does not rotate a credential. If the value was ever real or reused, Human Owner must rotate it separately.
