# Report: T5-002 P0 credential cleanup and complete MySQL-only retirement

## Result

`DONE - PASS` on 2026-07-13.

Revid backend runtime, persistence tests, migration tooling, configuration, and active documentation are MySQL-only. Runtime configuration fails closed, the tracked credential assignment was removed without value disclosure, predictable runtime security defaults are gone, and the final MySQL/schema/security evidence passed.

## Delivered

- Removed the tracked hard-coded database password assignment by retiring its unused helper without exposing the value.
- Removed active SQLite selectors, dependencies, engine/schema helpers, migration tooling, wrappers, tests, documentation, runtime `create_all()`, and the production in-memory fallback.
- Added reusable exact-name guarded disposable MySQL test schemas with post-create and pre-cleanup `SELECT DATABASE()` identity gates.
- Migrated database-backed tests to MySQL while retaining database-free pure unit fakes and mocks.
- Required explicit MySQL and JWT configuration, made health ready only for connected MySQL at Alembic head, and disabled dev-admin login unless explicitly configured.
- Added full migrated-schema comment/FK inspection and committed-data persistence evidence across SQLAlchemy engine reconstruction.
- Left ignored local `.db` artifacts and the pre-existing `revid_test_db` schema untouched.

## Acceptance Evidence

| Gate | Evidence | Result |
|---|---|---|
| Credential source cleanup | Retired helper; redacted tracked scans; no value displayed | PASS |
| Rotation reporting | Conditional Human Owner rotation gate retained in CURRENT/PROGRESS | PASS |
| MySQL-only fail-closed runtime | Focused configuration, lifespan, health, revision, seed, and store tests | PASS |
| SQLite/test/tool retirement | Active marker scan 0; tracked DB artifacts 0 | PASS |
| Guarded database tests | Exact `revid_test_*` names and `SELECT DATABASE()` lifecycle gates | PASS |
| Schema comments and FKs | `test_mysql_closure.py` compares all ORM application tables/columns and FK metadata with MySQL | PASS |
| Restart persistence | Committed user/project reloaded after engine disposal and reconstruction | PASS |
| Focused closure | fixture guards plus D2 closure tests, 6/6 | PASS |
| Full backend regression | 169/169 in 96.311 seconds | PASS |
| Alembic | Single head `e9f1a2b3c4d5` | PASS |
| Credential hygiene | Six classified test/history/placeholder literals; zero review candidates; no values output | PASS |
| Disposable cleanup | `revid_test_t5_002_closure` absent after tests | PASS |
| Diff quality | Fresh review and `git diff --check` | PASS |

## Human Owner Gates Remaining

- If the removed assignment was ever real or reused, rotate the credential in its owning system and record only the outcome.
- Ignored local `.db` artifacts require exact-path approval after backup/parity evidence before quarantine or deletion.
- The pre-existing `revid_test_db` schema requires ownership confirmation before destructive cleanup.

These gates do not invalidate T5-002 implementation acceptance because the Task required reporting rotation separately and preserving local artifacts.

## Next Task

Create and activate T5-003 Task/PLAN/PROGRESS before implementing the expand-first multi-canvas schema and compatibility API unit.
