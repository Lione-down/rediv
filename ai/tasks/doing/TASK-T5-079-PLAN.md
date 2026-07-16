# TASK-T5-079 Plan

- State: `DONE - PASS`
- Objective: repair the scoped-selector leak through one RED-GREEN browser cycle and the smallest component-boundary change.

## Delivery sequence

1. Reproduce and record the current media-root displacement in the deterministic mixed image/video scenario.
2. Add one browser containment assertion against the real rendered media surfaces.
3. Run the focused scenario and retain the expected RED failure fingerprint.
4. Move above/below placement ownership from `.canvas-node-media` to `CanvasVideoKeyframeRail` itself.
5. Run the focused scenario to GREEN, then the selected-video frame/keyframe and toolbar-related regression groups.
6. Build the frontend and inspect a fresh mixed-topology screenshot at the supported desktop viewport.
7. Search for sibling uses of the leaking selector/class and classify every match.
8. Run UTF-8, diff, file-size, sensitive-path, and repository-state audits.
9. Write REPORT/state closure, commit, and push only the verified T5-079 scope.

## Verification

```powershell
cd frontend
npx playwright test tests/e2e/canvas-multi-scenario-visual.spec.ts --project=chromium --grep "mixed image, video, lifecycle"
npx playwright test tests/e2e/canvas-video-frame-capture.spec.ts tests/e2e/canvas-multi-scenario-visual.spec.ts --project=chromium
npm run build
```

## Stop rules

- Stop if the repair requires persisted geometry changes, a new layout engine, backend/schema/provider behavior, or more than five implementation files.
- Stop and rebuild the hypothesis if the containment assertion still fails after the scoped selector is removed.
