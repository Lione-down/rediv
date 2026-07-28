# TASK-T6-012 Implementation Plan

- State: `BLOCKED`
- Verification outcome: `FAIL`
- Active unit: `Human rejected - visible Script workflow is not usable`
- Task: [TASK-T6-012](../todo/TASK-T6-012.md).
- Progress: [TASK-T6-012-PROGRESS](TASK-T6-012-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Frozen RED evidence: [REPORT-T6-007](../../reports/REPORT-T6-007.md).

## Delivery rule

Execute only T6-012 through observed focused REDs followed by the smallest coherent GREEN. Preserve the accepted T6-011 Canvas runtime and every later-Task boundary. Automated evidence does not replace the required Human acceptance decision.

## Unit 0 - Activation and evidence inventory

- Status: `completed`
- Activate T6-012 as the only implementation Task and restore project-state validation.
- Re-read the accepted architecture, T6-007 ownership map/RED report, current frozen RED tests, existing cinematic contracts/compiler, Script authoring boundary, and overlapping worktree paths.
- Create the source/evidence manifest before production implementation, pinning the approved public commit/license and separating derived Revid decisions from provider claims.
- Record exact focused RED commands and failure fingerprints before changing production code.

## Unit 1 - Strict story-production schema

- Status: `completed`
- Add focused tests first for strict stamps, extra-field rejection, non-empty prompts, stable IDs, duplicate names, reference resolution, field locks, validation states, and size/count bounds.
- Implement the smallest strict `schemas.story_production` models that satisfy those contracts.
- Keep schema/prompt fields Revid-owned and UTF-8; do not copy public example prose.

## Unit 2 - Automatic director routing, generation, and repair

- Status: `completed`
- Add focused REDs for standalone-versus-sequence routing, deterministic model messages, strict JSON extraction, bounded structural repair, and retryable failure.
- Implement the non-selectable Skill contract/executor using existing provider/model authority without making real calls.
- Stamp Skill/schema versions server-side and expose only an allowed text-model choice.

## Unit 3 - Partial regeneration and continuity

- Status: `completed`
- Add focused REDs for target-only partial regeneration, locked/user-edited preservation, source-revision drift, accepted/rejected take reconciliation, canonical/transient separation, and stable lineage.
- Implement only pure/application-level state transitions; no migration or user/runtime-data mutation.

## Unit 4 - Current-shot prompt compiler

- Status: `completed`
- Add focused REDs proving prompt inclusion/exclusion boundaries.
- Compile a concise current-shot prompt from validated state, reference transfer/exclusion policy, accepted opening state, continuity locks, and reserved beats.
- Prove internal JSON, unrelated shots, rejected takes, and unsupported provider claims are excluded.

## Unit 5 - Script capability and headless result handoff

- Status: `completed`
- Turn the two frozen T6-012 browser contracts GREEN through the existing Script authoring/capability boundary.
- Expose allowed text models and fixed automatic director metadata without a Skill selector or Director Canvas entry.
- Attach one validated story-production result to the initiating stable Script card without implementing T6-013's production UI.

## Unit 6 - Verification and Human gate

- Status: `blocked`
- Run focused tests, related backend/frontend regression, a fresh frontend production build, applicable fresh-build browser proof, and relevant broad checks.
- Run project-state validation, dependency/sensitive-path/protected-path checks, and a fresh diff audit against this Task.
- Update Task/PLAN/PROGRESS/CURRENT continuously.
- Stop at `VERIFYING / PENDING` for explicit Human `ACCEPT` or `ACCEPT_WITH_DECLARED_BOUNDARIES`; do not create REPORT, stage, commit, or push before that decision.

## Stop conditions

- Stop on any need for a migration, real/paid call, secret/env access, user/runtime-data mutation, external Skill installation, or incompatible product/contract change.
- Stop if implementation would surface Director in Canvas, overlap T6-013 through T6-016, or silently absorb T6-011's deferred minor issues.
- Stop if a RED failure is infrastructure/fixture noise rather than the intended missing behavior; repair the test boundary before production changes.

## Human rejection

On 2026-07-25 the Human Owner rejected the candidate because the visible Script function is not usable. Selection marquee, group/ungroup, and whole-card connection acquisition were also explicitly required as a separate Canvas interaction contract. T6-012 remains `BLOCKED / FAIL`; its machine evidence and uncommitted contract implementation are audit/selective-reuse inputs only and are not an accepted delivery.
