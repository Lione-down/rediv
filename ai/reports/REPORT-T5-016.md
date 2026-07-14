# REPORT-T5-016 - Multi-scenario Canvas Validation

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `abae43913fefc507ac9ae7b60547abbfeda5d484`
- Scope: deterministic Canvas workflow validation and evidence-backed visual fixes

## Delivered outcome

Revid Canvas now has a reusable 11-node browser scenario that proves mixed image/video work rather than one idealized graph. Two text prompts and two media references converge into one generation node, which branches into landscape, square, portrait, video, placeholder, and unavailable results through ten typed connections.

The evidence pass fixed three root defects. Graph Access now closes before a located node opens compact context UI, so dialogs and drawers do not compete for overlay ownership. Long text nodes grow within the compact 120 to 150 pixel contract and clip body overflow deliberately; Canvas-only titles stay bounded while full titles remain available in details and Graph Access. Running and warning states use restrained one-pixel inset outlines instead of large glow fields.

## Scenario evidence

- Recognizable local SVG fixtures prove 16:9, 1:1, and 9:16 geometry without stretching.
- A local H.264 fixture exposes native controls, decodes metadata, and plays in Chromium.
- Running, success, failed, unavailable, loading, selected, editing, locked, and review-only states render together.
- Long Chinese, long English, empty content, four-way convergence, six-way branching, and non-overlap geometry have direct assertions.
- Retained screenshots are under `output/playwright/t5-016-scenarios/` for 1440x900, 1366x768, 920x900, and 375x812 overview/detail states.

## Verification evidence

- Focused Canvas regression: PASS, 26/26.
- Full Chromium regression: PASS, 150/150.
- Frontend build: PASS, 4,779 modules transformed.
- Mock-browser 200/300 profile: 296 ms stable render, 60.01 FPS, 16.7 ms frame p95, 1.6 ms pointer p95, 0 long tasks.
- Guarded real-MySQL/browser supervisor: PASS, run `t5008-31316-e8d048a9e890bdce`.
- Retained live summary: `output/playwright/t5-008-live/t5008-31316-e8d048a9e890bdce/summary.json`.
- Live graph: 200 nodes, 300 connections, revision 3, exact retained checksum.
- Live performance: 170 ms stable render, 59.95 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 0 long tasks across 30 seconds.
- Hygiene: strict UTF-8 PASS, changed source files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Contract and safety notes

- Vue 3, Leafer UI, Pinia, typed registry ports, autosave, MySQL, provider APIs, and the mobile review-only boundary remain intact.
- No paid provider call, real secret access, migration, destructive data operation, external asset copy, or Canvas engine replacement occurred.
- The user-owned untracked retired-Hermes plan and ignored QA/reference output remain unstaged.
- AIGCCanvasFlow informed general hierarchy patterns only; no source file was copied.

## Final assessment

The Canvas is now validated as a workflow surface, not only as a collection of polished cards. Media ratios, convergence, branching, failure, unavailable content, video playback, localization extremes, compact editing, and dense performance all have repeatable evidence. Future work can focus on genuinely new capabilities such as drag-edge continuation, inline media tools, or sequence editing rather than reopening these visual fundamentals.
