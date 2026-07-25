# TASK-T6-011 - Replace the Canvas card runtime and rebuild the text workflow

- State: `DONE`
- Verification outcome: `PASS`
- Prior delivery outcome: `REJECTED / FAIL` by the Human Owner on 2026-07-23.
- Human outcome: `ACCEPT_WITH_DECLARED_BOUNDARIES` on 2026-07-25; unspecified minor issues are deferred to a future independently planned Task.
- Phase: `Product V3 / Phase 6 contract-first reset`
- Objective: replace the complete visible and interactive Canvas frontend from the Human reference video, including shell, cards, attached surfaces, tools, ports, edges, and Script workflow, while preserving one canonical model/state/geometry authority and accepted data/job/provider contracts.
- Dependency: `T6-010 - DONE / PASS` at activation baseline `HEAD == origin/main == 11cdaaac7be485e219830ebf9a6c589996830a47`.
- Reactivation baseline: prior T6-011 delivery commit `05679e04484857e86541aafc4601a4a7cd1f2e72`; this commit is rejected audit evidence, not an accepted product baseline.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Human-confirmed interaction contract: [T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT](../../requirements/T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT.md).
- Human-directed Canvas frontend replacement: [T6-011-HUMAN-DIRECTED-CANVAS-FRONTEND-REPLACEMENT](../../requirements/T6-011-HUMAN-DIRECTED-CANVAS-FRONTEND-REPLACEMENT.md).
- Plan: [TASK-T6-011-PLAN](../doing/TASK-T6-011-PLAN.md).
- Progress: [TASK-T6-011-PROGRESS](../doing/TASK-T6-011-PROGRESS.md).
- Report: [REPORT-T6-011](../../reports/REPORT-T6-011.md).

## Reactivated scope

- Keep the accepted stack, MySQL authority, Canvas document, stable node IDs, graph/history/autosave contracts, durable generation jobs, and backend provider boundaries.
- Retain Leafer as the Canvas/world engine, but make the DOM card surface the sole visible and interactive authority for card bodies, ports, selection, editing, and attached controls.
- Replace the current split projection in which a Leafer card, DOM card, selection overlay, ports, and SVG edges can disagree. All visible layers must consume one in-memory layout projection in the same frame; persistence follows the interaction update.
- Introduce one canonical card model and an explicit state machine covering `idle -> selected -> editing/composing -> submitting/running -> succeeded/failed`.
- Rebuild Text, Script, Image Generation, Video Generation, Video Composition, and capability-gated Audio Generation card composition on the replacement runtime. Director is absent. Asset/Material remains an import/library/reference utility and semantic role; generated Result is job-materialized output, not a manually creatable authoring node.
- Render `@node` and asset references as structured inline tokens containing a stable ID, thumbnail, display name, revision, role, and order. Raw `@name · type · id` text is not an accepted visible representation.
- Persist explicit model, generation mode, reference roles, and ordering in canonical card/job state. Selection, blur, re-entry, reload, and Canvas switching must never silently re-derive or change them.
- Use compact current-Canvas synchronization keyed by bound job IDs. Canvas runtime must not poll project-wide legacy `generation-tasks?page_size=100`; legacy task lists remain history/admin compatibility only.
- Preserve legacy document readability through a bounded adapter during cutover, without retaining two competing visible card runtimes indefinitely.
- Audit the complete Human-rejected behavior matrix, including defects not isolated in screenshots, before requesting renewed acceptance.

## Human-reported rejection findings

1. Mentions are rendered as raw text/separate references instead of inline thumbnail-and-name tokens.
2. Dragging can move the lower Canvas projection and connections while the visible DOM card remains behind.
3. Image-to-video mode can revert to keyframes after deselection and reselection.
4. Card visual hierarchy and state presentation are inconsistent and confusing.
5. Script cards are visually poor and cannot be dragged in every state.
6. Add-menu taxonomy mislabels image generation, omits video generation, and exposes unclear/uneditable result and asset nodes.
7. Canvas repeatedly fetches large project-wide generation-task pages instead of the current card's bound job result.
8. Other required workflow behavior remains unimplemented and must be audited rather than presumed complete.
9. Ports and edges have multiple geometry authorities: the input side lacks symmetric elastic acquisition, selection can create a duplicate output `+`, and the duplicate control interferes with the visible edge origin.
10. Elastic acquisition does not visibly follow continuous pointer movement or clamp symmetrically for input/output.
11. Successful Video Generation creates a visible Result card instead of updating the stable originating card.
12. The originating Video Generation card does not expose a playable media URL/poster/control lifecycle with isolated pointer ownership.
13. Agnes model/capability/task-progress mapping is stale and must be re-audited only against official documentation.
14. A succeeded Video Generation job can show `已完成/100%` while the original card remains an empty placeholder.
15. Persisted edges visually terminate at a moving `+`; Human requires edges on the card boundary and `+` to be an acquisition button only.
16. Only the top strip starts card drag, edges do not follow during pointer movement, and the cursor does not communicate grab/grabbing.
17. The minimap is absent; top-right utilities, Ctrl+mouse-wheel zoom, Canvas right-click menu, and the chat action beside Audio are visible but missing or non-functional.
18. Persisted connection lines can paint over card labels and media; every persisted and draft line must remain below every card.
19. The compact current-Canvas generation-jobs delta is fetched on every active poll and repeatedly returns a page of older job JSON even though the active card already has an exact bound job ID.

## Current acceptance criteria

1. Exactly one visible card body exists per logical node, and Leafer/DOM/selection/edge layers cannot separate during drag, pan, zoom, selection, editing, or autosave.
2. Every ordinary card exposes exactly one visible left acquisition `+` and one visible right acquisition `+`, regardless of compatible logical-port count. Input and output acquisition are symmetric; selection never creates a duplicate control.
3. Acquisition controls and persisted edge attachments derive from one projected geometry authority but have distinct roles: `+` initiates/accepts connection gestures, while rendered edge endpoints attach to the card boundary. Representative zoom proof uses rendered SVG measurements.
4. Every non-interactive part of an authoring card is draggable in every non-disabled state, including Script empty/direct/assisted states; pointer hold projects grab/grabbing and the card plus every attached edge move in the same rendered frame.
5. Explicit card state and generation configuration survive blur, deselection, re-entry, reload, and Canvas switching without fallback or silent mode/model changes.
6. Structured mention tokens render inline as thumbnail plus display name, keep stable identities/roles/order, remain keyboard accessible, and round-trip through persistence without degrading to raw IDs.
7. The Add and contextual-continuation surfaces expose clearly named Text, Script, Image Generation, Video Generation, Video Composition, and Audio Generation types. Director is absent. Audio is retained but backend-capability-gated and cannot dispatch without an allowed model.
8. Asset/Material remains an import/library/reference utility and semantic role rather than a generic authoring type. Generated Result cannot be manually added and appears only from a successful job; ownership and editability are explicit and every enabled visible action is functional and truthful.
9. Empty text cards expose only truthful direct and capability-gated assisted modes, with direct editing of the canonical card body.
10. Assisted text composition is attached to the same selected card, requires an explicit allowed-model selection, and never silently reroutes.
11. Successful text output applies to the original unchanged card through one typed undoable/autosaved mutation. Stale revision application fails closed and leaves the result recoverable.
12. Image/video workflows retain explicit mode, model, reference roles, and ordered references on the same card; image-to-video cannot revert to keyframes on reselection.
13. Canvas synchronization requests only current-Canvas cursors and/or bound job IDs with compact status/result DTOs. The project-wide legacy task-list endpoint is absent from normal Canvas polling.
14. Stable IDs, graph bindings, history, autosave, durable jobs, provider authority, and legacy document readability survive the cutover.
15. Focused RED tests precede implementation; focused GREEN precedes related and broad regression; frontend is rebuilt before preview/browser proof.
16. Automated visual, functional, interaction, API, and persistence evidence is reported separately from Human acceptance.
17. T6-011 cannot become `DONE / PASS` until the Human Owner explicitly records `ACCEPT` or `ACCEPT_WITH_DECLARED_BOUNDARIES` after reviewing the rebuilt runtime.
18. Project-state, diff, UTF-8, protected-path, sensitive-path, exact-staging, commit, and push checks pass.
19. Reference role/order has one typed persistence authority; visible tokens and provider request projections cannot diverge.
20. Accepted image/video requests remain recoverable after ambiguous POST response loss or browser refresh without project-wide reconciliation.
21. Cinematic lineage consumes only a bounded current-project/current-Canvas DTO and rejects foreign task/project/Canvas/node identity.
22. Multi-port acquisition regions remain non-overlapping at representative zooms while preserving symmetric input/output hit behavior.
23. The visible `+` follows continuous pointer positions inside its acquisition region, clamps to the shared radius, and remains exactly one acquisition control per card side while compatible logical ports stay hidden and typed.
24. A successful Video Generation compact job updates the original stable node and its history/autosave/job binding; normal Canvas never renders a Result card, while legacy documents remain readable.
25. Same-card video uses an accessible media URL and optional poster with native controls, loading/error/fallback states, and click/pointer isolation from card drag and Canvas pan.
26. Agnes endpoints, allowed/known models, finite task statuses, integer progress, and completed `metadata.url` follow the 2026-07-25 official contract exactly; unknown or contradictory shapes fail closed and provider raw never enters compact DTOs.
27. A compact job transition from running to succeeded fetches and applies the bounded result to the original stable Video Generation node; the visible card replaces its placeholder with the playable video without a Result card or page-wide task read.
28. The replacement runtime retains a visible functional minimap, Ctrl+mouse-wheel zoom, and the existing Canvas right-click command menu.
29. Every enabled top-right utility and the chat action beside Audio has a truthful observable action, keyboard/accessibility behavior, and no silent no-op.
30. Persisted and draft SVG connections always paint below every card while retaining shared card-boundary/draft geometry, same-frame drag following, selection styling, and pointer-safe hit behavior.
31. Normal persisted-card polling makes zero current-Canvas delta calls: reload and active progress request only the exact nonterminal bound-job compact status and successful bound result, then stop at terminal/card removal. The bounded delta API remains available outside this normal polling path.
30. Acquisition diameter and follow clamp remain constant in Canvas-world units, so their rendered screen-space size scales proportionally with viewport zoom while card-boundary persisted edges remain unchanged.
31. Image cards render the complete source frame with contain semantics instead of cropping it to the card rectangle.
32. Playable video cards expose unobstructed native controls and suppress the redundant lifecycle overlay; real queued/running progress remains visible before media is available.

## Non-goals and locked boundaries

- No T6-012 or later behavior, built-in director Skill, Director/`导演台` Canvas entry, story-production schema, or unrelated product expansion.
- No full-stack/framework/database/Canvas-engine rewrite; this is a bounded strangler replacement of the visible card subsystem.
- No real or paid provider call, secret access, user/runtime-data migration, destructive operation, external-account change, or irreversible schema operation.
- Do not mutate user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, or `test-results/`.
- Do not remove legacy history/admin compatibility or existing readable documents before the replacement adapter is proven.

## Prior attempted delivery contract (rejected reference only)

- Provide truthful text-card empty modes for direct writing, text-to-video prompt composition, reverse prompt from image, and text-to-music only when the selected allowed model advertises that capability.
- Keep direct writing and accepted content editing inside the text card.
- Provide a selected-card attached text work surface only while composing or optimizing with a model.
- Return and render an explicit backend-authoritative allowed text-model list; require the user-selected allowed model ID and never silently reroute.
- Submit text work through the durable compact v2 job contract and resume it through the existing current-Canvas synchronization boundary.
- Apply a successful text result to the original unchanged text card through the typed Canvas command/history/autosave boundary.
- Fail stale-revision application closed without overwriting user edits, while keeping the generated result recoverable.
- Serialize canonical text result content once and preserve all legacy compatibility paths not owned by this Task.

### Prior non-goals and locked boundaries

- No T6-012 built-in director Skill or story-production schema.
- No T6-013 script asset/shot workflow, T6-014 image lifecycle, T6-015 semantic video, or T6-016 compatibility removal.
- Do not expose a Skill selector or silently choose another text model.
- Do not remove legacy generation/result projection, project history/admin compatibility, or unbound legacy fallback.
- No real or paid provider call, secret access, user/runtime-data migration, destructive operation, external-account change, or irreversible schema operation.
- Do not mutate user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, or `test-results/`.

### Prior acceptance criteria

1. Empty text cards expose only truthful direct and capability-gated assisted modes, with keyboard-accessible selection and no graph/history mutation from mode browsing.
2. Direct writing edits the canonical current card body and remains editable through undo, redo, autosave, reload, and Canvas switching.
3. Assisted composition uses an attached stage/inset-bounded work surface only while selected/configuring; accepted content returns to the current text card and the surface is not permanent.
4. The capability contract returns an explicit allowed text-model list with stable model IDs and per-mode support; frontend submission requires one user-selected allowed model.
5. Unknown, unavailable, incompatible, or omitted model IDs fail before job, quota, provider, Canvas, history, or autosave mutation; no silent routing occurs.
6. Compact text submit/status/result contracts remain bounded, and canonical result content is serialized exactly once.
7. Refresh and Canvas switching resume the same durable text job without cancelling it or creating another visible card.
8. Same-card result application verifies stable project/Canvas/node/job identity and the submitted content revision before one typed undoable/autosaved mutation.
9. A stale revision never overwrites newer user text; the generated result remains explicitly recoverable without fabricating a successful application.
10. Legacy text/script and result documents remain readable; no T6-012 through T6-016 behavior is implemented.
11. Focused RED/GREEN evidence passes before related and broad regression; frontend is rebuilt before preview/browser proof.
12. Automated visual/functional/interaction evidence is reported separately from Human visual/interaction acceptance.
13. Project-state, diff, UTF-8, protected-path, sensitive-path, exact-staging, commit, and push checks pass.
