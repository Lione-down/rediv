# TASK-T6-002 Implementation Plan

- State: `DOING`
- Verification outcome: `PENDING`
- Active unit: `Unit 3 - Authoritative provenance and graph routes`
- Task: `ai/tasks/todo/TASK-T6-002.md`
- Progress: `ai/tasks/doing/TASK-T6-002-PROGRESS.md`
- Activation baseline: `HEAD == origin/main == 760d2ef3dcb217b6026e7da345a4702484f370c6`; ahead/behind `0/0`; tracked worktree clean.
- Decisions: `ADR-2026-07-10-CODEX-DIRECT-DELIVERY`, `ADR-002`, `ADR-004`, and `ADR-005` remain authoritative.

## Execution strategy

Every behavior change follows test-driven delivery: add the smallest failing regression, capture the expected failure, implement the minimum coherent fix, run focused GREEN and related regression, then review and deliver only owned paths. Security behavior fixes land before structural refactors so later changes cannot mask them.

## Unit sequence

### Unit 1 - Authentication defaults and secret transport

- Status: `completed`

- Make mock auth explicitly opt-in and validate runtime profile/signing secrets at startup.
- Move admin dev-login credentials out of query strings and gate development-only routes fail closed.
- Add cross-worker-capable throttling using the existing MySQL-only authority without reading real credentials.
- RED/GREEN: runtime defaults, password/WeChat auth, admin behavior, startup, and multi-worker throttle tests.

### Unit 2 - Atomic registration and invitation redemption

- Status: `completed`

- Lock invitation rows and perform uniqueness checks, identity/user/quota creation, and usage increment in one transaction.
- Treat database uniqueness as final authority and refresh only minimum post-commit compatibility state.
- RED/GREEN: duplicate, rollback, and two-connection `max_uses=1` races, repeated three times.

### Unit 3 - Authoritative provenance and graph routes

- Status: `active`

- Reclassify all callers of generated-asset and legacy project graph routes.
- Remove forged-provenance creation; derive all generation lineage server-side or remove the unused route.
- Retire legacy graph routes only if no live external contract is found; otherwise stop for the Human compatibility gate.
- RED/GREEN: asset lineage, multi-canvas ownership, route surface, and document persistence.

### Unit 4 - Canvas JSON budgets

- Measure serialized size statistics without retaining user content and record P50/P95/max here before choosing limits.
- Obtain Human approval for exact limits; starting proposal is 2 MiB body, 64 KiB node content, 16 KiB connection metadata, depth 16, plus bounded key/string counts.
- Add iterative pre-persistence budgeting and exact 413/422 semantics with zero mutation.
- RED/GREEN: exact boundary, one-byte over, deep, aggregate, and chunked/no-content-length cases.

### Unit 5 - Agnes credential boundary

- Pin the production provider to the repository-owned exact HTTPS host and reject userinfo, query, fragment, confusable/suffix tricks, plaintext, or arbitrary hosts before client construction.
- Inject mock/test transport directly; any development override must be explicit, loopback-only for plaintext, and impossible in production.
- RED/GREEN: endpoint security, provider validation, generation transaction, and capability suites with zero real calls.

### Unit 6 - Deterministic CI and dependencies

- Add read-only workflow jobs for hygiene/build, guarded MySQL backend, deterministic Chromium, pinned security checks, and safe failure artifacts.
- Adopt a reproducible reviewed backend constraints workflow and retain `npm ci` with the tracked lockfile.
- Prove local equivalents and document which live/hardware/paid gates remain outside ordinary CI.

### Unit 7 - Durable state normalization

- First add a failing validator for allowed states, one active Task, complete tables, link existence, and Task/REPORT/CURRENT/ROADMAP agreement.
- Archive the long completion snapshot, make CURRENT concise, complete missing ROADMAP rows, normalize T5-092, and update entry docs without moving historical Task files.
- Adopt `State = TODO|DOING|VERIFYING|BLOCKED|DONE` plus separate verification outcome.

### Unit 8 - Request-scoped repositories

- Prove stale cross-instance authorization/admin/domain state with two-store/two-session RED tests.
- Introduce narrow domain repositories and migrate auth/admin first, then project/Canvas and asset/generation paths in bounded commits.
- Remove production dictionary exposure and retire the duplicate application store only after caller scans and full regression.

### Unit 9 - Explicit Canvas UI state and production file splits

- Add a discriminated single `ContextSurface` with deterministic opener/focus return; preserve existing DOM, copy, shortcuts, and mutation behavior.
- Stabilize overlay/focus regression before extracting contextual domains and Stage chrome.
- Keep route orchestration in `CanvasWorkspace.vue`, move reusable presentation domain logic into `modules/canvas`, and target sub-500-line business files.

### Unit 10 - Test fixture/spec splits and final regression

- Capture exported helper and test title/count baselines, split only by behavior domain, and prove before/after identity.
- Run full backend, build, functional Chromium, accessibility, headed performance, state validator, audit signals, diff/hygiene, exact staging, and origin agreement.
- Transition to `VERIFYING`, write REPORT only after every non-deferred acceptance criterion passes, then synchronize durable state to `DONE / PASS`.

## Verification order

1. Unit-specific RED and focused GREEN.
2. Related backend or frontend regression.
3. MySQL concurrency/restart evidence where relevant, only on guarded `revid_test_*` schemas.
4. Production frontend build and deterministic Chromium where relevant.
5. Final full backend, functional Chromium, accessibility, and unchanged performance gates.
6. `scripts/validate-project-state.py`, audit signals, `git diff --check`, tracked database scan, UTF-8/BOM, sensitive-path and high-confidence secret-signature scan.
7. Recheck `HEAD`, stage exact owned paths, review cached diff, commit, push, and confirm ahead/behind `0/0`.

## Current measurements and decisions

- Canvas serialized size P50/P95/max: pending Unit 4 measurement; no user content will be stored.
- Approved Canvas budgets: pending Human Owner decision after measurement.
- Legacy external graph-route commitment: pending Unit 3 whole-repo caller classification.
- Exact production Agnes host: pending Unit 5 repository-owned contract verification; no network/provider request will be made to discover it.
