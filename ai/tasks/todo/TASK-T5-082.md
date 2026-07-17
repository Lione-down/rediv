# TASK-T5-082 - Professional action registry, Slash Palette, and image grid split

- State: `DONE - PASS`
- Objective: add one Revid-owned professional action registry and keyboard-safe Slash Palette, then split one canonical project image into exact 4, 9, 16, or 25 crop assets and Canvas nodes without replacing the source image or weakening existing graph, history, persistence, responsive, or performance contracts.
- Dependency: `T5-081 - DONE - PASS` at committed and pushed baseline `0201f86919dd60cf3dd1b61fd8af1fa29d8cc773`.

## Product direction

- Clean-room boundary: reproduce only publicly observable capability and interaction patterns. Do not copy LibTV source, brand, icons, copy, or visual assets.
- Preserve Revid's graphite-black/violet tokens, Leafer infinite Canvas, typed ports, bidirectional connection authoring, reroute, groups, result branching, Storyboard projection, card hierarchy, and quiet micro-interactions.
- Visual thesis: one compact action surface that feels native to the current Canvas, with dark stepped surfaces, existing typography and radii, visible focus, and no decorative redesign.
- Content plan: orient with search, show only eligible actions with concise reasons, execute one explicit choice, and return focus to the Canvas.
- Interaction thesis: Slash opens only when the Canvas owns the keystroke, arrow keys move through deterministic results, Enter executes, Escape closes, and reduced motion removes nonessential transitions.
- Pattern synthesis: use Raycast only as a model for searchable action organization, Notion only for contextual Slash entry, and Linear only for strict keyboard ownership. Revid retains its own tokens, copy, action semantics, and identity.
- CSS strategy: existing scoped Vue SCSS and `v2-canvas-tokens.scss` only. No Tailwind, CSS-in-JS, new icon set, or new token vocabulary.

## Scope

- Add a typed professional action registry with stable IDs, category, keywords, availability, eligibility, execution intent, and fail-closed unknown or unsupported behavior.
- Project existing Canvas actions through the registry only where their current contracts are truthful. Do not reimplement command, recipe, upload, or provider behavior inside the registry.
- Add a Canvas-owned Slash Palette with deterministic search/order, keyboard navigation, accessible semantics, focus restoration, and no graph mutation while merely opening or filtering.
- Refuse Slash ownership inside editable controls, dialogs, menus, drawers, composing IME input, active drag/connection gestures, readonly review, and the 375px review-only boundary.
- Add exact 2x2, 3x3, 4x4, and 5x5 crop geometry in row-major order for 4, 9, 16, and 25 outputs.
- Keep the source project asset and source Canvas node unchanged. Every crop becomes a new project-owned image asset and a new canonical Canvas image node.
- Reuse the existing project asset upload boundary and create all crop nodes through one existing `insert-graph` command, one history entry, and one document PATCH.
- Place crop nodes deterministically without overlap, preserve selection and typed graph invariants, and support exact undo, redo, autosave, reload, and recovery.
- Extract registry, palette coordination, crop geometry, and split workflow into focused modules or components. Do not add further business logic to already oversized Canvas coordinators.

## Acceptance criteria

1. Registry resolution is deterministic and fail closed for unknown actions, unsupported node kinds, unavailable media, locked or grouped targets, stale selection, readonly review, active in-flight conflicts, and capability mismatches.
2. Opening or filtering the Slash Palette makes zero graph, history, autosave, viewport, generation, recipe, provider, or asset-upload mutation.
3. Slash keyboard ownership excludes editable, dialog, menu, drawer, IME composition, drag/connection, readonly, and 375px review-only contexts; existing shortcuts keep their current ownership.
4. The palette is keyboard complete with accessible combobox/listbox semantics, deterministic search and category order, active-descendant or equivalent focus semantics, Enter execution, Escape cancellation, outside dismissal, and exact Canvas focus restoration.
5. The image-grid action is offered only for one exact canonical, available, project-owned image asset/source node. Results, video, external/foreign assets, broken media, multi-selection, locked/grouped nodes, and unsupported serialization fail closed.
6. Crop geometry covers 4, 9, 16, and 25 outputs as exact 2x2, 3x3, 4x4, and 5x5 partitions in left-to-right, top-to-bottom order, including non-divisible source dimensions without gaps, overlap, or lost pixels.
7. The source asset record, bytes, metadata, URL, node content, node ID, position, and connections remain unchanged. Every crop has a distinct project-owned asset ID and bounded image metadata.
8. Successful splitting creates exactly 4, 9, 16, or 25 canonical image nodes through one atomic `insert-graph` mutation, one history entry, and one document PATCH. Upload or decode failure creates no graph mutation.
9. Exact node count, crop order, asset ownership, stable placement, selection, undo, redo, autosave, reload, recovery, and unrelated graph entities are verified.
10. The palette and split flow remain usable at 1440x900, 1366x768, and 920x900. At 375x812 they remain review-only, unavailable for mutation, and free of horizontal overflow.
11. Visible focus, minimum hit targets, localized text fit, WCAG 2 A/AA, Escape behavior, and `prefers-reduced-motion` pass without adding ornamental motion.
12. Focused registry, keyboard, crop, upload, command, history, persistence, and responsive tests pass before related regression. The production build, full functional Chromium Canvas suite, and guarded owned 200-node/300-connection live performance boundary pass without threshold weakening.

## Locked contracts

- Action definitions are data and pure predicates. They may describe and dispatch existing intents but may not mutate stores, DOM, graph, assets, quota, or provider state during resolution.
- Crop partitions use source pixel bounds and row-major indices. The implementation must define one shared geometry result consumed by image extraction, asset naming/metadata, node order, and tests.
- Crop assets remain project-scoped through the existing authenticated upload API. No data URL or blob URL is persisted into the Canvas document.
- Graph insertion uses the existing canonical asset node shape and one `insert-graph` command. No loop of per-node graph mutations is permitted.
- Every crop node persists `image_grid_split_schema_version: 1`, `image_grid_split_count`, one-based `image_grid_split_index`, zero-based row/column, exact source/crop pixel bounds, and `source_asset_id` in existing node content JSON. It does not persist a source node ID or create a cross-canvas reference.
- Partial upload/decode errors fail before graph insertion and surface a bounded local error. No automatic retry or paid/provider call is allowed.

## Non-goals

- No LibTV source, brand, icon, copy, prompt, visual asset, or proprietary workflow is copied.
- No database, migration, backend endpoint, provider contract, quota, generation task, recipe, or paid-call change.
- No new UI, graph, state-management, upload, image-processing, or icon library.
- No UI redesign, global shell change, second Canvas engine/store, cross-canvas edge, collaboration, or mobile editing.
- No script-to-shot schema, professional Storyboard recipes, image editing operations, camera controls, workflow templates, video editing, audio, or Agent/Skill interface. Those remain T5-083 through T5-090 scope.

## Risks and controls

- Shortcut theft is controlled by one explicit keyboard-ownership resolver and negative browser cases for every excluded surface.
- Action drift is controlled by stable IDs, pure eligibility, reuse of existing command boundaries, and fail-closed stale-context revalidation at execution time.
- Pixel seams are controlled by integer boundary partitioning from shared source bounds rather than independently rounded widths.
- Graph partial state is controlled by completing decode and project uploads before one atomic graph insertion.
- Memory and main-thread pressure are controlled by bounded source/output validation, sequential or capped crop work, immediate object-URL cleanup, and real 25-output browser evidence.
- Coordinator growth is controlled by new focused modules/components and a file-size/growth gate.
- UI drift is controlled by current Canvas tokens/components, real viewport screenshots, reduced-motion checks, and no new visual vocabulary.

## Human gates

- Paid calls, real secret access, external accounts, destructive data/filesystem work, runtime migrations, irreversible schema changes, and incompatible product or UX changes remain Human Owner gates.
- Guarded live verification may use environment already supplied to owned processes but may not open or expose `.env` or credential values.
