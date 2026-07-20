# TASK-T6-002 - Project audit remediation and structural hardening

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6`
- Objective: execute the 2026-07-20 project audit remediation program so authentication, registration, provenance, Canvas payloads, provider credentials, CI, durable state, persistence freshness, Canvas UI state, and high-risk tests are fail-closed, maintainable, and reproducibly verified.
- Dependency: `T6-001 - DONE / PASS` at activation baseline `HEAD == origin/main == 760d2ef3dcb217b6026e7da345a4702484f370c6`.
- Plan: `ai/tasks/doing/TASK-T6-002-PLAN.md`.
- Progress: `ai/tasks/doing/TASK-T6-002-PROGRESS.md`.
- Report: `ai/reports/REPORT-T6-002.md`.
- Audit source: preserved user-owned `.hermes/plans/2026-07-20_225502-project-audit-remediation.md` with SHA-256 `457ACDEF858F3A5AD54659CC43F63D8E87A70B722B91775B854E970AA7E56C0E`.

## Scope

1. Fail-closed authentication defaults, credential validation, secret transport, route gating, and cross-worker throttling.
2. Atomic invitation redemption and registration rollback/concurrency correctness.
3. Authoritative generated-asset provenance and retirement or explicit gating of legacy graph mutation routes.
4. Bounded Canvas JSON body, aggregate, field, and nesting budgets before persistence work.
5. Exact production Agnes endpoint trust and injectable mock transport without credential leakage.
6. Secret-free deterministic CI, disposable MySQL verification, frontend build/browser gates, and dependency locking/auditing.
7. A machine-validated durable state schema and concise CURRENT/complete ROADMAP documentation.
8. Request-scoped domain repositories replacing production dependence on process-wide full-table caches.
9. One explicit Canvas contextual-surface state and scoped splits of oversized Canvas business files.
10. Behavior-preserving splits of oversized high-risk frontend test fixtures/specs plus final regression and hygiene.

## Non-goals and Human gates

- No real or paid provider request, real secret access, `.env` inspection, external-account mutation, or user/production data operation.
- No destructive filesystem or MySQL action. Database tests may use only guarded disposable schemas whose exact names begin with `revid_test_`.
- No incompatible external route removal when a live production caller or support commitment exists; that requires a separate Human decision.
- No Canvas visual redesign and no weakening of existing accessibility, functional, responsive, or 200-node/300-connection performance thresholds.
- Exact Canvas JSON budgets remain a Human product-contract gate after representative size measurement.
- No deletion or rewriting of historical Hermes evidence or user-owned untracked `.codex/`, `.hermes/plans/`, and `output/` paths.

## Acceptance criteria

1. Mock auth is off by default; known/short signing secrets fail closed; secret-bearing admin actions reject query-string credentials; disabled auth routes are absent or return stable 404/403; throttling remains effective across multiple workers.
2. One successful registration consumes one invitation use and all failed registrations consume zero; concurrent redemption cannot exceed `max_uses`.
3. Clients cannot forge generated provenance; only supported authoritative Canvas document and generation completion routes can mutate their domains.
4. Canvas requests exceeding approved byte, field, aggregate, or depth budgets return 413/422 before document/revision mutation; exact boundaries pass.
5. Production credentials can be sent only to the exact approved HTTPS Agnes endpoint; invalid endpoints construct no client and issue no request.
6. Clean-checkout CI uses mock providers and guarded disposable MySQL, builds the frontend, runs deterministic browser/backend gates, and has read-only permissions plus dependency/secret/SAST checks.
7. `CURRENT`, `ROADMAP`, Task, PLAN, PROGRESS, REPORT, and links pass `scripts/validate-project-state.py` under one normalized state schema.
8. Production request paths do not authorize or serve mutable domain state from process-wide full-table caches; cross-worker freshness is proven.
9. Canvas contextual surfaces have one discriminated state, current behavior/visuals remain unchanged, and targeted production business files are below 500 lines or carry an approved exception.
10. Split test title/count/ordering sets remain identical; full backend, build, functional Chromium, accessibility, performance, diff, UTF-8, sensitive-path, secret, database-artifact, exact-stage, commit, push, and origin checks pass.

## Delivery policy

- Implement Units 1 through 10 in dependency order using RED → GREEN → focused regression → scoped diff review.
- Each independently verified Unit receives its own scoped conventional commit and push only after staged hygiene and HEAD drift checks.
- Keep this Task `DOING` until implementation is complete; use `VERIFYING` only for the final whole-program gate and write REPORT only after all non-deferred criteria pass.
