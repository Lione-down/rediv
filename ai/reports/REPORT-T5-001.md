# Report: V2 documentation and architecture baseline

## Task ID

T5-001

## Status

`DONE - PASS`

## Outcome

Product V2 is now decision-complete at the documentation level. The repository has an approved PRD, Canvas first-acceptance contract, V2 design system, executable architecture, MySQL-only and multi-canvas ADRs, a Phase 5 delivery roadmap, and an active first implementation Task.

No business code, database, secret file, or pre-existing browser artifact was modified, and no paid service call was made. The authorized disposable libTv benchmark was restored to an empty Canvas and left no persistent external state.

## Acceptance Review

| Area | Evidence | Result |
|---|---|---|
| Product direction | Approved PRD with scope, non-goals, metrics, sequence, and gates | PASS |
| Canvas contract | Functional, performance, browser, visual, accessibility, persistence, and security AC | PASS |
| Architecture | Exact schema, APIs, stores, renderer, autosave, conflict, migration, rollback, and tests | PASS |
| Visual system | Nine-section production target with exact tokens and prompt guide | PASS |
| Decisions | ADR-004 and ADR-005 accepted and linked | PASS |
| Delivery state | ROADMAP, CURRENT, T5-001, and T5-002 agree | PASS |
| Safety | Credential candidate is redacted; `.env`, `.db`, MySQL, and paid APIs untouched | PASS |
| Worktree protection | 45 untracked root Playwright snapshots and `output/` remain excluded | PASS |

## Principal Decisions

- Product V2 maps to Phase 5 and does not rewrite Phase 4 history.
- MySQL 8 is the only runtime and database-backed test engine.
- projects own multiple canvases; graph and edit history are canvas-scoped, assets and generation data are project-scoped.
- Leafer UI remains the Canvas engine and is refactored to keyed incremental rendering.
- Canvas acceptance precedes global page redesign.
- mobile is browse and review only; 920px remains a compact editing target.
- real-time collaboration, cross-canvas edges, audio generation, director console, and automatic local database deletion are out of first scope.

## Files Changed

- product and acceptance: V2 PRD plus Canvas first-acceptance specification;
- architecture and decisions: Canvas architecture, ADR-004, ADR-005, and ADR index;
- UI: V2 design system plus a historical banner on the Phase 4 design system;
- delivery state: CURRENT, ROADMAP, T5-001, T5-002, PLAN, PROGRESS, and REPORT;
- project navigation and governance: root, backend, frontend, Task, Report, and Review READMEs;
- reusable engineering guidance: `pitfalls.md`;
- backend and frontend business code: unchanged.

## Risks And Follow-Through

- P0: remove the tracked hard-coded database password assignment at `backend/run_alembic_mysql.py:8` without printing it. If it was real, Human Owner rotation remains required.
- P0: source defaults still allow SQLite until T5-002 completes; developers must not treat the approved target as already implemented.
- P1: current renderer clears and rebuilds the scene on broad state changes; T5-005 must replace it before 200/300 acceptance.
- P1: multi-canvas data cannot be safely downgraded after a second canvas exists; migrations use expand-first and forward-fix rules.

## Verification Summary

| Check | Evidence | Result |
|---|---|---|
| Encoding | strict UTF-8 decode of 24 changed documents | PASS |
| Links | all local Markdown targets across 24 changed documents exist | PASS |
| Document structure | required sections present in PRD, acceptance, architecture, and design system | PASS |
| Authoring guard | 22 newly authored documents contain no undecided marker or new em dash | PASS |
| Accessibility tokens | contrast ratios: primary button 5.86:1 / 7.11:1 / 4.55:1; muted text minimum 4.53:1 | PASS |
| Fresh consistency review | seven P1/P2 findings resolved: FK, idempotency, contrast, ownership, reorder, external-state wording, and last-opened Canvas | PASS |
| Secret hygiene | changed-file and staged-file scans checked 24 paths and emitted no candidate | PASS |
| Git whitespace | `git diff --check` and `git diff --cached --check` | PASS |
| Staged ownership | exactly 24 owned documentation paths; no `.env`, database, code, browser artifact, or `output/` path | PASS |

Backend tests, frontend build, Revid product E2E, database integration, and real-service provider calls were not run because this unit changes documentation only. The libTv interaction benchmark is browser/manual competitor evidence, not Revid product acceptance evidence.

## Next Task

`T5-002 - P0 credential cleanup and complete MySQL-only retirement`
