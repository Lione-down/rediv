# TASK-T5-092 Plan

- State: `DONE - PASS`
- Objective: allow distinct generation nodes in one editable Canvas to execute concurrently while preserving same-node single-flight behavior, strict authenticated request idempotency, cross-process Agnes admission, exact task/result ownership, and the existing T5-091 cinematic handoff and billing contracts.
- Baseline: `origin/main` at `2eaad1ad91a081ae41bc7757341caaa10eecaacf`; T5-091 business delivery is `1f3077c9208a0a7590d1ab549e89210a49d0b923` and closure is `6799fdf`.

## Unit 0 - Activation audit and contract lock

- Status: `completed`

1. Re-audit every frontend generation entrypoint, local/durable runtime registry, polling, pending projection, terminal adoption, provider lifecycle, transaction/quota ordering, current MySQL/Alembic surface, and deployment worker assumptions.
2. Lock one bounded UUID client request ID per explicit action, an immutable backend fingerprint, same-node duplicate behavior, and the exact zero-mutation mismatch response.
3. Lock a MySQL-backed leased Agnes admission model with global, per-user, and per-media limits, conservative backend-owned defaults, bounded acquisition, explicit `provider_busy` plus `Retry-After`, and restart-safe stale reconciliation.
4. Keep admission separate from quota and generation-task authority. Capacity must be acquired before provider entry and released on every terminal/exception/cancellation path; no API request may pretend to be a durable queue.
5. Add focused frontend and backend RED tests before business implementation.

Success gate: source audit, RED tests, Task, PLAN, PROGRESS, CURRENT, and ROADMAP agree on one bounded design with no frontend capacity authority, external scheduler, provider POST retry, or second generation authority.

## Unit 1 - Node-scoped Canvas concurrency

- Status: `completed`

1. Replace Canvas-wide generation blocking with a node/task-scoped in-flight registry derived from accepted local submissions and durable active tasks.
2. Lock only the active source node's mutable request fields while unrelated generation nodes remain editable and executable; same-node attempts return accessible deterministic feedback.
3. Isolate polling, progress, error, pending projection, terminal placement, selection, Canvas, and auth/session guards per task.
4. Prove two image plus two video mock submissions overlap and settle in arbitrary order without result, quota, error, or busy-state cross-assignment.

Success gate: distinct nodes overlap in one Canvas; same-node single-flight and 375px review-only behavior remain exact.

## Unit 2 - Request idempotency and cross-process Agnes admission

- Status: `completed`

1. Add the client request ID and canonical fingerprint to schemas, frontend request builders, generation-task persistence, APIs, and responses for ordinary, recipe, operation, and cinematic paths.
2. Enforce authenticated uniqueness and exact duplicate replay; reject mismatched reuse before provider, task, quota, asset, or Canvas mutation.
3. Add a fully commented MySQL admission lease model and one Alembic head, with atomic global/per-user/per-media acquisition and bounded stale-lease reconciliation across Uvicorn workers.
4. Preserve atomic quota semantics and prove concurrent users/media, duplicates, cancellation, timeout, failures, and completions never exceed capacity or charge twice.

Success gate: guarded disposable-MySQL concurrency tests prove configured limits and at-most-one accepted task/provider entry per explicit action.

## Unit 3 - Provider lifecycle, timeout, and recovery

- Status: `completed`

1. Align shared Agnes `httpx` pool limits and connect/pool/read/write timeouts with backend admission settings.
2. Close shared clients through FastAPI lifespan and reconcile abandoned leases safely after restart without applying any migration to user/runtime data.
3. Separate local saturation, pool timeout, connect timeout, response timeout, provider 429/503, malformed response, cancellation, and persistence failure; expose only safe bounded retry metadata.
4. Keep provider creation POSTs single-attempt. Only read-only video polling may use bounded retry/backoff.

Success gate: mock transport/lifecycle tests prove correct classification, release, restart recovery, and zero duplicate provider creation.

## Unit 4 - Regression and closure

- Status: `completed`

1. Run focused frontend concurrency and backend idempotency/admission/lifecycle tests first.
2. Run related generation, cinematic, billing, quota/task/result, recovery, duplication, Storyboard, responsive, accessibility, and security regression.
3. Run product backend, production build, functional Chromium, and guarded 200-node/300-connection evidence without threshold weakening.
4. Perform fresh acceptance, diff, UTF-8/BOM, migration-head, secret, sensitive-path, file-growth, exact-stage, and HEAD-drift review; write REPORT and close Task/PLAN/PROGRESS/CURRENT/ROADMAP only when every non-deferred criterion passes.

Success gate: code, tests, mock/contract/browser evidence, REPORT, durable state, commit, and `origin/main` agree on `DONE - PASS` without a real-provider capacity or fidelity claim.

## Required focused commands

```powershell
backend\.venv\Scripts\python.exe -m pytest -q backend\tests\test_generation_idempotency.py backend\tests\test_agnes_admission.py backend\tests\test_agnes_provider_lifecycle.py -x
```

```powershell
cd frontend
npx playwright test tests/e2e/canvas-concurrent-generation.spec.ts --project=chromium --timeout=60000 --reporter=line
npm run build
```

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

```powershell
cd frontend
npx playwright test --project=chromium --timeout=60000 --reporter=line
```

## Stop rules

- Stop before `.env`/secret access, paid/real provider calls, external accounts/workers, user/runtime migration, destructive operations, arbitrary/remote Skill execution, hidden durable scheduling, cross-Canvas relations, second Canvas/runtime/store, or mobile editing.
- Stop and split a separately approved architecture Task if bounded admission cannot safely meet the contract without a durable queue/worker.
- Do not claim provider capacity, exactly-once provider execution, or visual fidelity beyond mock, contract, disposable-MySQL, and browser evidence.
- Preserve and never stage `.codex/`, `.hermes/plans/`, `output/`, or unrelated user changes.
