# REPORT T4-003 - MySQL Runtime Cutover And Acceptance

- Status: `PASS`
- Completed: 2026-07-10
- Owner: Codex Project Lead Engineer
- Delivery mode: `CODEX_DIRECT_DELIVERY`

## Outcome

FastAPI now starts in MySQL mode with `DatabaseStore`, rejects unreachable or out-of-date schemas, reports deterministic database readiness, persists API-created project data across engine and process restarts, and retains the SQLite rollback path.

Real acceptance used the existing local MySQL 8.0 service and the project-root `.env` under explicit Human Owner authorization. The runtime process consumed the file; Codex did not open, print, copy, or persist its contents.

## Implementation

| File | Change |
|---|---|
| `backend/database.py` | Resolve Alembic head with an absolute migration path, read the live engine, reject revision mismatch, and emit actionable secret-safe failures. |
| `backend/api/health.py` | Probe the real connection and expose `connected`, `ready`, dialect, current revision, head revision, and match state without credentials. |
| `backend/controllers/store.py` | Flush the new user before inserting its quota row, fixing MySQL foreign-key error 1452. |
| `backend/main.py` | Remove the unused `InMemoryStore` import; MySQL continues to configure `DatabaseStore` only after schema validation. |
| `backend/README.md` | Document project-root `.env` startup through `uvicorn --app-dir backend --env-file .env` and health readiness semantics. |
| `backend/tests/test_mysql_runtime_cutover.py` | Add deterministic live-engine, absolute Alembic path, mismatch, and MySQL parent-before-child write-order coverage. |
| `backend/tests/test_health.py` | Add ready, failed-connection, MySQL revision-match, and secret-safe health coverage. |

No migration was added because database revision `a1b2c3d4e5f6` already equals the Alembic head.

## Verification

### Automated Tests

| Verification | Result |
|---|---|
| `test_mysql_runtime_cutover.py` | 9 passed |
| `test_health.py` | 5 passed |
| Safe backend suite excluding real T4-002 disposable migration class | 132 passed |
| T4-002 migration mock/regression classes | 12 passed |
| Total safe regression evidence | 144 passed |
| `compileall` on changed Python files | passed |
| `git diff --check` | passed; line-ending warnings only |

The T4-002 `TestMigrationTool` real disposable-database class was not run because its separate `REVID_TEST_MYSQL_ADMIN_URL` capability was intentionally absent. Its 12 mock/regression tests passed. T4-003 instead completed its own real MySQL runtime integration below.

### MySQL Runtime

| Check | Result |
|---|---|
| Database | `revid_db` |
| MySQL version | `8.0.43` |
| Alembic current/head | `a1b2c3d4e5f6` / `a1b2c3d4e5f6` |
| Revision match | true |
| FastAPI store backend | `DatabaseStore` |
| `/health` | `status=ok`, `dialect=mysql`, `connected=true`, `ready=true` |
| Real uvicorn process | started successfully with project-root env file |

### Persistence Records

The following non-destructive acceptance records remain in MySQL for Navicat inspection:

| Entity | ID | Creation path |
|---|---|---|
| User | `759076e9-8965-4459-b174-7163c0892e9d` | `DatabaseStore.create_user` |
| Project | `47f3db82-75b7-478f-8d19-6de5d707563e` | `POST /projects` |
| Canvas node | `c38740b3-570a-4d50-9b69-8995aa11c343` | `POST /projects/{project_id}/nodes` |
| Asset | `51e482fa-df8e-4e0e-a36a-17ec4b7fde96` | `POST /assets/upload` |

Project, node, and asset GET requests returned 200:

- immediately after creation;
- after engine dispose and re-initialization;
- from a separate Python process;
- through a real uvicorn HTTP process.

### Read-Only Database Inspection

- 13 base tables including `alembic_version`.
- 11 foreign keys.
- Missing app-table comments: 0.
- Missing app-column comments: 0.
- User, project, node, and asset acceptance record presence: all true.

### Failure And Rollback Paths

- Forced MySQL connection failure prevented application startup with `RuntimeError`.
- The error was actionable and contained no configured password.
- The service did not fall back to in-memory storage.
- `REVID_USE_SQLITE=true` started with `DatabaseStore`, `dialect=sqlite`, and `ready=true`.

## Acceptance Criteria

| Criterion | Verdict |
|---|---|
| MySQL mode starts and health is ready | PASS |
| User/project/node/asset persist and are database-visible | PASS |
| Records survive backend restart and remain API-readable | PASS |
| SQLite-safe regression and real MySQL integration pass | PASS |
| SQLite rollback remains functional | PASS |
| Connection failure is actionable and fail-closed | PASS |
| No secret exposure | PASS |

## Safety

- No `.env` content was opened or displayed.
- No password, token, Authorization header, or credential-bearing URL was written to evidence.
- No `DROP`, `TRUNCATE`, destructive `DELETE`, downgrade, reset, or cleanup was executed.
- No paid external API was called.
- Acceptance records were intentionally retained rather than destructively cleaned up.

## Final Verdict

`T4-003 DONE - PASS`. T4-004 is dependency-ready.
