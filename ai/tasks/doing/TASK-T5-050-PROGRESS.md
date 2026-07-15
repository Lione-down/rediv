# TASK-T5-050 Progress

- Task state: `DONE - PASS`
- Active unit: complete
- Updated: 2026-07-15

## Completed work

- Migrated selection normalization from document order to explicit request order while filtering missing IDs and deduplicating the first occurrence.
- Added one ordered node projection helper and made the store's `selectedNodes` follow `selectedNodeIds` exactly.
- Preserved existing document-order semantics for the separate two-node connect action, preventing an unrelated direction change for bidirectionally compatible legacy nodes.
- Extended the existing composition popover with every exact `T/R` role and source title from the authoritative selection-generation intent.
- Proved reverse-click mixed selection through Canvas markers, preflight list, persisted `input_order`, resolved generation context, undo/redo, and reload inspector.
- Verified Escape cancellation without graph mutation, 920px long Chinese title wrapping without horizontal overflow, and 375px readonly exclusion.
- Visually accepted desktop mixed-source and compact long-title composition menus.

## Remaining work

- None for T5-050.

## Exact next action

Select the next bounded Canvas refinement from fresh runtime evidence under the continuing Canvas iteration goal.

## Files changed

- `frontend/src/modules/canvas/canvas-selection.ts`
- `frontend/src/store/canvas.ts`
- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/canvas/CanvasSelectionToolbar.vue`
- `frontend/src/components/canvas/composables/use-canvas-command-interactions.ts`
- `frontend/tests/e2e/canvas-command-contract.spec.ts`
- `frontend/tests/e2e/canvas-selection-generation.spec.ts`
- T5-050 task, plan, progress, report, state, roadmap, and pitfalls documents.

## Commands run and summarized results

- Selection projection RED: PASS as an expected missing-export failure.
- First browser RED: PASS as a real mismatch, role markers remained in document order.
- `npm run build`: PASS, 4,811 modules transformed.
- Focused reducer and selection-generation verification: PASS, 17/17.
- Final related Canvas regression: PASS, 35/35.
- Final T5-050 evidence rerun: PASS, 2/2.
- Visual review: PASS, desktop mixed sources and 920px long-title compact menu.

## Blockers and release conditions

- No active blocker.
- Drag reorder, backend/provider changes, automatic execution, and mobile editing remain outside scope.
