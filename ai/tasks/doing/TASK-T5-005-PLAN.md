# TASK-T5-005 Plan

- State: `DOING`
- Completed unit: Unit A - persistent keyed Leafer world and incremental node reconciliation (`COMPLETE - PASS`)
- Completed unit: Unit B - command contract, selection, and multi-node editing (`COMPLETE - PASS`)
- Completed unit: Unit C - grouping, connection, shortcuts, and accessibility list (`COMPLETE - PASS`)
- Next unit: Unit D - view and arrange commands
- Updated: 2026-07-13

## Objective

Deliver T5-005 as independently verified interaction units. Units A-C now cover persistent rendering, deterministic command editing, flat grouping, validated connection, Canvas-focus shortcuts, and synchronized DOM graph access; Unit D completes view and arrange commands.

## Direction Lock

- Visual thesis: preserve the accepted graphite-black violet creative studio; selection feedback remains restrained and contextual.
- Content plan: keep the graph as the dominant surface; expose duplicate and delete only in a contextual selection toolbar and the existing context menu.
- Interaction thesis: single, modifier, and marquee selection are deterministic; dragging any selected node previews the whole selection locally and dispatches one move command on pointerup.
- CSS strategy: existing scoped SCSS and Canvas V2 token source only; no new styling system, visual palette, or permanent chrome.

## Unit A - Persistent keyed Leafer world

#### Scope

1. Create one persistent Leafer world `Group` and keep node visuals in a keyed `Map` for the renderer lifetime.
2. Add a pure reconciliation planner that identifies create, update, and remove IDs and rejects duplicate input IDs.
3. Create visual objects only for new node IDs, patch existing visual properties for changed node data/selection/status, and destroy only removed node groups.
4. Store node coordinates in world space and apply pan/zoom through the world-group transform; resize changes only the Leafer viewport size.
5. Replace the `JSON.stringify` scene signature and viewport-triggered `render()` rebuild with explicit appearance, position, selection, viewport, and resize synchronization paths.
6. Preserve existing event callbacks, connection SVG behavior, status overlays, minimap, mobile review-only boundary, and immediate mutation persistence behavior.
7. Add focused pure reconciliation tests and run the existing Canvas document/shell browser regression plus production build.

#### Non-goals

- command types, command inversion, multi-node drag, duplicate, group, connect, shortcut expansion, arrange, or history;
- SVG edge-world refactor, minimap throttling, viewport culling, or final 200/300 performance certification;
- backend/API/schema changes, database access, paid calls, secret access, or visual redesign.

#### Success Criteria

- The Leafer root and world group are created once; normal sync contains no `leafer.clear()` or root-child rebuild.
- Unchanged keyed node groups survive appearance, selection, viewport, and unrelated-node updates.
- Add, update, remove, and duplicate-ID reconciliation behavior has focused automated coverage.
- Pan/zoom changes only the persistent world-group `x`, `y`, `scaleX`, and `scaleY` values.
- Current Canvas editing, viewport persistence, shell navigation, mobile review, and responsive behavior pass relevant Chromium regression.
- `vue-tsc` plus Vite build, fresh diff review, `git diff --check`, file-size, UTF-8, sensitive-path, secret-candidate, and database-artifact gates pass.

### Outcome

- The renderer now creates one Leafer root and one persistent world group, keeps keyed node visual objects for its lifetime, and destroys only removed node groups.
- A pure reconciliation planner separates create, update, and remove work and rejects duplicate renderer keys before scene mutation.
- Node appearance snapshots skip unchanged visual property writes; position and viewport updates use dedicated paths, with viewport pan/zoom changing only the world-group transform.
- The stage no longer uses `JSON.stringify` scene signatures or viewport-triggered full renders, while current pointer, SVG edge, minimap, overlay, persistence, and mobile review behavior remain intact.
- Focused reconciliation tests passed 2/2, focused Canvas browser regression passed 8/8, full Chromium passed 18/18, the production build passed with 4712 modules, and real desktop/mobile screenshots were reviewed.

## Later Units

### Unit B - Command and multi-selection editing

### Scope

1. Add a discriminated typed command envelope for `move-nodes`, `duplicate-nodes`, and `delete-selection`, including source metadata for pointer, keyboard, toolbar, and context-menu dispatch.
2. Add a pure deterministic selection reducer that filters stale IDs, follows graph order, keeps one explicit primary node, and makes connection selection mutually exclusive with node selection.
3. Preserve an existing multi-selection when an already selected node begins a drag; modifier click toggles membership without starting a drag when the clicked node becomes unselected.
4. Preview every selected node from captured origin positions during pointermove, restore the full selection on cancellation, and dispatch one multi-move command on pointerup. Existing per-node Canvas APIs may persist the command after pointerup; no request may run during pointermove.
5. Duplicate selected nodes with a stable 32 world-unit offset and recreate only connections whose two endpoints are both duplicated. Select the duplicated nodes after server IDs resolve.
6. Delete the selected connection or selected nodes through the same command dispatcher. Keep existing optimistic rollback and user-visible save-error behavior.
7. Route `Ctrl+D`, Delete/Backspace, the existing context menu, and a contextual selection toolbar through the command dispatcher while retaining the below-768px review-only guard.
8. Add focused pure command/selection/source coverage and browser coverage for deterministic modifier/marquee selection, multi-drag, duplicate, delete, toolbar convergence, and mobile mutation blocking.

### Non-goals

- undo/redo stacks, command inversion/replay, autosave batching, idempotency, graph revisions, or conflict recovery owned by T5-006;
- group/ungroup, validated connect, complete Canvas-focus shortcut scoping, shortcut help, or the DOM accessibility list owned by Unit C;
- fit, arrange, align/distribute/lock, view toggles, zoom expansion, performance certification, backend/API/schema changes, or visual redesign.

### Success Criteria

- Pure tests prove selection output and command payloads are deterministic and reject missing/stale targets.
- Clicking and dragging any member of a multi-selection preserves the selection and moves every member by the same delta.
- Pointermove mutates only local preview state; persistence begins only after one `move-nodes` command is dispatched on pointerup.
- Keyboard, contextual toolbar, and context-menu duplicate/delete actions call the same typed dispatcher and retain mobile read-only enforcement.
- Duplicate recreates all selected nodes and only internal selected-subgraph connections; delete removes exactly the selected graph targets.
- Focused Chromium tests, relevant Canvas regression, full Chromium regression, production build, real desktop/mobile review, fresh diff review, `git diff --check`, file-size, UTF-8, sensitive-path, secret-candidate, and database-artifact gates pass.

#### Outcome

- One discriminated command envelope now carries source metadata and typed `move-nodes`, `duplicate-nodes`, and `delete-selection` payloads through the Canvas store.
- Selection normalization follows document order, filters stale IDs, keeps one primary node, and makes node and connection selection mutually exclusive.
- Marquee and modifier selection are deterministic; dragging any selected node previews every selected node from captured origins and dispatches one command only on pointerup.
- Duplicate copies the selected nodes with a stable offset and recreates only internal selected-subgraph connections; Delete/Backspace, toolbar, and context-menu actions share the command dispatcher.
- A contextual selection toolbar uses the existing V2 surfaces and 40px targets, while the below-768px review-only surface exposes no mutation command.
- Focused command/interaction tests passed 7/7, full Chromium passed 25/25, the production build passed with 4719 modules, and desktop/mobile screenshots were reviewed.

### Unit C - Grouping, connection, shortcuts, and accessibility list

### Scope

1. Extend the existing Canvas node DTO and frontend mapping to preserve the already-migrated `z_index`, `parent_node_id`, `is_locked`, and `is_collapsed` fields without adding or changing database schema.
2. Add typed `group-nodes`, `ungroup-nodes`, and `connect-nodes` commands to the same dispatcher used by pointer, keyboard, toolbar, and context-menu mutations.
3. Implement flat grouping only: require at least two active, unlocked, ungrouped non-group nodes; create one group bounds node with 24 world-unit padding; persist child `parent_node_id`; select the new group after completion.
4. Ungroup a selected group, or the common parent of selected children, by clearing child `parent_node_id` before deleting the group; select the released children after completion.
5. Validate connection intent before optimistic mutation: both nodes must exist, source and target must differ, ports must be `out` to `in`, and the exact directed connection must not already exist. Route pointer connection completion and a two-node toolbar/keyboard action through the typed command.
6. Make shortcuts active only while focus is within the Canvas stage, ignore editable controls, preserve the review-only guard, and expose `Ctrl+D`, `Ctrl+G`, `Ctrl+Shift+G`, `Ctrl+Enter`, Delete/Backspace, Escape, and `?` through an accessible shortcut panel.
7. Add a synchronized DOM graph panel with keyboard-reachable node locate/select actions, connection review/select actions, and delete actions only when editing is allowed.
8. Preserve the graphite-black violet V2 vocabulary, existing scoped SCSS/tokens, 40 px targets, visible focus, localized Chinese labels, reduced motion, and the below-768px review-only boundary.
9. Add focused pure/backend/browser coverage, then run relevant Canvas regression, full Chromium regression, production build, real desktop/mobile review, fresh diff review, and hygiene gates.

### Non-goals

- Nested groups, group collapse, group drag semantics, lock/unlock UI, align/distribute, auto-arrange, command inversion, undo/redo, autosave batching, or revision history.
- New database tables, columns, migrations, destructive database work, paid calls, secret access, global page redesign, or a second Canvas engine.
- Final 200-node/300-connection performance and full milestone accessibility certification, which remain Unit E and T5-008 work.

### Success Criteria

- Pure command tests reject invalid grouping and connection payloads and produce deterministic command envelopes for valid selections.
- Group and ungroup persist existing schema fields through the canonical Canvas API, restore coherent local state on failure, and leave no child pointing at a deleted group after a successful ungroup.
- Pointer, keyboard, contextual toolbar, and DOM graph actions converge on the typed dispatcher where they mutate the graph.
- Mutation shortcuts do nothing when focus is outside Canvas, when focus is in an editable control, or when the viewport is review-only.
- The shortcut/graph panel is keyboard reachable, exposes synchronized node and connection labels, locates/selects graph entities, and hides destructive actions in review-only mode.
- Focused tests, relevant/full Chromium, production build, real rendered viewport review, `git diff --check`, UTF-8, file-size, sensitive-path, secret-candidate, and database-artifact checks pass.

### Outcome

- Canonical Canvas node DTOs now preserve the existing commented group, z-order, lock, and collapse fields; null parent updates round-trip through guarded MySQL without a migration.
- Typed flat group, ungroup, and connect commands validate stale/missing/locked/grouped targets, use 24 world-unit group bounds, recover coherent local state on request failure, and keep direct group deletion free of child-parent orphans.
- Pointer connection completion, Canvas-focus keyboard shortcuts, contextual toolbar, context menu, and accessibility actions converge on the command dispatcher while editable controls, outside-Canvas focus, and mobile review mode remain protected.
- One synchronized graph/shortcut panel exposes node locate/select, connection review/select, and edit-only deletion with Chinese labels, 40 px targets, visible focus, and the existing graphite-black violet vocabulary.
- Focused frontend tests passed 9/9, focused guarded MySQL/node API tests passed 13/13, full backend passed 190 tests plus 5 subtests, full Chromium passed 27/27, and the final build passed with 4723 modules.
- Real 1366x768 group/panel and 375x812 review-only panel screenshots were reviewed under `output/playwright/t5-005-unit-c/`.

### Unit D - View and arrange commands

Complete zoom presets and numeric entry, fit graph/selection, view toggles, align/distribute/lock, and stable undoable auto-arrange command output.

### Unit E - Closure evidence

Run focused render/performance, required viewports, accessibility, full regression, and documentation reconciliation before REPORT and `DONE - PASS`.
