# Revid Current Project State

Last updated: 2026-07-12

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Hermes: retired; no Queue, card, profile, Reviewer, HANDOFF, or runtime reconciliation is active
- Delivery decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Product State

- Phase 4 initial version: `COMPLETE - PASS`
- Product V2 / Phase 5: active
- V2 priority: Canvas first acceptance
- Visual direction: premium graphite-black and dark-purple system
- Database direction: MySQL-only; SQLite support is approved for retirement but still exists in Phase 4 source until T5-002 completes

## Active Delivery

- Task: `T5-002 - P0 credential cleanup and complete MySQL-only retirement`
- State: `DOING`
- Task: `ai/tasks/todo/TASK-T5-002.md`
- Plan: `ai/tasks/doing/TASK-T5-002-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-002-PROGRESS.md`
- Dependency: T5-001 complete

## Latest Completed Task

- Task: `T5-001 - V2 documentation and architecture baseline`
- State: `DONE - PASS`
- Task: `ai/tasks/todo/TASK-T5-001.md`
- Plan: `ai/tasks/doing/TASK-T5-001-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-001-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-001.md`
- Outcome: V2 product, Canvas acceptance, visual, architecture, MySQL-only, multi-canvas, roadmap, and execution contracts are decision-complete.

## Locked V2 Documents

- PRD: `ai/requirements/REVID-V2-PRD.md`
- Canvas acceptance: `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- Canvas architecture: `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- V2 design system: `ui/REVID-V2-DESIGN-SYSTEM.md`
- MySQL-only ADR: `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- Multi-canvas ADR: `ai/decisions/ADR-005-project-multi-canvas.md`
- Roadmap: `ai/state/ROADMAP.md`

## Current Facts And Risks

- Current running health was last observed as MySQL connected and ready with `current == head == e9f1a2b3c4d5`.
- Source defaults still select SQLite, so runtime evidence does not satisfy the MySQL-only source contract.
- T5-002 Unit A retired the unused `backend/run_alembic_mysql.py` helper and removed its tracked hard-coded database password assignment without opening the file or displaying the value/raw diff; the verified unit is delivered in a scoped local commit.
- Source cleanup does not rotate a credential that may have been used. Rotation remains a separate Human Owner gate if the assignment was ever real or reused.
- Unit A verification passed backend compile and all 189 backend tests; redacted scans found no remaining hard-coded password assignment.
- Current Canvas remains project-scoped, uses conflicting light and dark theme sources, hides its grid behind an opaque surface, and broadly rebuilds the Leafer scene.

## Exact Next Action

Start Unit B by replacing SQLite-selectable runtime configuration with fail-closed MySQL-only settings and focused tests.

## Blockers And Release Conditions

- Credential rotation becomes Human-required only if the assignment was ever real or reused; release by rotating it in the owning system and recording only the outcome.
- Local ignored `.db` artifact deletion is blocked pending exact-path Human approval after MySQL backup and parity evidence.
- No push is authorized.

## Worktree Protection

- Unit A run started from `main` at `a245dcb31065f209217095707e4067c5b0243066`.
- Pre-existing staged, tracked-modified, unmerged, detached, and in-progress Git-operation state: none.
- Forty-five root `.playwright-cli/*.yml` files and untracked `output/` were pre-existing and remain excluded from Unit A staging.
- Ignored `.env` and `.db` artifacts must not be opened, deleted, moved, or committed without explicit authorization.

## Delivery Automation

- Automation: `revid-codex-direct-delivery-controller`
- Commit policy: each completed verified unit ends in a scoped local commit; no automatic push
- Automation memory is only a cursor and never overrides this file, ROADMAP, Tasks, code, tests, or runtime evidence.
