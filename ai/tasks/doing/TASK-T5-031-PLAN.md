# TASK-T5-031 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: a stable right-side variant column on the graphite Canvas, with existing typed edges and V lineage doing the explanatory work.
- Content hierarchy: active generation context first, newly completed output visible second, history and comparison available on demand.
- Interaction thesis: foreground completion uses a minimal non-zooming camera correction; background work remains quiet.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only; no new styling system.

## Reference assessment

- Runway keeps newly generated media immediately discoverable.
- ComfyUI preserves explicit source-to-output graph lineage.
- Figma reveals distant objects without changing the user's zoom unless explicitly asked to fit.
- Revid combines these patterns by placing durable variants predictably and translating only enough to reveal the latest foreground result.

## Units

1. Add pure collision-aware result placement and panel-safe reveal geometry.
2. Thread foreground-result notification from resource generation to CanvasStage without coupling background reconciliation to camera movement.
3. Preserve selection, zoom, inspector, lineage, persistence, and undo behavior.
4. Add pure and browser coverage for repeated variants, occupied slots, already-visible, panel-safe, compact, background, reload, and readonly scenarios.
5. Run build, focused/related/full Chromium, visual review, diff, and hygiene gates.
6. Synchronize durable state, write REPORT, commit, and push.

## Risks

- Reconciliation runs for both foreground and background tasks; camera movement must be explicitly scoped to the initiating request.
- Result dimensions depend on canonical presentation geometry, not persisted width alone.
- Panel overlays reduce the true visible Canvas area even when the underlying stage remains full width.
- Automatic selection would replace the generation inspector and break a user's editing context.
