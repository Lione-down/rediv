# TASK-T6-008 - Add durable compact generation jobs

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 contract-first reset`
- Objective: implement compact versioned generation-job APIs and a durable MySQL lease-backed runner so provider work is independent of browser HTTP request lifetimes.
- Dependency: `T6-007 - DONE / PASS` at activation baseline `HEAD == origin/main == 6be8c41d47a20ede687fed863366e4c723b59f0b`.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-008-PLAN](../doing/TASK-T6-008-PLAN.md).
- Progress: [TASK-T6-008-PROGRESS](../doing/TASK-T6-008-PROGRESS.md).
- Report: [REPORT-T6-008](../../reports/REPORT-T6-008.md).

## Scope

- Add owned compact submit, status, result, delta, cancel, and retry DTOs under versioned v2 generation-job APIs.
- Extend the existing MySQL generation-task authority with expand-first lease, version, cancellation, retry, and immutable idempotency state proven necessary by T6-007 contracts.
- Add repository and request-scoped service operations for submit, claim, heartbeat, complete, fail, cancel, retry, result read, and project/Canvas delta listing.
- Add a bounded FastAPI lifespan runner that reclaims expired leases and delegates provider work through an explicit dispatch boundary.
- Preserve compatibility reads for existing generation-task rows and keep legacy media endpoints unchanged.
- Add migration and integration proof only against disposable MySQL.

## Non-goals and locked boundaries

- No T6-009 frontend synchronization, Canvas UI, same-card result application, card rename, director, script, image, or semantic-video implementation.
- No real or paid provider call, secret access, user/runtime-data migration, destructive operation, external-account change, or incompatible legacy endpoint removal.
- Do not mutate user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, or `test-results/`.
- Do not expose `request_parameters`, provider raw responses, request fingerprints, credential-bearing URLs, base64 media, full project history, or duplicated result bodies through ordinary v2 DTOs.

## Acceptance criteria

1. T6-007 compact DTO and hard payload-budget tests are GREEN without weakening their assertions.
2. A persisted queued job is claimable under one bounded lease; an expired running lease is reclaimed once after simulated process restart.
3. Repeating the same client request ID and immutable fingerprint returns the same job without replaying provider mutation.
4. Reusing the same client request ID with a different fingerprint fails closed.
5. Claim, heartbeat, completion, failure, cancellation, retry, result read, and delta listing preserve monotonic versioning and project/Canvas authorization.
6. A mock provider invocation is independent of browser disconnect and persists its provider request ID before later polling or completion.
7. Existing generation-task rows remain readable through the compatibility boundary.
8. Every new or changed database field has a non-empty MySQL comment; migration upgrade/downgrade and integration proof run only against disposable MySQL.
9. Focused tests pass before relevant broad backend regression; activation-state, diff, UTF-8, sensitive-path, exact-staging, commit, and push checks pass, with the documented post-closure single-active transition ending when T6-009 activates.

## Completion

- Compact v2 DTO/API, MySQL lease/idempotency execution, fake-provider dispatch, process-restart reclaim, cancellation/retry, result and delta reads, and legacy compatibility are implemented.
- Focused T6-008 verification is `24/24`; related transaction/runtime regression is `44/44`; broad backend verification excluding the two explicitly future-owned T6-007 RED modules is `606/606`.
- Migration proof used disposable MySQL only. No real/paid provider call, secret access, user/runtime migration, T6-009 frontend work, or protected-path mutation occurred.
