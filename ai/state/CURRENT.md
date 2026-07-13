# Revid Current Project State

Last updated: 2026-07-13

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Delivery decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Product State

- Phase 4 initial version: `COMPLETE - PASS`
- Product V2 / Phase 5: active
- V2 priority: Canvas first acceptance
- Database direction: MySQL-only
- Completed V2 Tasks: T5-001 through T5-006 (`DONE - PASS`)

## Active Delivery

- Active implementation Task: none
- Most recently completed: `T5-006 - Autosave, conflicts, history, and recovery`
- State: `DONE - PASS`
- Task: `ai/tasks/todo/TASK-T5-006.md`
- Plan: `ai/tasks/doing/TASK-T5-006-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-006-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-006.md`
- Next planned Task: `T5-007 - Node registry, project-shared assets/templates, generation tasks/results, and mock provider flows`

## Current Verified Facts

- T5-004 delivered the canonical full-screen multi-Canvas shell, routing, metadata navigation, exact graph scope, viewport persistence, mobile review boundary, and V2 token/accessibility closure.
- T5-005 delivered one persistent keyed Leafer world, typed deterministic commands, selection/group/connect/arrange/lock, synchronized DOM access, 10%-800% view controls, and the mock-browser 200-node/300-connection performance profile.
- T5-006 delivered the atomic idempotent document PATCH, serialized autosave, exact local recovery, Canvas-keyed 100-command undo/redo, reconstructable latest-50 revision history, checkpoints, conflict handling, and restore-to-new-head.
- T5-006 final evidence passed 12 guarded MySQL document/revision tests, 16 focused Chromium tests, 200 full backend tests, 56 full Chromium tests, a 4,739-module build, independent review, and hygiene gates.
- Browser offline and 200/300 performance evidence remains deterministic mock-browser evidence. T5-008 owns final local-MySQL 200/300 persistence, restart, performance, accessibility, visual, and security certification.
- Alembic head remains `f0a1b2c3d4e5`; no T5-006 schema change or user/runtime migration occurred.

## Exact Next Action

Create T5-007 Task/PLAN/PROGRESS, mark it as the only active implementation Task, and inspect the existing asset/template/generation contracts before business-code edits.

## Blockers And Human Gates

- No repository blocker prevents T5-007 planning.
- Applying `f0a1b2c3d4e5` to user/runtime data requires reviewed backup discipline and Human authorization.
- Paid provider calls, real secret access, credential rotation, destructive MySQL work, and ignored local `.db` cleanup remain Human Owner gates.
- The pre-existing `revid_test_db` schema remains untouched pending ownership confirmation.

## Worktree And Automation

- T5-006 Unit E started from clean `main` at `095cc7363c94996cfda51a84f3722b90190f9674`.
- Only owned T5-006 code, tests, Task/state/report, and pitfalls paths are in the delivery diff.
- Ignored `.env`, `.db`, Playwright output, and runtime artifacts remain excluded from staging.
- Automation memory is only a cursor; repository documents, code, diff, tests, and runtime evidence are authoritative.
