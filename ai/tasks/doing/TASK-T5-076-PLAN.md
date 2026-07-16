# TASK-T5-076 Plan

- State: `DONE - PASS`
- Objective: deliver one frontend-only runtime projection slice from task-only polling to targeted Canvas and Inspector presentation.

## Delivery sequence

1. Add RED browser coverage that holds image/video POSTs while task-list responses advance through queued/running/terminal states, recording the current missing-polling/generic-label fingerprint.
2. Add `refreshTasksIfCurrent(projectId)` without reloading assets/templates.
3. Extract polling ownership to `use-canvas-generation-runtime.ts` and keep `use-canvas-resource-experience.ts` below its current 446 lines.
4. Start runtime discovery after the local source-state flush and before the long POST await; retain a single timer and graceful error fallback.
5. Add pure `generation-runtime-presentation.ts` resolution keyed by strict project/canvas/source linkage.
6. Project local/durable runtime state into authoring-card presentation and Inspector without graph mutation.
7. Add renderer targeting for changed generation node IDs and prove polling does not trigger a full visual reconciliation.
8. Verify background selection, reload recovery, compact/readonly, reduced motion, terminal/failure behavior, zero PATCH/history/camera mutation, build, related regression, and fresh 200/300 performance.
9. Complete diff/UTF-8/file-size/sensitive-scope review, REPORT/state reconciliation, exact commit, and push.

## Runtime contract

- Local active request before durable discovery: `submitting`, presented as `正在提交`.
- Durable `queued`: `排队中`; durable `running`: `模型生成中`.
- Durable terminal state remains authoritative until normal source/result reconciliation completes.
- One newest strict task per generation node wins by created time then ID; unrelated project/Canvas/node/media tasks are ignored.
- Polling errors never fail or duplicate the long generation POST.

## Verification

```powershell
cd frontend
npx playwright test tests/e2e/canvas-generation-runtime-feedback.spec.ts tests/e2e/canvas-generation-run-history.spec.ts tests/e2e/canvas-generation-run-result.spec.ts tests/e2e/canvas-node-presentation.spec.ts
npm run build
cd ..
backend\.venv\Scripts\python.exe scripts\canvas_acceptance_supervisor.py --execute
```

Then run related generation/recovery/presentation browser regression, diff/UTF-8/file-size/sensitive staging audits, and exact owned-scope review.

## Stop rules

- Stop on backend/schema need, concurrent Canvas ownership, HEAD drift, real provider/secret need, or a renderer design that requires graph persistence on polling ticks.
