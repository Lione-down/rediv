# TASK-T6-019 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-019](../todo/TASK-T6-019.md).
- Progress: [TASK-T6-019-PROGRESS](TASK-T6-019-PROGRESS.md).

## Delivery rule

Deliver only the lifecycle domain/API on the existing T6-018 tables. Use strict RED -> smallest GREEN -> focused
regression -> guarded disposable-MySQL integration/restart -> relevant broad checks -> state/diff/security audit.
Do not implement later capture, preflight, instantiate, UI, generation, run, upgrade, clone, or detach behavior.

## Unit 0 - Baseline reconciliation

- Status: `complete`
- Read complete governance, CURRENT, ROADMAP, approved PRD, frozen behavior matrix, T6-018 Task/PLAN/PROGRESS/REPORT,
  redesign plan, Direct Delivery ADR, and linked architecture.
- Preserve protected untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Fetch `origin/main` and confirm
  `HEAD == origin/main == 9bdd5806a8c377b732a3218fd052dfd762fa3583`, ahead/behind `0/0`.
- Audit the T6-018 models plus existing auth/router/controller/repository/error/transaction/test patterns.

## Unit 1 - Focused RED

- Status: `complete`
- Add repository/lifecycle/API tests before production modules or route registration.
- Cover create/list/get, owner isolation, built-in read-only behavior, draft update, new version draft, publish
  immutability, retire readability, invalid manifest rollback, bounded API errors, concurrency, restart persistence,
  and zero unrelated mutation.
- Run the exact focused tests and retain the expected missing-module/route/contract failures.

## Unit 2 - Smallest coherent GREEN

- Status: `complete`
- Add strict lifecycle request/response schemas without weakening the frozen manifest contract.
- Add three immutable server-owned built-in V1 definitions.
- Add a session-bound repository that owns queries/row mapping only.
- Add a lifecycle controller that owns authorization, row locks, canonicalization, slot replacement, transaction
  boundaries, and deterministic domain errors.
- Add `/api/workflow-templates` routes and register only that router.
- Keep legacy `/templates` routes and all Canvas/quota/job/provider code unchanged.

## Unit 3 - Focused regression and guarded runtime proof

- Status: `complete`
- Run focused lifecycle/repository/API tests on guarded disposable `revid_test_*` MySQL.
- Prove concurrent draft-version behavior, rollback atomicity, and backend restart persistence.
- Run frozen workflow-template contract/model/migration/constraint tests and legacy Template/Canvas regression.
- Run relevant broad backend checks and classify any unchanged out-of-scope RED without weakening thresholds.

## Unit 4 - Closure

- Status: `complete`
- Perform fresh acceptance-criteria and diff review, compile, project-state validator, `git diff --check`, route and
  secret/path audits.
- Update Task/PLAN/PROGRESS/CURRENT/ROADMAP and write `REPORT-T6-019`.
- Precisely stage only T6-019 paths after `.gitignore`, staged-path, and high-confidence secret-signature review.
- Create one conventional `type(scope): subject` commit, push once, fetch, and verify `HEAD == origin/main`.
- Use Codex project/thread tools to create the T6-020 goal session in the same saved `project_revid`, transfer the
  full remaining program protocol, and make no further repository edits after creation.

## Stop boundaries

- No schema migration or user/runtime database mutation.
- No capture/preflight, Canvas instantiate, frontend/UI, Script/Image/Video, provider, quota, job, run, diff/upgrade,
  clone/detach, marketplace, arbitrary-code, secret, or paid-call behavior.
- Database tests use only identity-guarded disposable `revid_test_*`; unavailable external state is classified
  accurately rather than replaced with SQLite or mock evidence.

## Outcome

- Units 0 through 4 are complete. T6-019 delivers the exact owner-scoped lifecycle/API boundary on the existing
  T6-018 schema, with three read-only built-ins and no legacy Graph Template or later-Task runtime switch.
- The remaining session operations are exact staging, one scoped commit/push, remote parity, and creation of the
  separate T6-020 session; no repository edit is allowed after that session is created.
