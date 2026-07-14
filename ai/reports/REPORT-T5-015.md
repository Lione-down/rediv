# REPORT-T5-015 - Canvas Media-first Fidelity

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `661a6663e09a807b9f9cfda41ccae2d1e389fedc`
- Scope: reference-backed Canvas visual refinement only

## Delivered outcome

Revid Canvas now uses content-shaped presentation rather than one fixed card geometry. Decoded images and videos form the outer node body at their intrinsic aspect ratio, including 16:9, 1:1, and 9:16. Script and generation nodes are materially shorter, media labels remain external, success no longer draws a full green perimeter, persisted edges are quiet solid curves, and idle ports recede until hover or selection.

The selected-node toolbar and composer are smaller and shallower. Their placement uses the same derived visual rectangles as rendering, ports, connections, selection, status overlays, fit bounds, and minimap. Media records that lack dimensions adopt the decoded ratio once and persist it; records with matching dimensions do not create redundant graph writes.

## Reference synthesis

Four public LibTV screenshots established the target hierarchy: media as node body, labels outside media, low-contrast graph relationships, and contextual tools. The Human Owner additionally supplied the MIT-licensed `MaLunan/AIGCCanvasFlow` repository. Its source reinforced progressive disclosure through hover/selected controls and semantic node/body separation. Revid intentionally rejected its permanent left toolbar, fixed header on every node, bright 2px purple edges, and glow-heavy selection treatment. No AIGCCanvasFlow source file or proprietary LibTV asset was copied.

## Verification evidence

- Focused visual/workflow/resource Chromium: PASS, 22/22.
- Decoded metadata adoption plus node workflow: PASS, 13/13.
- Port geometry contract: PASS, 2/2 after replacing obsolete fixed-height expectations with shared visual geometry.
- Full Chromium regression: PASS, 147/147.
- Frontend build: PASS, 4,779 modules transformed.
- Final screenshots: `output/playwright/t5-015-final/` at 1440x900, 1366x768, 920x900, 375x812, passive-edge, and selected-composer states.
- Guarded real-MySQL/browser supervisor: PASS, run `t5008-32068-4cd0cd07305201b3`.
- Retained live summary: `output/playwright/t5-008-live/t5008-32068-4cd0cd07305201b3/summary.json`.
- Live graph: 200 nodes, 300 connections, revision 3, exact retained checksum.
- Live performance: 165 ms stable render, 59.97 FPS, 16.8 ms frame p95, 0.1 ms pointer p95, 0 long tasks across 30 seconds.
- Hygiene: strict UTF-8 PASS, changed source files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Contract and safety notes

- Leafer UI, Vue 3, Pinia, SCSS tokens, graph commands, autosave, MySQL, provider APIs, and mobile review-only behavior remain unchanged.
- No paid provider call, real secret access, migration, destructive data operation, or engine replacement occurred.
- The user-owned untracked retired-Hermes plan remains untouched.
- Public and open-source references remain in ignored or unstaged QA locations and are excluded from the delivery commit.

## Final assessment

The result is materially closer to the requested LibTV media-first feel than T5-014 while remaining recognizably Revid. The dominant visual anchor is now media, not a generic node card. Further work such as drag-edge continuation pickers, inline image tools, frame strips, or node-type switching would be new product capability and should be planned as a separate Task.
