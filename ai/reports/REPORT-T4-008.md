# REPORT T4-008 - Real-Data Home Project And Asset Dashboard

- Status: `PASS`
- Completed: 2026-07-11
- Owner: Codex Project Lead Engineer
- Delivery mode: `CODEX_DIRECT_DELIVERY`

## Outcome

Revid Home is now an authenticated real-data project dashboard backed by the existing project, asset, quota, and MySQL contracts. It supports explicit empty/loading/error/partial/refresh/create states, immediate project creation, reload and backend-restart persistence, responsive layouts, session isolation, and Workspace navigation with the exact backend project ID.

All non-deferred acceptance criteria passed. No backend business code or migration source was changed by T4-008. The Human Owner authorized applying the existing additive `e9f1a2b3c4d5` migration to local `revid_db` so final real-service acceptance could run.

## Implementation

| Area | Delivered |
|---|---|
| Project domain | Exact list/create contracts plus generation-safe load, refresh, create, duplicate-request, error, and synchronous session-reset behavior. |
| Asset domain | Complete list filters/envelope and required/nullability contracts, empty initial state, single-flight loading, refresh preservation, and stale cross-session suppression. |
| Credential binding | The shared request interceptor binds Authorization synchronously before a session switch can retarget a mutating request. |
| Home composition | `Home.vue` is 499 lines and delegates route header, projects, recent assets, quota summary, and project creation to five Home-local components. |
| UX states | Loading, empty, initial error, refresh error, partial data, zero quota, frozen generation, create success, and create failure are explicit. |
| Navigation | Existing and newly created projects enter Workspace with one scalar backend `project_id`; Home exposes no implicit demo Workspace link. |

## Repository Hygiene Recovery

Commit `1f9a4b0` mistakenly tracked 70 local browser/QA artifact paths. Human Owner authorized cleanup.

- Added narrow ignore rules for `/frontend/.playwright-cli/` and `/output/playwright/`.
- Removed the exact 70 paths from Git tracking with local files preserved.
- Verified the staged deletion set exactly matched the 70 paths introduced by `1f9a4b0`.
- Verified tracked artifact count `0`, missing local file count `0`, not-ignored count `0`, and credential-like added-line matches `0`.
- Created local commit `3b449b2 chore(repo): ignore local browser qa artifacts`.
- No history rewrite, artifact deletion, cleanup push, `git reset`, or `git clean` was performed.

## Authorized MySQL Migration

Preflight proved local database identity `revid_db`, starting revision `d8c5b9a4e2f0`, code head `e9f1a2b3c4d5`, and no partial `generation_tasks` table. Runtime credentials came only from the injected process environment and were never printed or persisted.

The existing migration was applied exactly once to target `e9f1a2b3c4d5`. Fresh post-checks passed:

| Check | Result |
|---|---|
| Alembic revision | PASS; current/head `e9f1a2b3c4d5` |
| `generation_tasks` | PASS; table exists with non-empty table comment |
| Column comments | PASS; 15 columns, 0 missing comments |
| Indexes | PASS; 7/7 expected indexes |
| Foreign keys | PASS; 4 FKs with `CASCADE` / `SET NULL` semantics |
| Collation | PASS; child `user_id` collation matches `users.id` |
| Initial rows | PASS; 0 rows after additive migration |

## Verification

### Automated And Build Checks

| Check | Result |
|---|---|
| `npm run build` | PASS; `vue-tsc -b` plus Vite build, 4,663 modules transformed |
| `Home.vue` line count | PASS; 499 lines |
| `git diff --check` | PASS |
| Cleanup exact-set and local-preservation checks | PASS; 70/70 exact, 0 tracked, 0 missing, 0 outside authorized trees |
| Migration schema inspection | PASS; revision, comments, indexes, FKs, collation, and row baseline verified |

### Real Local-Backend/MySQL Matrix

The acceptance runtime used real FastAPI, real local MySQL `revid_db`, and a headed Chromium session at `http://localhost:9099`. No `.env` file was opened, no paid provider call was made, and no credential value or bearer token was written to tracked evidence.

| Scenario | Result |
|---|---|
| Fresh account and empty Home | PASS; zero projects/assets and default quotas `100/20/3` rendered |
| Project creation | PASS; `T4-008 Acceptance 20260711-1646` inserted immediately with ID `8836c578-2db1-4624-a55d-e4bdfb25bf98` |
| Reload persistence | PASS; the same ID/name remained after browser reload |
| Backend restart persistence | PASS; the same project remained after stopping and restarting the owned backend process |
| Real API matrix | PASS; `/me`, `/projects`, and `/assets` returned 200 |
| API/MySQL cross-check | PASS; user, project ID/name/owner/timestamp, quotas, and asset count matched parameterized SQL reads |
| Real network outage | PASS; Home showed scoped project/asset errors while preserving the successful project data |
| Recovery | PASS; refresh returned to normal after backend restart |
| Workspace navigation | PASS; `/app/workspace` received exactly one scalar `project_id=8836c578-2db1-4624-a55d-e4bdfb25bf98` |
| Canonical console | PASS; 0 errors and 0 warnings after recovery on a fresh page |

The owned Playwright session, backend process, and Vite process were stopped after acceptance; local ports 8000 and 9099 were confirmed closed.

The first browser bootstrap used `127.0.0.1:9099` against the frontend's `localhost:8000` API base and produced expected CORS setup errors. That page was discarded; canonical acceptance reran from `localhost:9099` on a fresh page. Two local `t4008_*` acceptance users remain because deleting test users was not authorized; only `t4008_mrg4c7ae` owns the acceptance project.

### Responsive And Visual Acceptance

| Viewport | Result |
|---|---|
| 1440x900 | PASS; `scrollWidth=1440`, no horizontal overflow, project and quota hierarchy visually correct |
| 920x900 | PASS; `scrollWidth=920`, balanced stacked layout and no clipping |
| 375x812 | PASS; `scrollWidth=360 <= 375`, project card/ID wrap cleanly and actions remain usable |
| Keyboard | PASS; first Tab focused `返回 Revid 首页` with solid 3px outline |
| Visual inspection | PASS; all three canonical captures showed readable copy, stable spacing, and no layout regression |

Canonical screenshot evidence:

- `output/playwright/t4-008-slice-c/.playwright-cli/page-2026-07-11T08-48-13-225Z.png`
- `output/playwright/t4-008-slice-c/.playwright-cli/page-2026-07-11T08-48-35-240Z.png`
- `output/playwright/t4-008-slice-c/.playwright-cli/page-2026-07-11T08-48-54-374Z.png`

Prior Slice B2 mocked browser evidence remains applicable for zero-quota, create-error, partial API failure, loading-without-empty-flash, and cross-session draft reset states; no Home business code changed during final real-service acceptance.

## Acceptance Criteria

| Criterion | Verdict |
|---|---|
| MySQL projects/assets match Home | PASS |
| Project creation updates immediately and survives refresh | PASS |
| Empty, API failure, and zero-quota states | PASS; real empty/failure plus prior focused zero-quota evidence |
| Production build | PASS |
| 1440x900, 920px, and 375px browser checks | PASS |
| `Home.vue` at most 500 lines | PASS; 499 |
| Workspace receives explicit project ID | PASS |

## Safety And Residual Work

- No repository `.env` or secret file was opened.
- No credential value, bearer token, Authorization header value, or secret-bearing URL was written to tracked docs or logs.
- No migration downgrade, destructive SQL, paid Agnes call, external account call, push, history rewrite, or artifact deletion occurred.
- The two local acceptance users and one acceptance project remain in `revid_db`; deleting them requires a separate explicit destructive-data authorization.
- T4-005 Unit B remains a separate paid-call Human gate.
- The backend direct registration API 72-byte password boundary remains a separate engineering follow-up.

## Final Verdict

`T4-008 DONE - PASS`. T4-009 is dependency-ready and selected as the next Task; no T4-009 business code was started in this closeout.
