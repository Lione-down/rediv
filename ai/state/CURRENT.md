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
- T6-017 through T6-019: `DONE / PASS`; frozen V1 contract, additive MySQL persistence, and lifecycle API are verified.
- T6-020: `DONE / PASS`; portable capture/classification and provider-free preflight are verified.
- Old T6-014 through T6-016 were provisional scopes superseded before formal Task creation.
- Database authority remains MySQL-only.

## Active Delivery

- T6-020 is complete; no implementation Task is active until the requested T6-021 session begins.
- Task: [TASK-T6-020](../tasks/todo/TASK-T6-020.md).
- Plan: [TASK-T6-020-PLAN](../tasks/doing/TASK-T6-020-PLAN.md).
- Progress: [TASK-T6-020-PROGRESS](../tasks/doing/TASK-T6-020-PROGRESS.md).
- Report: [REPORT-T6-020](../reports/REPORT-T6-020.md).

## Live Gates

- T6-017 contract authority and V1 defaults remain frozen.
- T6-018 added only definition/version/slot/instance/binding/step/run persistence, constraints, indexes, comments,
  migration compatibility, and guarded disposable MySQL evidence.
- The legacy `templates` table and Graph Template runtime remain unchanged.
- T6-019 added built-in/private definition/version lifecycle and owner-scoped API on the T6-018 tables.
- T6-020 adds deterministic topology-only capture, explicit asset-slot promotion, fail-closed classification, and
  provider-free preflight with zero Canvas/template-instance/quota/job/provider mutation.
- Instantiate/lineage, UI, generation, WorkflowRun, upgrade/clone/detach, and release proof remain assigned to
  T6-021 through T6-027.
- Program-level final visual, interaction, and journey acceptance remains T6-027.

## Exact Next Action

Precisely commit/push the verified T6-020 scope, confirm remote parity, then create the T6-021 local saved-project
session for atomic instantiate and lineage. Do not edit the repository after creating that session.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- T6-017 through T6-020 are `DONE / PASS`; [REPORT-T6-020](../reports/REPORT-T6-020.md) records focused MySQL `13`,
  related backend `85` plus `3` subtests, frontend `3/3`, build `5,041`, and broad backend `713` plus `203` subtests
  with seven unchanged baseline REDs. Final Human visual/interaction acceptance remains T6-027.
