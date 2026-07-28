# TASK-T6-021 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-021](../todo/TASK-T6-021.md).
- Progress: [TASK-T6-021-PROGRESS](TASK-T6-021-PROGRESS.md).

## Delivery rule

Deliver only exact-version atomic Canvas instantiate and durable instance/binding/step-node lineage. Use
RED -> smallest coherent GREEN -> focused regression -> guarded disposable-MySQL runtime proof -> relevant broad
checks -> state/diff/security audit. Do not implement UI, generation, WorkflowRun, upgrade/clone/detach, or
compatibility retirement.

## Unit 0 - Baseline reconciliation

- Status: `complete`
- Read complete governance, CURRENT, ROADMAP, frozen PRD, behavior matrix, T6-020 Task/PLAN/PROGRESS/REPORT,
  redesign plan, Direct Delivery ADR, accepted modular architecture, and Canvas architecture.
- Preserve protected untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and
  `test-results/`.
- Fetch `origin/main` and confirm
  `HEAD == origin/main == 61c88b3c51a4dfdf4cfafb320206abe5ea23e55b`, ahead/behind `0/0`.
- Audit T6-018 lineage tables, T6-019 lifecycle, T6-020 preflight, existing Canvas document patch transaction, and
  legacy Graph Template stable-ID/idempotency behavior.

## Unit 1 - Focused RED

- Status: `complete`
- Add guarded API tests for exact-version success, isolated IDs across instances, strict identical replay,
  mutation-key mismatch, durable binding/step/node lineage, and one-revision atomicity.
- Add fail-closed tests for draft/retired/foreign version, wrong project/Canvas, stale preflight/asset/base revision,
  graph/port/capacity/cycle drift, and target ID collision.
- Count Canvas revisions, instance/binding/step/run rows, quota ledgers, and generation tasks before and after each
  failure. Run the exact tests and retain the expected missing-route/service/contract RED.

## Unit 2 - Smallest coherent GREEN

- Status: `complete`
- Add strict instantiate request/response schemas and a dedicated owner-scoped route.
- Add commented additive ordered asset-binding-item and immutable instance-commit tables; preserve the T6-018
  tables/constraints and apply new revisions only to guarded disposable MySQL evidence.
- Add `backend/services/workflow_templates/instances.py` for deterministic ID allocation and topology projection.
- Add controller orchestration that locks target scope and exact version, reruns T6-020 preflight, compares the
  fingerprint, applies one in-session Canvas patch, persists revision replay metadata and lineage, then commits once.
- Keep frozen manifest/schema, lifecycle routes, legacy Graph Template, quota, generation, provider, and run
  authorities unchanged.

## Unit 3 - Focused regression and guarded runtime proof

- Status: `complete`
- Run focused instantiation tests on an identity-guarded disposable `revid_test_*` MySQL schema.
- Prove restart persistence, identical replay, concurrent duplicate serialization, rollback after a forced lineage
  failure, and zero residue/side effects.
- Run T6-017 through T6-020 contract/lifecycle/capture/preflight/model/constraint regression plus legacy Graph
  Template and Canvas document regression.
- Run relevant broad backend checks and classify only pre-existing out-of-scope RED without weakening thresholds.

## Unit 4 - Closure

- Status: `complete`
- Perform fresh acceptance/diff review, compile, project-state validator, `git diff --check`, route/import/security
  audits, and guarded residue probe.
- Update Task/PLAN/PROGRESS/CURRENT/ROADMAP and write `REPORT-T6-021`.
- Precisely stage only T6-021 paths after `.gitignore`, staged-path, env-like path, and high-confidence
  secret-signature review.
- Create one conventional `type(scope): subject` commit, push once, fetch, and verify `HEAD == origin/main`.

## Stop boundaries

- No migration beyond the required additive asset-binding-item and instance-commit lineage tables, and no user/runtime database
  application, frontend/UI, provider request, quota reservation/ledger mutation, GenerationTask/job, WorkflowRun,
  Script/Image/Video projection, version diff/upgrade/clone/detach, or compatibility retirement.
- No widening or rewriting the frozen T6-017 manifest or T6-020 preflight contract.
- Database tests use only identity-guarded disposable `revid_test_*`; unavailable external state is classified
  accurately rather than replaced with SQLite or mock evidence.
