# TASK-T5-030 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: a compact graphite intent menu where one muted line explains the exact T/R payload before choosing an output medium.
- Content hierarchy: verified input summary, image intent, then video intent with semantic mode.
- Interaction thesis: inspect counts, choose one medium, continue through the existing generation inspector, and see the real result on Canvas.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- Runway clarifies image versus video intent before execution.
- ComfyUI makes input composition inspectable through explicit graph connections.
- Figma keeps selection metadata adjacent to contextual actions.
- Revid shows only counts and semantics already proven by its generation-context resolver.

## Units

1. Expose pure selection intent counts and video mode.
2. Add a low-noise compose-menu summary and semantic option detail.
3. Generalize the shared mock lifecycle for scoped image/video success and failure.
4. Prove selection-created image/video output, payload, lineage, playable media, reload, history, quota, and failure contracts.
5. Run build, focused/related/full Chromium, visual review, diff, and hygiene gates.
6. Synchronize durable state, write REPORT, commit, and push.

## Risks

- A fixture returning image identity for a video request would create false-positive browser evidence.
- Failure tasks must use the dynamic composed node ID or reconciliation cannot prove durable state.
- Menu detail must remain compact at 920px and not compete with the generation inspector.
- Mock output proves application lifecycle and rendering, not real provider quality.
