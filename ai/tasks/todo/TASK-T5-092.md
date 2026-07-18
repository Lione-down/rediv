# TASK-T5-092 - Same-Canvas concurrent generation and Agnes admission control

- State: `VERIFYING`
- Objective: allow one Canvas to run multiple independent image and video generation tasks concurrently while adding bounded, cross-process Agnes admission, request idempotency, transport backpressure, and exact task/result isolation.
- Dependency: `T5-091 - DONE - PASS` at business delivery `1f3077c9208a0a7590d1ab549e89210a49d0b923` and state closure `6799fdf6ed79edd8b4e3a5af8394dfda4e7d7023` pushed to `origin/main`.
- Activation rule: this Task remains inactive until `ai/tasks/doing/TASK-T5-092-PLAN.md` and `ai/tasks/doing/TASK-T5-092-PROGRESS.md` are created or refreshed from the current code and T5-091 contracts. No business-code edit may precede that activation audit.

## Verified current gap

- The Canvas frontend owns one global `isGenerating` flag. Once any image or video request starts, every other generation node in the same Canvas is blocked even though durable task presentation and pending-result projection already model multiple tasks.
- Local runtime requests are keyed by generation node. This is a useful isolation boundary, but the current global flag prevents distinct nodes from using it concurrently and the map cannot represent two simultaneous submissions from the same node.
- MySQL generation transactions lock the user quota row and count active reservations per user and media type. Existing concurrency tests protect quota and completion atomicity, but this is not a provider-wide or deployment-wide Agnes capacity limit.
- Agnes uses one shared `httpx.AsyncClient` per process with default connection-pool limits. There is no backend-owned global/per-user/per-media admission policy, no explicit pool alignment, and no provider-busy response contract.
- Generation requests do not carry a stable client request ID. Double clicks, client retries, or an uncertain response can therefore create duplicate tasks and duplicate paid provider submissions.
- Image and text provider work remains request-bound; video creation and polling can keep one HTTP request active for about ten minutes. Provider POST retries, process interruption, slot release, and stale reservation recovery need explicit concurrent semantics.
- T5-091 adds exact cinematic preflight/handoff, provider/model selection, billing acknowledgement, and immutable snapshots. T5-092 must preserve and revalidate those contracts independently for every concurrent request.

## Locked product contract

1. A user may start image, video, or mixed image/video generation from multiple distinct generation nodes in the same editable Canvas without waiting for unrelated nodes to finish.
2. Active state is node- and task-scoped. An in-flight node locks only its own mutable request inputs; unrelated generation nodes remain editable and executable.
3. One source generation node has at most one accepted in-flight submission at a time. Repeated clicks or transport retries for the same explicit action resolve idempotently and never create a second provider call.
4. Parallel tasks may finish, fail, time out, or be cancelled in any order. Each task must retain its own source node, exact request snapshot, quota outcome, progress, result asset, result placement, lineage, and error state.
5. Concurrency is bounded, not unlimited. Backend-owned Agnes limits apply across Canvas, project, user, request process, and Uvicorn worker boundaries; the frontend never invents or hardcodes provider capacity.
6. When capacity is unavailable and no durable scheduler owns the request, the API fails before provider/task/quota/asset/Canvas mutation with an explicit `provider_busy` response and bounded `Retry-After`. It must not display a fabricated durable queue.
7. T5-092 does not add an external queue or worker. If activation proves that safe deferred execution requires a new scheduler, stop and split that architecture into a separately approved Task rather than hiding it inside an API request.
8. Provider creation POSTs are never automatically retried unless Agnes exposes and the implementation verifies a provider-side idempotency contract. Read-only polling may use bounded retry/backoff.
9. Existing T5-090/T5-091 Agent/Skill discovery, exact preflight, billing acknowledgement, provider/model ownership, source-revision checks, and canonical request equality remain authoritative for every parallel task.
10. Mobile remains review-only. No concurrent generation action is added at the 375px boundary.

## Scope

### Frontend task isolation

- Replace Canvas-wide `isGenerating` ownership with a node/task-scoped in-flight registry derived from local requests plus durable active tasks.
- Keep the active node's prompt, input order, parameters, cinematic settings, provider/model, and acknowledgement snapshot locked while allowing unrelated generation nodes to remain interactive.
- Preserve exact selection changes, Canvas navigation, logout/session changes, resource refresh, pending-result projection, result materialization, Graph Access, Storyboard projection, history, and autosave behavior while multiple tasks are active.
- Prevent a second simultaneous run from the same source node and provide accessible node-local busy feedback instead of silently dropping the action.

### Idempotent generation submission

- Add one bounded client request ID per explicit generation action and persist it through image, video, ordinary, recipe, image-operation, and cinematic handoff request paths.
- Enforce authenticated user-scoped uniqueness in the backend so duplicate delivery returns the original accepted task/outcome or a deterministic in-progress response without re-entering Agnes.
- Reject reuse of one request ID with a different media type, project, Canvas, node, provider/model, capability, prompt, reference, parameter, recipe/operation, Skill, or acknowledgement fingerprint.
- Record the exact crash window when Agnes accepts a request but no provider-side idempotency/identifier has yet been durably acknowledged; do not claim exactly-once behavior beyond evidence.

### Cross-process Agnes admission

- Define backend settings for global and per-user active limits by Agnes media type, plus bounded acquisition/pool timeout values. Exact defaults must be conservative and documented without reading or exposing real secrets.
- Implement admission through a MySQL-backed lock/reservation boundary or another activation-approved mechanism that is correct across multiple Uvicorn workers. An in-process semaphore alone is insufficient evidence.
- Acquire capacity before an Agnes provider call and release or reconcile it on success, provider failure, validation failure, cancellation, timeout, client disconnect, and process restart.
- Preserve existing atomic quota semantics. Capacity reservation is not quota debit, successful completion charges exactly once, and rejected/busy/failed requests do not overcharge.
- If schema changes are required, add fully commented MySQL fields/tables, a single Alembic head, disposable guarded migration tests, and no application to user/runtime data without the existing Human gate.

### Provider transport and error contract

- Align `httpx.Limits`, connect/pool/read/write timeouts, and provider concurrency settings so the connection pool cannot become an accidental second unbounded queue.
- Close Agnes clients through FastAPI lifespan on normal shutdown and prove repeated startup/shutdown does not leak clients or slots.
- Classify provider `429`, provider `503`, local capacity saturation, pool timeout, connection timeout, response timeout, malformed result, cancellation, and persistence failure separately without exposing provider secrets or raw sensitive responses.
- Honor safe provider `Retry-After` metadata where present and use bounded backoff only for read-only video polling.

### Concurrent recovery and result ownership

- Reconcile multiple active tasks after refresh, Canvas switch/back, frontend restart, and backend restart without collapsing them into one global busy state.
- Preserve deterministic non-overlapping pending result projections and exact terminal result placement for arbitrary completion order.
- Ensure a stale response from an old auth session, project, Canvas, or node cannot mutate the current session, clear another node's busy state, apply an older quota revision, or adopt a foreign result.

## Implementation plan

### Unit 0 - Activation audit and contract lock

1. Activate T5-092 as the only implementation Task and create its PLAN/PROGRESS before business-code edits.
2. Re-audit generation actions/runtime presentation, result projection, resource polling, task transactions/reservations, Agnes lifecycle, current Alembic head, T5-091 handoff, and deployment worker count.
3. Lock the exact client request ID contract, same-node behavior, global/per-user/per-media capacity model, busy response, slot lease/reconciliation model, migration surface, and verification matrix.
4. Write frontend and backend RED tests that prove the existing global lock and missing provider admission/idempotency gaps.

Success gate: Task, PLAN, PROGRESS, CURRENT, ROADMAP, tests, and source audit agree on one bounded design with no fake queue, hidden scheduler, or second generation authority.

### Unit 1 - Node-scoped Canvas concurrency

1. Replace the global generation boolean with a node/task-scoped registry and exact computed busy state.
2. Allow distinct image/video nodes to submit concurrently while preserving same-node single-flight behavior and per-node mutable-input locks.
3. Make runtime discovery, polling, error/success feedback, pending projections, and terminal handoff independent for every request.
4. Prove selection changes, mixed media, arbitrary completion order, undo/redo, autosave/reload, Canvas switching, logout, compact layout, and 375px review-only behavior.

Success gate: at least two image and two video mock tasks from distinct nodes overlap in one Canvas and settle independently with exact result ownership.

### Unit 2 - Idempotency and cross-process admission

1. Add the strict client request ID/fingerprint contract to frontend requests, backend schemas, task persistence, and generated responses.
2. Add cross-process Agnes global/per-user/per-media admission with atomic acquire/release and stale lease reconciliation.
3. Preserve quota locking and one-charge semantics under simultaneous users, media types, duplicate requests, completions, grants, cancellation, and failures.
4. Return deterministic duplicate and `provider_busy` outcomes with no duplicate provider call or unintended mutation.

Success gate: guarded MySQL concurrency tests prove capacity is never exceeded across competing transactions and each explicit action produces at most one accepted task/provider submission.

### Unit 3 - Provider lifecycle, timeout, and recovery

1. Configure the Agnes connection pool and timeout policy from the same backend-owned capacity contract.
2. Close the shared provider during lifespan shutdown and reconcile abandoned local admissions safely after restart.
3. Add separate provider/local saturation error mapping, safe `Retry-After`, read-only polling backoff, cancellation, and uncertain-response handling.
4. Prove no automatic retry of paid provider creation POSTs and document any provider-side exactly-once limitation honestly.

Success gate: mock transport tests cover saturation, pool timeout, provider 429/503, cancellation, restart, arbitrary completion order, and slot release without leaks or duplicate calls.

### Unit 4 - Regression and closure

1. Run focused frontend concurrent-generation and backend admission/idempotency tests first.
2. Run related T5-075 through T5-091 generation, quota, task, result, cinematic handoff, billing acknowledgement, autosave, recovery, duplication, Storyboard, and security regression.
3. Run the product backend suite, production build, functional Chromium, responsive/accessibility checks, and guarded 200-node/300-connection evidence without weakening thresholds.
4. Perform fresh diff, UTF-8/BOM, migration-head, secret, sensitive-path, file-growth, and exact-stage review; write REPORT and close durable state only after all non-deferred criteria pass.

Success gate: code, tests, mock/contract/browser evidence, REPORT, CURRENT, ROADMAP, commit, and `origin/main` agree on `DONE - PASS`; no real-provider quality or capacity claim exceeds evidence.

## Acceptance criteria

1. T5-091 remains `DONE - PASS`; ordinary and cinematic generation reuse the same native task/quota/provider/result authority.
2. One editable Canvas can hold at least two image and two video requests concurrently from distinct generation nodes under a controlled mock barrier.
3. Image-only, video-only, and mixed image/video tasks can overlap and complete in any order without result, progress, error, or quota cross-assignment.
4. Only the active source node's mutable request fields are locked; unrelated generation nodes remain editable and executable.
5. A second in-flight action from the same source node is rejected or resolved idempotently with accessible feedback and zero duplicate provider call.
6. Every explicit action carries one bounded client request ID and immutable request fingerprint; mismatched reuse fails closed.
7. Duplicate delivery, double click, uncertain response, and safe client retry create at most one accepted generation task and one provider submission.
8. Agnes concurrency limits are backend-owned, configurable, media-aware, per-user/global, and effective across multiple Uvicorn workers.
9. Capacity exhaustion returns explicit `provider_busy` plus bounded `Retry-After` before provider/task/quota/asset/Canvas mutation; no false durable queue is shown.
10. Quota remains atomic and monotonic: no oversubscription, double debit, stale quota overwrite, or charge for rejected/failed work.
11. Success, provider failure, validation failure, cancellation, timeout, disconnect, persistence failure, and restart release or reconcile admission without capacity leaks.
12. `httpx` connection-pool limits and timeouts align with configured admission; FastAPI lifespan closes the provider client.
13. Paid provider creation POSTs are never automatically retried without verified provider-side idempotency; read-only polls use bounded retry only.
14. Multiple local/durable active tasks survive refresh and restart discovery with exact node/project/Canvas/user ownership.
15. Pending projections remain stable and non-overlapping; terminal results materialize at their own predicted coordinates despite arbitrary completion order.
16. Stale auth/project/Canvas responses cannot clear or mutate current concurrent state, and older quota revisions remain ignored.
17. T5-091 cinematic preflight, source revision, provider/model, acknowledgement, canonical request, and task snapshot equality are independently preserved per concurrent task.
18. Desktop and compact editable layouts expose node-local progress and errors; 375px remains review-only with no horizontal overflow or accidental execution.
19. Focused tests precede relevant regression; product backend, build, functional Chromium, accessibility, hygiene, and guarded performance evidence pass without threshold weakening.
20. No `.env`/secret access, real/paid Agnes call, external account, destructive operation, user/runtime migration, arbitrary Skill runtime, cross-Canvas relation, mobile editing, or hidden external scheduler occurs without separate authorization.

## Expected implementation surface at activation

- `backend/core/agnes_provider.py`
- `backend/core/generation_provider.py`
- `backend/settings/config.py`
- `backend/main.py`
- `backend/api/generation_common.py`
- `backend/api/image_generate.py`
- `backend/api/video_generate.py`
- `backend/schemas/generation.py`
- `backend/models/generation_task.py`
- `backend/controllers/generation_reservations.py`
- `backend/controllers/generation_transactions.py`
- a narrowly scoped commented Alembic migration if required by the locked cross-process design
- `frontend/src/components/canvas/composables/use-canvas-generation-actions.ts`
- `frontend/src/components/canvas/composables/use-canvas-generation-runtime.ts`
- `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- `frontend/src/modules/canvas/generation-service.ts`
- `frontend/src/modules/canvas/generation-runtime-presentation.ts`
- `frontend/src/modules/canvas/generation-result-projection.ts`
- `frontend/src/components/canvas/CanvasContextPanel.vue`
- focused backend tests under `backend/tests/`
- focused Chromium tests under `frontend/tests/e2e/`

## Verification responsibilities at activation

- Add a focused backend suite for idempotency, admission limits, duplicate fingerprints, cross-user/media concurrency, cancellation, timeout, restart reconciliation, provider 429/503, and client lifecycle.
- Add a focused Chromium suite for two image plus two video overlapping requests, same-node double click, arbitrary completion order, selection/Canvas/auth drift, node-local locks, pending placement, and exact result adoption.
- Use mock providers and disposable guarded MySQL only by default. A real Agnes capacity or quality smoke remains separately Human-authorized.
- Run focused gates first, then full backend, production build, functional Chromium, responsive/accessibility, hygiene, and guarded 200/300 performance evidence.

## Non-goals

- No unlimited concurrency, client-defined capacity, or frontend-only semaphore.
- No simultaneous duplicate runs from one source generation node in this Task.
- No external broker, distributed job worker, scheduler deployment, autoscaling, cloud queue, or background provider service.
- No automatic retry of image/video/text provider creation POSTs.
- No change to Agnes model selection, pricing, provider credentials, visual-quality scoring, automatic regeneration, or user account management.
- No cross-Canvas generation dependency, real-time collaboration, second Canvas engine/store, or mobile editing.
- No claim that mock overlap proves the actual Agnes account's undocumented rate or concurrency limits.

## Human gates

- Any real or paid Agnes concurrency smoke, provider-account limit discovery through paid calls, `.env`/secret access, external worker/account, destructive operation, or user/runtime migration requires explicit Human Owner authorization.
- Applying a new Alembic head to user/runtime data remains separately gated even when the migration passes disposable MySQL tests.
- If provider documentation or runtime evidence requires a durable scheduler rather than bounded admission, stop and request approval for a separate worker/queue architecture Task.
