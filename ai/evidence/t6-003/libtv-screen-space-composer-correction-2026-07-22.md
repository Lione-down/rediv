# T6-003 Unit 6K screen-space composer correction

## Official read-only observation

- Source: the exact Human-supplied authenticated LibTV Canvas URL, opened read-only on 2026-07-22.
- The selected `图片节点 10` composer wrapper declares `w-full min-w-[660px] max-w-[660px]` and applies an inverse Canvas-scale transform. No private source, network payload, upload, generation, or graph mutation was inspected or performed.
- At 50% Canvas zoom, the node measures `311 x 175 CSS px`; the composer remains `660 x 191.6 CSS px`, its inverse transform is `matrix(2, 0, 0, 2, 0, 0)`, and the node-to-composer gap is `8 CSS px` (`16 world px`).
- At approximately 82% fit zoom, the node measures `510.412 x 287.209 CSS px`; the composer remains `660 x 191.6 CSS px`, its inverse scale is `1.21862`, and the gap is approximately `13.13 CSS px` (`16 world px`).
- At 100% Canvas zoom, the node measures `622 x 350 CSS px`; the composer remains `660 x 191.6 CSS px`, its transform is identity, and the gap is `16 CSS px`.

## Contradicted Revid assumption

- Unit 6J correctly matched the 100% `320px` card screenshot by changing `200%` to `206%`, but that percentage remains tied to current media screen width.
- The official behavior is not a universal `2.0586 x` screen ratio. `2.0586 x` is only the observed 100% relationship for the Human's approximately `320px` card.
- Revid must therefore use a fixed `660 CSS px` creator surface in screen space while the media continues to scale with Canvas zoom.

## Unit 6K contract

- Add a browser RED at 17%, 36%, 50%, 82%, 100%, and 200% Canvas zoom.
- Require composer width `658..662 CSS px` and visible height at least `188 CSS px` at every zoom.
- Require composer and media horizontal centers within `2 CSS px` at every zoom.
- Require the below-card gap to equal `16 world px`, within `2 CSS px` after scaling.
- Keep the selected media bounds unchanged, toolbar screen-space behavior unchanged, zero document PATCHes, and the 375px review-only boundary unchanged.
- Preserve Revid graphite/violet styling, modes, sources, prompt, model/parameter footer, submit authority, lifecycle feedback, accessibility, graph/history/persistence, and provider ownership.
- Stop for renewed Human visual/interaction acceptance before REPORT, staging, commit, push, or goal completion.

## Result

- RED: the 17% Revid composer measured `112.03125 CSS px`, proving the media-relative `206%` rule violated the official screen-space contract.
- GREEN: `CanvasCardWorkSurface.vue` now uses fixed `660px` min/max width; the shared surface geometry publishes a `16 * viewport.zoom` CSS gap. The media continues to use the existing current visible geometry.
- Browser contract: 17%, 36%, 50%, 82%, 100%, and 200% all pass `658..662 CSS px` width, at least `188 CSS px` height, center alignment within `2 CSS px`, scaled `16 world px` gap, and zero document PATCHes.
- Authenticated local Revid: approximately 82% measures media `293.863px`, composer `660 x 190px`, gap `13.05px`; 50% measures media `180px`, composer `660 x 190px`, gap `8px`. The view was restored to 82%.
- Verification: build `4,972`; related `44/44`; three-axis `7/7`; full functional Chromium `597/597` in `9.5m`; headed performance `2/2` in `1.1m`.
