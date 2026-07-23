# TASK-T6-007 - Characterize and freeze replacement contracts

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 contract-first reset`
- Objective: turn the Human-approved T6-006 replacement workflows into focused failing backend and browser contracts before changing runtime behavior.
- Dependency: `T6-006 - DONE / PASS`.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-007-PLAN](../doing/TASK-T6-007-PLAN.md).
- Progress: [TASK-T6-007-PROGRESS](../doing/TASK-T6-007-PROGRESS.md).

## Scope

- Add RED backend contracts for compact submit/status/result DTOs, hard payload budgets, semantic video-reference preservation, and built-in story-director output.
- Add RED Playwright contracts for node rename stability, duplicate-title disambiguation, refresh-continuous generation, non-selectable director ownership, semantic video references, same-card results, and image-batch siblings.
- Mark overlapping legacy keyframe, result-node, polling, and payload expectations explicitly as compatibility behavior where required.
- Record precise expected failure fingerprints proving that failures are caused only by absent T6-006 replacement contracts.

## Non-goals and locked boundaries

- No runtime implementation, schema migration, provider adapter change, production API change, snapshot regeneration, visual redesign, or compatibility-path removal.
- No real or paid provider call, secret access, database mutation outside isolated existing test authorities, destructive action, or external-account change.
- Do not weaken existing unrelated thresholds or convert RED expectations into skips.

## Acceptance criteria

1. Focused backend tests fail only because compact v2 generation, semantic-reference, or story-director contracts do not yet exist.
2. Focused Playwright tests fail only because the approved rename, durable generation, built-in director, semantic-reference, or same-card behaviors do not yet exist.
3. Every failure fingerprint names the absent replacement contract and is stable enough to guide T6-008 and later Tasks.
4. Legacy compatibility expectations are labeled without changing runtime behavior.
5. No snapshot is updated or assertion weakened to conceal a mismatch.
6. Project state, UTF-8/no-BOM, diff, sensitive-path, and exact-staging checks pass.

## Completion evidence

- Backend replacement contracts: `10/10` expected RED failures across compact DTOs, `4 KiB` submit/status and `128 KiB` delta budgets, semantic references, and `revid.story-production`.
- Browser replacement contracts: `11/11` expected RED failures across rename/history, compact durable submit/restore, same-card and image-batch results, built-in director ownership, semantic capability/context, and connected-image `@` bindings.
- Every RED failure is an assertion with a named `T6-007 RED [...]` fingerprint caused by an absent replacement contract; no collection, fixture, authentication, preview, MySQL, or provider failure remains.
- Legacy compatibility labels preserve existing behavior: backend `26/26` and Playwright `6/6` pass without assertion changes.
- Production build passes with `4,988 modules transformed`; no runtime source, snapshot, schema, provider adapter, or production API changed.
- REPORT: [REPORT-T6-007](../../reports/REPORT-T6-007.md).
