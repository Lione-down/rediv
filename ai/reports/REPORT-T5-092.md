# REPORT-T5-092 - Same-Canvas concurrent generation and Agnes admission control

- Status: `DONE - PASS`
- Baseline: T5-091 state closure `6799fdf6ed79edd8b4e3a5af8394dfda4e7d7023`
- Business delivery: `595f1d4bfd5b844014a5b82bcb9045fa541f8291` pushed to `origin/main`
- Scope: concurrent distinct-node image/video execution, authenticated request idempotency, MySQL-backed cross-process Agnes admission, bounded transport/lifecycle/error contracts, and exact task/result isolation; no external scheduler or real provider call.

## Delivered

- Replaced one Canvas-global generation boolean with local/durable node/task-scoped ownership. An active source locks only its mutable prompt/input/parameter surface; unrelated image/video nodes and Storyboard recipe branches remain editable and executable. Same-node attempts return deterministic accessible feedback.
- Added one UUID4 per explicit ordinary, recipe, operation, cinematic, shot-schema, and legacy Workspace generation action. Backend fingerprints canonical immutable user/scope/media/provider/model/prompt/reference/parameter/handoff data and enforces user-scoped uniqueness.
- Duplicate active delivery returns an in-progress outcome; mismatched reuse fails closed; a completed identical request replays the original task/asset/quota outcome without another provider call or debit, including after the original action exhausts that media quota.
- Added fully commented nullable `generation_tasks.client_request_id` and `request_fingerprint` fields, user/client uniqueness, a singleton `agnes_admission_guard`, and Alembic head `a3b4c5d6e7f8`. The guarded row plus active generation-task leases serialize global/per-user/per-media capacity across competing database connections and Uvicorn workers without adding a second task queue.
- Capacity saturation returns `provider_busy` plus bounded `Retry-After` before task/provider/quota/asset/Canvas mutation. Stale queued/running tasks reconcile to terminal failure after the configured lease; successful completion still charges exactly once through the existing quota transaction.
- Aligned the shared Agnes `httpx` pool with admission and configured connect/pool/read/write timeouts. Lifespan closes and safely recreates the provider client. Local pool/connect/response/write timeout, provider 429/503, and safe numeric provider `Retry-After` are classified separately without exposing raw provider responses.
- Provider creation POSTs remain single-attempt. Existing bounded video status polling remains read-only. T5-091 cinematic preflight, provider/model selection, billing acknowledgement, canonical handoff, request snapshot, task/result ownership, stale-session guards, pending projections, and terminal placement remain on the same native authority.
- Split request acceptance into `generation_starts.py` while retaining `generation_transactions.py` as the compatibility transaction surface; both are below 500 lines. No renderer, edge/minimap, pointer, graph, camera, autosave, or Canvas persistence hot path changed.

## Verification

- Focused final backend idempotency/admission/migration/provider/restart evidence passed `11` tests. The broader post-split generation/cinematic/migration/security matrix passed `58` tests. The product backend suite before the final responsibility-only split/order hardening passed `519` tests plus `116` subtests in `517.10s`.
- Disposable guarded MySQL proved the new migration and competing-connection media admission; `alembic heads` returned only `a3b4c5d6e7f8`. No user/runtime schema was migrated.
- Focused generation service/concurrency Chromium passed `10/10`, including two image plus two video requests held concurrently, distinct UUID4 payloads, active-node controls disabled, and unrelated-node editing/execution. The final affected matrix passed `80/81`; its sole old retry-equality assertion was updated to require identical business payload plus a new explicit-action request ID, then passed in isolation.
- Functional Chromium excluding only the separately guarded 200/300 FPS title ran `497` tests: `496` passed and one existing video-metadata/provenance zero-PATCH assertion fluctuated because decoded aspect ratio persisted before its assertion. The unchanged title passed immediately in isolation (`1/1`), providing exhaustive green functional coverage with the retry recorded rather than hidden.
- Production frontend build passed with `4,926` transformed modules. Companion performance/accessibility/viewport tests, including 375px review-only behavior, passed in the functional matrix.
- `git diff --check`, Python compileall, staged sensitive-path scan, UTF-8/no-BOM, new-file <=500-line, single-head, exact-stage, and HEAD-drift checks passed. `.codex/`, `.hermes/plans/`, `output/`, `.env`, and key/certificate paths were excluded.

## Classified performance evidence

- The unchanged 200-node/300-connection title did not meet its unmodified software-rendered threshold in this run: the full matrix measured `49.06193829836655 FPS`; isolated reruns measured `35.30524785723048 FPS` and `33.289158147166475 FPS`, versus required `>=55`. Chromium reported SwiftShader and `hardwareAcceleration: false`.
- The first isolated artifact still passed stable render (`736ms`), pointer p95 (`28.6ms`), longest task (`144ms`), and minimap update requirements, while FPS/frame cadence failed. No threshold, duration, worker count, seed, product performance code, or test code was changed.
- This is retained as an explicit environment-classified mock-browser red item, consistent with prior Revid SwiftShader variance handling. T5-091's same-title `56.35 FPS / 16.8ms p95` remains the latest passing baseline. T5-092 does not claim a fresh 200/300 pass or real Canvas/provider capacity from this evidence.

## Deliberate boundaries

- No `.env`, secret, real/paid Agnes request, external account, destructive operation, user/runtime migration, external broker/worker/scheduler, automatic provider creation retry, cross-Canvas generation relation, second task authority, or mobile editing was used or added.
- Revid guarantees at most one accepted task/provider entry per authenticated client request ID. If Agnes accepts work but the response/provider identifier is lost before durable acknowledgement, provider-side exactly-once cannot be claimed; the request remains active until terminal handling or stale-lease reconciliation.
- Mock overlap and disposable-MySQL admission prove Revid coordination, not the undocumented concurrency, rate limit, fidelity, identity, or motion behavior of a real Agnes account. Any real capacity/fidelity run remains separately Human-authorized.
- Applying repository head `a3b4c5d6e7f8` to user/runtime data remains a Human Owner gate with reviewed backup and migration discipline.
