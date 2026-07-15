# TASK-T5-051 Progress

- Task state: `DONE - PASS`
- Active unit: complete
- Updated: 2026-07-15

## Completed work

- Added one pure resolver that swaps adjacent same-kind selection inputs and returns a new ordered node ID list.
- Preserved independent prompt and reference order while rejecting missing nodes, invalid selections, and first/last boundaries.
- Added exact accessible up/down controls beside every preflight role and title, with disabled boundary states.
- Applied reorder through `canvasStore.setSelection` only, so Canvas T/R markers and the open preflight update immediately without document commands.
- Kept stable node-ID keys and added an open-menu window Escape contract so keyboard focus survives role changes and the popover always closes.
- Proved keyboard R reorder, pointer T reorder, Escape/reopen persistence, zero document PATCH, unchanged graph revision, video persistence, undo/redo, and reload inspection.
- Proved the pure adjusted order feeds both image and video generation commands.
- Verified 920px long Chinese titles, 375px readonly exclusion, desktop/compact visuals, build, and related regression.

## Remaining work

- None for T5-051.

## Exact next action

Select the next bounded Canvas refinement from fresh runtime evidence under the continuing Canvas iteration goal.

## Files changed

- `frontend/src/modules/canvas/selection-generation.ts`
- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/canvas/CanvasSelectionToolbar.vue`
- `frontend/tests/e2e/canvas-selection-generation.spec.ts`
- T5-051 task, plan, progress, report, state, roadmap, and pitfalls documents.

## Commands run and summarized results

- Reorder resolver RED: PASS as an expected missing-export failure.
- Pure reorder GREEN: PASS, 1/1.
- `npm run build`: PASS, 4,811 modules transformed.
- Final focused selection-generation verification: PASS, 8/8.
- Related Canvas and keyboard regression: PASS, 46/46.
- Visual review: PASS, desktop mixed-source and 920px localized compact menus.

## Blockers and release conditions

- No active blocker.
- Pointer drag sorting, backend/provider changes, document history, and mobile editing remain outside scope.
