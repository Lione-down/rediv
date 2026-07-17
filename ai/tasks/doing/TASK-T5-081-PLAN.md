# TASK-T5-081 Plan

- State: `DONE - PASS`
- Objective: deliver a Storyboard review and sequence workflow as a pure projection plus validated ordinary Canvas group commands, without forking graph, execution, history, autosave, or responsive ownership; preserve duplication through the single Human-authorized existing-controller metadata-ID remap.

## Human authorization addendum

- On 2026-07-17, the Human Owner authorized changing only `backend/controllers/canvases.py::duplicate_canvas()` so validated `group/storyboard` version-1 `ordered_child_ids` follow the existing duplicate `node_id_map`, plus focused backend tests.
- This exception permits no new endpoint, schema, migration, provider behavior, secret access, paid call, destructive operation, or user-data change. Future, malformed, unsupported, ordinary, and unrelated content must remain unchanged.

## Locked design direction

- Visual thesis: preserve Revid's near-black, dark-purple, media-first, low-noise Canvas; Storyboard becomes a calm three-lane review surface, not a second card design system.
- Content plan: orient with the view switch, scan text/image/video lanes, then reuse the existing Context Panel for detail and allowed edits.
- Interaction thesis: view switching and item selection are presentation state; only typed group/order/settings commands may mutate the document, and 375px remains review-only.
- CSS strategy: existing scoped Vue SCSS plus `v2-canvas-tokens.scss`; no Tailwind, CSS-in-JS, global restyle, gradient, glass, or new token vocabulary.
- Reference principles: Milanote keeps script, imagery, and notes on one creative board; Boords emphasizes ordered frames, automatic numbering, ratio, and frame detail; Miro emphasizes rearrangeable visual sequences on one canvas. Revid retains its own graph, tokens, copy, interaction, and product identity.
- TDD rule: every production behavior begins with a focused failing test whose fingerprint proves the missing requirement.

## Unit 0 - Durable activation

1. Verify T5-080 Task, PLAN, PROGRESS, REPORT, CURRENT, ROADMAP, local HEAD, and `origin/main` all agree on `DONE - PASS`.
2. Create T5-081 Task, PLAN, and PROGRESS; add ROADMAP order 81; make it the only `DOING` Task.
3. Record objective, data contract, acceptance criteria, non-goals, risks, baseline worktree, visual direction, and exact first RED.
4. Re-read the required truth set and repeat Git guards before business-code edits.

Success gate: T5-081 is the only active implementation Task and all durable files agree.

## Unit 1 - Pure Storyboard projection

1. Audit registry, generation runtime, lineage, media availability, group content, and document-order helpers.
2. Create `storyboard-types.ts` and `storyboard-projection.ts` behind RED table cases for canonical/legacy/unsupported nodes, group order, geometry fallback, pending/success/failure/unavailable state, and result deduplication.
3. Return stable lane items that retain existing node IDs only; do not clone graph entities or introduce mutable state.
4. Prove same-input determinism, no input mutation, no store/network side effects, and safe malformed-metadata fallback.

Success gate: one input document always produces the same ordered lane IDs and statuses without mutation.

## Unit 2 - View boundary and review lanes

1. Add a route-scoped local `workflow | storyboard` mode and an accessible tab switch while preserving canonical route/document identity.
2. Keep Canvas state mounted or otherwise prove viewport/history neutrality; close only transient menus/drafts while retaining selection and Context Panel identity.
3. Add an explicit `allow-generation-execution` boundary so Storyboard cannot generate, retry, branch, or execute a recipe.
4. Render text, image, and video lanes using canonical presentation/media/task helpers, explicit empty/error states, lane counts, focus rings, and keyboard previous/next navigation.
5. Verify zero document/viewport PATCH, history, revision, generation, recipe, or provider request on switching/review.
6. Verify desktop, compact, and 375px review-only behavior.

Success gate: Storyboard reduces graph traversal while Workflow remains the sole graph and execution surface.

## Unit 3 - Validated image storyboard groups

1. Add canonical `group/storyboard` registry resolution and pure metadata/membership validation for exactly 2-25 editable, unlocked, ungrouped image asset/result children.
2. Add typed create, settings/order, convert, and ungroup commands that validate current membership before mutation.
3. Create one deterministic grid resolver for aspect ratio, 1-5 columns, numbering, child positions, and visible group bounds.
4. Reuse T5-080 whole-group drag semantics, command executor, autosave, history, and duplicate document behavior.
5. Add Workflow controls only where truthful; keep normal group controls and shortcuts unchanged.

Success gate: storyboard groups are ordinary durable group nodes with validated metadata and one-command atomic mutation.

## Unit 4 - Shared sequence order

1. Use `ordered_child_ids` as the single order for Storyboard items and Workflow grid placement.
2. Provide accessible earlier/later controls and recompute metadata, child positions, and group bounds atomically.
3. Preserve selection, Context Panel identity, provider input-order metadata, lineage, edges, unrelated nodes, and exact undo/redo.
4. Verify one PATCH, reload, Canvas duplication, conversion, ungroup, and malformed metadata.

Success gate: Workflow layout and Storyboard reading order remain identical through history and reload.

## Unit 5 - Integrated verification and closure

1. Run focused projection/workflow/group/registry/command/history/persistence specs, then related selection/generation/provenance/media/shell/keyboard suites.
2. Run production build and inspect empty, mixed, pending/failure, 2-image, 25-image, and invalid-selection states at 1440x900, 1366x768, 920x900, and 375x812.
3. Run full functional Chromium and the guarded owned 200/300 supervisor because view composition and group rendering changed.
4. Run diff, UTF-8, file-size/growth, accessibility, reduced-motion, request-guard, sensitive-path, staged-secret, and exact staged-diff gates.
5. Write `REPORT-T5-081.md`, close Task/PLAN/PROGRESS/CURRENT/ROADMAP, commit exact owned paths, and push `main` only when every non-deferred criterion passes.

Success gate: code, tests, evidence, durable state, commit, and `origin/main` agree on `DONE - PASS`.

## Stop rules

- Stop and document a blocker if the work requires a second graph/store, backend endpoint/schema/provider behavior beyond the authorized duplicate metadata-ID remap, paid execution, secret access, destructive data work, mobile editing, or an incompatible persisted contract.
- Stop and re-plan if switching cannot remain revision/history/viewport neutral, metadata cannot fail closed, or one order cannot own both reading and layout.
- Preserve pre-existing untracked `.hermes` plans and `output/`; never stage them.
