# REPORT-T5-045 - Proportional node status badges at overview zoom

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `75213e11dc53b536808c4703bce35ee1e3b54001`

## Delivered

- Removed the forced 88% minimum scale from running, success, and failure status badges.
- Made badge content follow exact Canvas zoom below 100% while retaining the existing 120% high-zoom cap.
- Kept status copy on one line so portrait and compact result nodes do not wrap lifecycle labels.
- Preserved lifecycle copy, icons, colors, node geometry, media controls, lineage, selection, and graph behavior.
- Added direct geometry coverage for seven mixed lifecycle nodes at 10%, 50%, 100%, and 800% zoom.

## Verification

- Pre-fix focused RED: PASS as diagnostic evidence; 10% badge width was about 45px versus a proportional target near 7px.
- Frontend build: PASS, 4,809 modules transformed.
- Focused status zoom Chromium: PASS, 3/3.
- Related multi-scenario, provenance, result reveal, media, composer, and node workflow Chromium: PASS, 38/38.
- Visual inspection: PASS at 1440x900, 920x760, and 375x812.
- `git diff --check`, UTF-8, file size, scoped worktree, and sensitive-path review: PASS.

## Retained evidence

- `output/playwright/t5-045-status-zoom/desktop-full-trace-1440x900.png`
- `output/playwright/t5-045-status-zoom/compact-full-trace-920x760.png`
- `output/playwright/t5-045-status-zoom/readonly-overview-375x812.png`

## Deferred boundaries

- Low-zoom scaling for unavailable and broken media placeholder content is the next bounded visual issue.
- Status behavior redesign, node/result layout changes, backend work, provider calls, and mobile editing remain out of scope.
