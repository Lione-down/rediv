# REPORT-T5-058 - Multi-origin reorder identity lifecycle

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-057 (`DONE - PASS`)

## Delivered

- The real two-origin merge browser fixture now covers downstream reference reorder as a complete identity lifecycle rather than an initial-state snapshot.
- Reorder changes only downstream request roles: G2 V1 moves from R2 to R1 while G1 V2 moves from R1 to R2.
- One undo and one redo restore the exact corresponding R order while each canonical V and origin-generation target stays attached to its result.
- Reload preserves persisted row order, Canvas pills, source copy, and both independent origin targets.
- The reordered mock provider request sends exact `asset-second-origin`, `asset-generated` image order.
- Dedicated 920px editable and 375px readonly two-origin scenarios prove bounded density, available origin navigation, hidden mutation controls, and zero readonly PATCHes.
- No business-code correction was required; the existing command, context resolver, lineage resolver, and projection already satisfy the stronger contract.

## Verification

- Production build: PASS, 4,815 modules transformed.
- Focused lineage and result-branch suite: PASS, 10/10.
- Related edge identity, input order, provenance, navigation, remix, and result-lineage matrix: PASS, 50/50.
- Desktop reorder, undo, redo, reload, provider payload, and navigation: PASS.
- Visual evidence inspected:
  - `output/playwright/t5-057-multi-origin-navigation/two-origin-reordered-1440x900.png`
  - `output/playwright/t5-057-multi-origin-navigation/two-origin-reordered-compact-920x900.png`
  - `output/playwright/t5-057-multi-origin-navigation/two-origin-readonly-375x812.png`
- Diff, whitespace, sensitive-path, and staging-scope checks: PASS.

## Product result

Multi-generation composition now has regression evidence that request order is editable without corrupting source history. The current R role can move while the upstream V and origin remain canonical, including after history operations and reload.
