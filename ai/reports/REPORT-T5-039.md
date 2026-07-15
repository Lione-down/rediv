# REPORT-T5-039 - End-to-end generation provenance trace

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `fa6f834818355cb63c94b57db104a03a771edfd9`

## Outcome

Selecting a canonical generation now explains the complete graph flow: authoritative T/R inputs converge on the task and every canonical V output continues from it with a restrained result-edge trace.

## Implementation

- Added one result-variant provenance projection shared by selected generation and selected result lineage.
- Combined canonical outputs with the existing generation-context input provenance only at the selection adapter.
- Reused existing input, excluded-input, result, and selected-result edge classes with no new color or motion system.
- Corrected result-edge accessible text from input-participation language to generated-output language.

## Verification

- Frontend build: PASS, 4,808 modules transformed.
- Provenance, lineage, edge insertion, and edge reroute Chromium: PASS, 20/20.
- Final provenance suite after pre-execution screenshot hardening: PASS, 3/3.
- Six existing variants plus one new foreground output, mixed media, excluded inputs, selected result, readonly, comparison, and ordinary edge labels: PASS.
- Visual inspection: PASS at 1440x900; inputs remain the stronger intent trace and outputs use lower result contrast.
- Hygiene: PASS, scoped diff, file-size, `git diff --check`, and sensitive-path boundaries.

## Visual evidence

- `output/playwright/t5-039-end-to-end-provenance/full-input-output-trace-1440x900.png`
- `output/playwright/t5-039-end-to-end-provenance/ordered-four-inputs-1440x900.png`
- `output/playwright/t5-039-end-to-end-provenance/readonly-provenance-375x812.png`

## Deferred boundaries

New edge styling, animation, physical result stacking, automatic execution, paid provider calls, secrets, backend behavior, and mobile editing remain outside scope.
