# TASK-T5-078 Plan

- State: `DONE - PASS`
- Objective: deliver one non-persistent projection slice from a shared pure placement resolver through world-space rendering to exact canonical result handoff.

## Delivery sequence

1. Add RED pure/browser tests for image/video reservations, collision/extreme-height placement, multiple active tasks, local/durable deduplication, reload, terminal removal, and exact handoff.
2. Extract result draft geometry and collision-aware placement from `createGeneratedResultCommand` into a pure resolver without changing existing result behavior.
3. Define deterministic projection identities and stable task ordering for local requests plus strict queued/running durable tasks.
4. Recompute all projection placements from real Canvas bounds plus earlier virtual projection bounds.
5. Expose projections from the existing generation runtime owner without a second polling source.
6. Add a thin `CanvasPendingGenerationLayer.vue` world-space overlay using existing Canvas tokens, canonical subtype dimensions, and the shared runtime presentation.
7. Keep the layer pointer-passive and absent from graph, minimap, Graph Access, selection, ports, keyboard, context menu, document serialization, autosave, and history.
8. Pass the resolved position into terminal reconciliation so one canonical node plus one source edge materializes at the exact predicted coordinates.
9. Verify failure/timeout/auth/project/Canvas/unmount cleanup and foreground/background/reload behavior.
10. Run focused and related browser tests, default build, visual desktop/compact/readonly/zoom/reduced-motion checks, full Chromium, and the owned 200/300 supervisor.
11. Run diff, UTF-8, file-size, sensitive-path, and repository-state audits.
12. Write REPORT/state closure, commit, and push only the verified T5-078 scope.

## Verification

```powershell
cd frontend
npx playwright test tests/e2e/canvas-pending-generation-result.spec.ts tests/e2e/canvas-result-placement.spec.ts tests/e2e/canvas-generation-result-reveal.spec.ts tests/e2e/canvas-generation-run-result.spec.ts tests/e2e/canvas-result-lineage.spec.ts
npm run build
cd ..
backend\.venv\Scripts\python.exe scripts\canvas_acceptance_supervisor.py --execute
```

At closure, run full Chromium with an adequate single-worker timeout, then hygiene and state audits.

## Stop rules

- Stop on canonical placement divergence, persistent projection data, extra polling/network ownership, task identity ambiguity that could duplicate results, concurrent Canvas ownership, or any required backend/schema/provider/product contract change.
