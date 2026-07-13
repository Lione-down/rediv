# Revid Current Project State

Last updated: 2026-07-14

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

- Active implementation Task: `T5-007 - Node registry, project resources, and generation integration`
- State: `DOING`
- Task: `ai/tasks/todo/TASK-T5-007.md`
- Plan: `ai/tasks/doing/TASK-T5-007-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-007-PROGRESS.md`
- Most recently completed: `T5-006 - Autosave, conflicts, history, and recovery` (`DONE - PASS`)
- Completed T5-007 units: Unit A - node registry and compatibility boundary; Unit B - additive MySQL resource contract; Unit C - project assets and templates; Unit D - generation transactions and frontend service (`PASS`)
- Active T5-007 unit: Unit E - Canvas resource and generation experience

## Current Verified Facts

- T5-004 delivered the canonical full-screen multi-Canvas shell, routing, metadata navigation, exact graph scope, viewport persistence, mobile review boundary, and V2 token/accessibility closure.
- T5-005 delivered one persistent keyed Leafer world, typed deterministic commands, selection/group/connect/arrange/lock, synchronized DOM access, 10%-800% view controls, and the mock-browser 200-node/300-connection performance profile.
- T5-006 delivered the atomic idempotent document PATCH, serialized autosave, exact local recovery, Canvas-keyed 100-command undo/redo, reconstructable latest-50 revision history, checkpoints, conflict handling, and restore-to-new-head.
- T5-006 final evidence passed 12 guarded MySQL document/revision tests, 16 focused Chromium tests, 200 full backend tests, 56 full Chromium tests, a 4,739-module build, independent review, and hygiene gates.
- T5-007 Unit A delivered the six-type canonical registry, compatibility-only legacy definitions, lossless unsupported-node round trips, exact typed port geometry, registry-driven creation/group/connect/render behavior, media presentation, and the responsive keyboard ToolDock.
- T5-007 Unit A final evidence passed 71 Canvas Chromium tests, 6 authenticated workflow tests, a post-review 7/7 focused browser run, a 4,747-module build, four-viewport visual inspection, independent review at 0 HIGH / 0 MEDIUM, diff hygiene, and the 500-line gate.
- T5-007 Unit B added Alembic head `a6b7c8d9e0f1`, resource origin attribution, strict versioned template graphs, guarded legacy backfill/downgrade, database-enforced scope, transactional node-link clearing, database-authoritative resource reads, and non-destructive `409` project-delete conflicts.
- T5-007 Unit B final evidence passed 47 guarded schema/project/Canvas tests and 49 affected resource/template/mock-generation tests; safe downgrade, compile, single-head, diff, file-size, and independent review gates passed at 0 HIGH / 0 MEDIUM.
- T5-007 Unit C added project-owned asset filters, audio upload support, cross-Canvas resource visibility, versioned graph capture, atomic target-Canvas template instantiation, deterministic create-only ID remapping, exact retry metadata, and one-transaction legacy template project creation.
- T5-007 Unit C final evidence passed 123 affected backend tests plus independent template/document/revision reruns; compile, restart, diff, file-size, single-head, and independent review gates passed at 0 HIGH / 0 MEDIUM / 0 LOW.
- T5-007 Unit D delivered idempotent project-scoped generation transactions, no-charge terminal failures, quota reservations and revision snapshots, atomic grant/debit ledgers, strict provider result validation, restart reconciliation, and one frontend generation service with per-session monotonic quota updates.
- T5-007 Unit D final evidence passed 94 affected backend tests plus 3 subtests, 11 focused/authenticated Chromium tests, a 4,748-module build, Alembic head `c9d0e1f2a3b4`, independent backend/browser reruns, and review at 0 HIGH / 0 MEDIUM / 0 LOW.
- Browser offline and 200/300 performance evidence remains deterministic mock-browser evidence. T5-008 owns final local-MySQL 200/300 persistence, restart, performance, accessibility, visual, and security certification.
- Repository Alembic head is `c9d0e1f2a3b4`; no user/runtime migration occurred.

## Exact Next Action

Establish Unit E browser RED tests for cross-Canvas resources, asset/template insertion, contextual generation states, narrow drawers, keyboard focus, and the 375px review-only boundary before implementing the responsive Canvas resource UI.

## Blockers And Human Gates

- No repository blocker prevents T5-007 Unit E.
- Applying `a6b7c8d9e0f1` to user/runtime data requires reviewed backup discipline and Human authorization.
- Applying `b8c9d0e1f2a3` to user/runtime data is covered by the same migration gate.
- Applying `c9d0e1f2a3b4` to user/runtime data is covered by the same migration gate.
- Paid provider calls, real secret access, credential rotation, destructive MySQL work, and ignored local `.db` cleanup remain Human Owner gates.
- The pre-existing `revid_test_db` schema remains untouched pending ownership confirmation.

## Worktree And Automation

- T5-007 Unit D was developed from clean Unit C baseline `af8196fc165eb5d2cacc16a8ede9fa57213e0942`.
- Ignored `.env`, `.db`, Playwright output, and runtime artifacts remain excluded from staging.
- Automation memory is only a cursor; repository documents, code, diff, tests, and runtime evidence are authoritative.
