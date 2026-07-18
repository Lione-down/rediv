# TASK-T5-092 Progress

- Task state: `VERIFYING`
- Active unit: `Unit 4 - Regression and closure`

## Completed work

- Verified T5-091 was already fully converged as `DONE - PASS`: Task, PLAN, PROGRESS, REPORT, CURRENT, ROADMAP, business commit `1f3077c`, closure commit `6799fdf`, and `origin/main` agree; no T5-091 history rewrite was required.
- Activated T5-092 from clean tracked baseline `2eaad1a` and locked no-fake-queue, no-provider-POST-retry, no-secret, no-paid-call, no-user/runtime-migration, and 375px review-only boundaries before business edits.
- Replaced Canvas-wide generation blocking with node/task-scoped local runtime ownership. Distinct image/video nodes stay editable and executable, while one source node remains single-flight with accessible node-local feedback.
- Added one UUID4 client request ID per explicit frontend action, canonical SHA-256 request fingerprints, user-scoped uniqueness, deterministic active/mismatch/terminal outcomes, and successful-result replay without a second provider call or quota debit, including replay after the original request exhausts quota.
- Added commented generation-task fields, singleton MySQL admission guard, Alembic head `a3b4c5d6e7f8`, stale active-task reconciliation, and atomic global/per-user/per-media admission across competing database connections. Busy requests fail before task/provider/quota/asset mutation with bounded `Retry-After`.
- Aligned Agnes `httpx` pool/connect/pool/read/write limits with backend settings, closed/recreated the shared provider through lifespan, classified local saturation, pool/connect/read/write timeout, provider 429/503, and safe numeric `Retry-After`, and added no creation-POST retry.
- Preserved T5-091 ordinary/cinematic handoff, acknowledgement snapshot, task/quota/result authority, stale auth/project/Canvas guards, pending result projection, and response-scope validation for concurrent requests.
- Split request-start responsibilities into `generation_starts.py`; `generation_transactions.py` remains the compatibility/public transaction surface and both controllers are below 500 lines.
- Updated exact-payload regression tests to require the new request ID and changed the former Canvas-global Storyboard lock expectation to the T5-092 node-local concurrency contract.

## Remaining work

- Exact-stage, review, commit, and push the verified business delivery.
- Write `REPORT-T5-092.md`, mark Task/PLAN/PROGRESS/ROADMAP `DONE`, roll CURRENT to idle, then commit and push closure state.

## Exact next action

Stage only the T5-092 implementation, tests, PLAN/PROGRESS, CURRENT, ROADMAP, and Task files; inspect the staged diff and sensitive paths; commit/push the business delivery.

## Files changed

- State/docs: `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`, `ai/tasks/todo/TASK-T5-092.md`, `ai/tasks/doing/TASK-T5-092-PLAN.md`, `ai/tasks/doing/TASK-T5-092-PROGRESS.md`.
- Backend APIs/controllers/core: generation common/image/text/video endpoints, generation errors/records/reservations/starts/transactions/store, Agnes provider, request fingerprinting, task utilities, lifespan, and settings.
- Backend persistence/contracts: `generation_task.py`, `agnes_admission_guard.py`, model exports, generation schemas, and migration `a3b4c5d6e7f8_add_generation_idempotency_admission.py`.
- Backend tests: focused idempotency/admission/migration/provider/lifespan tests plus adjacent cinematic, concurrency, restart, migration-head, asset, schema, and security regressions.
- Frontend runtime/contracts: Canvas generation actions/runtime/resource experience/shot schema, generation service/task types, and legacy Workspace request entrypoint.
- Frontend tests: focused concurrent generation/service fixtures and exact request payload regressions across authenticated, operation, retry, remix, resource, branch, selection, Storyboard, and visual recipe paths.

## Commands run and summarized results

- Required document/Git audit: T5-091 closure consistent; `HEAD` and `origin/main` stayed at `2eaad1a` throughout implementation; unrelated `.codex/`, `.hermes/plans/`, and `output/` remained untracked and untouched by source staging.
- Focused final backend: `11 passed`; related backend matrix after controller split: `58 passed`; full backend before the final responsibility-only split/order hardening: `519 passed, 116 subtests`.
- Focused Chromium generation service/concurrency: `10 passed`; final affected 81-test matrix: `80 passed`, then the sole explicit-retry request-ID expectation was corrected and isolated `1 passed`.
- Functional Chromium excluding only the separately guarded 200/300 FPS title: `496 passed, 1` unrelated timing-sensitive provenance assertion; the unchanged provenance title passed immediately in isolation (`1 passed`). Effective functional coverage is exhaustive and green after retry, with the fluctuation retained transparently.
- Production frontend build: `4,926 modules transformed`, pass. Python compileall, `git diff --check`, migration-head, UTF-8/no-BOM, new-file <=500-line, and HEAD-drift checks passed.
- Disposable guarded MySQL migration/admission evidence passed; `alembic heads` returned the single head `a3b4c5d6e7f8`. No user/runtime migration ran.
- Guarded 200-node/300-connection title retained its unchanged thresholds but failed fresh SwiftShader/no-hardware-acceleration runs (full matrix `49.06 FPS`; isolated `35.31 FPS` and `33.29 FPS`, versus required `>=55`). Companion performance/accessibility/viewport titles passed. This is classified as software-rendered mock-browser evidence, not reported as a pass and not used to claim a real Canvas or Agnes capacity regression.

## Blockers and release conditions

- No implementation or delivery blocker.
- The guarded SwiftShader-only FPS title is an explicit non-passing environment classification with unchanged thresholds; T5-091's retained 56.35 FPS / 16.8ms p95 baseline remains the latest passing same-title evidence. T5-092 does not alter renderer reconciliation, edge/minimap, pointer, or graph hot paths.
- Exactly-once behavior is bounded to the accepted Revid task/provider entry. If Agnes accepts work but the process loses the response before a provider identifier is durably acknowledged, provider-side exactly-once cannot be claimed; the Revid request remains in progress until terminal handling or stale-lease reconciliation.
- Real/paid Agnes capacity/fidelity, `.env`/secret access, external scheduler/worker, and applying `a3b4c5d6e7f8` to user/runtime data remain Human-gated and excluded.
