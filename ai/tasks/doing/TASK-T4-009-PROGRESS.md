# T4-009 Progress - Real-data Space asset workspace

- Task: `T4-009`
- State: `DOING`
- Updated: 2026-07-11
- Plan: `ai/tasks/doing/TASK-T4-009-PLAN.md`
- Source Task: `ai/tasks/todo/TASK-T4-009.md`

## Current Bounded Unit

Unit 1 - durable planning and read-only frontend/backend/design/test contract audit. This unit is complete; no T4-009 business code was edited.

## Completed Work

- Completed the required run read set: AGENTS, direct-delivery operating model, CURRENT, ROADMAP, active Task, linked direct-delivery ADR, and automation cursor.
- Attempted the Codex task-list single-flight check; the query did not return and was terminated without repository or Git mutation. The run therefore uses the required branch/HEAD/index drift guard.
- Recorded a clean starting Git baseline on `main` at `f0327cb1a490908e438cb7e23dc8fb26599d1599`: no staged, modified, untracked, or unmerged paths were reported.
- Created the T4-009 PLAN and this PROGRESS document before business-code edits.
- Read the complete 983-line current Space implementation, asset API/store/types, auth/quota state, project API/store/navigation, router, App shell, relevant Home/Workspace patterns, design tokens, Naive UI overrides, and `ui/design-system.md`.
- Traced the complete asset/template routes, schemas, models, both store implementations, focused backend tests, quota `/me` path, admin hidden behavior, and project navigation contract.
- Locked the T4-009 product and visual direction in PLAN using the repository's existing dark design vocabulary and component-scoped SCSS strategy.

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

- Implement the independent paginated Space asset collection without changing the existing default recent-asset cache.
- Add the template domain module, then detail/mutation clients in later bounded slices.
- Replace the Space prototype with local real-data components and complete accessibility, failure, responsive, real-data, and browser acceptance.
- Implement and verify Units 2-5 from the PLAN; write REPORT only after all acceptance criteria pass.

## Exact Next Action

Implement the first Unit 2 sub-slice in `frontend/src/types/asset.ts`, `frontend/src/api/assets.ts`, and `frontend/src/store/assets.ts`: add an independent query-aware paginated Space collection that preserves API metadata, deduplicates only identical queries, rejects stale query/session responses, resets synchronously on token change, and leaves the existing Home/Workspace default cache contract unchanged. Do not edit Space or template UI in that slice.

## Files Changed

- `ai/tasks/doing/TASK-T4-009-PLAN.md` - added the Task delivery plan and acceptance matrix.
- `ai/tasks/doing/TASK-T4-009-PROGRESS.md` - recorded the completed contract audit, verification, remaining work, and exact next action.
- `ai/state/CURRENT.md` - rolled the active Task snapshot from TODO planning to DOING after Unit 1.
- `ai/state/ROADMAP.md` - advanced T4-009 from TODO-NEXT to DOING.

## Commands And Summarized Results

- Codex task list query for the automation ID/title - timed out with no result; no write occurred.
- Required `Get-Content -Raw` reads - completed for all currently linked active documents and ADR.
- Git baseline commands (`status`, unstaged/staged diffs, unmerged paths, branch, HEAD) - clean `main`, HEAD `f0327cb1a490908e438cb7e23dc8fb26599d1599`, no reported index or worktree paths.
- Source inventory and contract searches with `rg`, complete file/chunk reads, and line count - mapped the frontend/backend contracts above; Space measured 983 lines.
- `python -m unittest tests.test_asset_upload tests.test_template_system tests.test_quota_flow` - 29 temporary-SQLite/FastAPI contract tests passed in 11.966 seconds; no real database or external service used.
- `npm run build` - passed; `vue-tsc` and Vite transformed 4,663 modules.

## Blockers And Release Conditions

- No T4-009 Human gate or dependency blocker is currently known.
- Single-flight task-list inspection was unavailable for this run. Release condition for staging/commit is an unchanged branch/HEAD/index and no Git operation or unmerged path at the pre-commit recheck.
- Full browser and real API/MySQL acceptance are intentionally deferred until UI behavior exists; they are completion gates, not blockers for the next domain slice.
- No push is authorized. T4-005 Unit B paid provider smoke and residual T4-008 local-data cleanup remain out of scope.
