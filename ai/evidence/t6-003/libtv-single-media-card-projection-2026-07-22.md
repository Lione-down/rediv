# T6-003 LibTV Single Media Card Projection Evidence

- Date: `2026-07-22` (`Asia/Shanghai`).
- Reference: Human-supplied authenticated LibTV Canvas card named `三花小猫`.
- URL observed read-only: `https://www.liblib.tv/canvas?spaceId=3263052&projectId=e902db4bd4f7408c8556f48a2e34d1f5`.
- Actions: inspect idle state, click the visible image once, inspect selected state, press Escape, and remeasure idle state.
- No generation, upload, attachment, graph edit, project edit, provider call, quota action, or paid action was performed.

## Human evidence hashes

- Revid idle split-card defect: `88FE31494D4D70046CC394AFD7FF388347972FC22AEAC1AF0046AEC038518609`.
- Revid selected stacked-card defect: `4A3A387615418411F63F15DE14D44BAD324042D58A9378C37FCEF8C10A0A612C`.
- LibTV idle `三花小猫`: `12E6DE837580C0EC89D2045E4D6567DBE0E8607F7181E281C811FD5D6F9B0C02`.
- LibTV selected `三花小猫`: `B1F47A194FD5FEFED18AF39628D0E3EC90EBDCE0641B6645E8A49DFB5BE80F75`.

## Observed contract

1. Idle presentation exposes one image card only. There is no visible generation-task card, detached result card, or empty lineage shell.
2. The image, external node label, `1024 × 1024` metadata, and midpoint input/output controls form the stable card body.
3. Selecting the image preserves its exact visible bounds. Browser measurements before and after selection are identical: `x 800.2680`, `y 130.7680`, `width 319.4639`, `height 319.4640`; every measured delta is `0`.
4. Selection adds a source-attached top media toolbar and a separate composer below the image. It does not insert an authoring task shell above the image.
5. The selected composer text area measures `634 × 80 CSS px`; the image measures `319.4639 CSS px` wide. The inner composer/image width ratio is approximately `1.9846`, so the earlier same-width composer conclusion is superseded.
6. The selected `参考` control is inside the lower composer surface. Its measured button bounds are `54 × 26 CSS px` at `x 643`, `y 478.8380`.
7. The top `人像质感调节` control measures `178 × 32 CSS px` at `x 518.25`, `y 56.8125`; the toolbar spans materially wider than the image body.
8. Escape returns to the exact idle image bounds and removes both contextual surfaces.

## Exact full-toolbar remeasurement

- A stricter post-handoff read-only pass reopened the same authenticated `三花小猫` project and measured the complete selected surfaces rather than one representative toolbar button.
- Media image: `x 800.084`, `y 130.584`, `319.831 × 319.831 CSS px`.
- Lower composer: `x 630.8`, `y 466.638`, `658.4 × 190 CSS px`, width ratio `2.0586 ×`.
- Complete top toolbar: `x 509.45`, `y 48.213`, `901.1 × 49.6 CSS px`, width ratio `2.8174 ×`.
- This proves the lower composer and top toolbar have different width authorities. Revid's existing `2 ×` composer remains aligned; reusing the same `2 ×` width for the top toolbar is a remaining visible mismatch and is assigned to Unit 6F.
- The pass performed no generation, upload, attachment, graph edit, project edit, provider call, quota action, paid action, or credential inspection.

## Revid defect and root cause

- `use-canvas-stage-card-interactions.ts` hides a projected canonical result only while one generation source is selected, so idle Canvas exposes both generation and result nodes.
- `CanvasNodeSurfaceLayer.vue` resolves projected media only while the source is selected, while Leafer continues rendering the source as an authoring generation card.
- `CanvasCardWorkSurface.vue` uses `width: 100%` of the source card, forcing a narrow vertical stack instead of a separately bounded wide composer.
- professional media actions accept only canonical asset/result selections, so a generation source with a projected materialized result receives the generic selection toolbar rather than the media toolbar.

## Corrected Revid boundary

- Keep the canonical generation source, materialized result, task, asset, connection, history, and Graph Access records.
- In the primary creator-facing Canvas, collapse a materialized image/video generation family into one stable media-card projection in idle and selected states.
- Hide the canonical result and its internal source-to-result edge unless the user explicitly selects that record through Graph Access.
- Project downstream result edges back to the visible source card without changing persisted connection identity.
- Preserve the media card bounds across selection; attach a wide collision-aware composer below and the existing Revid media toolbar above.

## Unit 6E historical Revid evidence, superseded by Unit 6F toolbar correction

- Idle capture: `output/playwright/t6-003-materialized-card/idle-materialized-image-card.png`, SHA-256 `000785A4FF2E6223CA757E12D9A8EC9F31D529F521246D8C9623CCA0A9EDB903`.
- Historical selected capture: `output/playwright/t6-003-materialized-card/selected-materialized-image-card.png`, SHA-256 `A7650677C86E5A6C79CC22DC313428261B1E2E45F504E35B8C1EAC4AFA6BBA96`; this file path was recaptured and the hash below is authoritative.
- The selected capture retains the same renderer/media rectangle as idle, adds an approximately `2 ×` wide top toolbar and lower composer, and contains neither an automatic detail drawer nor a detached/empty canonical result shell.
- Final manual review found and removed a separate right-side `V1` lineage outline that initially escaped the canonical-renderer assertion. The browser contract now explicitly requires zero `.result-lineage-node` overlays for the hidden materialized result; Graph Access still restores an explicitly requested canonical result.
- Direct card selection keeps details closed; the media toolbar's `打开节点详情` action explicitly opens the existing Revid detail surface and closing it preserves selection.
- Primary renderer, DOM media surface, hit testing, status layers, connections, and minimap consume one projected node family. Graph Access selection disables the projection for the requested canonical result so lineage and the internal edge remain inspectable.
- Production build PASS: `4,971` modules transformed.
- Focused browser PASS: materialized direct-click/zero-lineage-shell `1/1`; final card/Graph Access/provenance/lineage regression `45/45`.
- Final functional Chromium PASS: `594/594` in `10.0m` using `playwright.ci.config.ts`.
- Final headed 200-node/300-connection performance PASS: `2/2` in `1.1m`; dependency audit reports zero vulnerabilities after the isolated transitive `immutable 5.1.6 -> 5.1.9` lockfile update.
- No generation, upload, paid/provider call, real-secret access, backend/schema mutation, or destructive action was performed for this evidence.

## Unit 6F corrected Revid evidence

- Units 6H through 6K supersede the Unit 6F/6G captures by moving resolution into the external media header, correcting toolbar height/action rhythm/placement, and making the lower composer a fixed `660 CSS px` screen-space surface. Historical hashes remain recorded in PROGRESS. Current local hashes are desktop selected `92B4BC3DF7330F536826A67D3C97FAA8685E70A3E0EFCEA83F7C6BD922ED092A`, compact `4BF4819B1E683F63BA5E4EF7492FACDAA34C10DAC18F8A4C438228EDD1B6B4AF`, idle `DE6433F6489DA6E999669480640D8405B18FEF2374B46926B6CE631DD6ED8D81`, and square selected `C9890ECD3EF1BF076A2271E067B198CEB3AD9FC3A9134F081292FB4E34208FB3`. These hashes are informational because browser antialiasing may vary across processes; browser geometry and DOM assertions are authoritative.
- Revid now uses a viewport-stable `900 CSS px` toolbar width and a separately governed fixed `660 CSS px` composer. At the measured 100% `320px` card these ratios are `2.8125 x` and `2.0625 x`; at other zooms both contextual surfaces remain screen-space stable while the media scales.
- Ten professional actions render concise labels so the wider toolbar preserves official-like contextual density. Download, details, and fullscreen remain compact utility icons; availability, disabled states, accessible names, focus, and action ownership are unchanged.
- Browser proof covers 17/36/50/82/100/200% composer geometry, `1366x768`, constrained `920x900`, isolated `1024 x 1024` square media, live viewport resize, `50 CSS px` toolbar height, one-row action rhythm, standard above-media placement, true top collision flip, readonly hiding, continuous fixed `660 CSS px` composer hierarchy, external media metadata, selected-video rail separation, and zero document PATCHes. Related regression is `44/44`; three-axis parity is `7/7`; final full Chromium is `597/597`; headed performance is `2/2`.
