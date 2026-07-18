# REPORT-T5-094 - Agnes contract recovery, AI script authoring, and LibTV observable Canvas parity

- Status: `DONE - PASS`
- Baseline: T5-093 state closure `e932a3615273f3fde9c3173a51f39c8291acac34`
- Business delivery: T5-094 closure commit pushed to `origin/main`
- Date: 2026-07-19
- Scope: backend-owned Agnes text/image/video contracts and safe failures, non-destructive `Agnes 2.0 Flash` script draft/refine authoring, and clean-room observable LibTV Canvas parity; no real provider call or private LibTV access.

## Delivered

- Added one typed backend Agnes contract for model IDs, endpoints, media-specific request adapters, response validation, video polling, and capability consumers. Arbitrary provider passthrough now fails at the adapter boundary.
- Added bounded redacted provider errors with stable deterministic/transient codes, safe provider request/correlation IDs, numeric `Retry-After` propagation, and actionable API/frontend presentation. Failed, rejected, busy, stale, or malformed work does not create an active asset, charge successful quota, attach stale output, or discard a prior valid result.
- Added a deterministic same-fingerprint failure guard and preserved native admission/idempotency ownership. Transient provider failures, including HTTP 503, remain explicit manual-retry cases; provider creation POSTs are not automatically replayed.
- Added strict owned-upload image reference conversion to bounded Data URIs. Cross-user, traversal, symlink, missing, unsupported, private-network, credentialed, and oversized references fail before provider work.
- Added backend-owned `script_draft` and `script_refine` for `Agnes 2.0 Flash`, strict source/canvas revision and output validation, immutable task snapshots, and lineage without raw brief/source text in task parameters.
- Added contextual and Slash Palette script controls, cancel/stale handling, default-new editable output, and explicit atomic replace with undo/redo/autosave/reload behavior. Script authoring remains separate from Cinematic shot decomposition.
- Added a 94-row clean-room LibTV parity ledger, Revid semantic color map, and 28-scenario machine-readable manifest. Every safely implementable row is matched without copying private source, brand assets, prompts, fonts, or proprietary icons.
- Added compact Canvas chrome, observable catalog and continuation surfaces, workflow starters, selected-media actions, generation summaries, result-family presentation, recovery/revision controls, dense overview behavior, and an exact-text local composer with honest unavailable boundaries.
- Added a dedicated Playwright full-Chromium new-headless performance project. It uses hardware acceleration for the unchanged 200-node/300-connection gate while the default headless-shell/SwiftShader behavior remains retained as separate environment evidence.

## Verification

- Final backend target matrix passed `76/76` tests in `121.55s`, including `57` subtests across Agnes contract/reference/provider, admission/idempotency, parameter validation, text/image/video routes, and script authoring.
- Production frontend build passed `vue-tsc -b` and Vite with `4937 modules transformed`.
- Related Chromium matrix passed `74/74` in nine affected files.
- Dedicated full-Chromium performance/accessibility matrix passed `3/3`, including the unchanged 200-node/300-connection thresholds, Canvas switching, accessibility, and required viewport coverage. The retained final measured run before closure was 128.29 FPS, 25.1ms frame p95, 3.3ms pointer p95, 69ms longest task, and 10.30 minimap updates/s with hardware acceleration enabled.
- Ledger/manifest audit passed: `94` rows, `28` scenarios, zero unknown IDs, zero uncovered rows, and zero status mismatches; final ledger counts are `61 MATCHED`, `5 BLOCKED`, and `28 NOT_OBSERVABLE`.
- Fresh diff review found zero out-of-scope paths and zero added debug/TODO/skip markers. `git diff --check`, strict UTF-8/no-replacement-character audit, sensitive-path scan, high-confidence secret-signature scan, exact-stage scope, and HEAD/origin drift checks passed.

## Accepted documented deferrals

- On 2026-07-19, the Human Owner accepted `A03`, `B17`, `E08`, `E09`, `E10`, and all 28 `NOT_OBSERVABLE` rows as documented deferrals.
- The Human Owner deferred real Agnes smoke. Offline unit/mock/browser-fixture evidence therefore proves Revid contract and recovery behavior, not current real Agnes availability, capacity, billing, fidelity, or output quality.
- The five blocked rows and 28 non-observable rows retain their exact ledger status and release conditions; they are not relabeled as matched.

## Boundaries

- No `.env`, secret, real/paid Agnes request, external account mutation, destructive database/filesystem operation, user/runtime migration, private LibTV surface, proprietary asset, or threshold reduction was used.
- HTTP 503 is a provider capacity/availability signal that cannot be eliminated client-side. Revid currently classifies it as transient, preserves bounded safe metadata and `Retry-After`, and exposes manual retry without replaying an ambiguous provider creation request automatically.
- User-owned `.codex/`, `.hermes/plans/`, and `output/` paths remain excluded from Task staging and delivery.
