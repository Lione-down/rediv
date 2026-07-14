# TASK-T5-008 Progress

- Task state: `DONE - PASS`
- Active unit: Unit E - closed
- Updated: 2026-07-14
- Baseline HEAD: `f7c885e8e1ef3c0984cccdaf422c65eb72ca298a`

## Completed Work

- Read the approved Canvas acceptance, V2 PRD, Canvas architecture, ROADMAP, and current project state.
- Confirmed T5-007 is committed and pushed with full backend `384 passed + 56 subtests`, full Chromium `117 passed`, build `4,761` modules, and final review `0 HIGH / 0 MEDIUM / 0 LOW`.
- Identified the principal T5-008 evidence gap: existing Chromium tests use route mocks and Vite preview, while final certification requires live FastAPI plus a unique disposable MySQL schema, restart, exact 200/300 checksum, retained performance/environment evidence, and final accessibility/visual/security classification.
- Created T5-008 Task, PLAN, and PROGRESS before business-code edits.
- Inventoried all 97 approved acceptance checkboxes in `TASK-T5-008-COVERAGE.md`, preserving the distinction between guarded backend evidence, route-mocked Chromium evidence, static/visual evidence, and the still-required live service chain.
- Approved `TASK-T5-008-HARNESS.md`: one serial Python supervisor owns a collision-safe unique schema, production lifespan, production Vite build/preview, two Playwright phases around an owned backend restart, redacted evidence, and exact cleanup.
- Confirmed the process environment contains the required MySQL admin setting without reading or printing its value; the standard API/preview ports were free at inspection time.
- Confirmed current RED gaps include close/reopen recovery, additive marquee, connection keyboard delete, distribute, and several fail-closed/hygiene gates; the explicit product RED set for empty/grid/keyboard is now closed.
- Added explicit fail-closed regressions for an unreachable MySQL connection and a missing `alembic_version` table; the focused runtime suite passes 12/12.
- Added the live Playwright boundary: required credential-free loopback origins, serial Chromium with no self-started web server, production login/API use, strict redacted manifest allowlist, pre/post-restart smoke phases, trace disabled for credential safety, and no API route interception. Static listing finds 2 live tests.
- The first supervisor pure-unit slice proves collision-safe schema ownership, strict readiness, redaction, exact child environment/commands, port/process ownership, and partial cleanup. Fresh review found and returned four integration corrections before live execution: phase spelling, inherited `REVID_*` allowlisting, direct Node CLIs, and ordinary-user rather than admin seeding.
- Closed the first product RED set: world-grid presentation now follows the 24-unit world grid across pan and 10%-800% zoom; empty Canvas exposes four canonical single-command workflow starters plus a zero-mutation blank path; mobile remains review-only; valid/invalid `Ctrl+L`, editable focus ownership, and dialog Delete/Backspace behavior now have focused browser coverage and visible accessible feedback.
- Main-line verification passes the 4,766-module production build and 19 combined keyboard/empty/grid/command browser tests. Independent visual inspection covered desktop empty, mobile review-only, and the visible invalid-command status pill.
- Main-line backend-cwd verification found and fixed two test import bootstraps that root-cwd focused runs had missed; the combined supervisor/seed/runtime/helper suite now passes 48 tests plus 10 subtests from the standard backend working directory.
- Added run-scoped backend health identity, exact preview build marker, dead-PID Windows cleanup guard, atomic retained summary, and redacted command fingerprints; independent harness review is now 0 HIGH / 0 MEDIUM.
- Added live API acceptance for project/default Canvas, duplicate/rename/reorder, stale 409, 200 nodes/300 unique non-self-loop connections, viewport persistence, duplicate graph remapping, restart checksum, responsive viewports, mobile review-only controls, anonymous/foreign access, and 30-second performance metrics.
- Latest owned live run passed 4 tests in pre/post phases, retained summary `output/playwright/t5-008-live/t5008-8680-6db47c18b0c27d80/summary.json`, and cleaned its runtime/schema/ports. Evidence: stable render 195 ms, 59.88 FPS, frame p95 16.7 ms, pointer p95 under 50 ms, 0 long tasks, 200 nodes/300 connections, 3 canvases.

## Remaining Work

- Units B-D: live functional, conflict/idempotency, 200/300 persistence/performance, responsive/accessibility/security evidence. `COMPLETE`.
- Unit E: full backend/Chromium/build/hygiene regression, independent review, REPORT, and state closure. `COMPLETE`.

## Exact Next Action

Activate T5-009 and begin its required PLAN/PROGRESS before product-code edits.

## Files Changed

- `ai/tasks/todo/TASK-T5-008.md`
- `ai/tasks/doing/TASK-T5-008-PLAN.md`
- `ai/tasks/doing/TASK-T5-008-PROGRESS.md`
- `ai/tasks/doing/TASK-T5-008-COVERAGE.md`
- `ai/tasks/doing/TASK-T5-008-HARNESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `backend/tests/test_mysql_runtime_cutover.py`
- `frontend/package.json`
- `frontend/playwright.live.config.ts`
- `frontend/tests/live/live-fixture.ts`
- `frontend/tests/live/canvas-live-smoke.spec.ts`
- `frontend/tests/live/canvas-live-acceptance.spec.ts`
- `scripts/canvas_acceptance_supervisor.py` (implementation in progress)
- `backend/tests/test_canvas_acceptance_supervisor.py` (implementation in progress)
- `backend/tests/test_canvas_acceptance_orchestration.py` (implementation in progress)
- `backend/scripts/seed_acceptance_user.py`
- `backend/tests/test_seed_acceptance_user.py`
- `scripts/canvas_acceptance_support.py`
- `scripts/canvas_acceptance_processes.py`
- `frontend/src/assets/styles/v2-canvas-tokens.scss`
- `frontend/src/components/canvas/CanvasEmptyGuide.vue`
- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/canvas/canvas-grid-presentation.ts`
- `frontend/src/components/canvas/canvas-stage.scss`
- `frontend/src/components/canvas/canvas-workflow-starters.ts`
- `frontend/src/components/canvas/composables/use-canvas-command-interactions.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage-keyboard.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage-presentation.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/tests/e2e/canvas-empty-grid.spec.ts`
- `frontend/tests/e2e/canvas-keyboard-ownership.spec.ts`

## Commands And Results

- T5-007 closure commit/push - PASS: `f7c885e` is on `origin/main`.
- T5-008 source-of-truth read - PASS: acceptance, PRD, architecture, current state, roadmap, Playwright config, and test inventory inspected.
- Coverage audit - PASS: 97/97 checkbox rows classified; explicit RED set recorded.
- Harness design review - PASS: schema ownership, secret redaction, process ownership, restart, CORS/build-time API origin, evidence, and cleanup contracts recorded before code.
- `backend/.venv/Scripts/python.exe -m pytest tests/test_mysql_runtime_cutover.py -q` - PASS: 12 tests.
- `npm run test:e2e:live -- --list` with non-secret loopback/list-only settings - PASS: 2 tests; no service was started.
- Live browser static gates - PASS: no route interception, no config `webServer`, strict TypeScript, UTF-8, and <=500 lines.
- Supervisor/runtime/seed/helper suite from `backend/` - PASS: 72 tests plus 10 subtests (latest pure run; one pytest cache permission warning only).
- Production build - PASS: 4,766 modules.
- Combined keyboard/empty/grid/command Chromium focus - PASS: 22 tests.
- Supervisor dry run - PASS: configuration and free-port preflight completed without schema or process mutation and emitted only run/schema/port metadata.
- Independent pre-live review - PASS: 0 HIGH / 0 MEDIUM after identity/marker/dead-PID correction.
- Owned live pre/post acceptance - PASS: latest run 4 tests, 200/300 persistence/checksum/restart, 4 viewport screenshots, mobile review-only, and 30-second performance evidence; schema/runtime/ports cleaned.

## Blockers And Release Conditions

- No repository blocker prevents Unit A.
- The live harness may use only an owned unique `revid_test_*` schema and process-provided configuration. User/runtime migrations, real secret access, paid calls, destructive user data work, and ignored `.db` cleanup remain Human Owner gates.
