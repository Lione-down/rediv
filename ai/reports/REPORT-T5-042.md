# REPORT-T5-042 - Inspector lineage source navigation

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `dbf669d63f09b13c9f37ba98d2cd35875b0c58b0`

## Delivered

- Turned every authoritative generation T/R source row into an accessible `定位到画布：<title>` action without nesting or displacing independent reorder controls.
- Turned canonical result lineage's origin generation into the same direct locate action.
- Desktop navigation selects and minimally reveals the exact node while keeping the inspector synchronized.
- Compact and readonly navigation close the current drawer, suppress only the navigation-caused automatic reopen, then select and panel-safely reveal the target.
- Ordinary compact node selection still opens context normally; included and excluded inputs remain equally locatable.
- Navigation changes selection/camera only: at most one viewport PATCH, zero document PATCHes, and no graph-history entry.

## Verification

- Frontend build: PASS, 4,809 modules transformed.
- Focused lineage navigation Chromium: PASS, 5/5.
- Generation provenance, context order, result lineage/compare, responsive, and navigation Chromium: PASS, 21/21.
- Keyboard activation: PASS through focus plus Enter on a T source.
- Visual inspection: PASS for desktop source actions at 1440x900, located reference at 920x760, and readonly located generation at 375x812.
- `git diff --check`, scoped diff, worktree ownership, and sensitive-path review: PASS.

## Retained evidence

- `output/playwright/t5-042-lineage-navigation/desktop-generation-source-actions-1440x900.png`
- `output/playwright/t5-042-lineage-navigation/compact-located-reference-920x760.png`
- `output/playwright/t5-042-lineage-navigation/readonly-located-generation-375x812.png`

## Deferred boundaries

- Navigation follows only lineage already displayed by canonical resolvers; recursive ancestry browsing, breadcrumbs, graph mutation, automatic navigation, and mobile editing remain out of scope.
