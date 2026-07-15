# REPORT-T5-051 - Reorderable composition preflight

## Result

`DONE - PASS`

Creators can now correct prompt and reference order directly inside the multi-node composition preflight. Each source exposes quiet, keyboard-accessible up/down controls, while T and R groups remain independently ordered.

Reordering changes selection state only. Canvas markers and menu roles update immediately, but no document PATCH, graph revision, or history entry is created. The adjusted order then becomes the exact image/video generation connection order and survives generation reload inspection.

## Verification

- Production build: PASS, 4,811 modules transformed.
- Focused selection-generation verification: PASS, 8/8.
- Related command, keyboard, output, remix, provenance, compact, and readonly regression: PASS, 46/46.
- Keyboard flow: PASS, focus plus Enter reorders R input and Escape closes after role changes.
- Mutation boundary: PASS, zero document PATCH and unchanged graph revision before generation.
- Image/video semantics: PASS, both command types consume the same adjusted T/R order.
- Responsive localization: PASS, long Chinese title wraps inside the 920px menu without horizontal overflow.

## Retained evidence

- `output/playwright/t5-051-reorderable-composition-preflight/mixed-selection-compose-menu-1440x900.png`
- `output/playwright/t5-051-reorderable-composition-preflight/mixed-selection-video-generation-1440x900.png`
- `output/playwright/t5-051-reorderable-composition-preflight/text-selection-compose-menu-920x900.png`

## Deferred

Pointer drag sorting, persisted generation input reorder changes, backend/provider calls, document history entries, and mobile editing remain outside T5-051.
