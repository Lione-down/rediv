# REPORT T4-009 - Real-Data Space Asset Workspace

- Status: `PASS`
- Completed: 2026-07-11
- Owner: Codex Project Lead Engineer
- Delivery mode: `CODEX_DIRECT_DELIVERY`

## Outcome

Revid Space is now a 497-line authenticated personal asset workspace backed by the existing asset, template, quota, project, and MySQL contracts. It provides independent real-data loading for assets, templates, and quota; asset type filters and API pagination; accessible prompt/image/video presentation; detail and Workspace navigation; template reuse; confirmed asset/template deletion; explicit loading, empty, retained-error, and boundary states; and responsive dark UI at all required widths.

All non-deferred acceptance criteria passed. T4-009 changed no backend code, migration, dependency, Home, Workspace, Canvas, or global design token.

## Implementation

| Area | Delivered |
|---|---|
| Asset domain | Independent response-shaped Space collection, query single-flight, A-B-A reuse, stale/session suppression, detail, soft-delete, collection invalidation, and page-boundary recovery without contaminating Home/Workspace's default cache. |
| Template domain | Owner-scoped list/detail, hard-delete, non-idempotent use lock, created-project recovery, list/detail invalidation, and synchronous auth-session reset. |
| Space composition | `Space.vue` coordinates real assets/templates/quota and delegates presentation to eleven Space-local files; all current scope files remain below 500 lines. |
| Media | Prompt content, generation-sourced absolute HTTPS image/video media with no URL userinfo, image `no-referrer`, compact non-interactive previews, detail-only video controls, and stable differentiated fallback. |
| Mutation UX | Detail-only soft/hard delete behind named cancel-first `alertdialog`; target-owned failures, refresh semantics, keyboard confirmation, reduced motion, and post-delete reload persistence. |
| Navigation | Asset project actions and template-use results pass the exact scalar backend `project_id` into the canonical Workspace route. |

## Verification

### Automated And Build Checks

| Check | Result |
|---|---|
| `backend/.venv/Scripts/python.exe -m unittest tests.test_asset_upload tests.test_template_system` | PASS; 22/22 owner, list/filter/pagination, detail, soft-delete/hidden, template hard-delete/use, and persistence contracts. |
| `npm run build` | PASS; `vue-tsc -b` and Vite production build transformed 4,693 modules. |
| Maintainability | PASS; `Space.vue` 497 lines; largest current Space-local file 459 lines; all scoped implementation files below 500. |
| `git diff --check` | PASS. |
| Deep fresh review | PASS; scope, security/trust boundaries, session/concurrency, mutation/error paths, API compatibility, accessibility, reduced motion, responsive behavior, and adversarial sequences reviewed with no Task hard stop. |

### Real Local-Backend/MySQL Matrix

The acceptance runtime used real FastAPI, local MySQL `revid_db` at Alembic revision `e9f1a2b3c4d5`, and headed Chromium at `http://localhost:9099`. Runtime credentials came only from the injected process environment; no `.env`, credential value, bearer token, paid provider, or external account was opened or recorded.

The isolated fixture account was `t4009_mrgisxgt`. Its normal API-created rows were compared with parameterized MySQL reads before and after browser mutations.

| Scenario | Result |
|---|---|
| Pre-mutation MySQL | PASS; 14 asset rows = 13 active + 1 hidden, active types prompt/image/video = 10/2/1, 2 templates, 1 project, quota 100/20/3. |
| Real API list/filter/page | PASS; visible total 13, page split 12+1, filter totals 10/2/1, template total 2, `/me` quota 100/20/3. |
| Detail/hidden semantics | PASS; active image/template detail matched fixture IDs; hidden asset detail returned 404 after the owned backend reloaded the out-of-band fixture transition. |
| Real media | PASS; HTTPS image decoded, video metadata and labelled controls loaded, Prompt content rendered, and upload-provenance relative media stayed in accessible fallback without a media request. |
| Asset soft-delete | PASS; cancel-first Tab/Enter confirmation, detail 404, visible total 12, invalid page 2 recovered to page 1, and reload did not restore the row. |
| Template use/delete | PASS; use created exactly one project and navigated with one scalar project ID; the second template hard-deleted to detail 404/list total 1 and remained absent after reload. |
| Post-mutation MySQL | PASS; 14 asset rows = 12 active + 1 deleted + 1 hidden, active types 9/2/1, 1 template, 2 projects, unchanged quota 100/20/3. |
| Runtime teardown | PASS; owned Playwright, backend, and Vite processes stopped; ports 8000 and 9099 closed. |

The MySQL `hidden` fixture transition was deliberately limited to the current run's owned row. `DatabaseStore.get_asset()` keeps an in-process detail cache, while list reads query MySQL; the owned backend was restarted once to synchronize that out-of-band fixture mutation. Normal backend hide/delete routes update both persistence and cache.

### Responsive And Browser Acceptance

| Viewport | Result |
|---|---|
| 1440x900 | PASS; document/body width 1425 <= 1440, three-column asset grid, hierarchy and media scan visually correct. |
| 920x900 | PASS; document/body width 905 <= 920, two-column grid, no clipping or crowded controls. |
| 375x900 | PASS; document/body width 360 <= 375, one-column grid, wrapped heading/status rail/filter/media/fallback remain usable. |
| Browser diagnostics | PASS; 0 unexpected console errors/warnings, 0 page errors, and 0 failed page API responses in final phases. |
| Keyboard/accessibility | PASS; native view/filter/pager controls, named regions/drawer, cancel-first destructive dialogs, Tab/Enter confirmation, accessible fallback reasons, and detail-only video controls. |

Canonical screenshots:

- `output/playwright/t4-009-unit5/space-real-1440.png`
- `output/playwright/t4-009-unit5/space-real-920.png`
- `output/playwright/t4-009-unit5/space-real-375.png`

## Acceptance Criteria

| Criterion | Verdict |
|---|---|
| Local MySQL asset/template rows match Space lists, filters, totals, and detail | PASS; parameterized MySQL and authenticated API/UI evidence agree. |
| Detail and soft-delete/hidden/hard-delete refresh semantics match API | PASS. |
| Production build | PASS; 4,693 modules. |
| 1440x900, 920px, and 375px browser checks | PASS. |
| `Space.vue` at most 500 lines | PASS; 497. |

## Safety, Residual Data, And Follow-Up

- No backend source, schema, migration, dependency, secret, `.env`, paid call, push, history rewrite, or user/production-data cleanup occurred.
- Local acceptance data remains in `revid_db` because broad cleanup was not authorized: one `t4009_mrgisxgt` user, 14 asset rows (12 active, 1 deleted, 1 hidden), 1 template, and 2 projects.
- Ignored evidence remains under `output/playwright/t4-009-unit5/`. One Playwright snapshot created in repository-root `.playwright-cli/` remains untracked because deleting or moving it was not authorized; it is excluded from the closure commit.
- Existing backend asset ordering has no deterministic tie-breaker when multiple MySQL `DATETIME` values are identical within one second. The acceptance fixture normalized one owned boundary timestamp so pagination behavior was deterministic. A future backend Task should order by `created_at` plus a stable secondary key; this pre-existing backend risk does not invalidate T4-009's frontend acceptance.
- T4-005 Unit B remains a separate paid-call Human gate. No push is authorized.

## Final Verdict

`T4-009 DONE - PASS`. T4-012 Unit A is the next dependency-ready delivery unit; no T4-012 business code was started during this closeout.
