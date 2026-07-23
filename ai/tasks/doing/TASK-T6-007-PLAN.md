# TASK-T6-007 Implementation Plan

- State: `DOING`
- Verification outcome: `PENDING`
- Active unit: `Unit 0 - RED contract inventory and ownership`
- Task: [TASK-T6-007](../todo/TASK-T6-007.md).
- Progress: [TASK-T6-007-PROGRESS](TASK-T6-007-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Delivery rule

T6-007 is test-first characterization only. Add failing contracts and exact failure evidence before any runtime implementation. Do not update snapshots, weaken unrelated assertions, or add production behavior.

## Unit sequence

### Unit 0 - RED contract inventory and ownership

- Status: `in_progress`
- Re-read current generation schemas, API clients, polling, result projection, card commands, script authoring, video parameters, capability surfaces, and overlapping tests.
- Map each new contract to one future implementation Task and identify compatibility-only expectations.
- Confirm owned paths do not overlap unknown worktree changes.

### Unit 1 - Backend compact and semantic contracts

- Status: `pending`
- Add focused RED contracts for compact generation DTOs and hard payload budgets.
- Add semantic-reference contracts preserving stable IDs, roles, instructions, exclusions, source revisions, and order.
- Add story-director contracts for the versioned Revid-owned production document and absence of a user-selectable Skill authority.

### Unit 2 - Browser workflow contracts

- Status: `pending`
- Add focused RED contracts for rename, duplicate-title disambiguation, undo/redo/reload, and stable `@` bindings.
- Add refresh-continuity contracts for text, script, image, and video.
- Add same-card result, image-batch sibling, built-in director, and semantic-reference UI contracts.

### Unit 3 - Failure-surface review

- Status: `pending`
- Run focused backend and Playwright tests.
- Prove failures are limited to absent replacement contracts, with no infrastructure, fixture, authentication, selector, build, or unrelated regression noise.
- Label compatibility expectations without changing runtime behavior.

### Unit 4 - State and delivery

- Status: `pending`
- Perform fresh diff review, project-state validation, UTF-8/no-BOM, sensitive-path, and exact-staging checks.
- Record RED commands and failure fingerprints in PROGRESS and REPORT.
- Complete, commit, and push T6-007 only when every acceptance criterion is satisfied.

## Stop conditions

- Stop before any production implementation or schema/provider change.
- Stop if a failure is caused by infrastructure, fixtures, authentication, unstable selectors, or unrelated regressions rather than the intended absent contract.
- Stop before real/paid calls, secrets, destructive operations, runtime data changes, or incompatible contracts.
