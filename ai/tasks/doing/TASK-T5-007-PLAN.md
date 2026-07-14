# TASK-T5-007 Plan

- State: `DONE - PASS`
- Completed units: Units A-E (`COMPLETE - PASS`)
- Active unit: none
- Updated: 2026-07-14

## Objective

Land T5-007 as five independently verified units. Every behavior change follows RED -> GREEN -> focused regression, and every unit leaves existing projects and legacy Canvas graphs usable.

## Unit A - Registry Contract And Compatibility

1. Add failing unit/browser tests for the six canonical definitions, unique ports, default sizes, capabilities, serialization versions, compatibility-only legacy entries, and unknown-node preservation.
2. Implement a typed `node-registry.ts` with lookup, creation listing, subtype validation, and safe unsupported resolution.
3. Route mappers, recovery validation, renderer metadata, context/double-click creation, `Tab`, and accessibility labels through the registry.
4. Add the contextual tool-dock entry without adding provider or resource logic.
5. Run focused tests, build, Canvas browser regression, diff review, and hygiene gates before committing Unit A.

## Unit B - Additive MySQL Resource Contract

1. Add failing guarded MySQL tests for required comments, origin attribution, same-project/same-Canvas constraints, node-link clearing, template schema version, graph backfill, and downgrade protection.
2. Add one MySQL-only Alembic migration after `f0a1b2c3d4e5`; apply only to disposable guarded `revid_test_*` schemas.
3. Update SQLAlchemy models and strict Pydantic schemas without opening `.env` or running a user/runtime migration.
4. Preserve legacy template payloads through deterministic version-1 backfill into versioned graph data.
5. Run migration upgrade/head/restart tests plus the affected backend regression before committing Unit B.

## Unit C - Project Assets And Templates

1. Add failing ownership, audio-asset, project filter, cross-Canvas availability, template graph capture, atomic target-Canvas instantiate, ID remap, and invalid-graph tests.
2. Introduce focused controllers/services rather than expanding the existing 2,000-line store with new domain orchestration.
3. Keep existing template-to-new-project behavior compatible and add an authenticated target-Canvas instantiation contract.
4. Use one Canvas document mutation batch for inserted template graphs so autosave/revision semantics remain canonical.
5. Run focused guarded MySQL/API tests, restart evidence, and affected regressions before committing Unit C.

## Unit D - Generation Transactions And Frontend Service

1. Add failing mock integration tests for project/Canvas/node ownership, success, provider failure, asset persistence failure, exact task/result linkage, no-charge failures, authoritative quota response, and restart persistence.
2. Extract shared generation orchestration and provider dependency boundaries from endpoint-specific code while preserving existing public routes.
3. Extend image/video requests with project, origin Canvas, and optional generation-node context; persist generated assets at project scope.
4. Return authoritative post-transaction quotas and replace frontend quota state from the response.
5. Move provider request logic out of `CanvasWorkspace.vue` into the Canvas module/service and run full affected regressions before committing Unit D.

## Unit E - Canvas Resource And Generation Experience

1. Add failing browser tests for project resources across Canvas switches, asset/template insertion, contextual generation editor, task success/failure/result states, real preview/placeholder behavior, keyboard focus, narrow drawers, and mobile review-only controls.
2. Implement `CanvasAssetPanel`, contextual inspector/editor, and project resource state with existing V2 tokens, Naive UI, Lucide, and current command/autosave boundaries.
3. Keep optional asset panel width within 280-420px on desktop, collapse it when requested, use a drawer on narrow viewports, and expose only non-mutating review content on mobile.
4. Run focused browser/accessibility/visual checks at 1440x900, 1366x768, 920x900, and 375x812.
5. Run full backend and Chromium regressions, production build, guarded restart evidence, independent review, security/hygiene gates, REPORT, and durable state closure.

### Unit E Upload Security Closure

1. Keep the cross-process MySQL upload lock only around short capacity-reservation transitions. Never hold it while awaiting an untrusted request body, and bound both idle receive time and total upload duration.
2. Stream the sole multipart file into a named staging file below the configured upload root, account for its reserved capacity across processes, and finish with a same-volume atomic rename. Do not use system-temp spooling or a second full-size copy.
3. Route parser file writes, rollover-equivalent work, validation, cleanup, and finalization through threadpool-backed disk operations; malformed, oversized, timed-out, or abandoned uploads must release reservation state and leave no partial file.
4. Require a patched `python-multipart` version, replace synthetic positive media samples with independently decodable tiny fixtures, and reject the former forged container fixtures through stronger codec/sample linkage checks.
5. Add RED/GREEN evidence for slow-body lock liveness, reservation quota/floor accounting, timeout and cleanup, event-loop-safe writes, dependency bounds, real-media acceptance, and forged-media rejection before repeating the full backend regression and independent security review.

### Unit E Browser RED Matrix

1. Project-scoped assets, templates, generated assets, and generation history remain visible after a normal Canvas switch; inserting an asset creates one registry-backed node only in the active Canvas without copying project ownership.
2. Template insertion calls the authenticated target-Canvas instantiate endpoint once with the current revision and one bounded client mutation ID, then reloads the server-confirmed document instead of replaying client-side node patches.
3. A canonical generation node exposes a contextual prompt editor, persists prompt changes, sends complete project/Canvas/node context, and creates one linked result node from a mock success response.
4. A mock provider failure shows the durable failed task and exact reason, performs no automatic retry, creates no result or asset, and leaves the authoritative quota snapshot unchanged.
5. Desktop resources use a 280-420px resizable complementary panel. At 920px, resources and contextual details use keyboard-complete drawers with focus return, visible focus, 40px targets, and no serious or critical axe findings.
6. The four accepted viewports preserve editable desktop/narrow behavior. At 375px, project resources remain browsable while upload, insertion, template-use, generation, delete, and Canvas mutation actions are absent and mutation shortcuts remain inert.

Mock browser evidence must use project-filtered asset/task endpoints, versioned template graphs, complete durable generation task records, and local fulfilled media bytes. It must not call a real provider or present mock evidence as paid-service evidence.

## TDD And Verification Contract

- Write the smallest behavior test first and record the expected RED fingerprint before production code.
- Run focused GREEN immediately, then the affected suite; do not weaken existing assertions or thresholds.
- Distinguish pure unit, mock-provider, guarded real-MySQL, browser, and manual evidence.
- Never present mock provider evidence as paid/real-service evidence.
- No Unit completes with a known HIGH/MEDIUM review finding or inconsistent Task/PLAN/PROGRESS/CURRENT state.

## Exact Next Action

Commit and push the verified T5-007 closure, then create and activate T5-008 Task/PLAN/PROGRESS for the final Canvas first-acceptance matrix.

## Closure Evidence

- Full backend: `384 passed, 56 subtests passed` on disposable guarded MySQL schemas.
- Final upload/security matrix: `134 passed, 48 subtests passed`.
- Full Chromium: `117 passed`; focused resource-race/revision regression: `10 passed`.
- Production build: `4,761` modules transformed.
- Alembic: single head `c9d0e1f2a3b4`; no user/runtime migration ran.
- Independent frontend and final upload/security reviews: `0 HIGH / 0 MEDIUM / 0 LOW`.
- Compile, UTF-8, 500-line, dependency, diff, and sensitive-file hygiene gates passed.
