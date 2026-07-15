# REPORT-T5-047 - Proportional provenance markers at overview zoom

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `dbf31a7278dc414a5b550d4ae4b9482388c2dae9`

## Delivered

- T/R source pills now scale as complete visual units from their node top-left corners.
- G/V result pills now scale as complete visual units from their node top-right corners.
- Low zoom follows exact Canvas zoom while high zoom is capped at 120%.
- Existing labels, excluded-source styling, selected-variant emphasis, lineage overlays, and graph behavior remain unchanged.

## Verification

- Pre-fix RED: PASS as expected; T1 remained 22px wide at 10% instead of 2.2px.
- Frontend build: PASS, 4,809 modules transformed.
- Focused marker zoom Chromium: PASS, 3/3.
- Related provenance, lineage, media, and multi-scenario Chromium: PASS, 27/27.
- Post-evidence mobile timing check: PASS, 1/1.
- `git diff --check`: PASS.
- Visual inspection: PASS at 1440x900, 920x760, and 375x812.

## Evidence

- `output/playwright/t5-047-provenance-marker-zoom/desktop-full-trace-1440x900.png`
- `output/playwright/t5-047-provenance-marker-zoom/compact-full-trace-920x760.png`
- `output/playwright/t5-047-provenance-marker-zoom/readonly-full-trace-375x812.png`

## Deferred

- Provenance semantics, edge rendering, marker copy, node geometry, backend work, provider calls, and mobile editing remain unchanged.
