# REPORT-T5-040 - Explicit full generation trace fit

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `d53fca91d715049d9eac7d2caf5bad4236573fa5`

## Delivered

- Added one quiet, accessible `适配完整生成链路` action to selected-generation context headers.
- Extended the shared fit geometry with optional viewport insets and exposed fitting an explicit canonical node set.
- Fit resolves the same authoritative T/R provenance and canonical V family already used by graph explanation.
- Desktop keeps the inspector open; compact and readonly drawers close first, retain selection, then fit after their leave transition.
- The action changes only camera state: one viewport PATCH per effective action, zero document PATCHes, and no graph-history entry.

## Verification

- Frontend build: PASS, 4,809 modules transformed.
- Geometry, provenance, compact/readonly, and foreground reveal Chromium: PASS, 15/15.
- Focused final trace-fit Chromium: PASS, 3/3.
- Visual inspection: PASS at 1440x900 (51%), 920x760 (44%), and readonly 375x812 overview (14%).
- `git diff --check`, scoped diff, worktree ownership, and sensitive-path review: PASS.

## Retained evidence

- `output/playwright/t5-040-full-trace-fit/desktop-full-trace-1440x900.png`
- `output/playwright/t5-040-full-trace-fit/compact-full-trace-920x760.png`
- `output/playwright/t5-040-full-trace-fit/readonly-full-trace-375x812.png`

## Deferred boundaries

- The 375px result is intentionally an overview; readable node content remains a desktop/compact-width concern.
- Automatic fit on selection, graph layout mutation, mobile editing, backend changes, and provider execution remain out of scope.
