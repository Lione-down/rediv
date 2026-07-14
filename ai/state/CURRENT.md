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
- Completed V2 Tasks: T5-001 through T5-007 (`DONE - PASS`)

## Active Delivery

- Active implementation Task: none during the verified T5-007 commit boundary
- Most recently completed: `T5-007 - Node registry, project resources, and generation integration` (`DONE - PASS`)
- Task: `ai/tasks/todo/TASK-T5-007.md`
- Plan: `ai/tasks/doing/TASK-T5-007-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-007-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-007.md`
- Next Task: `T5-008 - Canvas first-acceptance E2E, performance, browser, MySQL, accessibility, visual, and security closure`

## Current Verified Facts

- T5-004 through T5-007 now provide the complete pre-certification Canvas product: full-screen multi-Canvas routing, persistent Leafer world, deterministic command model, autosave/recovery/revisions, canonical node registry, project-shared resources, versioned templates, durable generation tasks/results, and backend-authoritative quota snapshots.
- T5-007 Unit E adds responsive project resource and contextual generation controls, registry-backed asset/template insertion, durable success/failure result presentation, desktop/narrow keyboard behavior, and a strict 375px browse/review-only boundary.
- Local upload handling now uses bounded JSON/multipart bodies, provisional cross-process reservation slots, per-user/global active and scan limits, same-volume staging, idle/total deadlines, cancellation-safe disk lifecycle, real decodable media fixtures, and bounded CPU/memory validation.
- T5-007 final evidence passed 384 backend tests plus 56 subtests, 134 upload/security tests plus 48 subtests, 117 Chromium tests, a 4,761-module build, four accepted viewport inspections, and independent frontend/security review at 0 HIGH / 0 MEDIUM / 0 LOW.
- Repository Alembic head is `c9d0e1f2a3b4`; no user/runtime migration occurred.
- Browser offline and prior 200-node/300-connection performance evidence remains deterministic mock-browser evidence. T5-008 owns final local-MySQL persistence, restart, performance, accessibility, visual, and security certification.

## Exact Next Action

Commit and push the verified T5-007 closure, then create T5-008 Task/PLAN/PROGRESS before implementing its live FastAPI + disposable MySQL browser harness and final Canvas acceptance matrix.

## Blockers And Human Gates

- No repository blocker prevents T5-008 planning and project-local implementation.
- Applying Alembic revisions through `c9d0e1f2a3b4` to user/runtime data requires reviewed backup discipline and Human authorization.
- Paid provider calls, real secret access, credential rotation, destructive MySQL work, and ignored local `.db` cleanup remain Human Owner gates.
- The pre-existing `revid_test_db` schema remains untouched pending ownership confirmation.

## Worktree And Automation

- T5-007 Unit E was developed from clean Unit D baseline `f563e22ba332ab5788c9cfb259c275cd53e1753f`.
- Ignored `.env`, `.db`, Playwright output, and runtime artifacts remain excluded from staging.
- Automation memory is only a cursor; repository documents, code, diff, tests, and runtime evidence are authoritative.
