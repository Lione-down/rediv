# TASK-T5-034 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: graphite-black graph workspace with a quiet camera that only corrects loss of foreground context.
- Content plan: preserve the source graph, make the created generation visible, keep its inspector as the action endpoint.
- Interaction thesis: command commit first, selection second, one minimum reveal after DOM/store reconciliation; no camera animation.
- CSS strategy: no CSS changes; reuse existing Canvas geometry and viewport tokens.

## Reference assessment

- Figma keeps newly created objects visible without reframing the entire document.
- Miro distinguishes user-triggered navigation from remote/background document changes.
- ComfyUI keeps graph placement explicit and camera changes separate from execution state.
- Revid applies these principles through the existing panel-safe minimum reveal function.

## Units

1. Make selection composition and result branching return successful created-node identity.
2. Add foreground-only reveal adapters at the CanvasStage and workspace action boundaries.
3. Prove minimum translation, zoom/selection/inspector preservation, visible no-op, compact insets, local recovery behavior, undo/redo, and reload neutrality.
4. Run build, focused/related/full Chromium, visual review, diff, and hygiene gates.
5. Synchronize durable state, write REPORT, commit, and push.

## Risks

- Camera side effects inside the store would also fire during undo, redo, reload, or reconciliation.
- Revealing before the committed node is observable can calculate against missing geometry.
- Desktop stage width already excludes side panels while compact drawers overlay it; inset ownership must not be double counted.
- A rejected/no-op action must not leave a stale reveal intent; an autosave failure after local commit must keep that local node visible for recovery.
