# REPORT-T5-053 - Selected edge semantic identity

## Result

`DONE - PASS`

One selected Canvas connection now exposes a compact semantic identity surface. It names prompt input, reference input, generated result, or generic data flow, then shows the exact source-to-target relationship without placing permanent text on every edge.

The existing insertion action now belongs to the same contextual surface. When the geometric midpoint intersects a Canvas node, canonical visual geometry moves the surface to a clear vertical slot and draws a restrained leader back to the original edge. Inspection remains selection-only and creates no graph mutation.

## Verification

- Browser RED: PASS; missing semantic identity reproduced before implementation.
- Screenshot collision RED: PASS; naive midpoint placement reproduced over a script node before collision handling.
- Production build: PASS, 4,813 modules transformed.
- Focused selected-edge verification: PASS, 3/3.
- Related insertion, reroute, provenance, lineage, keyboard, multi-scenario, zoom, and command regression: PASS, 56/56.
- Semantic roles: PASS for prompt, media, generated result, and generic data connections.
- Interaction preservation: PASS for keyboard selection, endpoint reroute, atomic insertion, dismissal, and unselected-edge quietness.
- Mutation boundary: PASS, identity inspection produces no document PATCH.
- Responsive review: PASS at 1440x900, 920x760, and readonly 375x812.

## Retained evidence

- `output/playwright/t5-053-selected-edge-identity/selected-result-edge-1440x900.png`
- `output/playwright/t5-053-selected-edge-identity/selected-media-edge-920x760.png`
- `output/playwright/t5-053-selected-edge-identity/selected-media-edge-readonly-375x812.png`

## Reference adaptation

AIGCCanvasFlow's public README describes upstream output text on edges. Revid adapts only the comprehension goal: exact identity appears contextually for one selected edge, while the graph stays unlabeled and quiet by default. The current public reference commit did not expose the README's named frontend source files, so no unverified code implementation was copied.

## Deferred

Permanent edge labels, upstream content previews, editable connection metadata, new connection types, and Canvas engine replacement remain outside T5-053.
