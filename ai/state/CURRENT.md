# Revid Current Project State

Last updated: 2026-07-20

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version: `DONE / PASS`.
- Product V2 / Phase 5: `DONE / PASS`; T5-096 is the final T5 Task.
- Product V3 / Phase 6: active.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: `T6-002 - Project audit remediation and structural hardening`.
- State: `DOING`
- Verification outcome: `PENDING`
- Task: [TASK-T6-002](../tasks/todo/TASK-T6-002.md).
- Plan: [TASK-T6-002-PLAN](../tasks/doing/TASK-T6-002-PLAN.md).
- Progress: [TASK-T6-002-PROGRESS](../tasks/doing/TASK-T6-002-PROGRESS.md).
- Active unit: `Unit 8 - Request-scoped repositories`.
- Last completed Task: `T6-001 - Revid-native cinematic director Skills v2`, `DONE / PASS`.
- Last report: [REPORT-T6-001](../reports/REPORT-T6-001.md).
- Archived completion detail: [2026-07-20 T5/T6 completion snapshot](archive/2026-07-20-t5-t6-completion-snapshot.md).

## Live Gates

- T6-002 Units 1-5 are delivered: fail-closed authentication, atomic invitation redemption, authoritative routes/provenance, bounded Canvas JSON, and exact Agnes endpoint trust.
- Unit 6 is delivered: immutable-action least-privilege CI, reviewed Python constraints, digest-pinned MySQL 8, process-safe backend runner, deterministic Chromium, and pinned secret/SAST checks.
- Unit 7 is delivered: exact T6 State/Verification metadata, complete ROADMAP rows, a concise CURRENT cursor with archived detail, refreshed entry docs, and a GREEN durable-state validator.
- Latest Unit 6 evidence: clean Python 3.13 `pip check`; backend `575/575`; frontend build `4937` modules; deterministic functional/accessibility Chromium `552/552`.
- The unchanged 200-node/300-connection headed hardware gate remains separate from ordinary SwiftShader CI. No real or paid provider request is authorized or claimed.
- Only guarded disposable `revid_test_*` schemas may be created or dropped by tests.

## Exact Next Action

Execute Unit 8 request-scoped repository migration: begin with two-store freshness RED tests, then move auth/admin reads off process-wide full-table caches in bounded verified commits.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, and `output/` paths; never stage them.
- Preserve unrelated concurrent work. The active Task owns only paths explicitly recorded in its PROGRESS document.
- The local ignored `backend/.venv-ci-check/` is retained temporarily for the final clean-environment regression because recursive deletion was blocked by tool safety policy.

## Boundaries And Human Gates

- Historical Task paths remain stable; directory names are not workflow state.
- Offline/mock evidence does not establish real-provider health, capacity, fidelity, or cost.
- User/runtime database migration, paid calls, real secrets, destructive operations, and incompatible supported-contract removal still require explicit Human authorization.
