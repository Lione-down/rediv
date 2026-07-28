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
- T6-018: `DONE / PASS`; additive MySQL persistence foundation is verified.
- Old T6-014 through T6-016 were provisional scopes superseded before formal Task creation.
- Database authority remains MySQL-only.

## Active Delivery

- No active implementation Task; T6-018 repository work is complete.
- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-018](../tasks/todo/TASK-T6-018.md).
- Plan: [TASK-T6-018-PLAN](../tasks/doing/TASK-T6-018-PLAN.md).
- Progress: [TASK-T6-018-PROGRESS](../tasks/doing/TASK-T6-018-PROGRESS.md).
- Requirements: [Reusable cinematic template PRD](../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).

## Live Gates

- T6-017 contract authority and V1 defaults remain frozen.
- T6-018 added only definition/version/slot/instance/binding/step/run persistence, constraints, indexes, comments,
  migration compatibility, and guarded disposable MySQL evidence.
- The legacy `templates` table and Graph Template runtime remain unchanged; T6-019 lifecycle API and all later behavior
  are excluded.
- Program-level final visual, interaction, and journey acceptance remains T6-027.

## Exact Next Action

Precisely commit/push T6-018, verify `HEAD == origin/main`, then create the separate T6-019 goal session; this checkout
must not receive T6-019 changes from the current session.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- The `.hermes` redesign plan remains untracked planning evidence.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- T6-017 is `DONE / PASS`; machine evidence is recorded in [REPORT-T6-017](../reports/REPORT-T6-017.md).
- T6-018 is `DONE / PASS`; classified machine evidence is recorded in
  [REPORT-T6-018](../reports/REPORT-T6-018.md).
- Create T6-019 only after the T6-018 scoped commit is pushed and `HEAD == origin/main`.
