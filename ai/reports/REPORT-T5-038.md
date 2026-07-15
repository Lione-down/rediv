# REPORT-T5-038 - Generation output variant map

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `fe96525c4e4437686a826d065b66b4b9a0c877a3`

## Outcome

Expanded repeated outputs now read as one generation-owned version family without sacrificing individual media geometry. Selecting a canonical generation shows stable `V1..Vn` markers on every active typed result, alongside its existing T/R input provenance.

## Implementation

- Extracted one canonical ordered output resolver and reused it in selected-result lineage.
- Filtered variants by canonical node definitions, active state, exact generation source, and typed `out -> in` ports.
- Projected the same persisted connection order for generation-selected and result-selected views.
- Kept output nodes physically expanded so selection, edges, minimap, placement, reload, and comparison remain honest.

## Verification

- Frontend build: PASS, 4,808 modules transformed.
- Focused generation provenance and result lineage Chromium: PASS, 9/9 after correcting compact drawer test ownership.
- Related provenance, lineage, result placement, and foreground reveal Chromium: PASS, 16/16.
- Final result-lineage suite after no-document/no-camera-mutation assertion hardening: PASS, 6/6.
- Mixed image, video, unavailable, broken, inactive, untyped, repeated, readonly, comparison, and selected-result states: PASS.
- Visual inspection: PASS at 1440x900; compact 375x812 drawer ownership verified.
- Hygiene: PASS, scoped diff, file-size, `git diff --check`, and sensitive-path boundaries.

## Visual evidence

- `output/playwright/t5-038-generation-output-variants/generation-output-map-1440x900.png`
- `output/playwright/t5-038-generation-output-variants/generation-output-map-readonly-375x812.png`
- `output/playwright/t5-038-generation-output-variants/image-lineage-1440x900.png`

## Deferred boundaries

Physical result stacking, graph re-layout, automatic execution, paid provider calls, secrets, backend behavior, and mobile editing remain outside scope.
