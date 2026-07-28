# Revid Current Project State

- State: `DOING`
- Verification outcome: `PENDING`
- Last updated: `2026-07-29`

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`; Codex is the single engineering owner.
- Human gates remain paid providers, secrets, external accounts, destructive operations, arbitrary code, and public/team scope.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- T6-001 through T6-004 and T6-006 through T6-011: `DONE / PASS`.
- T6-005 and T6-012: terminal `BLOCKED / FAIL`.
- T6-013: `DONE / DEFERRED`; baseline `515b8c90097108b05e8cc838e3ba6402e30c366b` is pushed.
- T6-017 through T6-019: `DONE / PASS`; contract, persistence, and lifecycle API are verified.
- T6-020 and T6-021: `DONE / PASS`; portable preflight plus atomic instantiate/lineage are verified.
- T6-022 through T6-026: `DONE / PASS`; Library/configuration UI, Script/Image, provider-valid Video, durable
  WorkflowRun orchestration, and template-instance compatibility lifecycle are delivered and machine verified.
- Old T6-014 through T6-016 were provisional scopes superseded before formal Task creation; database authority
  remains MySQL-only.

## Active Delivery

- No implementation Task is active. T6-026 is closed; T6-027 was not created or activated.
- Completed Task: [TASK-T6-026](../tasks/todo/TASK-T6-026.md).
- Plan: [TASK-T6-026-PLAN](../tasks/doing/TASK-T6-026-PLAN.md).
- Progress: [TASK-T6-026-PROGRESS](../tasks/doing/TASK-T6-026-PROGRESS.md).
- Report: [REPORT-T6-026](../reports/REPORT-T6-026.md).
- Activation baseline: `9c0c4b57186b5e448180af5932ced6b792a3648b`; delivery commit and remote parity are
  verified in the current run.

## Live Gates

- T6-017 contract authority and V1 defaults remain frozen; the legacy `templates` table and Graph Template runtime
  remain unchanged.
- T6-018 through T6-021 own persistence, lifecycle, capture/preflight, atomic instantiate, and durable lineage.
- T6-022 owns only Library/configuration UI and existing-route adoption, without provider execution or a second
  Canvas authority.
- Video compilation is delivered by T6-024, and explicit durable WorkflowRun orchestration is delivered by T6-025.
  T6-026 may add only explicit additive-compatible version lifecycle around those frozen authorities.
- T6-026 protects detected local overrides and keeps upgrade/clone/detach on typed Canvas
  mutation/history/autosave plus authoritative backend transactions with zero implicit run/job/provider work.
- Program-level final visual, interaction, and journey acceptance remains T6-027.

## Exact Next Action

Stop. Do not create or activate T6-027 in this delivery; any later T6-027 work requires a separate dependency-ready
Direct Delivery activation.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate
- T6-026 non-deferred acceptance, scoped commit/push, and remote parity are complete.
- Machine browser/build evidence is not Human acceptance; final program-level acceptance remains T6-027.
