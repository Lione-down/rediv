# Task: T4-002 Unit C1 — PLAN

## Execution Identity

- Task: T4-002
- Unit: C1 (fixture/schema preflight)
- Queue Revision: phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18
- Executor: revid-backend
- Business Attempt: 1 continuation

## Scope

Execute two integration tests against real MySQL:

1. `TestMigrationTool::test_ac8_structured_url_and_identity` — proves URL built via SQLAlchemy URL API, database identity = `revid_test_t4_002`, and `SELECT DATABASE()` returns the expected name.
2. `TestMigrationTool::test_ac9_alembic_creates_schema` — proves all 12 application tables exist after Alembic `upgrade head`.

## Environment Provenance

- `REVID_TEST_MYSQL_ADMIN_URL`: set in runtime environment (confirmed).
- MySQL version: 8.0.43 (per CURRENT.md verified baseline).
- Alembic revision: `a1b2c3d4e5f6`.
- Test database: `revid_test_t4_002` (unique per Task).

## Hard Gates Checklist

| # | Gate | Status |
|---|------|--------|
| 1 | Secret from runtime env only, no leakage | Enforced |
| 2 | Destructive ops limited to CREATE/DROP `revid_test_t4_002` | Enforced |
| 3 | Database identity = `revid_test_t4_002` | Verified in test_ac8 |
| 4 | Schema via Alembic upgrade head, 12 tables | Verified in test_ac9 |
| 5 | Missing secret / perm / identity / cleanup → BLOCKED | Enforced |
| 6 | No old T4-002 card reuse | Confirmed |

## Execution Steps

1. Confirm `REVID_TEST_MYSQL_ADMIN_URL` is set (env check).
2. Confirm git diff for business files is empty (read-only).
3. Run `test_ac8_structured_url_and_identity`.
4. Run `test_ac9_alembic_creates_schema`.
5. Verify cleanup (DROP `revid_test_t4_002`).
6. Write REPORT with evidence.
7. Create HANDOFF card.

## Risk Assessment

- Runtime: Hermes dispatch timeout risk inherited from rev17. Mitigated by thin-dispatcher fix (rev18 PMC PASS).
- MySQL connectivity: Admin URL must have CREATE/DROP DATABASE privileges.
- Cleanup failure: Must propagate to test failure (AC12 behavior in tearDownClass).
