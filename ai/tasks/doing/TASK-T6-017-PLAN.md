# TASK-T6-017 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-017](../todo/TASK-T6-017.md).
- Progress: [TASK-T6-017-PROGRESS](TASK-T6-017-PROGRESS.md).

## Delivery rule

Deliver only the dependency-ready contract freeze. Use strict TDD, keep the repository usable, and do not implement
T6-018 persistence or any runtime UI/provider behavior.

## Unit 0 - Baseline reconciliation

- Status: `complete`
- Closed T6-013 as `DONE / DEFERRED` without inventing historical acceptance.
- Verified backend, frontend, fresh build, diff/security boundaries, created REPORT, precisely committed, pushed, and
  confirmed `HEAD == origin/main == 515b8c90097108b05e8cc838e3ba6402e30c366b`.
- Preserved all protected untracked files and kept the PRD/redesign plan out of the baseline commit.

## Unit 1 - Focused RED

- Status: `complete`
- Add backend REDs for strict manifest parsing, unknown/code/secret/non-portable rejection, canonical fingerprint,
  portability classifier, and provider projection fixtures.
- Add frontend REDs for the same manifest and abuse fixtures plus the identical fingerprint.
- Observe failures caused by the missing T6-017 contract, not syntax or environment errors.

## Unit 2 - Smallest coherent GREEN

- Status: `complete`
- Freeze PRD V1 status/defaults and write the behavior matrix and JSON Schema.
- Implement strict Pydantic/TypeScript contracts using existing project patterns and the canonical JSON authority.
- Add sanitized shared fixtures for portable, non-portable, abuse, and provider projection cases.

## Unit 3 - Verification and closure

- Status: `complete`
- Run focused GREEN, related template/canonical regression, fresh production build, provider-free browser contract proof,
  validator, `git diff --check`, staged security audit, and fresh diff review.
- Reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP, create REPORT, precisely stage, create one scoped commit, push, and verify
  remote parity.
- After parity, create the T6-018 session and stop modifying this repository.

## Outcome

- Units 0 through 3 are complete. T6-017 delivered only the frozen V1 contract artifacts and did not enter T6-018
  persistence or runtime scope.
- The scoped T6-017 commit/push and remote-parity check are the final repository operations before the separate T6-018
  session is created.

## Stop boundaries

- Fail closed on real/paid provider calls, secret access, external accounts, destructive user data/filesystem actions,
  arbitrary-code templates, public/team marketplace, or a need to widen into T6-018.
- Do not introduce a second Canvas, graph, history, autosave, template execution, or provider pipeline.
