# TASK-T5-085 - Versioned image-operation branches and fail-closed capability contracts

- State: `DONE - PASS`
- Objective: add clean-room, Revid-owned downstream branches for canvas expansion, inpaint, erase, cutout, upscale, normalized region marking, and ordered multi-image fusion, with strict versioned region/mask/request contracts and honest provider capability detection.
- Dependency: `T5-084 - DONE - PASS` at committed and pushed baseline `504231d9e112002928e163f4e93cbb96efbf4482`.

## Product direction

- Reproduce only publicly observable image-operation capability and interaction patterns. Do not copy LibTV source, prompts, operation IDs, schemas, brand, icons, copy, or assets.
- Preserve Revid's graphite-black/violet UI, Leafer infinite Canvas, typed ports, bidirectional connections, reroute, groups, result branches, Storyboard projection, history, autosave, and responsive ownership.
- Every operation starts from exact current project-owned canonical image results and creates a new downstream generation/region branch. Source nodes, source assets, and prior results are never overwritten.
- Provider availability is backend-owned. The current real runtime must not advertise or execute an image operation that Agnes does not explicitly support. Full provider-operation behavior is verified only through local mock contracts; the local normalized region marker may remain available without a provider call.

## Scope

- Add a strict Revid-owned frontend operation registry with version-1 IDs: `expand`, `inpaint`, `erase`, `cutout`, `upscale`, `region`, and `fusion`.
- Upgrade the authenticated generation capability document to a backward-aware version-2 contract with a nested version-1 image-operation capability section. Legacy version-1 capability responses remain valid for ordinary generation but expose zero image operations.
- Add strict normalized source-region, region-mask, expansion-margin, upscale-factor, source-count, prompt, and operation request validation. Region coordinates use the source-normalized `[0,1]` space and must have positive area wholly inside the source.
- Keep provider operation support empty in the production backend until an explicit provider contract exists. `region` is local-only; sending it to the generation endpoint is invalid. Browser mock capabilities may advertise the six provider operations for contract/E2E verification.
- Add operation actions to the existing professional Slash Palette. Single-source operations require one eligible image result; fusion requires 2-8 ordered eligible image results. Readonly, Storyboard, busy, stale, locked, grouped, unsupported, malformed, missing-resource, cross-project, and mixed selection states fail closed.
- Reuse existing result/selection generation commands, typed media edges, graph placement, history, autosave, generation transaction, quota, task/result reconciliation, reload, and explicit retry paths. No new Canvas engine, modal system, provider library, database field, or migration is allowed.
- Add a focused inspector control surface for region/mask, expansion margins, and upscale factor. The normalized region marker is visible and editable without a provider request; provider-backed operations retain the existing explicit Generate action and never auto-run.

## Acceptance criteria

1. Capability contract v2 is authenticated and strict; malformed, duplicate, unknown, future-version, invalid-limit, or inconsistent supported/provider operation declarations fail closed. Legacy v1 preserves ordinary generation and exposes no operations.
2. Production capabilities advertise only local `region`; all current provider operations are unavailable and any crafted backend operation request is rejected before task, quota, asset, or provider mutation.
3. The operation registry accepts only exact version-1 definitions and maps each operation to its exact source count, prompt rule, execution kind, and parameter requirements.
4. Eligibility requires canonical unlocked ungrouped current-project/current-user active image results whose persisted asset IDs and URLs match project resources. Fusion requires exactly 2-8 unique results in selection order; every invalid state is action-free.
5. Every successful action creates one downstream branch through one atomic `insert-graph`, with one history entry and one document PATCH. Source nodes/assets remain byte-for-byte unchanged; no branch crosses a Canvas boundary.
6. Single-source branches contain one ordered media edge. Fusion contains exact ordered media edges for all 2-8 sources and persists the operation without silently falling back to ordinary image generation.
7. Region contract v1 accepts only finite source-normalized rectangles with positive width/height inside `[0,1]`. Mask contract v1 references that region, bounds feathering, and preserves explicit invert state. Unknown/extra/future data fails closed.
8. Expand requires at least one positive bounded margin; inpaint and erase require a valid region mask; upscale accepts only capability-listed factors; cutout accepts no region/mask/expand/upscale fields; fusion accepts no single-source-only fields.
9. Prompt requirements are exact: expand, inpaint, and fusion require a final prompt; erase, cutout, and upscale do not fabricate one. Region is local-only and exposes no Generate call.
10. Mock provider requests carry exact `image_operation`, ordered `image_ids`, prompt presence/absence, aspect ratio, project/canvas/node scope, and immutable task request-parameter snapshot. They contain no client-owned internal provider prompt.
11. Mock success creates exactly one downstream result and charges once. Failure creates no result and charges zero; explicit retry reuses the same branch/contract and can settle once. Capability/context drift before submission causes zero request/mutation beyond the already explicit branch.
12. Region/mask/expand/upscale controls persist through one command per edit, undo/redo, autosave, reload, recovery, and Canvas duplication without altering source identity or Storyboard behavior.
13. Slash ownership, Escape/focus return, 1440/1366/920 editing, 375x812 review-only, reduced motion, accessible names, keyboard controls, no horizontal overflow, and graphite/violet visual continuity remain correct.
14. No database field/migration, real provider/paid call, `.env`/secret access, external account, destructive operation, cross-canvas relation, mobile editing, second Canvas store/engine, or UI redesign is introduced.
15. Focused backend/frontend tests pass before related Canvas/generation regressions; product backend, production build, functional Chromium, manual visual/accessibility, and guarded 200-node/300-connection evidence pass without threshold weakening.

## Locked contracts

- Revid operation IDs are `expand`, `inpaint`, `erase`, `cutout`, `upscale`, `region`, and `fusion`, version 1.
- The capability endpoint uses top-level contract v2 for operation-aware clients while request-parameter snapshots remain contract v1. A nested image-operation capability contract version 1 declares supported operations, provider-executable operations, region space, fusion limit, and upscale factors.
- Production supported operations are `region` only; production provider operations are empty. Mock browser fixtures may declare `expand`, `inpaint`, `erase`, `cutout`, `upscale`, and `fusion` provider-executable.
- A region is `{ contract_version: 1, coordinate_space: 'source-normalized', x, y, width, height }`. A mask is `{ contract_version: 1, kind: 'region', feather, invert }` and applies to the operation's region.
- Branch operation state is stored inside existing generation-node `generation_parameters`; no new persisted backend column is needed.
- Provider requests are explicit user actions only. Creating or editing a branch never reserves quota or starts a task.

## Non-goals

- No real Agnes/provider image editing, paid smoke, provider prompt invention, external image editor, segmentation model, SAM/ControlNet/IP-Adapter, face matching, automatic semantic masks, or visual fidelity claim.
- No raster painting brush, polygon/freehand mask editor, destructive source replacement, asset mutation, batch workflow execution, camera controls, video/audio editing, or Agent/Skill interface.
- No T5-086 shot controls, T5-087 workflow execution, T5-088 video editing, T5-089 audio, or T5-090 Agent/Skill work.

## Risks and controls

- Capability overclaim is controlled by a backend-owned supported/provider split and a production-empty provider list.
- Malformed or unsafe masks are controlled by one strict normalized contract shared by node parsing, request construction, and backend validation.
- Accidental source mutation is controlled by immutable result/resource checks and downstream-only atomic commands.
- Fusion order drift is controlled by existing ordered media edges and exact request snapshot verification.
- Coordinator growth is controlled by focused registry, command, composable, and control-component modules; `CanvasStage.vue` remains untouched unless a verified contract makes it unavoidable.

## Human gates

- Any real provider/paid call, new provider account or secret, provider prompt/contract decision, database/migration change, destructive source edit, external service, or incompatible UX remains a Human Owner gate.
