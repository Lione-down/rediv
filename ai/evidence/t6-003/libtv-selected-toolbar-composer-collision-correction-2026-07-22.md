# T6-003 Unit 6L - Selected toolbar and composer collision correction

## Evidence boundary

- Human reference: `C:/Users/mkd/AppData/Local/Temp/codex-clipboard-81d95e1a-9cea-4ebc-af12-a52702265f0c.png`.
- Official reference behavior: the selected square `三花小猫` media card keeps the approximately `900 x 50 CSS px` professional toolbar above the external media header and keeps the approximately `660 x 190 CSS px` creator surface below the media.
- Revid runtime: authenticated local Canvas at `http://127.0.0.1:5173/app/projects/6368b636-2bc7-4941-9040-0c088f7d024a/canvases/c9daa6a3-6043-41f3-a3f8-47d115373014`, inspected read-only at approximately `82%` zoom on 2026-07-22.
- No upload, generation, graph edit, paid call, credential inspection, or external-account mutation occurred.

## Contradicting current evidence

The current selected materialized image measured:

- media: `x=585.438`, `y=117.162`, `w=293.587`, `h=164.700 CSS px`;
- composer: `x=402.238`, `y=295.075`, `w=660`, `h=190 CSS px`;
- media toolbar: `x=282.238`, `y=289.962`, `w=900`, `h=50 CSS px`.

The toolbar therefore overlaps the composer by approximately `44.9 CSS px`. The prior top-collision fallback only tested whether the toolbar fit below the media. It did not reserve the selected card's lower composer, so its machine-green fallback was visually invalid.

## Bounded correction contract

1. Preserve the normal approximately `26 CSS px` toolbar-to-media gap whenever the full above candidate fits inside the Canvas safe bounds.
2. When app chrome prevents that full gap, clamp the toolbar to the top safe boundary only if its bottom can remain at least `24 CSS px` above the media body. That band retains the approximately `22px` external title/metadata header plus at least `2px` separation, matching the Human reference instead of covering the header.
3. Only when even the clamped above candidate cannot clear the media may the toolbar move below. For a selected card with a lower composer, that fallback starts after the composer bottom plus `8 CSS px`; it must never occupy the media-to-composer interval or overlap either surface.
4. If an oversized zoomed media/composer stack itself spans the complete safe vertical field, collision-free placement is geometrically impossible. In that bounded case only, keep the toolbar available at the Canvas safe-bottom edge instead of hiding it. Normal card sizes remain pairwise non-overlapping.
5. Preserve the fixed `900 x 50 CSS px` toolbar, fixed `660 x approximately 190 CSS px` composer, media bounds, horizontal centering/clamping, ports, edges, typed graph/history authority, readonly/context hiding, focus/accessibility, and zero document mutation.
6. Add browser REDs for both a narrow top-clearance clamp and a genuine no-fit fallback before production edits. GREEN must prove toolbar/header/media/composer pairwise non-overlap whenever the safe field permits it, bounded safe-bottom availability for oversized zoom, unchanged media/composer geometry, and zero PATCHes.

## Stop condition

After focused GREEN, rebuild and verify the authenticated local card at approximately `82%`, then rerun the related selected-card geometry matrix. Human acceptance remains required before REPORT, `DONE / PASS`, staging, commit, push, or goal completion.

## RED and GREEN result

- RED narrow-clearance candidate: the old toolbar bottom was `358 CSS px` where the media header contract required at most `131 CSS px` before the final external-header assertion was tightened.
- RED genuine no-fit candidate: the old toolbar began at `188px` while the composer ended at `386px`; required fallback start was at least `394px`.
- GREEN centralizes vertical placement beside the existing horizontal resolver. It preserves the normal `26px` above offset, permits only a header-safe narrow clamp, places a genuine no-fit toolbar after the composer plus `8px`, and keeps an oversized `200%` portrait toolbar available at the safe-bottom edge.
- Focused collision `2/2`, complete node geometry `7/7`, related selected-card/media/video matrix `45/45`, and three-axis parity `7/7` pass without snapshot updates.
- Production build transforms `4,972` modules. Full functional Chromium passes `598/598` in `9.5m`; headed 200-node/300-connection performance passes `2/2` in `1.1m`.

## Authenticated local result

At the preserved approximately `82%` Canvas zoom after the final production build:

- external metadata: `y=94.363..110.363`, `h=16 CSS px`;
- media: `y=116.363..281.963`, `295.2 x 165.6 CSS px`;
- composer: `y=295.075..485.075`, `660 x 190 CSS px`;
- toolbar fallback: `y=493.087..543.087`, `900 x 50 CSS px`.

The header-to-media, media-to-composer, and composer-to-toolbar separations are approximately `6`, `13.1`, and `8 CSS px`. No upload, generation, graph edit, provider call, paid action, credential access, or document mutation occurred.

## Final mechanical gates

- `npm audit --audit-level=moderate`: zero vulnerabilities.
- `python scripts/validate-project-state.py`: passed.
- `git diff --check`: passed with line-ending warnings only.
- T6-003 owned-path scan: `106` paths; strict UTF-8 failures `0`; BOM files `0`; sensitive paths `0`; high-confidence secret-signature files `0`; database artifacts `0`.
- Unit 6L production/test sizes: `canvas-media-toolbar-geometry.ts` `78`, `CanvasStage.vue` `1008`, and `canvas-libtv-node-geometry.spec.ts` `330` nonblank lines. `CanvasStage.vue` remains the documented aggregate-SFC exception.
- `HEAD` remains `b4e7e4fad26f346648946bc0cad8919a1d8944e2`; `HEAD...origin/main = 0/0`; no staging, commit, or push occurred.
