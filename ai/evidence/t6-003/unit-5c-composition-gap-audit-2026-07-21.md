# T6-003 Unit 5C Composition Gap Audit - 2026-07-21

- Trigger: the Human rejected treating the earlier runtime as visually complete, and the final Unit 5B side-by-side still shows material whole-frame differences from the accepted direction.
- Baseline runtime: `output/playwright/t6-003-visual-convergence/desktop-1440x900.png`, SHA-256 `2DD0C672A30225BAEE11ED87D905CA6C5E18DF2F3DF2689BBC01DD14B08062ED`.
- Accepted direction: `output/t6-003/design-preview/revid-canvas-card-interaction-static-v1-1440x900.png`, SHA-256 `D2881B12B17B5653AFDCE5EA6D09A257F00C44EFE9B1EB94CACD343A81BC9A1F`.
- Boundary: this unit changes real Canvas presentation plus its deterministic representative scene. It does not fabricate provider results, copy reference assets, alter serialized graph dimensions, or replace the official clean-room behavior authority.

## Remaining visible gaps

1. Short script/note and generation cards collapse to a shallow fitted band. Their internal type-title-body hierarchy exists, but fitted height is materially weaker than the accepted card rhythm.
2. The representative graph meets the old minimum `48%` vertical occupancy only narrowly and leaves the main workflow reading as a horizontal strip rather than a balanced Canvas composition.
3. The grid preference is enabled, but the `0.14` dot alpha is effectively absent in the captured dark frame, removing the accepted infinite-Canvas texture.
4. The source-attached media toolbar is geometrically correct but its translucent surface and border read too weakly against the Canvas at overview zoom.

## Unit 5C RED requirements

- At fitted `1440x900`, every short canonical authoring card is at least `85%` of the representative media-card screen height, with type, title, and body still internal and legible.
- The declared graph bounds occupy at least `58%` of the stage height while remaining fully bounded and retaining at least `72%` width occupancy.
- An enabled grid exposes a deterministic dot token with alpha of at least `0.20`, follows viewport zoom/pan, and disappears only through the existing grid preference.
- The selected media toolbar retains exact source attachment and uses an opaque-enough Canvas surface plus strong semantic border; no control, focus path, or Revid-only action is removed.
- All disclosure remains zero-mutation, `375x812` remains review-only, and current port/edge endpoints continue to derive from shared visible geometry.

## Release rule

Unit 5C is complete only after RED/GREEN evidence, a fresh production build, four-view capture/manual comparison, relevant regression, full functional Chromium, unchanged headed performance, and hygiene gates pass. Human acceptance and Git delivery remain Unit 5D.

## Outcome

- `PASS`: authoring/generation visible height tiers are `160/190/220` and `160` world px without serialized dimension changes; the declared runtime scene passes the `0.85` authoring/media ratio and `58% / 72%` vertical/horizontal occupancy gates.
- `PASS`: grid dot alpha is `0.22`; the Leafer root is transparent, and browser inspection proves an empty grid point has no opaque Leafer descendant covering it.
- `PASS`: the selected media toolbar uses the opaque Canvas surface and strong semantic border while all existing actions and focus paths remain available.
- `PASS`: a wide connection SVG hit path can no longer steal a current overlapping port; continuation is `16/16`, edge identity is `5/5`, and edge insertion is `6/6`.
- `PASS`: fresh build transformed `4,958` modules; related regression is `54/54`; full functional Chromium is `570/570`; unchanged headed performance is `2/2`; dependency/state/diff/UTF-8/BOM/sensitive-path/secret/database-artifact gates pass.
- `PASS`: all four viewports were recaptured and manually inspected. Human runtime acceptance remains the separate Unit 5D gate.
