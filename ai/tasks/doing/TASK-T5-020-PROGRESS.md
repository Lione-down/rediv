# TASK-T5-020 Progress

- Task state: `DONE - PASS`
- Active unit: complete
- Updated: 2026-07-15

## Completed work

- Read AGENTS, CURRENT, ROADMAP, the direct-delivery ADR, design skill, and Playwright skill.
- Ran required git preflight at `9c121fc2293515a4ec27f26bbf3f7eb897acace3`; only the user-owned retired-Hermes plan and QA output are present.
- Confirmed `npx` is available.
- Audited edge presentation, selection, Graph Access, keyboard deletion, command history, executor, mutation, and autosave boundaries.
- Confirmed selected-edge styling exists but the SVG layer is pointer-passive and no reconnect mutation exists.
- Locked T5-020 scope, non-goals, visual direction, risks, and acceptance criteria.
- Added typed `reconnect-connection` validation that rejects unchanged, duplicate, incompatible, locked, grouped, unsupported, and missing endpoints.
- Added one same-ID connection update mutation that preserves metadata/status and enters normal autosave/history capture as one operation.
- Added a dedicated Canvas connection layer with a 16px invisible hit path, selected-edge styling, and zoom-stable endpoint handles.
- Added source and target endpoint reroute pointer lifecycles with typed nearest-port resolution, Escape/pointer cancellation, and empty-release rollback.
- Removed an SVG pointer-focus bounding-box artifact discovered during manual screenshot review while retaining keyboard focus styling.
- Focused command and browser suites pass; current frontend build transforms 4,789 modules.
- Updated legacy passive-edge assertions to preserve the precise contract: visible paths remain pointer-passive while the transparent hit path alone receives stroke hits.
- Relevant regression passed 57/57; full Chromium passed 173/173 after the contract update.
- Rebuilt current source and passed the post-accessibility focused suite 28/28 after replacing internal IDs with node titles in edge labels.
- Captured and manually reviewed the 920x900 selected-edge screenshot; removed the pointer-focus bounding box and retained keyboard focus behavior.
- Passed UTF-8, changed-file size, diff, and sensitive-path hygiene gates; fresh diff review found no release blocker.
- Wrote `ai/reports/REPORT-T5-020.md` and synchronized durable state.

## Remaining work

- None for T5-020.

## Exact next action

Preserve direct edge selection and same-ID reroute; use a future Task for atomic node insertion into an existing edge.

## Files changed

- `ai/tasks/todo/TASK-T5-020.md`
- `ai/tasks/doing/TASK-T5-020-PLAN.md`
- `ai/tasks/doing/TASK-T5-020-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T5-020.md`
- `pitfalls.md`
- `frontend/src/components/canvas/CanvasConnectionLayer.vue`
- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/canvas/canvas-stage.scss`
- `frontend/src/components/canvas/composables/use-canvas-connection-presentation.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/src/modules/canvas/canvas-commands.ts`
- `frontend/src/modules/canvas/mutations.ts`
- `frontend/tests/e2e/canvas-command-contract.spec.ts`
- `frontend/tests/e2e/canvas-edge-reroute.spec.ts`

## Commands run and summarized results

- Required source reads and git preflight: complete.
- `npx` prerequisite: available.
- Command contract: PASS, 10/10.
- Edge reroute browser suite before final readonly case: PASS, 4/4.
- Frontend build: PASS, 4,789 modules transformed.
- Relevant Canvas regression: PASS, 57/57.
- Full Chromium: PASS, 173/173.
- Post-label current-source focused suite: PASS, 28/28.
- Visual evidence: `output/playwright/t5-020-edge-reroute/selected-edge-920x900.png`, manually reviewed.
- Hygiene: strict UTF-8, changed files <=500 lines, `git diff --check`, and sensitive-path review passed.

## Blockers and release conditions

- No active blocker.
- Paid calls, secrets, destructive operations, migrations, edge insertion, and Canvas engine changes remain outside scope.
