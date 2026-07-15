# REPORT-T5-050 - Selection-order composition preflight

## Result

`DONE - PASS`

Multi-node composition now follows the user's explicit selection sequence instead of silently restoring document order. Canvas `T/R` markers, the composition preflight, created connection metadata, resolved generation context, and the reloaded inspector all share that same authority.

The existing composition menu now lists every exact role and source title before image or video workflow creation. This keeps the Canvas quiet until review is requested and makes reverse-order mixed selections auditable before mutation.

## Verification

- Production build: PASS, 4,811 modules transformed.
- Focused reducer and composition verification: PASS, 17/17.
- Related selection, command, remix, output, and provenance regression: PASS, 35/35.
- Final visual evidence rerun: PASS, 2/2.
- Reverse-click contract: PASS, `R1 人物参考`, `T1 镜头约束`, `R2 海岸参考`, `T2 场景约束` persisted and reloaded exactly.
- Cancellation and readonly: PASS, Escape and 375px review produce no graph mutation.
- Compact localization: PASS, long Chinese title wraps inside 920px without horizontal overflow.

## Retained evidence

- `output/playwright/t5-050-selection-order-preflight/mixed-selection-compose-menu-1440x900.png`
- `output/playwright/t5-050-selection-order-preflight/mixed-selection-video-generation-1440x900.png`
- `output/playwright/t5-050-selection-order-preflight/text-selection-compose-menu-920x900.png`

## Boundary

Selection order is authoritative for generation composition. The separate two-node connect action deliberately retains its established document-order direction for bidirectionally compatible legacy nodes. Drag reorder, provider calls, and mobile editing remain deferred.
