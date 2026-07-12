# REPORT T4-013 - Full E2E, Visual QA, Security And Documentation Closure

- Status: `DONE - PASS`
- Completed: 2026-07-12
- Owner: Codex Project Lead Engineer
- Delivery mode: `CODEX_DIRECT_DELIVERY`

## Outcome

T4-013 closes Phase 4 with a repeatable Chromium E2E harness, responsive visual coverage, fresh backend and disposable-MySQL verification, repository/index secret hygiene, and reconciled durable documentation. The authenticated browser workflow covers password login, project creation, Canvas nodes and connections, generation success and failure, success-only quota consumption, asset visibility, reload, and session restoration.

The final verdict combines evidence classes instead of treating them as interchangeable. Browser business responses are stateful mocks; current-head schema checks use an isolated disposable MySQL database; retained-runtime persistence and restart evidence comes from completed real-service Tasks; Agnes provider evidence comes from the separately authorized T4-005 real smoke. No new paid call or destructive cleanup was required.

## Delivered

- Added `@playwright/test`, production-preview configuration, and an ignored browser evidence directory.
- Added one authenticated stateful-mock workflow for project, Canvas, generation success/failure, quota, asset, reload, and session restoration behavior.
- Added Login, Home, Workspace, and Space checks at 1440x900, 920x900, and 375x900 with visibility and horizontal-overflow guards.
- Corrected three evidence-proven Workspace responsive defects:
  - desktop inspector tab selection no longer opens the mobile drawer above the mobile breakpoint;
  - the desktop inspector is hidden at and below 920px;
  - the status heading clears the 76px tool rail.
- Captured and visually inspected 12 sanitized screenshots under ignored `output/playwright/t4-013-responsive/`.
- Completed final tracked/index secret hygiene and documentation reconciliation.

## Evidence Classification

| Class | Evidence | Claim boundary |
|---|---|---|
| Unit/regression | Fresh backend `.venv` suite passed 189/189; focused MySQL/runtime selection passed 12/12 | Backend logic, migrations, error paths, SQLite rollback, and store/API regressions |
| Disposable MySQL integration | Isolated database upgraded to Alembic head `e9f1a2b3c4d5`; 14 app tables, 118 columns, 18 FKs, and zero empty table/column comments; isolated test database removed by its tested lifecycle | Current-head schema, comments, constraints, and migration behavior; not retained user records |
| Stateful mock browser | Chromium suite passed 4/4; authenticated workflow plus responsive matrix and 12 reviewed screenshots | Frontend routing, rendering, interaction, success/failure UI, quota semantics, reload, and responsive layout; not a live backend/provider claim |
| Real local service / retained MySQL | T4-003, T4-008, T4-009, T4-011, and T4-012 reports record real FastAPI/MySQL/API/browser reads, writes, reloads, backend restarts, schema comments/FKs, and retained business records | Real runtime persistence, restart, API-to-MySQL agreement, Canvas and asset behavior at the verified revisions |
| Real external service | T4-005 records explicitly authorized Agnes text/image/video success plus runtime MySQL GenerationTask/asset linkage and a controlled persisted failure | Real provider and generation persistence only; no new provider call in T4-013 |
| Deferred current-runtime repetition | Process-only preflight found no `REVID_DB_*` runtime settings and no configured listener on 8000/5173/9099; `.env` was not opened | No claim that retained runtime records were freshly re-read during T4-013; release requires process-supplied settings or an already configured backend |

## Verification

| Check | Result |
|---|---|
| Backend full regression | PASS; final closure rerun 189/189 in 46.725 seconds using repository `.venv` |
| Focused migration/runtime regression | PASS; 12/12 |
| Disposable MySQL Alembic/schema/comments/FK matrix | PASS |
| Frontend production build | PASS; final closure rerun transformed 4,702 modules |
| Chromium E2E | PASS; final closure rerun 4/4 in 7.6 seconds |
| Responsive visual matrix | PASS; Login, Home, Workspace, and Space at all three target widths |
| Repository/index secret hygiene | PASS; sanctioned sanitized `.env.example` only, zero high-confidence tracked credential findings, empty index before closure staging |
| Local database artifact tracking | PASS; no tracked `*.db`, `*.sqlite`, or `*.sqlite3` |
| Diff whitespace checks | PASS before final documentation closure |

## Acceptance Criteria

| Criterion | Verdict |
|---|---|
| Backend full tests and MySQL integration | PASS |
| Frontend build and browser E2E | PASS |
| Happy and failure paths | PASS; mock browser behavior reconciled with real provider/runtime persistence evidence |
| Navicat-equivalent tables, comments, FKs, and business records | PASS; fresh disposable schema matrix plus retained real-MySQL record matrices in dependency reports |
| Secret and Git hygiene | PASS |
| CURRENT, ROADMAP, Task, PROGRESS, REPORT, and source agree | PASS after closure reconciliation |
| SQLite preserved and no unauthorized destructive MySQL cleanup | PASS |

## Safety And Residual Follow-Ups

- No `.env` or secret file was opened, and no credential value or credential-bearing URL was recorded.
- No paid provider call ran in T4-013.
- No user or production database was dropped, truncated, reset, downgraded, or destructively cleaned. Only the test-owned disposable integration database used its existing cleanup lifecycle.
- SQLite support remains covered by regression and was not deleted.
- Forty-five pre-existing root `.playwright-cli/*.yml` snapshots and ignored QA output remain preserved and excluded from commits.
- The backend direct-registration 72-byte password boundary and stable asset ordering for tied timestamps remain separate follow-ups; neither invalidates the verified Phase 4 workflow.
- A fresh retained-runtime re-inspection remains available when process-only runtime configuration is supplied, but it is not a missing non-deferred acceptance criterion because retained real-service evidence already covers the required persistence and restart contracts.

## Final Verdict

`T4-013 DONE - PASS`. All Phase 4 roadmap Tasks are complete within their recorded evidence boundaries. No next implementation Task is dependency-ready.
