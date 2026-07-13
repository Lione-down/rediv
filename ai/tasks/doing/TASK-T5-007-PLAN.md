# TASK-T5-007 Plan

- State: `DOING`
- Completed units: Unit A - node registry and compatibility boundary; Unit B - additive MySQL resource contract; Unit C - project assets and templates; Unit D - generation transactions and frontend service
- Active unit: Unit E - Canvas resource and generation experience
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

## TDD And Verification Contract

- Write the smallest behavior test first and record the expected RED fingerprint before production code.
- Run focused GREEN immediately, then the affected suite; do not weaken existing assertions or thresholds.
- Distinguish pure unit, mock-provider, guarded real-MySQL, browser, and manual evidence.
- Never present mock provider evidence as paid/real-service evidence.
- No Unit completes with a known HIGH/MEDIUM review finding or inconsistent Task/PLAN/PROGRESS/CURRENT state.

## Exact Next Action

Add failing browser tests for cross-Canvas project resources, asset/template insertion, generation success/failure/result states, narrow drawers, keyboard focus, and the 375px review-only boundary before implementing the Unit E UI.
