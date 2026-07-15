# TASK-T5-059 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Objective

Verify a real two-origin chained video workflow from ordered generated-image keyframes through exact provider request, durable playable video result, and canonical downstream lineage.

## Scope and acceptance criteria

- Use G1 V2 and G2 V1 as two ordered keyframes for one downstream video generation.
- Inspector preflight must describe `视频关键帧 R1` and `视频关键帧 R2` with the exact source titles.
- Reorder keyframes and keep each upstream V/origin identity attached to its canonical result.
- Send the exact reordered `image_ids` to the mock video provider with the final prompt and downstream node identity.
- Materialize one durable playable video result, active generation-to-result edge, task/asset identity, quota decrement, and canonical V lineage.
- Preserve the workflow and playable result through reload.
- Verify compact and readonly review remain bounded and mutation-safe.

## Non-goals

- Paid provider calls, real credentials, audio, timeline editing, schema changes, or recursive ancestry.
- New video chrome or custom playback controls.

## Direction

- Visual thesis: quiet graphite creator surface with violet used only for active lineage and primary generation action.
- Content plan: orient keyframes, reveal exact request semantics, execute, inspect the playable canonical result.
- Interaction thesis: explicit order controls, native video playback, existing lineage navigation, and no automatic ancestry expansion.

## Units

1. Add a real two-origin video browser scenario with RED assertions for keyframe semantics, reordered request, playable output, lineage, and reload.
2. Fix only the provider, materialization, or UI projection behavior exposed by the RED.
3. Run production build, focused frontend and guarded backend regressions, plus desktop/compact/readonly visual review.
4. Close report/state/pitfalls, perform fresh diff review, commit, and push.

All units are complete. The existing implementation passed the stronger two-origin video contract without business-code changes; the browser and guarded backend matrices now protect it.

## Risks

- The image generation path can pass while video keyframe semantics or order diverges.
- Provider success can exist without a canonical playable result edge or reload persistence.
- Browser-native video readiness can be asynchronous and must be asserted explicitly.
