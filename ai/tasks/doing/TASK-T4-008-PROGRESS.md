# T4-008 Progress - Real-Data Home Project And Asset Dashboard

Last updated: 2026-07-11

## State

- Before this run: `DOING`, Slice A completed and committed
- Current: `DOING`
- Completed bounded unit: Slice B1, asset-domain real-data and session hardening
- Starting branch: `main`
- Starting HEAD: `a30a429b106344254aa90c0d0548b496b1123dd7`
- Pre-existing staged/modified files: none
- Pre-existing untracked files: `frontend/.playwright-cli/` and `output/`; browser evidence only, excluded from delivery staging
- Unmerged paths or in-progress Git operation: none

## Completed Work

- Audited the complete backend `GET /assets` route, response schema, InMemory/Database store implementations, model fields, ordering/filter/pagination behavior, and focused backend tests.
- Locked the asset list contract:
  - only the authenticated user's active assets are returned;
  - `asset_type` and `project_id` are optional equality filters;
  - results preserve backend newest-first order and return `items`, `total`, `page`, and `page_size`;
  - every item key is required while nullable values remain explicit, and response `type`, `source`, and `status` are strings rather than closed wire enums.
- Replaced the fabricated asset initial records with empty real-data state and added `hasLoaded`, sanitized `loadError`, duplicate-request single-flight, explicit refresh, same-session refresh-failure preservation, and generation-safe reset behavior.
- Bound the asset store to synchronous auth-token changes so cached data is cleared before another account can render it; stale success and failure completions no longer mutate state or propagate obsolete errors.
- Preserved the existing no-argument `loadAssets()` network-refresh behavior for Home compatibility while allowing an explicit cached `loadAssets(false)` path.
- Kept pagination metadata at the typed API boundary instead of duplicating it in Pinia, because the out-of-scope Workspace currently prepends directly to `items` and cannot maintain a truthful account-wide total.
- Completed a fresh Standard review. Security review was clean; architecture review's initial metadata-consistency P2 was fixed and its final re-review was clean.

## Remaining Work

1. Complete Slice B2 Home decomposition and authenticated real-data state UI, including project-store session reset, real project creation/list states, recent-asset states, unknown asset-value fallbacks, and explicit Workspace project-ID navigation.
2. Complete Slice C real local-backend/MySQL cross-check, responsive browser acceptance, REPORT, and closure.

## Exact Next Action

Read the complete current Home template/styles plus project store, auth session, router, and Home-local component conventions; then implement Slice B2 only: replace fabricated Home values with project/recent-asset/quota states, add project creation and retry/partial/empty/zero states, synchronously reset project state on token changes, decompose `Home.vue` below 500 lines, and navigate to Workspace with the selected backend project ID. Do not modify backend, Space, Workspace, Canvas, or global design tokens.

## Files Changed

- `frontend/src/types/asset.ts` - exact required/nullability response DTO, list query/envelope, and constrained create payload.
- `frontend/src/api/assets.ts` - complete `/assets` query/envelope typing and project-aware JSON upload payload.
- `frontend/src/store/assets.ts` - empty real-data state, refresh/error/single-flight behavior, synchronous session reset, and stale-completion suppression.
- `ai/tasks/doing/TASK-T4-008-PLAN.md` - marks Slice B1 complete and records the B2 session/asset-summary constraints.
- `ai/tasks/doing/TASK-T4-008-PROGRESS.md` - records Slice B1 implementation, verification, remaining work, and next action.
- `ai/state/CURRENT.md` - advances the rolling snapshot to completed Slice B1.

## Commands And Summarized Results

- Required read set and Git baseline: PASS; `main` at `a30a429b106344254aa90c0d0548b496b1123dd7`, no staged/modified/unmerged/Git-operation state, with only the known untracked browser artifacts. Codex task-list inspection did not return, so branch/HEAD/index rechecks remain the single-flight fallback.
- Complete backend asset contract and frontend caller audit: PASS; path, required/nullability fields, string wire values, active/user filtering, newest-first ordering, pagination, current Home calls, and session risks were read directly.
- `npm exec vue-tsc -- -b tsconfig.app.json --pretty false`: PASS with no diagnostics before the final build pass.
- Final ephemeral Vite SSR/Axios adapter harness with `envFile: false`: PASS; 9 HTTP requests and 28 state/contract checks covered empty state, single-flight, explicit cache, default refresh compatibility, refresh-failure preservation, synchronous A-to-B token reset, stale success/failure suppression, loading cleanup, sanitized fallback, and filter/pagination params/envelope. An earlier invocation reached the final fallback assertion but its inline Chinese expected literal was transcoded by PowerShell; the ASCII/code-point corrected harness passed.
- Final `npm run build`: PASS; Vue typecheck and Vite production build completed with 4,649 modules transformed.
- Fresh Standard review: PASS; security reviewer found no issue. Architecture reviewer identified one P2 because Pinia pagination metadata could diverge from the out-of-scope Workspace direct mutation; the metadata was removed from store state and the final architecture re-review found no remaining issue.
- `git diff --check`: PASS; no whitespace errors, with expected Git for Windows LF-to-CRLF notices only.

## Blockers And Release Conditions

- No active implementation blocker.
- Slice B2 must add equivalent synchronous project-store reset behavior before project cache is rendered across accounts; asset state already self-resets on token changes.
- Home must describe the loaded asset page as recent data and must not claim `items.length` is an account-wide total while Workspace direct item mutation remains outside T4-008 scope.
- Real MySQL acceptance later requires an authorized runtime capability; do not read `.env` files or print credentials. If no safe runtime is available, record the exact verification blocker rather than substituting mock evidence.
- T4-005 Unit B remains a separate Human cost gate and is outside T4-008.
