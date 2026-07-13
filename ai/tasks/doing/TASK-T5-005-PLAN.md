# TASK-T5-005 Plan

- State: `DOING`
- Completed unit: Unit A - persistent keyed Leafer world and incremental node reconciliation (`COMPLETE - PASS`)
- Next unit: Unit B - command contract, selection, and multi-node editing
- Updated: 2026-07-13

## Objective

Deliver T5-005 as independently verified interaction units, beginning with the renderer lifecycle foundation required by every later command and performance change.

## Direction Lock

- Visual thesis: preserve the accepted graphite-black violet creative studio; renderer changes must be visually neutral.
- Content plan: keep the graph as the dominant surface and add no permanent chrome in Unit A.
- Interaction thesis: preserve current pointer semantics while replacing full-scene rebuilds with stable keyed visuals and transform-only viewport updates.
- CSS strategy: existing scoped SCSS and Canvas V2 token source only; Unit A introduces no new styling system or visual literals.

## Unit A - Persistent keyed Leafer world

### Scope

1. Create one persistent Leafer world `Group` and keep node visuals in a keyed `Map` for the renderer lifetime.
2. Add a pure reconciliation planner that identifies create, update, and remove IDs and rejects duplicate input IDs.
3. Create visual objects only for new node IDs, patch existing visual properties for changed node data/selection/status, and destroy only removed node groups.
4. Store node coordinates in world space and apply pan/zoom through the world-group transform; resize changes only the Leafer viewport size.
5. Replace the `JSON.stringify` scene signature and viewport-triggered `render()` rebuild with explicit appearance, position, selection, viewport, and resize synchronization paths.
6. Preserve existing event callbacks, connection SVG behavior, status overlays, minimap, mobile review-only boundary, and immediate mutation persistence behavior.
7. Add focused pure reconciliation tests and run the existing Canvas document/shell browser regression plus production build.

### Non-goals

- command types, command inversion, multi-node drag, duplicate, group, connect, shortcut expansion, arrange, or history;
- SVG edge-world refactor, minimap throttling, viewport culling, or final 200/300 performance certification;
- backend/API/schema changes, database access, paid calls, secret access, or visual redesign.

### Success Criteria

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

Introduce the typed command boundary, deterministic selection reducer, multi-move, duplicate, and delete without yet adding durable history.

### Unit C - Grouping, connection, shortcuts, and accessibility list

Add group/ungroup, validated connect, Canvas-focus shortcut dispatch, shortcut panel, and synchronized DOM node/connection access.

### Unit D - View and arrange commands

Complete zoom presets and numeric entry, fit graph/selection, view toggles, align/distribute/lock, and stable undoable auto-arrange command output.

### Unit E - Closure evidence

Run focused render/performance, required viewports, accessibility, full regression, and documentation reconciliation before REPORT and `DONE - PASS`.
