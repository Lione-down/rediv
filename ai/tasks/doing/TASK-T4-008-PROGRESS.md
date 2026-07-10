# T4-008 Progress - Real-Data Home Project And Asset Dashboard

Last updated: 2026-07-11

## State

- Before this run: `DOING`, Slice A planned but not implemented
- Current: `DOING`
- Completed bounded unit: Slice A, contract audit and project-domain foundation
- Starting branch: `main`
- Starting HEAD: `5222ff8872d967890fbf8af2f90ebb0d1e1ae3d1`
- Pre-existing staged/modified files: none
- Pre-existing untracked files: `frontend/.playwright-cli/` and `output/`; browser evidence only, excluded from delivery staging
- Unmerged paths or in-progress Git operation: none

## Completed Work

- Completely audited Home, router, Workspace, frontend request/asset/auth-store contracts, backend project API/schema/model/store methods, and project CRUD tests.
- Locked the Slice A contract:
  - `POST /projects` accepts `{ name }` and returns `201` with `id`, `user_id`, `name`, and `created_at`;
  - `GET /projects` returns current-user `{ items, total }` in newest-first server order;
  - Workspace consumes the scalar query key `project_id`;
  - root Home remains public to preserve T4-007 guest/auth behavior.
- Added `frontend/src/modules/project/types.ts` and `api.ts` with only the required list/create contract.
- Added a Pinia project store with empty real-data state, cached load plus explicit refresh, separate sanitized load/create errors, load/create single-flight serialization, same-payload create deduplication, different-payload rejection, create-success ID upsert, and generation-safe reset.
- Confirmed an existing asset-store blocker for truthful Home data: fabricated initial items plus missing request/session race controls. Refined Slice B into bounded asset hardening and Home presentation units without changing backend or UI in this run.

## Remaining Work

1. Complete Slice B1 asset API/store/type contract hardening with no Home edit.
2. Complete Slice B2 Home decomposition and authenticated real-data state UI, including auth-session resets and explicit Workspace project-ID navigation.
3. Complete Slice C real local-backend/MySQL cross-check, responsive browser acceptance, REPORT, and closure.

## Exact Next Action

Read the complete backend asset list API/schema/store ordering contract, then implement only Slice B1 in `frontend/src/api/assets.ts`, `store/assets.ts`, and `types/asset.ts`: remove fabricated initial data and add generation-safe load/refresh/error/reset semantics; run an adapter harness, typecheck/build, fresh review, update durable state, and create one scoped local commit. Do not edit Home in that bounded unit.

## Files Changed

- `frontend/src/modules/project/types.ts` - exact project list/create DTOs.
- `frontend/src/modules/project/api.ts` - authenticated `/projects` list/create requests through the shared client.
- `frontend/src/modules/project/store.ts` - generation-safe real-data project state and actions.
- `ai/tasks/todo/TASK-T4-008.md` - explicitly scopes the necessary Slice B asset hardening.
- `ai/tasks/doing/TASK-T4-008-PLAN.md` - records locked contracts and the Slice B1/B2 split.
- `ai/tasks/doing/TASK-T4-008-PROGRESS.md` - records Slice A implementation, verification, remaining work, and next action.
- `ai/state/CURRENT.md` - advances the rolling snapshot to completed Slice A.
- `ai/state/ROADMAP.md` - reconciles the Home source line-count risk.

## Commands And Summarized Results

- Required read set and Git baseline: PASS; `main` at `5222ff8872d967890fbf8af2f90ebb0d1e1ae3d1`, no staged/modified/unmerged/Git-operation state, with only the known untracked browser artifacts.
- `npm exec vue-tsc -- -b tsconfig.app.json --pretty false`: PASS with no diagnostics.
- `npm run build`: PASS; Vue typecheck and Vite production build completed with 4,649 modules transformed.
- Ephemeral Vite SSR/Axios adapter harness: PASS; covered list deduplication, failed-refresh data preservation, load/create serialization, same-create deduplication, different-create rejection, immediate upsert, loading cleanup, and reset stale-response suppression. Two earlier harness invocations failed in test setup before valid product assertions (PowerShell Chinese regex transcoding, then delayed rejection-handler attachment); the corrected all-ASCII harness passed.
- New-file whitespace checks: PASS; no whitespace errors, with expected Git for Windows LF-to-CRLF notices only.
- Fresh standard architecture/security review: CLEAN; exact response fields and paths, stale-write/loading races, duplicate POST behavior, error sanitization, file scope, and unknown identifiers were reviewed with no blocking finding.

## Blockers And Release Conditions

- No active implementation blocker.
- Slice B must call `resetProjects()` and the equivalent asset reset on auth-session changes before cached data is displayed across accounts.
- Real MySQL acceptance later requires an authorized runtime capability; do not read `.env` files or print credentials. If no safe runtime is available, record the exact verification blocker rather than substituting mock evidence.
- T4-005 Unit B remains a separate Human cost gate and is outside T4-008.
