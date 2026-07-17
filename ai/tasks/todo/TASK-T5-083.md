# TASK-T5-083 - Strict shot schema and atomic script-to-storyboard graph

- State: `DONE`
- Objective: turn one exact canonical script into a strict versioned shot sequence through a Revid-owned mock provider, then create the shot prompts, image-generation plan, and Storyboard ordering through one atomic Canvas graph mutation without executing generation or weakening existing graph contracts.
- Dependency: `T5-082 - DONE - PASS` at committed and pushed baseline `adbf67ee0fb8efb79bcc7da6f0db1ab4f26955c0`.

## Product direction

- Clean-room boundary: reproduce only publicly observable script breakdown and storyboard-planning capability. Do not copy LibTV source, prompts, schema names, brand, icons, copy, or assets.
- Preserve Revid's graphite-black/violet UI, Leafer infinite Canvas, canonical nodes, typed ports, bidirectional connections, reroute, groups, result branching, Storyboard projection, history, autosave, and responsive boundaries.
- Mock-first means the accepted provider is deterministic, local, explicitly identified as `mock`, and makes no external or paid call. Real provider integration is not implied or silently enabled.
- The existing script remains the source of truth and is never overwritten. Shot data is ordinary versioned Canvas content JSON; no database field or migration is introduced.

## Scope

- Add an authenticated, project/canvas-scoped mock shot-schema endpoint with strict request/response models, bounded script and shot counts, deterministic order, and `extra=forbid` validation.
- Add a strict frontend runtime parser that rejects unknown versions, wrong scope/provider/model, duplicate or unordered shot IDs, missing fields, excess fields, and out-of-bound content.
- Add one professional action for exactly one canonical, unlocked, ungrouped, non-empty script in the current editable Workflow view.
- Add a focused shot-schema service and coordinator outside oversized Canvas components. Revalidate project, canvas, script identity/content, selection, and response scope immediately before mutation.
- Build canonical shot prompt nodes and image generation nodes with version-1 shot metadata, stable order, exact typed prompt connections, and existing generation-parameter contracts.
- Represent the planned sequence through the existing Storyboard projection and a strictly validated Storyboard shot-plan group, without changing image Storyboard v1 behavior.
- Insert the complete graph through one existing `insert-graph` command, one history entry, and one document PATCH. Opening the Palette, provider failure, malformed response, stale context, or command rejection produces no graph mutation.

## Acceptance criteria

1. Backend request and response models are strict, bounded, authenticated, project/canvas scoped, versioned, and reject extra fields, unknown versions/providers, empty or oversized scripts, invalid shot counts, duplicates, and non-contiguous order.
2. The accepted mock provider is deterministic and returns 2-25 ordered shots without network/provider/quota/task/asset mutation. No real provider is called or exposed as available.
3. Frontend parsing independently validates the entire response and fails closed for malformed, future-version, foreign-project/canvas/script, wrong-provider/model, duplicate, missing, extra, or reordered data.
4. The action is available only for one exact canonical `script/script` node with non-empty bounded text in the current loaded project/canvas; readonly, 375px review-only, Storyboard view, locked/grouped/multi/unsupported/stale/busy states fail closed.
5. The source script ID, title, text, content metadata, position, connections, and persisted record remain unchanged.
6. Every shot creates exactly one canonical prompt node and one canonical image-generation node with `shot_schema_version: 1`, stable shot ID/index, source-script identity, bounded prompt data, and supported image parameters.
7. Each generation receives the source script and its exact shot prompt through canonical typed prompt connections with stable independent input order. No generation request is automatically submitted.
8. The shot-plan Storyboard contract is strict, ordered, duplicate-safe, and fail closed while existing image Storyboard v1 creation, layout, reorder, conversion, projection, and duplication behavior remains unchanged.
9. Successful execution creates the complete graph through exactly one `insert-graph`, one history entry, and one document PATCH; provider/validation/context failure creates zero graph/history/autosave mutation.
10. Exact node/edge counts, placement, source preservation, Storyboard order, undo, redo, autosave, reload, recovery, and Canvas duplication/remapping are verified.
11. The feature remains keyboard accessible at 1440x900, 1366x768, and 920x900; 375x812 remains review-only. No new visual system, modal, graph engine, or UI library is introduced.
12. Focused backend/frontend/browser tests pass before related regression; backend regression, frontend build, functional Chromium Canvas regression, and guarded owned 200-node/300-connection evidence pass without threshold weakening.

## Locked contracts

- Shot schema identity is Revid-owned and version 1. Unknown or future versions are preserved as data where required but never executed or projected as a valid shot plan.
- Mock output is deterministic from validated request data and is labeled `provider: mock`, `model: revid-shot-mock-v1`; it does not use the generation provider protocol or quota transaction path.
- Shot prompts and generation nodes use existing canonical node serialization. Camera angle, framing, focus, lighting, time travel, recipes, image editing, video/audio, workflow execution, and Agent/Skill interfaces remain T5-084 through T5-090 scope.
- Atomicity means provider completion and all validation happen before one graph command. No per-shot store mutation or partial graph insertion is permitted.
- No generated media, result asset, task, or placeholder claiming provider success is fabricated.

## Non-goals

- No real LLM/provider call, paid call, quota reservation, generation task, asset creation, or automatic image generation.
- No database table/field, migration, runtime schema application, external account, or secret access.
- No LibTV prompt/schema/source/copy/brand/asset reuse and no UI redesign.
- No cross-canvas relationship, second Canvas store, mobile editing, collaboration, or destructive operation.
- No T5-084 professional recipe, T5-085 image edit, T5-086 shot-control, T5-087 batch execution, T5-088 video edit, T5-089 audio, or T5-090 Agent/Skill work.

## Risks and controls

- Provider ambiguity is controlled by a mock-only literal contract and tests proving no generation provider/quota/task path is touched.
- Schema drift is controlled by strict backend models, an independent frontend parser, explicit version/model/scope identity, and future-version negative tests.
- Partial graph state is controlled by preflight revalidation and one `insert-graph` command after the complete response is validated.
- Storyboard regression is controlled by version-specific group validation, existing v1 regression, and duplication/remapping tests.
- Coordinator growth is controlled by focused schema, service, graph-builder, and composable modules.

## Human gates

- Any real provider, paid call, external account, secret access, destructive data/filesystem work, runtime migration, irreversible schema change, or incompatible product/UX choice remains a Human Owner gate.
