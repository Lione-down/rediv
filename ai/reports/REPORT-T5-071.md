# REPORT-T5-071 - Reference-first visual fidelity v2 and recipe-flow isolation

## Outcome

T5-071 is `DONE - PASS` for the offline implementation and browser acceptance boundary. The Human Owner explicitly accepted offline-only closure on 2026-07-16 so enterprise certification can continue.

Real Agnes visual fidelity is not passed. Twenty authorized requests returned HTTP 503 and created zero images. This is a named provider caveat, not evidence of medium, identity, wardrobe, geometry, or cross-panel fidelity.

## Delivered

- Added exact backend resolution for `(generation_recipe_id, generation_recipe_version)`.
- Preserved exact v1 recipe behavior and pinned missing legacy versions to v1, never latest.
- Added fidelity-first v2 character and scene prompts with explicit photography, illustration, 3D, identity, wardrobe, palette, geometry, atmosphere, and lighting constraints.
- Made new frontend recipe branches persist and submit v2 while historical v1 reload and retry remain deterministic.
- Kept internal prompts backend-only and exactly one reference at the Agnes `extra_body.image` boundary.
- Reworked contextual toolbar scoring so unrelated node content is hard occupied space and selected-node auxiliary surfaces are secondary constraints.
- Proved the dense upper-result, selected-recipe-generation, lower-result stack has zero toolbar intersection and zero document or viewport persistence mutation.
- Updated and validated `revid-visual-assets` with an honest manual fidelity checklist.

## Verification

- Backend focused recipe gate: PASS, 9 tests plus 6 subtests.
- Backend required generation and transaction regression: PASS, 37 tests plus 9 subtests.
- Frontend recipe and service focused gate: PASS, 16/16.
- Frontend recipe, context, and result-branch regression: PASS, 29/29.
- T5-063 toolbar, compact drawer, readonly, keyboard, and interaction regression: PASS, 27/27.
- Completion-audit browser gate: PASS, 25/25.
- Frontend production build: PASS, 4,820 modules transformed.
- Project-local skill validation: PASS.
- Desktop 1440x900 toolbar isolation: zero intersection with both result cards, zero document PATCH, zero viewport PATCH.
- Compact 920x900: stable 360px drawer ownership, zero selection toolbar, two visible result surfaces, zero document PATCH, zero viewport PATCH.

## Real-provider evidence classification

- Authorized Agnes requests: 20 total across three recipe classes, same-day backoff, cross-day probes, a ten-minute delayed retry, and later bounded retries.
- Result: 20 HTTP 503 responses, zero result URLs, zero image files, zero Human visual verdicts.
- Local evidence: redacted metadata under `output/agnes/`; no credential value is recorded.
- Classification: provider availability failure. It neither proves nor disproves the v2 prompt's visual fidelity.

## Accepted boundary

The Human Owner chose to temporarily skip the unavailable Agnes fidelity gate and continue with T5-072. Revid may claim versioned recipe correctness, browser safety, deterministic retry, and honest capability boundaries. It may not claim that the current Agnes model preserves photographic identity or scene fidelity until a future authorized sample receives a Human verdict.

## Release decision

Release T5-071 offline implementation and browser behavior. Carry real-provider fidelity as an explicit unsupported boundary into T5-072 enterprise certification.
