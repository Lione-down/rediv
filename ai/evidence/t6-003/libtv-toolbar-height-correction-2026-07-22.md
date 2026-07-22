# T6-003 Unit 6I selected media toolbar height correction

## Human-visible mismatch

- Reference: the Human-supplied official LibTV selected `三花小猫` image card screenshot.
- Official measured complete toolbar: approximately `901.1 x 49.6 CSS px`.
- Current Revid selected toolbar: approximately `900 x 40 CSS px` at desktop.
- Width and horizontal source attachment are already correct. Height and internal action rhythm are not: the Revid surface reads as a thin stacked icon strip, while the reference uses one substantial contextual bar with icon and label on the same row.

## Bounded correction

- Target toolbar height: `50 CSS px`, tolerated browser measurement `48..52 CSS px`.
- Keep the existing viewport-stable `900 CSS px` target width and current safe-bound clamp.
- Professional actions use one horizontal icon-and-visible-label row. Compact download, detail, and fullscreen utilities remain icon-only.
- At a `920 x 900` viewport, the toolbar must remain within Canvas safe bounds and must not require horizontal scrolling.
- Height, content flow, and hit targets remain screen-space stable at Canvas zoom `17%`, `36%`, `100%`, and `200%`.
- In the standard selected materialized-card state, the toolbar remains above the external media header and its bottom is approximately `26..34 CSS px` above the media body. It flips below only when the top candidate cannot clear actual app chrome.

## Preserved authorities

- No action is added, removed, enabled, or executed differently.
- Disabled-state honesty, aria labels, keyboard focus, hover, source attachment, top/bottom collision flip, readonly hiding, and fullscreen/detail/download authorities remain unchanged.
- Media body, external metadata header, composer, ports, edges, node geometry, graph, history, autosave, provider, backend, and schema authorities remain unchanged.

## Verification plan

1. RED: assert `48..52 CSS px` toolbar height, row action flow, minimum action hit height, standard above-media placement, true top-collision flip, and no horizontal overflow at desktop, compact desktop, all official zooms, and live viewport resize.
2. GREEN: change only `CanvasMediaToolbar.vue` presentation unless RED reveals a geometry-authority defect.
3. Rebuild before browser verification, then recapture selected desktop and compact screenshots and inspect both against the official reference.
4. Run focused toolbar/card/media tests, three-axis visual parity, full functional Chromium, headed performance, dependency audit, state validation, diff, UTF-8, BOM, sensitive-path, and secret-signature checks.
5. Stop for explicit Human visual and interaction acceptance before REPORT, `DONE / PASS`, staging, commit, push, or goal completion.

## Implementation and RED/GREEN evidence

- Height/rhythm RED: current browser geometry measured `40 CSS px`; the professional action computed as blockified `grid`, so icon and label did not form the required one-row action.
- Placement RED: the standard materialized-card state measured a `-238 CSS px` toolbar-to-media gap because collision logic put the toolbar below the media.
- GREEN centralizes `CANVAS_MEDIA_TOOLBAR_HEIGHT_PX = 50` and `CANVAS_MEDIA_TOOLBAR_ABOVE_GAP_PX = 26`. `CanvasStage.vue` uses the same values for inline surface height, top/bottom fit, and transform; selection collision occupancy consumes the same bounds.
- `CanvasMediaToolbar.vue` uses a `50 CSS px` outer surface, `36 CSS px` control slots, and horizontal flex actions with `11px` visible labels. Utility controls remain compact and icon-only.
- Exact browser proof passes at `17%`, `36%`, `100%`, and `200%`, at `1366x768` and `920x900`, through live `1440 -> 920 -> 1440` resize, and in the explicit top-collision fixture. No horizontal scroll or document PATCH occurs.

## Final evidence

- Desktop selected: `output/playwright/t6-003-materialized-card/selected-materialized-image-card.png`, SHA-256 `628898927C5BB8A35E3B4D94386A059AA7525F134A34BFA36E0B9C648FFF46F8`.
- Compact selected: `output/playwright/t6-003-materialized-card/selected-materialized-image-card-920x900.png`, SHA-256 `6F67C00D9063315D4C225324D6A7DCAC5B84CEB4D1332FCF7804618902D515C2`.
- Idle remains unchanged: SHA-256 `75DD98A2F69EB4592A562A61BD14CFF70A2DD341CFD7A43F6845C8CC63323B22`.
- Manual inspection confirms the toolbar is above the media, not between media and composer; action labels share the icon baseline; compact content is unclipped; the external title/resolution header and continuous lower composer remain intact.
- Verification: build `4,972`; exact corrected geometry `4/4`; related toolbar/card/media/video `43/43`; three-axis parity `7/7` with no snapshot update; full Chromium `596/596` in `9.5m`; headed performance `2/2` in `1.1m`; dependency audit `0`; project-state validation and `git diff --check` pass.
- Hygiene: `101` owned paths, `96` UTF-8 text files, strict UTF-8 failures `0`, BOM files `0`, sensitive-path names `0`, high-confidence secret-signature files `0`, and database artifacts `0`. The documented aggregate-SFC exceptions remain `CanvasStage.vue 1005` and `CanvasWorkspace.vue 995` nonblank lines.
