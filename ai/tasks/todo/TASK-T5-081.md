# TASK-T5-081 - Storyboard projection and image storyboard groups

- State: `DONE - PASS`
- Objective: project the current Canvas document into truthful text, image, and video Storyboard review lanes, then add durable image-only storyboard groups whose order, ratio, grid, and numbering remain ordinary Canvas graph metadata.
- Dependency: `T5-080 - DONE - PASS` at committed and pushed baseline `408c5f2a6fe940fb4567c8b97b008ff7bd1d2c3b`.

## Scope

- Derive one pure Storyboard projection from the existing `CanvasNode[]` and `CanvasConnection[]` entities.
- Add an accessible top-level `工作流 / 故事板` presentation switch without changing route or document identity.
- Render stable text, image, and video review lanes with explicit empty, pending, failure, success, and unavailable states.
- Reuse the current selection, Context Panel, media, task, parameter, and T/R/G/V lineage contracts.
- Add a canonical `group/storyboard` subtype for 2-25 editable unlocked ungrouped image asset/result nodes.
- Persist `serialization_version`, `storyboard_schema_version`, aspect ratio, 1-5 columns, numbering, and exact child order in existing group node content JSON.
- Reorder storyboard children and recompute group/child geometry through one typed command, one history entry, and one document PATCH.
- Convert to a normal group or ungroup without child-position or connection drift.

## Acceptance criteria

1. The top-level view switch is keyboard accessible, clearly identifies the active surface, and keeps one canonical Canvas URL/document.
2. Switching preserves node IDs, edges, selection, graph revision, viewport, history, open project/canvas identity, and produces no document or viewport PATCH.
3. Storyboard derives truthful non-duplicated text/image/video lanes with explicit empty states and deterministic order.
4. Storyboard item selection reuses the same Canvas node ID, Context Panel, parameters, media, runtime state, and T/R/G/V lineage.
5. Existing safe content/parameter edits may remain available, but Storyboard exposes no generate, retry, recipe, branch, concat, export, or provider execution action.
6. Workflow selection offers `创建分镜组` only for 2-25 compatible image asset/result nodes; mixed, text, video, locked, grouped, unsupported, one-item, and 26-item selections fail closed.
7. Storyboard groups durably preserve exact membership, order, aspect ratio, columns, numbering, reload, and Canvas duplication.
8. Reorder changes only storyboard metadata, grid child positions, and group bounds; provider input order, edge IDs, lineage, and unrelated graph entities stay unchanged.
9. Conversion removes storyboard-only metadata without moving children; ungroup preserves child positions and connections.
10. Whole-group movement reuses T5-080 parent-before-child equal-delta semantics.
11. Storyboard is usable at 1440x900, 1366x768, and 920x900; 375x812 remains review-only and mutation-free.
12. Focused projection/group/workflow tests, related Canvas regression, build, visual QA, full functional Chromium, persistence, accessibility, hygiene, and applicable owned 200/300 performance evidence pass.

## Locked data contract

- Storyboard group content uses `subtype: 'storyboard'`, `serialization_version: 1`, `storyboard_schema_version: 1`, `aspect_ratio: '16:9' | '9:16' | '1:1' | '4:3'`, `columns: 1 | 2 | 3 | 4 | 5`, `show_numbers: boolean`, and `ordered_child_ids: string[]`.
- `ordered_child_ids` contains every current child exactly once. Malformed metadata falls back to normal-group presentation and is never repaired destructively by inference.
- Child world positions remain absolute. No second graph, mutable Storyboard store, backend endpoint, database field, or migration is introduced.

## Non-goals

- No timeline tracks, duration editing, transitions, audio, subtitles, compositor, concat, render, export, batch download, or automatic graph execution.
- No provider, recipe, paid generation, new backend/schema, Canvas engine, persistent URL, cross-canvas edge, collaboration, or mobile editing change.
- No broad redesign of Workflow nodes, Context Panel, media cards, generation behavior, or global application shell.

## Risks and controls

- Projection drift is controlled by returning existing IDs and derived presentation only, with purity and no-request assertions.
- Metadata drift is controlled by exact current-membership validation on every storyboard command.
- Order drift is controlled by one authoritative `ordered_child_ids` sequence shared by Storyboard reading order and Workflow layout.
- Workspace growth is controlled by extracting Storyboard modules/components and keeping `CanvasWorkspace.vue`, `CanvasStage.vue`, and command orchestration within the preferred file boundary.
- Paid execution leakage is controlled by an explicit Context Panel execution boundary plus endpoint request guards.

## Human gates

- Paid calls, real secret access, external accounts, destructive data/filesystem work, runtime migrations, and incompatible product/UX changes remain Human Owner gates.
- The guarded live supervisor may run only with environment already supplied to the process and may not expose credential values.
