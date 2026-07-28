# TASK-T6-020 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-020](../todo/TASK-T6-020.md).
- Progress: [TASK-T6-020-PROGRESS](TASK-T6-020-PROGRESS.md).

## Delivery rule

Deliver only strict portable capture/classification and pure provider-free preflight. Use RED -> smallest coherent
GREEN -> focused regression -> guarded disposable-MySQL runtime proof -> relevant broad checks ->
state/diff/security audit. Do not implement instantiate, UI, generation, WorkflowRun, upgrade, clone/detach, or
compatibility retirement.

## Unit 0 - Baseline reconciliation

- Status: `complete`
- Read complete governance, CURRENT, ROADMAP, approved PRD, frozen behavior matrix, T6-019 Task/PLAN/PROGRESS/REPORT,
  redesign plan, Direct Delivery ADR, and linked architecture.
- Preserve protected untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and
  `test-results/`.
- Fetch `origin/main` and confirm
  `HEAD == origin/main == 617e514454212f359eefe2de87c07c6d66a8dc6f`, ahead/behind `0/0`.
- Audit the T6-019 lifecycle/API, frozen manifest/canonical fingerprint, legacy Graph Template capture, Canvas graph
  validation, asset ownership/status, capability registry, quota snapshot, and guarded MySQL patterns.

## Unit 1 - Focused RED

- Status: `complete`
- Add pure classifier/portability tests before production service modules.
- Add guarded API tests for capture success/failure, explicit asset-slot promotion, fixed-order preflight,
  typed-variable and asset revision checks, graph/capability/quota failures, deterministic fingerprint, and zero
  unrelated mutation.
- Run the exact focused tests and retain the expected missing-module/route/contract failures.

## Unit 2 - Smallest coherent GREEN

- Status: `complete`
- Add strict T6-020 request/response schemas without changing the frozen manifest schema.
- Add `backend/services/workflow_templates/portable_classifier.py` and `preflight.py`.
- Extend the workflow-template controller/API with capture and exact-version preflight orchestration only.
- Reuse existing Canvas graph validation, current capability contract, quota snapshot, and canonical JSON authority.
- Keep all mutation/provider adapters unreachable from capture/preflight.

## Unit 3 - Focused regression and guarded runtime proof

- Status: `complete`
- Run focused portability/capture/preflight tests on guarded disposable `revid_test_*` MySQL.
- Prove deterministic retry/restart results and zero Canvas/template-instance/quota/job/provider mutation.
- Run frozen workflow-template contract/lifecycle/model/constraint tests and legacy Graph Template/Canvas regression.
- Run relevant broad backend checks and classify unchanged out-of-scope RED without weakening thresholds.

## Unit 4 - Closure

- Status: `complete`
- Perform fresh acceptance/diff review, compile, project-state validator, `git diff --check`, route and sensitive-path
  audits.
- Update Task/PLAN/PROGRESS/CURRENT/ROADMAP and write `REPORT-T6-020`.
- Precisely stage only T6-020 paths after `.gitignore`, staged-path, env-like path, and high-confidence
  secret-signature review.
- Create one conventional `type(scope): subject` commit, push once, fetch, and verify `HEAD == origin/main`.
- List saved projects, select the exact `project_revid` path, create the T6-021 local session, and make no repository
  edits after creation.

## Stop boundaries

- No schema migration or user/runtime database mutation.
- No Canvas patch/revision, template instance/lineage/run write, quota reservation/ledger mutation, generation
  task/job, provider adapter/request, real/paid call, secret, frontend UI, or T6-021+ behavior.
- Database tests use only identity-guarded disposable `revid_test_*`; unavailable external state is classified
  accurately rather than replaced with SQLite or mock evidence.
