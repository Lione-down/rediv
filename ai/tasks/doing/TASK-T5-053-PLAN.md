# TASK-T5-053 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Revid already provides keyboard-selectable edge hit paths, endpoint reroute handles, provenance strokes, graph access, and atomic midpoint insertion.
- A selected incompatible edge has no visible identity beyond the highlighted curve and endpoint handles.
- In a convergence graph, users must visually trace the curve back to both nodes to understand the relationship.
- AIGCCanvasFlow's public README describes persistent upstream-output edge text, but the referenced frontend source is absent from its current public commit, so that implementation is not treated as evidence.

## Product comparisons

- Blender Geometry Nodes keeps cables quiet and relies on endpoint socket labels, precise but expensive to trace across long graphs.
- ComfyUI uses typed sockets and colored links, preserving density but leaving long-link identity implicit.
- AIGCCanvasFlow describes up to 30 characters of upstream output on edges, explicit but likely noisy when every edge participates.

## Direction

- Use Revid's own contextual pattern: no permanent edge text, one semantic identity surface only for the current selection.
- Reuse existing tokens, surface stepping, radius, focus ring, and press-scale motion.
- Keep exact identity in accessible text and title attributes while bounding visual title segments.

## Units

1. Add a browser RED for selected edge identity, semantic roles, dismissal, compact, readonly, and no-mutation behavior.
2. Add a pure semantic presentation resolver for ordinary, prompt, media, and result connections.
3. Render one midpoint contextual surface and integrate the existing insertion action.
4. Verify reroute, insertion, provenance, keyboard, dense, compact, readonly, and visual evidence.
5. Build, regression, report/state/pitfalls, diff review, commit, and push.

All units are complete. The final surface uses semantic role resolution plus collision-aware screen placement, and only renders for the current selected edge.

## Risks

- The identity surface can overlap a dense node or the current midpoint insertion action.
- Long localized titles can force horizontal overflow.
- Screen-space chrome can become oversized at low Canvas zoom.
- Readonly identity must not accidentally reintroduce mutation controls.
