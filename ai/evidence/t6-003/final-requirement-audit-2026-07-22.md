# T6-003 Final Requirement Audit

## Outcome

Acceptance criteria 1 through 16 are implemented and machine-verified. After the Human Owner requested direct closure on 2026-07-22, the one intended protected snapshot and its integrity overlay were refreshed; focused verification passed `1/1` and final unexcluded Chromium passed `599/599` in `11.5m` with exit `0`. Criterion 17 is accepted, so T6-003 is `DONE / PASS`; future Human-drawn UI sketches are separate work.

## Requirement Matrix

| AC | Current result | Primary evidence |
|---:|---|---|
| 1 | PASS | Official clean-room measurements, Human screenshots, design baseline, and correction records are under `ai/evidence/t6-003/`; official inspection preceded each correction unit. |
| 2 | PASS | Canonical card interaction, authoring shell, work-surface, readonly, lifecycle, and reduced-motion browser matrices pass without document mutation. |
| 3 | PASS | Shared geometry covers 17/36/100/200% and delayed metadata; node geometry `7/7` and three-axis parity `7/7` pass. |
| 4 | PASS | Idle/selected visual contracts and screenshot parity pass with stable media bounds and no selected translation/scale. |
| 5 | PASS | Visible ports retain 20 world px and each direction projects to one fixed logical midpoint. Unit 6Q supersedes Unit 6O's moving-path interpretation: the separate outside output control follows X/Y and clamps radially while two actual SVG starts plus a new draft remain on the fixed source boundary; its `+` and circle centers agree within `1 CSS px`. Unit 6P proves distinct prompt/media SVG endpoints converge on one visible materialized input midpoint. All are zero mutation. |
| 6 | PASS | Edge presentation, identity, target, continuation, insertion, reroute, and pure path regression pass with 2px visible and 20px hit geometry and no persistent arrows. |
| 7 | PASS | Connection-motion tests prove local 3000ms active flow, cleanup, idle exclusion, and reduced-motion static behavior. |
| 8 | PASS | Disclosure, toolbar, composer, Graph Access, resource dismissal, and reference acquisition assert zero PATCH/mutation; committed operations retain command/history authority. |
| 9 | PASS | The selected materialized family is one stable media card. The fixed screen-space composer is approximately `660 x 190px`; toolbar is approximately `900 x 50px`; external header, media, composer, and collision-resolved toolbar do not overlap in normal fit states. Unit 6L records authenticated 82% coordinates. |
| 10 | PASS | The selected card exposes `本地上传` and `项目资产`. Card-source selection reuses project resource ownership and atomic commands; cancel/Escape is zero mutation. Unit 6M proves exact opener focus return. |
| 11 | PASS | Mock image/video work-surface tests project pending/failure/success and materialized media into the source card; canonical result/lineage remain available only through Graph Access and downstream edges project to the visible card. |
| 12 | PASS | Text work-surface tests cover direct writing, text-to-video, text-to-music, and an honest unavailable image-to-prompt choice. |
| 13 | PASS | Compatible Canvas candidates, stable input order, atomic attachment, and return/Escape/outside/readonly/reload/deletion/undo/redo/Canvas-switch/generation/failure/stale lifecycle closure pass. |
| 14 | PASS | Context surfaces are source-attached, collision-aware, keyboard accessible, selection preserving, and focus restoring. Unit 6M closes the final desktop project-resource Escape gap while preserving the compact drawer. |
| 15 | PASS | Specialized Revid recipe/image/video/Skill surfaces remain functional; 375x812 resource and mutation matrices remain review-only. |
| 16 | PASS | Build `4,972`; Unit 6Q focused `1/1`; related `71/71`; edge insertion/reroute `11/11`; protected visual `1/1`; final unexcluded Chromium `599/599` in `11.5m`; headed performance `2/2`; dependency audit `0`; state/diff gates pass. |
| 17 | PASS | Human Owner accepted direct closure on 2026-07-22; Task, PLAN, PROGRESS, REPORT, CURRENT, and ROADMAP agree on `DONE / PASS`. |

## Authenticated Interaction Audit

The current selected image card contains one media surface, one card work surface, and one media toolbar. Its card work surface exposes `文生图`, `图生图`, `图片高清`, `本地上传`, `项目资产`, and `画布参考`. Opening `项目资产` displays the project-resource source selector with enabled image-source actions and honestly disabled incompatible video-source actions. No asset was selected, uploaded, or generated during this audit.

After Unit 6M, Escape from the focused `项目资产` resource tab closes the complementary panel, restores focus to the source card's `项目资产` button, and leaves the card work surface mounted. The deterministic card-source test additionally proves the document PATCH count is unchanged.

## Human Acceptance Set

- Official isolated square card: `C:/Users/mkd/AppData/Local/Temp/codex-clipboard-81d95e1a-9cea-4ebc-af12-a52702265f0c.png`.
- Revid isolated square counterpart: `output/playwright/t6-003-materialized-card/selected-materialized-square-card.png`.
- Revid official-scale `960 x 562` counterpart: `output/playwright/t6-003-materialized-card/selected-materialized-square-card-official-frame.png`.
- Revid detached output sequence: `output/playwright/t6-003-detached-output/01-resting-shared-anchor.png`, `02-following-shared-anchor.png`, and `03-reset-shared-anchor.png`.
- Revid shared input convergence: `output/playwright/t6-003-shared-input/materialized-prompt-media-shared-input.png`.
- Revid compact counterpart: `output/playwright/t6-003-materialized-card/selected-materialized-image-card-920x900.png`.
- Authenticated 82% hierarchy ranges: metadata `94.363..110.363`, media `116.363..281.963`, composer `295.075..485.075`, toolbar `493.087..543.087 CSS px`.

No official imagery, branding, source, private implementation, or proprietary prompt was copied. No paid/real provider call, secret access, destructive action, backend/schema change, or user-data migration occurred.
