# TASK-T5-021 Progress

- Task state: `DONE - PASS`
- Active unit: complete
- Updated: 2026-07-15

## Completed work

- Read AGENTS, CURRENT, ROADMAP, the direct-delivery ADR, design skill, and Playwright skill.
- Ran required git preflight at `6ca0b0ddebaecffb2724b2493ed2a368503828eb`; only the user-owned retired-Hermes plan and QA output are present.
- Confirmed `npx` is available.
- Audited current registry compatibility, insert-graph, reconnect, selected-edge layer, command history, mutation, autosave, and viewport boundaries.
- Confirmed generic `insert-graph` cannot intentionally reuse an existing edge ID, so edge insertion needs one dedicated atomic command/mutation.
- Locked T5-021 scope, non-goals, visual direction, risks, and acceptance criteria.
- Added pure two-sided bridge compatibility across the original source output and target input.
- Added `insert-node-into-connection` with original upstream edge ID preservation, one new downstream edge, and exact typed ports.
- Added one atomic mutation that inserts the node and replaces/adds both edge segments through one autosave/history boundary.
- Added a selected-edge midpoint plus affordance only when compatible canonical bridge subtypes exist.
- Added an accessible compact chooser with keyboard navigation, Escape, outside dismissal, reduced motion, and viewport clamping.
- Added browser coverage for one PATCH, same-ID preservation, undo/redo, incompatible text edges, compact viewport visuals, and readonly/cancellation boundaries.
- Focused edge insertion suite passes 6/6; frontend build transforms 4,793 modules.
- Resolved the selected-edge midpoint control overlap in the reroute regression by using the existing keyboard selection contract.
- Edge insertion plus reroute passes 11/11; relevant regression passes 62/63 before that test-only interaction update.
- Full current-source Chromium regression passes 179/179.
- Manually reviewed the 920x900 retained screenshot; midpoint control, compact chooser, semantic port labels, edge restraint, and viewport clamping are accepted.
- Completed diff, UTF-8, file-size, sensitive-path, and worktree-scope review; no changed implementation file exceeds 500 lines.

## Remaining work

- None.

## Exact next action

Continue the broader Canvas iteration goal with the next bounded Task.

## Files changed

- `ai/tasks/todo/TASK-T5-021.md`
- `ai/tasks/doing/TASK-T5-021-PLAN.md`
- `ai/tasks/doing/TASK-T5-021-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `frontend/src/components/canvas/CanvasConnectionLayer.vue`
- `frontend/src/components/canvas/CanvasEdgeInsertionMenu.vue`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/src/modules/canvas/canvas-commands.ts`
- `frontend/src/modules/canvas/edge-insertion.ts`
- `frontend/src/modules/canvas/mutations.ts`
- `frontend/tests/e2e/canvas-edge-insertion.spec.ts`
- `frontend/tests/e2e/canvas-edge-reroute.spec.ts`
- `ai/reports/REPORT-T5-021.md`
- `pitfalls.md`

## Commands run and summarized results

- Required source reads and git preflight: complete.
- `npx` prerequisite: available.
- Focused edge insertion suite: PASS, 6/6.
- Edge insertion plus reroute: PASS, 11/11.
- Relevant regression: 62/63 before the test-only keyboard-selection correction; the sole timeout was the midpoint control intercepting a center click, not a product mutation failure.
- Full current-source Chromium after correction: PASS, 179/179.
- Frontend build: PASS, 4,793 modules transformed.
- Visual review: PASS, `output/playwright/t5-021-edge-insertion/edge-insertion-920x900.png`.
- Hygiene gates: PASS.

## Blockers and release conditions

- No active blocker.
- Paid calls, secrets, destructive operations, migrations, arbitrary drag insertion, and Canvas engine changes remain outside scope.
