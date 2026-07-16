# TASK-T5-075 Progress

- Task state: `DONE - PASS`
- Active unit: complete; repository is ready for T5-076 activation after the T5-075 commit is pushed.

## Completed work

- Reconciled and pushed the T5-074 baseline before activation, then locked the real Alembic baseline at `c9d0e1f2a3b4`.
- Verified the official Agnes Image 2.1 Flash and Video V2.0 contracts read-only; no paid provider call or secret access occurred.
- Added backend-owned capability/normalization for eight image ratios, ordinary `1K`, recipe-fixed `1024x768`, three video reference modes, and exact `3/5/10/18 -> 81/121/241/441 @ 24 FPS` mappings.
- Added authenticated `GET /api/generation-capabilities`, strict pre-task validation, exact provider payload mapping, and nullable immutable task `request_parameters` diagnostics.
- Added additive MySQL-only revision `d0e1f2a3b4c5` with a non-empty JSON column comment; verification used disposable `revid_test_*` schemas only.
- Added one parameter-aware frontend resolver shared by Inspector, preflight, payload, included/excluded provenance, and task diagnostics.
- Added accessible image ratio, video duration/mode/primary-reference controls, recipe-fixed and readonly summaries, bounded run/result snapshot labels, and honest capability/invalid-state failures.
- Added typed parameter command persistence with in-flight guards, exact undo/redo/reload behavior, and one document PATCH per deliberate command.
- Initialized explicit video intent for result branches and selection composition; legacy multi-reference video remains blocked until the user confirms a visible mode.
- Kept `CanvasContextPanel.vue` at 495 lines and extracted the new request workflow to `use-canvas-generation-actions.ts`; `use-canvas-resource-experience.ts` is now 446 lines.

## Remaining work

- None for T5-075.
- T5-076 owns task-only polling and runtime generation visibility; T5-077 owns durable progress; T5-078 owns pending output projection.

## Exact next action

Commit and push the exact verified T5-075 scope, confirm a clean owned baseline, then activate T5-076 with fresh Task/PLAN/PROGRESS documents.

## Files changed

- State/task/report: `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`, `ai/tasks/todo/TASK-T5-075.md`, `ai/tasks/doing/TASK-T5-075-PLAN.md`, this PROGRESS, and `ai/reports/REPORT-T5-075.md`.
- Backend: generation capability/normalization route and contract, image/video schemas/routes/provider mapping, task model/schema/serializers/transactions/store, revision `d0e1f2a3b4c5`, and focused tests.
- Frontend: generation parameter resolver/service/types, typed command/mutation/serialized/store boundary, Inspector controls/actions, creation paths, workspace wiring, fixtures, and focused browser tests.

## Commands and summarized evidence

- Backend initial RED: missing `core.generation_parameter_contract`; migration JSON round-trip exposed MySQL JSON numeric string handling in the test assertion, then passed with an explicit numeric cast.
- Backend focused: `27 passed, 14 subtests passed`.
- Backend broader generation/provider/video matrix: `40 passed, 14 subtests passed`.
- Frontend focused parameter test: `6 passed`.
- Frontend parameter/preflight/input-order/selection/result-branch matrix: `31 passed`.
- Frontend production build: PASS, `4,830 modules transformed`.
- Backend compileall: PASS; repository Alembic head: `d0e1f2a3b4c5 (head)`.
- Visual review: PASS at 1440x900 image ratio, 920x900 keyframes/duration, and 375x812 readonly summary; drawer bounds asserted after transition.
- No real provider request, secret access, quota mutation outside mocks, or user/runtime migration occurred.

## Blockers and release conditions

- None.
