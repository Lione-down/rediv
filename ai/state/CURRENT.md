# Revid Current Project State

- State: `DONE`
- Verification outcome: `PASS`
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
- T6-022: `DONE / PASS`; Template Library/configuration UI is implemented and machine verified.
- T6-023: `DONE / PASS`; template-aware Script/Image and old T6-014 closeout is delivered.
- T6-024: `DONE / PASS`; provider-valid Video compiler and old T6-015 replacement are delivered.
- Old T6-014 through T6-016 were provisional scopes superseded before formal Task creation.
- Database authority remains MySQL-only.

## Active Delivery

- Latest completed Task: `T6-024 - Provider-valid Video compiler and old T6-015 replacement`;
  [TASK-T6-024](../tasks/todo/TASK-T6-024.md).
- Plan: [TASK-T6-024-PLAN](../tasks/doing/TASK-T6-024-PLAN.md).
- Progress: [TASK-T6-024-PROGRESS](../tasks/doing/TASK-T6-024-PROGRESS.md).
- Report: [REPORT-T6-024](../reports/REPORT-T6-024.md).
- Dependency baseline: T6-023 `DONE / PASS`;
  `HEAD == origin/main == c79bf1e8c0deac88f4fa1111ba8dd8a3b7327d7c` at activation.

## Live Gates

- T6-017 contract authority and V1 defaults remain frozen; the legacy `templates` table and Graph Template runtime
  remain unchanged.
- T6-018 through T6-021 own persistence, lifecycle, capture/preflight, atomic instantiate, and durable lineage.
- T6-022 owns only Library/configuration UI and existing-route adoption, without provider execution or a second
  Canvas authority.
- Video compilation is delivered by T6-024; WorkflowRun, upgrade/clone/detach, and release proof remain
  assigned to inactive T6-025 through T6-027.
- Program-level final visual, interaction, and journey acceptance remains T6-027.

## Exact Next Action

Stop. T6-025 is dependency-ready but remains inactive.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- T6-024 is closed `DONE / PASS`; no deferred T6-024 implementation remains.
- Machine browser/build evidence is not Human acceptance; final program-level acceptance remains T6-027.
