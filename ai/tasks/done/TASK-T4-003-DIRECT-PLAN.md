# T4-003 Direct Delivery Plan

## Goal

Complete and verify the existing MySQL runtime implementation without Hermes and without restarting the work from scratch.

## Implementation Units

1. Audit current code, tests, documentation, and diff against `ai/tasks/todo/TASK-T4-003.md`.
2. Correct only defects or weak tests proven by the audit.
3. Run focused tests, compile checks, and relevant SQLite-safe regression from a working directory that does not contain `.env`.
4. Check only the presence and target identity of process-provided MySQL configuration; never print values or open `.env`.
5. When the target is proven safe, run non-destructive startup, health, create-read, engine/process restart, and read-only database acceptance.
6. Write the direct REPORT, conduct a fresh diff review, and update CURRENT and ROADMAP.

## Non-Goals

- No Auth, frontend, Canvas, Agnes, or quota feature work.
- No Hermes runtime remediation.
- No schema change unless a concrete Alembic gap is demonstrated.
- No destructive database cleanup.

## Verification Semantics

- Unit tests prove branch behavior and error semantics.
- Integration evidence must use a real, explicitly identified safe MySQL target.
- Navicat or equivalent read-only evidence proves persistence and schema visibility.
- Mock or connection-failure tests do not satisfy real MySQL acceptance.

## Rollback

Business-code changes remain scoped to the allowed T4-003 files. SQLite remains the supported fallback mode through `REVID_USE_SQLITE=true`. No data rollback is authorized or expected.
