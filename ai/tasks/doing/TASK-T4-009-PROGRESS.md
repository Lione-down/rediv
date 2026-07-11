# T4-009 Progress - Real-data Space asset workspace

- Task: `T4-009`
- State: `DOING`
- Updated: 2026-07-11
- Plan: `ai/tasks/doing/TASK-T4-009-PLAN.md`
- Source Task: `ai/tasks/todo/TASK-T4-009.md`

## Current Bounded Unit

Unit 2, sub-slice 2 - typed current-user template list/detail read foundation. This slice is complete and verified; it is limited to `frontend/src/modules/template/**` plus active state documents and does not add mutations or edit Space UI.

## Current Slice Design

- Add domain-local `types.ts`, `api.ts`, and `store.ts` following the existing project-module structure; do not add a dependency or global store surface.
- Preserve the backend `{items,total}` list response and complete template snapshot shape, including nullable `node_data`; keep list and detail loading/error/cache state independent.
- Deduplicate the single list endpoint and each identical template ID while allowing different detail IDs to proceed concurrently. The latest selected detail wins, including A-B-A pending reuse.
- Use request identity plus authentication generation guards so superseded detail or session responses cannot publish data/errors or close current loading state.
- Reset list, detail, pending-request registries, loading, and errors synchronously when the auth token changes.
- Verify with TypeScript plus a deterministic Vite/Pinia/Axios runtime probe covering request dedupe, ordering, errors, cache independence, and token reset; run the production build before commit.

## Completed Work

- Reconstructed the current run from the required documents and automation cursor. The current slice started from clean `main` at `855f907a8438b627d61be6ac088f086316ef9602` with an empty index/worktree and no unmerged paths; the task-list query remained unavailable, so branch/HEAD/index drift guards apply.
- Refreshed PLAN and PROGRESS before business-code edits, audited the existing project/asset/auth patterns plus template routes, schemas, model, store serialization, and focused backend tests, and confirmed the slice requires no backend or product-contract change.
- Added exact template read types for the owner-scoped response, including API `total` and nullable arbitrary-dictionary `node_data`; the incompatible Canvas UI node type is not reused.
- Added list and detail API calls only. Detail IDs are trimmed, empty IDs reject without an HTTP call, and valid path segments are encoded.
- Added an independent response-shaped list cache and latest-selected detail state. List requests and identical detail IDs are single-flight; different IDs may run concurrently; A-B-A reuses pending A and restores it as active.
- Added request-identity, selection, and session-generation guards so stale success/error/finally paths cannot publish data, surface obsolete errors, delete a new same-ID request, or close current loading state.
- Added an explicit detail-clear transition and synchronous token reset for list/detail data, errors, loading, and pending registries. Stale actions resolve as `Promise<void>` while current failures reject.
- Completed Standard fresh review of all six delivery paths. Security/API-contract and architecture/concurrency passes reported no findings, and root review found no scope, compatibility, secret, or error-path hard stop.
- Completed the required run read set: AGENTS, direct-delivery operating model, CURRENT, ROADMAP, active Task, linked direct-delivery ADR, and automation cursor.
- Attempted the Codex task-list single-flight check; the query did not return and was terminated without repository or Git mutation. The run therefore uses the required branch/HEAD/index drift guard.
- Recorded a clean starting Git baseline on `main` at `f0327cb1a490908e438cb7e23dc8fb26599d1599`: no staged, modified, untracked, or unmerged paths were reported.
- Created the T4-009 PLAN and this PROGRESS document before business-code edits.
- Read the complete 983-line current Space implementation, asset API/store/types, auth/quota state, project API/store/navigation, router, App shell, relevant Home/Workspace patterns, design tokens, Naive UI overrides, and `ui/design-system.md`.
- Traced the complete asset/template routes, schemas, models, both store implementations, focused backend tests, quota `/me` path, admin hidden behavior, and project navigation contract.
- Locked the T4-009 product and visual direction in PLAN using the repository's existing dark design vocabulary and component-scoped SCSS strategy.
- Added `AssetListQuery`, which resolves server pagination defaults while preserving the existing optional `AssetListParams` and string-valued asset-type boundary.
- Added a response-shaped `spaceCollection` with independent query, loaded, loading, and error state; API `items/total/page/page_size` metadata is retained exactly, including boundary pages with empty items and nonzero totals.
- Added canonical fixed-order query keys and per-query pending requests, so only server-equivalent identical queries share a request while different queries may proceed concurrently.
- Added latest-query, request-identity, and shared session-generation guards. A-B-A reuses the still-pending A request, stale success/error/finally paths cannot overwrite or close the active query, and stale actions resolve without exposing another query's payload.
- Extended the existing synchronous token watcher reset to clear both the default and Space collections before old-session requests can settle.
- Preserved the complete Home/Workspace default cache surface and behavior. Filtered Space loads do not mutate `items`, `hasLoaded`, `isLoading`, or `loadError`; default loads do not mutate Space state.
- Kept `frontend/src/api/assets.ts` unchanged after fresh review proved it already forwards query params and preserves the full typed Axios response; no duplicate endpoint wrapper or metadata-unwrapping abstraction was introduced.
- Completed a Standard fresh diff review. The security specialist found no issue; the architecture specialist's stale return-contract finding was fixed by making Space load actions `Promise<void>`, and re-review found no remaining issue.

## Resolved Contracts And Decisions

### Assets

- `GET /assets` is authenticated, filters by `asset_type` and `project_id`, paginates with `page/page_size`, returns `{items,total,page,page_size}`, sorts newest first, and lists only the current user's `active` rows.
- Page values below 1 return 400. An out-of-range page returns an empty `items` array while preserving nonzero `total`, so the UI must distinguish a boundary page from a globally empty result.
- Asset detail has the same fields as a list item. Unknown type, null content, null/broken/relative URL, null or dangling project ID, and missing project metadata are valid frontend boundaries.
- User DELETE is soft delete and returns the row with `status=deleted`; subsequent normal lists omit it. `hidden` is admin-only and also disappears on refresh. There is no user hide, unhide, restore, storage-capacity, or media-download contract.
- The backend writes uploaded files under `/uploads/...` but does not mount that path, so a relative media URL can fail at runtime and requires an explicit fallback.
- The existing asset store keeps only the default first-page items and discards totals. Space query state must be separate so filter/page changes do not contaminate Home or Workspace.

### Templates

- `GET /templates` returns all current-user templates newest first as `{items,total}` with no server pagination or filters. Each response includes `node_data`; there is no source project ID, thumbnail, status, or updated time.
- Detail is owner-scoped. DELETE is a hard delete with a 204 empty body.
- POST `/templates/{id}/use` creates a same-name project, clones snapshot nodes but not connections, and returns the new `project_id` for canonical Workspace navigation.

### Quota And Navigation

- Normal users receive only remaining `{text,image,video}` counts from login or `/me`. No user-visible cap, used amount, percentage, timestamp, or ledger exists, so Space will show remaining counts without invented progress.
- Canonical project navigation is `{ name: 'workspace', query: { project_id } }`. Asset references are nullable and not foreign-key protected; project actions must degrade safely.

### UI And Verification

- Current tabs are prototype-only `profile/assets/history/results`; Space does not load assets, shows at most three cached rows, uses current-page length as a total, lacks all required filters/pagination/detail/delete/media fallbacks, and contains mock storage/history/results copy.
- The current global custom variables are light while Naive UI and `ui/design-system.md` define dark surfaces. Because global-token edits are forbidden, Space will use component-scoped dark surface values plus existing Naive UI theme behavior.
- Frontend has no unit-test framework. The Task will not add one; verification will use `npm run build`, focused temporary-SQLite backend tests, and mocked/real browser probes for the slices that expose UI behavior.
- Focused contract verification passed: 29 asset/template/quota backend tests using temporary SQLite and FastAPI TestClient.
- Frontend production baseline passed: `vue-tsc -b && vite build`, 4,663 modules transformed.

## Remaining Work

- Add typed asset detail/soft-delete and template hard-delete/use clients with exact response and refresh/invalidation behavior in Unit 2's final sub-slice.
- Replace the Space prototype with local real-data components and complete accessibility, failure, responsive, real-data, and browser acceptance.
- Implement and verify the remaining Unit 2 sub-slice plus Units 3-5 from the PLAN; write REPORT only after all acceptance criteria pass.

## Exact Next Action

Implement Unit 2, sub-slice 3: add typed asset detail/soft-delete and template hard-delete/use API/store flows with exact response handling, mutation single-flight/session guards, and coherent list/detail invalidation. Do not edit Space UI in that bounded slice.

## Files Changed

- `frontend/src/modules/template/types.ts` - added exact list/detail response types with nullable snapshot data.
- `frontend/src/modules/template/api.ts` - added guarded current-user list/detail GET clients.
- `frontend/src/modules/template/store.ts` - added independent guarded list/detail state, single-flight requests, clear behavior, and synchronous session reset.
- `ai/tasks/doing/TASK-T4-009-PLAN.md` - refined and reconciled Unit 2 sub-slice status and success criteria.
- `ai/tasks/doing/TASK-T4-009-PROGRESS.md` - recorded this bounded unit, verification, review, remaining work, and exact next action.
- `ai/state/CURRENT.md` - rolls the active Task snapshot and worktree ownership forward with this unit.

## Commands And Summarized Results

- Current required document reads and Git baseline commands - completed; this slice started clean on `main` at `855f907a8438b627d61be6ac088f086316ef9602` with no staged, modified, untracked, or unmerged paths. The previous asset-slice baseline was `fb4d83f4a11332263f74dbda52122aaae0b2e6b5`.
- Initial and final `npm exec vue-tsc -- -b --pretty false` coverage - passed; the final production build also reran the TypeScript project build after the detail-clear change.
- Node `assert` + Vite SSR + Pinia + Axios adapter stdin probe - final run passed 10 deterministic list/detail scenarios: exact auth-bound routes, list and same-ID single-flight, cache/force behavior, API total preservation, A-B-A reuse, current errors, detail close, empty-ID rejection without HTTP, synchronous token reset, stale 401 suppression, and same-ID cross-session record identity. The first run's only failure was PowerShell stdin encoding of a Chinese expected literal; the product value was correct and the Unicode-escaped full rerun passed.
- `backend/.venv/Scripts/python.exe -m unittest tests.test_template_system` - passed all 9 owner, ordering, detail, delete/use, persistence, and in-memory template contract tests.
- `npm run build` - passed; `vue-tsc` completed and Vite transformed 4,663 modules.
- Standard actual-diff review - security/API-contract and architecture/concurrency specialist passes plus root review completed with no findings; all three untracked module files were read explicitly because ordinary unstaged diff output omits them.
- Final staged review covered the exact six owned paths and a non-empty diff. `git diff --cached --check` passed; no repository secret scanner was found, and the redacted staged credential-pattern scan reported 0 candidates.
- Caller, auth/session, backend contract, and test-surface searches plus complete relevant source reads - confirmed the default-cache compatibility boundary and the query/session state machine implemented above.
- Initial `npm exec vue-tsc -- -b --pretty false` - exposed TS2454 for a closure-captured request record; replaced it with a monotonic request identity. Final typecheck passed.
- Node `assert` + Vite SSR + Pinia + Axios adapter stdin probe - final run passed 7 deterministic scenarios: exact params, identical-query single-flight/cache, different-query ordering, A-B-A reuse, response metadata/boundary, current versus stale errors, token reset/stale suppression, and default-cache isolation. The earlier probe's only failure was PowerShell stdin encoding of a Chinese expected literal; the product value was correct and the ASCII-safe rerun passed.
- Final `npm run build` - passed; `vue-tsc` and Vite transformed 4,663 modules.
- Standard fresh diff review - architecture and security specialists completed; one stale return-contract issue was fixed and re-review reported no findings.
- Final `git diff --check` passed. No repository secret scanner was found; the redacted staged credential-pattern scan covered all 4 owned paths with 0 candidates, and the staged diff was clean and non-empty.

## Blockers And Release Conditions

- No T4-009 Human gate or dependency blocker is currently known.
- Single-flight task-list inspection was unavailable for this run. Release condition for staging/commit remains an unchanged `main`/base HEAD/index and no Git operation or unmerged path at the pre-commit recheck.
- Full browser and real API/MySQL acceptance are intentionally deferred until UI behavior exists; they are completion gates, not blockers for the next domain slice.
- No push is authorized. T4-005 Unit B paid provider smoke and residual T4-008 local-data cleanup remain out of scope.
