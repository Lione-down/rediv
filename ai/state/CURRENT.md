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
- T6-017 through T6-019: `DONE / PASS`; contract, persistence, and lifecycle API are verified.
- T6-020 and T6-021: `DONE / PASS`; portable preflight plus atomic instantiate/lineage are verified.
- T6-022: `DONE / PASS`; Template Library/configuration UI is implemented and machine verified.
- T6-023: `DONE / PASS`; template-aware Script/Image and old T6-014 closeout is delivered.
- Old T6-014 through T6-016 were provisional scopes superseded before formal Task creation.
- Database authority remains MySQL-only.

## Active Delivery

- Latest completed Task: `T6-023 - Template-aware Script/Image and old T6-014 closeout`;
  [TASK-T6-023](../tasks/todo/TASK-T6-023.md).
- Plan: [TASK-T6-023-PLAN](../tasks/doing/TASK-T6-023-PLAN.md).
- Progress: [TASK-T6-023-PROGRESS](../tasks/doing/TASK-T6-023-PROGRESS.md).
- Report: [REPORT-T6-023](../reports/REPORT-T6-023.md).

## Live Gates

- T6-017 contract authority and V1 defaults remain frozen; the legacy `templates` table and Graph Template runtime
  remain unchanged.
- T6-018 through T6-021 own persistence, lifecycle, capture/preflight, atomic instantiate, and durable lineage.
- T6-022 owns only Library/configuration UI and existing-route adoption, without provider execution or a second
  Canvas authority.
- Generation, WorkflowRun, upgrade/clone/detach, and release proof remain assigned to T6-023 through T6-027.
- Program-level final visual, interaction, and journey acceptance remains T6-027.

## Exact Next Action

Stop. T6-024 is dependency-ready for a new Direct Delivery session but is not active.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- T6-023 is closed `DONE / PASS`; no deferred T6-023 acceptance remains.
- Final Human visual, interaction, and journey acceptance remains T6-027.
