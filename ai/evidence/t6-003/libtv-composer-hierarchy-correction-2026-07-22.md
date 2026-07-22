# T6-003 LibTV selected-card composer hierarchy correction

## Trigger and authority

- Trigger: renewed completion audit against the Human-supplied selected `三花小猫` screenshot after Unit 6F toolbar correction.
- Official reference: `C:/Users/mkd/AppData/Local/Temp/codex-clipboard-81d95e1a-9cea-4ebc-af12-a52702265f0c.png`.
- Pre-correction Revid evidence: `output/playwright/t6-003-materialized-card/selected-materialized-image-card.png`, historical SHA-256 `A44A504DBCF550918AF721CDD77D0AB6BD54C10B3F0607683ED3AF5E087FB4E9`.
- This is a clean-room visual and interaction observation. No LibTV source, private implementation, credential, upload, generation, graph mutation, or paid action is used.

## Remaining visible delta

- The outer Revid composer width and source attachment are already aligned at approximately `2.06 ×` the media width.
- The official selected-card composer reads as one continuous approximately `190 CSS px` creator surface: lightweight controls at the top, prompt content directly on the panel, and model/parameters plus the terminal submit control at the bottom.
- Revid currently reads as a nested form: work modes occupy one row, source actions occupy a second row, the prompt is placed in a separate black bordered textarea, and submission sits beside that nested textarea instead of terminating the bottom action band.
- The mismatch is hierarchy, not capability. Revid must retain its supported modes, upload/project-asset/Canvas-reference choices, provider/model identity, runtime feedback, disabled reasons, keyboard behavior, and graphite/violet identity.

## Unit 6G acceptance evidence

1. Modes and source actions share one compact top control band, with wrapping allowed only when the safe composer width requires it.
2. The prompt consumes one continuous central region with no nested dark-card background or standard border; focus remains visibly accessible.
3. Model, parameter summary, warnings/runtime/error feedback, and submit control belong to one bottom band; submit is the terminal action.
4. The desktop surface is at least `188 CSS px` high and remains centered under the media at approximately `2.06 ×` width when space permits.
5. Compact clamping, collision flip, readonly hiding, focus restoration, source actions, generation, and zero document PATCHes remain unchanged.
6. Desktop selected and `920x900` compact captures are manually inspected before renewed Human review.

## Implemented evidence

- `CanvasCardWorkSurface.vue` now has one top control band, one transparent borderless prompt region, and one bottom metadata/action band. The submit event, mode selection, prompt update, upload, project asset, Canvas reference, provider/model, runtime, disabled, focus, readonly, and mutation authorities are unchanged.
- Historical Unit 6G desktop selected capture: `output/playwright/t6-003-materialized-card/selected-materialized-image-card.png`, SHA-256 `487326D2C237920CEF5B275D64000F7F9BF4AA549748E3119A64B8F6CCC3EA4E`; Unit 6H later recaptured the same path.
- Historical Unit 6G compact selected capture: `output/playwright/t6-003-materialized-card/selected-materialized-image-card-920x900.png`, SHA-256 `E1B93D7370E76262C0FB750465030D31D24E20E66BCDC0227F89779246726598`; Unit 6H later recaptured the same path.
- Manual inspection confirms a continuous graphite/violet panel, compact single-row controls, unboxed prompt at rest, terminal submit action, stable media geometry, safe toolbar/composer bounds, and no detached result or lineage shell.

## Unit 6K width-authority correction

- This document's approximately `2.06 x` statement is valid only for the measured 100% `320px` card.
- Fresh official 50/82/100% DOM evidence supersedes a percentage width across zoom. Current production keeps the same hierarchy at a fixed centered `660 CSS px` screen width with a `16 world px` media gap.
- Verification: exact hierarchy `1/1`; full work-surface `9/9`; focused geometry/work-surface/visual `32/32`; three-axis parity `7/7`; production build `4,972` modules; full functional Chromium `596/596` in `9.5m`; headed performance `2/2` in `1.1m`; dependency audit `0`.
