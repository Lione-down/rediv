# T4-009 Progress - Real-data Space asset workspace

- Task: `T4-009`
- State: `DOING`
- Updated: 2026-07-11
- Plan: `ai/tasks/doing/TASK-T4-009-PLAN.md`
- Source Task: `ai/tasks/todo/TASK-T4-009.md`

## Current Bounded Unit

Unit 3, sub-slice 2 is complete. The prototype Space page is now a real-data controller with domain-local presentation components, guarded template-created-project recovery, native keyboard-reachable view switching and pagination, and verified responsive loading/error/empty/boundary behavior. Destructive actions and complete real media URL/load fallback remain in Unit 4.

## Completed Slice Design

- Keep `Space.vue` as the page-level coordinator for authenticated loading, native assets/templates/quota view switching, asset query state, detail selection, and canonical Workspace navigation. It remains at most 500 lines.
- Add prop-driven local components for the asset list/filter/pagination states, basic type-aware asset preview, template list/use states, quota remaining-count states, and a focus-managed asset/template detail drawer. Presentation helpers remain inside the Space subtree.
- Load assets, templates, and `/me` quota data independently so one failed surface does not hide successful data. Preserve API totals and explicit initial-loading, retained-data error, empty, and out-of-range boundary behavior.
- Reset asset page to one when the type filter changes, and recover any now-invalid page to the last valid page after a successful response, including a zero-result refresh. Asset project actions use `{ name: 'workspace', query: { project_id } }`; template use persists the exact returned project result before route navigation.
- Do not expose asset or template deletion in this slice. Basic prompt/image/video differentiation uses stable labelled placeholders; complete real URL rendering/load fallback, deletion confirmation, and mutation refresh acceptance remain Unit 4 work.
- Use the existing component-scoped SCSS and Naive UI dark theme, with near-black canvas, luminance-stepped surfaces, restrained violet selection, transform/opacity feedback, reduced-motion handling, and no global token or dependency change.

## Completed Work

- Replaced the 986-line prototype `Space.vue` with a 479-line real-data page controller and nine local Space presentation/style files, all below 500 lines. Removed mock storage, hard-coded history/results, false totals, and unsupported capacity/availability claims.
- Wired the independent Space asset collection to type filters, API pagination, retained-data errors, initial/empty/out-of-range states, detail selection, and canonical project navigation. A zero-result refresh from a later page now deterministically returns to page one.
- Wired real template list/detail/use and `/me` quota reads as independent surfaces. Quotas remain three non-fungible remaining counts; the overview reports available types instead of inventing a total or percentage.
- Persisted a successful template-use result in the route-independent template store. Component revision guards suppress stale navigation after leaving Space, re-entry exposes a recoverable created-project notice, navigation failures preserve the exact project ID, mutation errors are owned by template ID, and unmount clears detail controllers.
- Replaced inaccessible Naive pagination and tabs from the installed version with native buttons. The three view buttons expose pressed/control relationships to persistent labelled regions; pagination, filters, drawer naming, bounded accessible labels, focus visibility, reduced motion, text contrast, and long-content wrapping were reviewed and corrected.
- Completed Deep self-review plus independent security, architecture/concurrency, and UI/accessibility reviews. All findings were fixed; final architecture/concurrency and UI/accessibility re-reviews returned CLEAN.
- Final mocked Chromium QA passed native Enter/Space view switching, Enter pagination, zero-result page correction, retained created-project recovery after stale completion, exact Workspace project navigation, 320px no-overflow checks, 375px and 1440px screenshots, and 0 console errors/warnings. Production build passed with 4,689 modules transformed.
- Extracted the asset detail/delete refs, request registries, stale-settlement guards, and actions into `frontend/src/modules/asset/detail-controller.ts`. The asset store still owns default/Space collection invalidation and refresh, exposes the same refs/actions/resolved values, and is now 353 lines.
- Extracted template delete/use refs, per-ID delete registry, non-idempotent global use lock, request/session guards, and actions into `frontend/src/modules/template/mutation-controller.ts`. The template store still owns list/detail cache invalidation; after this slice's created-project recovery extension, the store/controller are 376/256 lines.
- Extended the Task's allowed additions narrowly to `frontend/src/modules/asset/**` after Deep architecture review rejected a first-pass global-store import from `views/**`. The helper was moved to the domain layer; architecture re-review returned `RESOLVED`, security returned no finding, and the root adversarial pass found no remaining dependency, mutation, session, or partial-refresh hard stop.
- Verified the extraction with a fresh TypeScript project build, 6 initial and 4 post-review Vite/Pinia/Axios runtime scenarios, and a final production build that transformed 4,664 modules. Coverage included A-B-A request reuse, empty-ID ownership, auth reset, asset soft-delete refresh, stale template-list suppression, hard-delete detail clearing, and global template-use locking.
- Added locally validated, encoded asset detail and soft-delete clients plus independent selected-detail loading/error/cache state. Empty IDs reject before touching request ownership or issuing HTTP.
- Added asset detail and delete per-ID single-flight with latest-selection/request/session guards. A soft-delete applies the exact returned row, suppresses older detail/list settlements, clears matching detail, and refreshes each previously loaded default/Space collection; refresh failures remain collection errors and do not misreport a successful deletion as failed.
- Added the exact template use response type, 204 hard-delete client, and use client. Hard-delete removes the unpaginated row, clears matching detail, and invalidates any older list/detail request that could republish it.
- Added guarded template delete/use mutation state and synchronous token reset. Delete permits different IDs while keeping only the latest visible loading/error owner. Template use is global single-flight because each POST creates a project without backend idempotency: identical IDs reuse one result and different IDs reject locally with a visible busy error before HTTP.
- Extended the template list flow with request identity so a list started before a successful hard-delete cannot restore the deleted row. All detail/delete/use actions now validate IDs before changing latest/active state.
- Completed a Deep fresh review. Security reported no finding. Concurrency found silent multi-project creation and invalid-ID ownership theft; both were fixed and deterministic re-probes passed. Architecture confirmed the use contract after PLAN/PROGRESS reconciliation and identified the two enlarged stores as structural debt for the next allowed-path extraction.
- Final focused evidence passed: the original runtime probe covered 9 asset/template detail, mutation, invalidation, auth, and empty-ID scenarios; fix probes covered 4 request-ownership/global-lock scenarios and 3 final busy-state/result scenarios; 22 backend asset/template contracts and the 4,663-module production build passed.
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
- The earlier asset-query sub-slice kept `frontend/src/api/assets.ts` unchanged because it already forwarded query params and preserved the full typed list response. This mutation slice adds only detail/delete clients and still introduces no duplicate list wrapper or metadata-unwrapping abstraction.
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

- The former prototype-only `profile/assets/history/results` views, mock storage, three-row cache display, and false current-page total have been removed. Native asset/template/quota views now expose the real store states; deletion and full media load fallback remain intentionally absent until Unit 4.
- Global custom variables remain light while Naive UI and `ui/design-system.md` define dark surfaces. Because global-token edits are forbidden, Space uses component-scoped dark surface values plus existing Naive UI theme behavior.
- Frontend has no unit-test framework. The Task will not add one; verification will use `npm run build`, focused temporary-SQLite backend tests, and mocked/real browser probes for the slices that expose UI behavior.
- Focused contract verification passed: 29 asset/template/quota backend tests using temporary SQLite and FastAPI TestClient.
- The current frontend production build passed: `vue-tsc -b && vite build`, 4,689 modules transformed.

## Remaining Work

- Unit 4: render usable real image/video URLs when available, convert missing/relative/load-error media into stable accessible fallbacks, and add asset/template deletion with explicit confirmation plus contract-accurate collection/detail refresh behavior.
- Unit 5: run authorized local real API/MySQL comparisons and final 1440x900/920px/375px browser acceptance across media, mutations, refresh, console, and network behavior.
- Write REPORT only after all Task acceptance criteria pass.

## Exact Next Action

Implement Unit 4's real media rendering/fallback and confirmed asset/template deletion flows, preserving current controller/component boundaries; then verify load failures, mutation ownership, collection/detail refresh semantics, keyboard behavior, TypeScript, build, and responsive browser edges.

## Files Changed

- `frontend/src/modules/asset/detail-controller.ts` - owns the extracted guarded asset detail/delete state machine behind injected collection callbacks.
- `frontend/src/modules/template/mutation-controller.ts` - owns the extracted template delete/use state machine and non-idempotent use lock.
- `frontend/src/api/assets.ts` - added locally validated, encoded detail and soft-delete clients.
- `frontend/src/store/assets.ts` - retains asset collection ownership and delegates detail/delete state while preserving its Pinia contract.
- `frontend/src/modules/template/types.ts` - added the exact use response contract.
- `frontend/src/modules/template/api.ts` - added validated 204 delete and project-creating use clients while preserving detail rejection behavior.
- `frontend/src/modules/template/store.ts` - retains list/detail cache ownership and delegates delete/use state while preserving its Pinia contract.
- `frontend/src/views/app/Space.vue` - coordinates real asset/template/quota loading, native view switching, detail state, project navigation, and created-project recovery in 479 lines.
- `frontend/src/views/app/components/space/**` - provides the nine scoped asset, template, quota, preview, drawer, notice, presentation, and page-style files.
- `ai/tasks/todo/TASK-T4-009.md` - records the narrow asset-domain helper addition required by architecture review.
- `ai/tasks/doing/TASK-T4-009-PLAN.md` - marks the extraction slice complete and records the corrected domain boundary.
- `ai/tasks/doing/TASK-T4-009-PROGRESS.md` - records the extraction, verification, review fix, remaining work, and exact next action.
- `ai/state/CURRENT.md` - rolls the active Task snapshot and worktree ownership forward with this unit.

## Commands And Summarized Results

- This slice started clean on `main` at `cf56c05f405115acb4766e27c28e71f6f6643ce5`, ahead of `origin/main` by seven commits, with no staged/modified/untracked/unmerged paths, detached HEAD, or Git operation. The task-list query timed out without mutation, so branch/HEAD/index drift guards remain mandatory through commit.
- `npm exec vue-tsc -- -b --pretty false` and repeated `npm run build` runs passed after each review fix; the final production build transformed 4,689 modules.
- Playwright CLI mocked-browser QA passed the full final assertion script at 320px: native view and pager keyboard operation, zero-result boundary correction, stale navigation suppression, store-persisted created-project recovery, and exact returned project navigation. `innerWidth`, document `scrollWidth`, and body `scrollWidth` were all 320 for asset and long-template states.
- Final Chromium screenshots were captured at 375x900 and 1440x1000 under `output/playwright/t4-009-unit3/.playwright-cli/`; the final Space session reported 0 console errors and 0 warnings. This is mock evidence, not real API/MySQL evidence.
- Deep review fixed stale template navigation, lost successful creation recovery, current-total semantics, owner-scoped drawer errors, lifecycle detail cleanup, inaccessible Naive controls, unreachable error rendering, zero-total pagination, contrast, long content, and ARIA ID relationships. Final architecture/concurrency and UI/accessibility re-reviews returned CLEAN; security found no remaining issue.
- All current implementation files are below 500 lines (`Space.vue` 479; largest local component 459), and `git diff --check` passed before durable-state reconciliation.
- Final staged review covered exactly 15 owned implementation/state paths with no unstaged remainder. The repository has no secret scanner; the redacted credential-pattern scan reported 0 candidates, `git diff --cached --check` passed, and the staged diff was non-empty.
- Required documents, automation cursor, and Git baseline - completed; this slice started clean on `main` at `a39731f7567ffc9c32e7b232a3c7463e8927959f` with empty staged/modified/untracked/unmerged state and no Git operation. The Codex task-list query did not return and was terminated without mutation, so branch/HEAD/index drift guards remain mandatory.
- `npm exec vue-tsc -- -b --pretty false` - passed before and after the architecture path correction.
- Node `assert` + Vite SSR + Pinia + Axios adapter probes - passed 6 initial extraction scenarios and 4 post-review scenarios covering request reuse, stale/session guards, mutation invalidation, refresh, and global template-use single-flight.
- `npm run build` - passed before and after the architecture correction; the final Vite run transformed 4,664 modules.
- Deep current-diff review - security found no issue; architecture found one Medium store-to-view dependency reversal, which was fixed by moving the helper to `modules/asset/**`; architecture re-review returned `RESOLVED`; root adversarial review found no remaining hard stop.
- Extraction-checkpoint file-size and whitespace checks - asset/template stores were 353/355 lines, new helpers were 315/248 lines, and `git diff --check` passed for tracked paths before that unit's staging.
- Required documents, automation cursor, and Git baseline - completed; this slice started clean on `main` at `cce0e29bc10c8909bffa934c4c5806c3710bd287` with empty staged/modified/untracked/unmerged state and no Git operation. The task-list query timed out twice without mutation, so drift guards remain mandatory.
- Initial `npm exec vue-tsc -- -b --pretty false` and final `npm run build` - passed; the final production build transformed 4,663 modules.
- Node `assert` + Vite SSR + Pinia + Axios adapter probes - passed 9 original detail/mutation/invalidation/session scenarios, 4 ownership/global-lock fix scenarios, and 3 final template-use busy/error/result scenarios. One first final-probe assertion failed only because PowerShell stdin altered the Chinese expected literal; the ASCII-safe rerun compared the thrown message to store state and passed.
- `backend/.venv/Scripts/python.exe -m unittest tests.test_asset_upload tests.test_template_system` - passed all 22 detail, authorization, soft-delete, hard-delete/use, ordering, persistence, and in-memory contracts.
- Deep actual-diff review - security found no issue; concurrency found 2 high-confidence races and both were fixed; architecture's use-contract mismatch was reconciled, while the 616-line asset store and 571-line template store are explicitly routed to Unit 3's first extraction; root adversarial review found no remaining mutation, auth, path, stale-settlement, or cache-invalidation hard stop.
- Final `git diff --check` passed. The worktree diff contains only the 7 implementation/active-state paths owned by this slice before CURRENT reconciliation; line endings produced only Git's existing LF-to-CRLF working-copy warnings.
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
- Mock browser acceptance for Unit 3 is complete. Real API/MySQL comparison and final cross-width media/mutation acceptance remain Unit 5 completion gates, not blockers for Unit 4.
- No push is authorized. T4-005 Unit B paid provider smoke and residual T4-008 local-data cleanup remain out of scope.
- This slice started from clean `main` at `cf56c05f405115acb4766e27c28e71f6f6643ce5`, ahead of `origin/main` by seven commits, with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state. The task-list query did not return within the single-flight window, so unchanged branch/HEAD/index state is required before staging and commit.
