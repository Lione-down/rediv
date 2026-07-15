# TASK-T5-063 Plan

- State: `DONE`
- Updated: 2026-07-15

## Objective

Keep the contextual selection toolbar adjacent to selected Canvas content without covering that content, video keyframes, the desktop Inspector safe area, or a compact context drawer.

## Scope and acceptance criteria

- On desktop with the Inspector open, a selected video toolbar does not overlap the native video rect or keyframe rail and remains at least 12px left of the Inspector.
- Selected node content participates in toolbar collision scoring, not only unrelated nodes and provenance markers.
- A selected video and its rail use one shared above/below placement decision; the toolbar prefers the opposite side and scores the actual rail rect.
- Toolbar clamps honor the provided top/right/bottom/left viewport insets.
- The toolbar honors the established Canvas surface insets; desktop browser evidence separately proves at least 12px clearance from the Inspector DOM boundary.
- While the compact context drawer is open, the toolbar is absent rather than visible behind a non-interactive mask; closing the drawer preserves the existing selection-clear contract without graph mutation.
- Multi-selection, generation composer, arrange/compose menus, readonly, keyboard focus, and existing panel-safe reveal behavior remain intact.
- No graph, persistence, provider, quota, or schema contract changes.

## Non-goals

- Toolbar redesign, action changes, new gestures, node auto-movement, Inspector resizing, or global overlay architecture replacement.

## Direction

- Visual thesis: contextual chrome orbits the content and never becomes a layer over the media itself.
- Content plan: preserve a clear selected node, expose one nearby toolbar, keep the Inspector as a separate review surface.
- Interaction thesis: placement changes are deterministic and motionless; compact overlays own interaction until dismissed.
- CSS strategy: retain the existing toolbar material and dimensions, change only authoritative geometry and visibility ownership.

## Units

1. Add RED browser assertions for selected-video, keyframe, Inspector, and compact drawer non-overlap.
2. Share keyframe-side resolution and make the toolbar scorer include selected and adjunct geometry plus viewport insets.
3. Hide toolbar under compact overlay ownership and verify restoration.
4. Run focused/related Chromium, build, screenshots, hygiene, report, commit, and push.

## Risks

- Fixed assumed toolbar bounds can be too conservative for one-node selections but must still cover wider multi-selection action sets.
- Duplicating keyframe placement logic would let the toolbar and rail disagree; use one pure helper.
- Desktop inset correction affects fit/reveal geometry beyond the toolbar; verify existing panel-safe flows.
