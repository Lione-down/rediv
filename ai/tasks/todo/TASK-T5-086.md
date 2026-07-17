# TASK-T5-086 - Capability-gated shot direction controls

- State: `DONE - PASS`
- Objective: add Revid-owned, strict, versioned controls for shot angle, framing, focus, lighting, and temporal advance/rewind intent to existing image/video generation branches without weakening generation, Canvas, or provider truthfulness.
- Dependency: `T5-085 - DONE - PASS` at committed and pushed baseline `971223b87527953de6ef2b17ffb6347335173536`.

## Product direction

- Reproduce only publicly observable professional shot-control capability patterns. Do not copy LibTV source, prompts, schemas, brand, icons, copy, or visual assets.
- Preserve Revid's graphite-black/violet UI, Leafer Canvas, typed ports, forward/reverse connections, reroute, groups, result branches, Storyboard projection, history, autosave, and responsive ownership.
- New shot intent must be explicit user-owned branch metadata and exact request/task snapshot data. Existing nodes, outputs, source assets, Canvas identities, and Storyboard data remain unchanged.
- Backend capability truth is authoritative. Until an explicit provider contract is approved, production must advertise zero executable shot controls and reject crafted shot-control requests before task, quota, asset, or provider mutation. Local/mock contracts may prove the lifecycle only.

## Scope

- Extend the generation capability document with a backward-aware versioned shot-control section for angle, framing, focus, lighting, and temporal advance/rewind intent.
- Define strict Revid-owned v1 shot-control contracts, bounded enum values, cross-field rules, exact capability parsing, generation-node persistence, request construction, and immutable task snapshot verification.
- Add a focused Context Panel control surface for eligible generation nodes, reusing the existing `GenerationNodeParameters`, one-command parameter mutation, undo/redo, autosave/reload/recovery, explicit Generate action, task/result reconciliation, and quota lifecycle.
- Keep current image operations, visual recipes, shot schema, Storyboard projection, image/video reference modes, and ordinary generation behavior backward compatible and fail closed on malformed/future/stale capability or node data.
- Browser mock capabilities may advertise controls for contract/E2E evidence. Production provider support remains unavailable unless a Human Owner authorizes an exact provider contract.

## Contract lock (Unit 0)

- Capability document evolves from v2 to v3. Both media sections receive an exact `shot_controls` v1 object with `supported_controls`, `provider_controls`, and the full Revid-owned defaults. Because shot controls have no local execution, `provider_controls` must exactly equal `supported_controls`; production declares both empty.
- The only v1 values are: angle `eye-level|high-angle|low-angle|overhead`; framing `wide|medium|close-up`; focus `deep|shallow`; lighting `natural|soft|dramatic`; temporal `hold|advance|rewind`. Defaults are `eye-level`, `medium`, `deep`, `natural`, and `hold`.
- A saved/request `shot_controls` object is all-or-nothing and has exactly those five fields plus `contract_version: 1`. Omission preserves legacy ordinary generation. When present, every control not advertised for that medium must stay at its default; a crafted object is rejected when the provider capability does not explicitly execute its medium's controls.
- Browser mock capability scope is image `angle/framing/focus/lighting` and video all five controls. `advance` or `rewind` is valid only for video `image-to-video` with exactly one ordered reference; image, text-to-video, and keyframes require `temporal: hold`. Visual recipes and image-operation branches reject shot controls to keep their existing contracts exact.

## Acceptance criteria

1. Capability evolution is authenticated, strict, backward-aware, and fails closed for malformed, duplicate, unknown, future, inconsistent, or provider-overclaiming shot-control declarations.
2. Production advertises no executable shot controls and crafted backend requests fail before task/quota/asset/provider mutation; ordinary image/video generation and T5-085 image operations remain unchanged.
3. Each control has exact version, bounded values, default, request field, and compatibility rules. Unknown/extra/future/stale node or request data blocks submission.
4. Controls are available only for the appropriate canonical generation media/reference context and never infer a provider prompt, image reference, duration, or temporal behavior.
5. Every edit is one existing parameter command with one history/autosave boundary, survives undo/redo/reload/recovery/duplication, and does not mutate source/result/Storyboard identity.
6. Mock requests and immutable task snapshots carry exact controls with project/canvas/node/media scope; capability/context drift yields zero request/mutation.
7. Success/failure/retry preserve existing quota/task/result semantics. No control auto-runs a task or reserves quota.
8. Slash/keyboard ownership, focus/Escape, 1440/1366/920 editing, 375px review-only, reduced motion, accessible names, no overflow, build, full Canvas regression, and guarded 200/300 evidence remain correct without threshold weakening.
9. No real provider/paid call, `.env` access, external account, database migration, destructive edit, cross-canvas relation, second Canvas store/engine, or UI redesign is introduced.

## Non-goals

- No actual camera-control provider call, automatic prompt engineering, image/video generation, timeline editing, physics camera simulation, motion capture, batch execution, video editing, audio, or Agent/Skill work.
- No incompatible visual redesign, freeform camera grammar, raw JSON editor, cross-canvas dependency, new database column, or migration.

## Human gates

- Real provider/paid calls, provider-specific request semantics, external accounts, real secrets, destructive edits, database/migration changes, and incompatible UX require explicit Human Owner authorization.
