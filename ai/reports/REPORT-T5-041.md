# REPORT-T5-041 - Result-origin full lineage fit

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `4f5fcb52fa24a2bd013cb12b9a0bf8491100a35a`

## Delivered

- Extended the existing `适配完整生成链路` action from selected generations to every canonical selected result.
- Result-origin fit derives the canonical generation owner, then fits authoritative T/R sources, generation, and the complete V family without changing selection.
- Preserved one stronger exact-result edge, selected V marker, result inspector, graph history, compact drawer handoff, and readonly review behavior.
- Added collision-aware toolbar docking across four node-adjacent positions plus top/bottom fallback rails; dense result families no longer lose a sibling beneath the retained selection toolbar.
- Protected selected-generation composer space while retaining deterministic screen-space toolbar behavior.

## Verification

- Frontend build: PASS, 4,809 modules transformed.
- Provenance generation/result/invalid lineage Chromium: PASS, 10/10.
- Command, keyboard, multi-selection generation, dense visual, and provenance regression: PASS, 37/37.
- Final result-origin desktop/compact/readonly Chromium: PASS, 3/3.
- Each result fit produced one viewport PATCH and zero document PATCHes; readonly stayed action-safe.
- Visual inspection: PASS for broken V6 at 1440x900, video V4 at 920x760, and readonly image V1 at 375x812.

## Retained evidence

- `output/playwright/t5-041-result-origin-trace-fit/result-origin-desktop-broken-1440x900.png`
- `output/playwright/t5-041-result-origin-trace-fit/result-origin-compact-video-920x760.png`
- `output/playwright/t5-041-result-origin-trace-fit/result-origin-readonly-image-375x812.png`

## Deferred boundaries

- Automatic camera movement, graph layout mutation, mobile editing, backend changes, and provider execution remain out of scope.
- Toolbar docking minimizes node obstruction; edge crossings alone do not force detachment when a node-adjacent zero-overlap position exists.
