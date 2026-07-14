# REPORT-T5-008 - Canvas first-acceptance certification

- State: `DONE - PASS`
- Date: 2026-07-14
- Baseline: `f7c885e8e1ef3c0984cccdaf422c65eb72ca298a`

## Outcome

The Canvas milestone is certified through the existing guarded backend/static/mock-browser evidence plus an owned production FastAPI + Vite + Chromium + disposable-MySQL run. No user/runtime schema was changed, no paid provider was called, and the generated schema, processes, ports, and runtime directory were cleaned by the supervisor.

Latest retained evidence: `output/playwright/t5-008-live/t5008-22080-200bbfd4bd11de8f/summary.json`.

## Live evidence

- Four serial live tests passed across pre-restart and post-restart phases.
- Project atomically created its default `画布 1`; metadata duplicate/rename/reorder and stale order revision returned the expected 409 without partial order change.
- A disposable MySQL document contained exactly 200 nodes and 300 unique non-self-loop connections; duplicate Canvas IDs were remapped; viewport and graph checksum survived backend restart.
- Idempotent retry returned the original result; a stale base revision returned 409; final graph revision was 3.
- Live performance: stable render 189 ms, 59.87 FPS, frame p95 16.8 ms, pointer p95 0.1 ms, 0 interaction long tasks over 200 ms.
- Live responsive captures covered 1440x900, 1366x768, 920x900, and 375x812; mobile exposed review-only controls and no graph delete/arrange actions.
- Anonymous and non-owned project access was rejected; backend health and preview readiness used an exact run-scoped identity handshake.

## Regression evidence

- Backend: `438 passed, 61 subtests passed`.
- Chromium: `131 passed` using `playwright.ci.config.ts` with an explicitly owned Vite preview process. The repository `playwright.config.ts` remains the interactive self-starting config; the CI config avoids a Windows npm child-process teardown hang.
- Production build: `4,766 modules`.
- Focused Canvas browser checks: `22 passed`.
- Harness/helper focused checks: `72 passed, 10 subtests passed`.
- `compileall`, `git diff --check`, UTF-8/no-BOM scan, and sensitive-path review passed. Existing historical files over 500 lines were not changed; all new/changed implementation files remain within the project limit.

## Evidence classification and limits

The acceptance matrix remains authoritative for whether a criterion is backend (`B`), mock-browser (`M`), static/visual (`S`/`V`), or live (`LIVE`). Provider calls remain mock-only by explicit policy. No real credentials, user/runtime migration, destructive database operation, or paid API call was used.

## State reconciliation

T5-008 Task, PLAN, PROGRESS, CURRENT, ROADMAP, and this REPORT agree on `DONE - PASS`; T5-009 is the next active product task.
