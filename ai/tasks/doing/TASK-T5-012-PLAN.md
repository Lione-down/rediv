# TASK-T5-012 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Unit A - diagnosis

- Reproduce the canonical Canvas route in a real browser.
- Capture the runtime Console and request evidence.

## Unit B - minimal fix

- Replace parser-incompatible color references in the Canvas Naive UI theme with stable color literals while retaining the V2 CSS token source for regular styles.
- Add a focused source-level regression guard for the theme contract.

## Unit C - verification and closure

- Run focused regression, frontend build, and real-browser Canvas route verification.
- Review the diff and reconcile task progress/report/current state.
