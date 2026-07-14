# REPORT-T5-012 - Canvas workspace rendering recovery

- Status: `DONE - PASS`
- Date: 2026-07-15

## Root cause

`frontend/src/assets/styles/v2-canvas-naive-theme.ts` passed CSS variable references such as `var(--v2-accent)` to Naive UI. The Canvas `NDropdown` render path calls Naive UI's `seemly/rgba` parser, which rejects CSS variables and aborted the Vue render tree. The Canvas APIs still returned 200 and the affected document was a valid empty Canvas.

## Fix

- Added a concrete parser-facing color palette in `v2-canvas-naive-theme.ts`.
- Replaced Naive UI color, border, and shadow overrides with hex/rgba values.
- Retained the shared V2 CSS token source for the Canvas DOM styles and non-color theme dimensions.
- Added `frontend/tests/e2e/canvas-theme-compatibility.spec.ts` to prevent CSS variable values from re-entering Naive UI color/border overrides.

## Verification

- Real browser reproduction before fix: canonical Canvas route had an empty snapshot and `[seemly/rgba]: Invalid color value var(--v2-accent)`.
- Real browser after fix: Canvas shell, `画布 1` switcher, empty-canvas guide, controls, and minimap rendered; Console error level returned 0 messages.
- Focused theme regression: `1 passed`.
- Canvas shell/navigation regression: `8 passed`.
- Frontend build: `4,767 modules transformed`, pass.
- `git diff --check`: pass.

## Scope and residual risk

Only the Canvas Naive UI theme and its focused regression guard changed. The current local `test2 / 画布 1` document has zero nodes, so the UI correctly presents the empty-canvas starting guide; this is data state, not a missing Canvas record.
