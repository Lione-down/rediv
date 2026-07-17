# REPORT-T5-086 - Capability-gated shot direction controls

## Result

`DONE - PASS`

Revid now carries strict, Revid-owned shot direction intent through existing image/video generation branches while the production boundary remains provider-honest and fail closed. No LibTV source, prompt, schema, brand, icon, copy, or visual asset was used.

## Delivery

- Capability document v3 adds exact nested `shot_controls` v1 sections to image and video capabilities. Its only values are angle `eye-level|high-angle|low-angle|overhead`, framing `wide|medium|close-up`, focus `deep|shallow`, lighting `natural|soft|dramatic`, and temporal `hold|advance|rewind`.
- Production advertises empty `supported_controls` and `provider_controls`. Crafted image/video requests with a non-default shot control fail before task, quota, asset, or provider mutation.
- Browser mocks advertise four static image controls and all five video controls only for offline contract/lifecycle verification. Non-`hold` temporal intent is limited to exact one-reference `image-to-video`; image, text-to-video, and keyframes fail closed.
- Existing v1 node parameter and immutable task snapshot shapes gain an optional all-or-nothing v1 `shot_controls` object. Legacy ordinary generation remains unchanged; visual recipes and image-operation branches reject shot controls rather than combining unapproved semantics.
- The existing Context Panel owns the compact accessible controls. Each edit uses the current one-command history/autosave boundary, persists through undo/redo/reload, and reaches the existing request/task/result/quota lifecycle only after explicit Generate.
- Capability drift blocks saved unsupported intent. Canvas duplicate command preserves the exact nested control object without changing graph identity. No second Canvas store/engine, migration, or UI redesign was introduced.

## Verification

| Gate | Result |
|---|---|
| RED evidence | PASS: backend missing-module and frontend v3-capability failures occurred before implementation |
| Focused backend | PASS: 28 tests, 34 subtests |
| Related backend | PASS: 77 tests, 43 subtests |
| Full backend | PASS: 482 tests, 116 subtests, 387.97s |
| Frontend build | PASS: 4,893 transformed modules |
| Focused shot-control Chromium | PASS: 9/9 |
| Related Canvas/generation Chromium | PASS: 51/51 |
| Full Chromium | PASS: 462/462, 8.6m |
| Accessibility and responsive review | PASS: scoped Inspector axe has zero serious/critical findings; 1440px editable and 375px review-only evidence pass |
| 200 nodes / 300 connections | PASS: 56.56 FPS, 16.8ms frame p95, 9.8ms pointer p95; thresholds unchanged |
| Hygiene | PASS: `git diff --check`, strict UTF-8 decode, and zero BOM; secret-signature scan found only existing code identifiers with no values. The touched command-contract regression was already 533 lines at baseline (551 after its focused nested-copy assertion), so no unrelated test-file refactor was mixed into this Task. |

## Evidence

- `output/playwright/t5-086-shot-controls/shot-controls-1440x900.png`
- `output/playwright/t5-005-unit-e/performance-metrics.json`

## Boundaries retained

- No real provider or paid call, secret access, external account, database migration, destructive operation, or cross-canvas connection.
- Production remains zero-executable-shot-control until a Human Owner approves an exact provider contract. This task proves the mock/contract lifecycle only.
