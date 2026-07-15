# REPORT-T5-064 - Composition selection hull

## Outcome

T5-064 is `DONE - PASS`.

Compose-ready selected sources now read as one pending generation set through a restrained aggregate hull. The hull uses the same selected surface bounds as contextual-toolbar placement, preserves the individual T/R semantic markers, and introduces no graph, group, provider, persistence, or command behavior.

## Implementation

- Added one computed selected surface-bounds contract in the stage presentation layer.
- Reused that contract for toolbar placement and a 12px screen-space composition hull gutter.
- Gated rendering through the authoritative compose capability plus readonly and context-overlay ownership.
- Kept the hull pointer-passive and labelled it `待合并 · N` on the upper-right edge to avoid T1/T2 markers.
- Added stable browser screenshot timing so Leafer and DOM overlays are captured in the same completed frame.

## Verification

- Initial RED: positive browser test failed with hull count 0.
- Visual RED: label-clearance assertion failed when the aggregate label overlapped T1.
- Focused selection-generation suite: PASS, 10/10.
- Related composition output, command, keyboard, video toolbar, multi-scenario, and provenance zoom matrix: PASS, 50/50.
- Frontend build: PASS, 4,819 modules transformed.
- Desktop visual: `output/playwright/t5-064-composition-hull/compose-ready-hull-1440x900.png`.
- Compact visual: `output/playwright/t5-064-composition-hull/compose-ready-hull-920x900.png`.

The browser contract proves source containment, role-label clearance, pointer passivity, zoom response, compact Canvas bounds, and absence for invalid and readonly selections. No paid provider or backend call was required.

## Product boundary

The hull is feedback for a pending composition, not a persisted group or container. Existing selection order remains the exact source of T/R roles and generated request order.
