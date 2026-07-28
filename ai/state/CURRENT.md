# Revid Current Project State

- State: `DONE`
- Verification outcome: `PASS`
- Last updated: `2026-07-28`

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`; Codex is the single engineering owner.
- Human gates remain real/paid provider calls, secrets, external accounts, destructive user data/filesystem operations,
  arbitrary-code templates, and public/team marketplace scope.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- T6-001 through T6-004 and T6-006 through T6-011: `DONE / PASS`.
- T6-005 and T6-012: terminal `BLOCKED / FAIL`.
- T6-013: `DONE / DEFERRED`; baseline `515b8c90097108b05e8cc838e3ba6402e30c366b` is pushed.
- T6-017: `DONE / PASS`; V1 PRD/schema/cross-language contract and sanitized fixtures are verified.
- Old T6-014 through T6-016 were provisional scopes superseded before formal Task creation.
- Database authority remains MySQL-only.

## Active Delivery

- No active implementation Task; T6-017 repository work is complete.
- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-017](../tasks/todo/TASK-T6-017.md).
- Plan: [TASK-T6-017-PLAN](../tasks/doing/TASK-T6-017-PLAN.md).
- Progress: [TASK-T6-017-PROGRESS](../tasks/doing/TASK-T6-017-PROGRESS.md).
- Requirements: [Reusable cinematic template PRD](../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).

## Live Gates

- T6-017 stayed within schema, behavior matrix, Pydantic/TypeScript parser, canonical fingerprint, portability/security
  fixtures, and provider projection fixtures.
- V1 defaults are built-in plus user-owned private templates, three built-in seed categories, immutable private publish,
  explicit compatible upgrade, no V1 import/export or Pro Alpha selector, explicit-only Image 2.0 precomposition, quota
  units plus cost class, target-project asset rebinding, and legacy Graph Template readability.
- No runtime UI, database model/migration, API lifecycle, Canvas mutation, quota/job mutation, or provider request was
  added.
- Program-level final visual, interaction, and journey acceptance remains T6-027.

## Exact Next Action

Precisely commit/push T6-017, verify `HEAD == origin/main`, then create the separate T6-018 goal session; this checkout
must not receive T6-018 changes from the current session.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- The formal PRD is T6-017 scope; the `.hermes` redesign plan remains untracked planning evidence.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- T6-017 is `DONE / PASS`; machine evidence is recorded in [REPORT-T6-017](../reports/REPORT-T6-017.md).
- Create T6-018 only after the T6-017 scoped commit is pushed and `HEAD == origin/main`.
