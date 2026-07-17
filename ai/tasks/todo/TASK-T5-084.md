# TASK-T5-084 - Professional Storyboard recipe registry and presets

- State: `DONE - PASS`
- Objective: add Revid-owned, versioned professional Storyboard presets for four-frame plot boards, 9/16/25-shot boards, character turnaround references, and scene multi-view references by composing the existing mock shot contract, visual asset recipe registry, Storyboard projection, and atomic Canvas commands.
- Dependency: `T5-083 - DONE - PASS` at committed and pushed baseline `60cd185504fa68bdf02c0918872f30f9f6643ba3`.

## Product direction

- Clean-room boundary: reproduce only publicly observable preset and interaction capability. Do not copy LibTV source, prompts, recipe IDs, schema names, brand, icons, copy, or assets.
- Preserve Revid's graphite-black/violet UI, Leafer infinite Canvas, typed ports, bidirectional connections, reroute, groups, result branches, Storyboard projection, history, autosave, and responsive ownership.
- A professional Storyboard recipe is an explicit authoring preset, not a second graph or provider. Script presets create ordinary T5-083 shot-plan graphs; visual reference presets create ordinary T5-065 versioned recipe branches.
- The source script or image result remains unchanged. No preset automatically executes a shot plan, fabricates media, or bypasses the existing visual generation transaction.

## Scope

- Add a strict frontend registry with version-1 Revid-owned recipe IDs, display metadata, source kind, and exact execution contract.
- Add script presets for a four-frame plot board and exact 9/16/25-shot boards. Reuse the existing authenticated local mock shot-schema endpoint with `requested_shot_count`, then reuse the existing one-command shot graph builder and Storyboard v2 projection.
- Add character turnaround and scene multi-view presets that map only to the existing `character-sheet` and `scene-multiview` visual asset recipes. Preserve their persisted recipe version, backend-owned prompts, one-reference rule, durable-before-request transaction, quota, failure, retry, and result lineage.
- Expose eligible presets through the existing professional Slash Palette without adding a modal, graph library, UI library, or new visual language.
- Keep coordination in focused registry/composable modules and avoid further growth of `CanvasStage.vue` or `CanvasWorkspace.vue` beyond narrow wiring.

## Acceptance criteria

1. The registry accepts only exact supported version-1 recipe definitions and fails closed for unknown IDs, source-kind mismatch, future versions, malformed visual recipe mappings, or unsupported shot counts.
2. Script presets are eligible only for one exact canonical, unlocked, ungrouped, non-empty bounded script in the current editable Workflow Canvas; readonly, Storyboard, busy, stale, multi-select, unsupported, and grouped states fail closed.
3. The four-frame plot preset requests and creates exactly 4 shots; multi-shot presets create exactly 9, 16, or 25 shots with deterministic 2, 3, 4, or 5 columns respectively.
4. Every script preset preserves the source and creates the exact T5-083 topology: `2N+1` new nodes, `2N` typed prompt edges, one valid Storyboard shot-plan group, no task/result/asset, and no generation request.
5. Each successful script preset uses one `insert-graph`, one history entry, and one document PATCH; request, validation, stale-context, or command failure causes zero graph/history/autosave mutation.
6. Character turnaround and scene multi-view presets are eligible only for one valid canonical image result with a current project-owned active image asset, then reuse the exact existing visual recipe ID/version and one ordered media edge.
7. Visual presets reuse persistence-before-request, capability/preflight, quota, task, result, explicit retry, reload, and no-charge-on-failure behavior. Client requests contain no internal recipe prompt.
8. No script preset or verification step calls image generation. Visual preset browser verification uses only the existing mock transport; no real or paid provider call is made.
9. Workflow and Storyboard views retain exact selection, node IDs, projection order, settings/reorder, undo/redo, autosave, reload, recovery, duplication, and existing image Storyboard v1 behavior.
10. Slash keyboard ownership, focus restoration, Escape, 920px compact editing, 375x812 review-only behavior, reduced motion, accessible names, and no horizontal overflow remain correct.
11. No database field/migration, backend provider prompt change, cross-canvas relation, second Canvas store/engine, mobile editing, or UI redesign is introduced.
12. Focused pure/browser tests pass before related regression; frontend build, functional Chromium Canvas regression, and guarded owned 200-node/300-connection evidence pass without threshold weakening.

## Locked contracts

- Registry IDs are Revid-owned and version 1. Script presets are `plot-board-4`, `shot-board-9`, `shot-board-16`, and `shot-board-25`; visual presets are `character-turnaround` and `scene-reference-views`.
- Script presets map to exact `requested_shot_count` values and create ordinary strict shot schema v1 / Storyboard shot-plan v2 data. The preset itself adds no new persisted schema field.
- Visual presets map to the existing runtime authorities `character-sheet` and `scene-multiview`; their current version remains owned by `VISUAL_ASSET_RECIPES` and the backend registry. Internal prompt text remains backend-only.
- Eligibility is resolved from current project/canvas/selection/resource state immediately before execution. The coordinator revalidates after async mock work and before the single command.
- Opening, searching, closing, or failing a preset does not mutate graph or viewport state.

## Non-goals

- No real LLM/image provider, paid call, external account, secret access, automatic image generation, batch execution, or fabricated task/result.
- No new backend recipe prompt, image-analysis provider, semantic person/scene detection, multi-image role assignment, or visual quality scoring.
- No T5-085 image editing, T5-086 shot controls, T5-087 workflow execution, T5-088 video editing, T5-089 audio, or T5-090 Agent/Skill interface.
- No LibTV source/prompt/schema/copy/brand/icon/asset reuse and no UI redesign.

## Risks and controls

- Preset drift is controlled by one strict registry and pure resolver tests rather than duplicated action constants.
- Partial graph state is controlled by the existing async revalidation plus one atomic T5-083 command.
- Paid/provider leakage is controlled by mock-only script planning and mocked visual recipe browser transport; real provider verification is explicitly excluded.
- Visual recipe drift is controlled by referencing existing IDs/versions instead of copying prompt or recipe data.
- Large preset topology is controlled by exact node/edge/column assertions at 25 shots plus existing guarded performance evidence.

## Human gates

- Any real provider or paid call, external account, `.env` or secret access, destructive data/filesystem work, database/migration change, irreversible contract, or incompatible product/UX decision remains a Human Owner gate.
