# Revid Current Project State

- State: `VERIFYING`
- Verification outcome: `PENDING`
- Last updated: `2026-07-29`

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`; Codex is the single engineering owner.
- Human gates remain paid providers, secrets, external accounts, destructive operations, arbitrary code, public/team
  scope, and final program-level visual/interaction/journey acceptance.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- T6-001 through T6-004 and T6-006 through T6-011: `DONE / PASS`; T6-005 and T6-012: terminal `BLOCKED / FAIL`.
- T6-013: `DONE / DEFERRED`; T6-017 through T6-026: `DONE / PASS`.
- Old T6-014 through T6-016 had no formal Task files; T6-023/T6-024 closed the first two, and the T6-027 candidate
  closes old T6-016 without fabricating historical Task or REPORT files.
- Database authority remains MySQL-only; legacy Graph Templates remain readable under the frozen V1 contract.

## Active Delivery

- Active implementation Task: `T6-027 - Retire compatibility paths and prove final release candidate`.
- Task: [TASK-T6-027](../tasks/todo/TASK-T6-027.md).
- Plan: [TASK-T6-027-PLAN](../tasks/doing/TASK-T6-027-PLAN.md).
- Progress: [TASK-T6-027-PROGRESS](../tasks/doing/TASK-T6-027-PROGRESS.md).
- Machine candidate: [T6-027 release candidate](../reports/T6-027-RELEASE-CANDIDATE.md).
- Activation baseline: `0f9aa9a53af694f208a354b5fa2bd9628f0d4141`; startup fetch confirmed remote parity.

## Live Gates

- Ordinary Image/Video submission uses compact v2 jobs, exact card binding, current-Canvas/bound-job sync, and
  same-card results. It no longer depends on legacy full-task success reconciliation, project-wide polling, or
  write-capable hidden Result materialization.
- Browser-local Workflow batch mock execution is no longer production-reachable. Explicit durable WorkflowRun remains
  the V3 template execution authority.
- The four T6-026 backend Image mismatches and the related frontend stale defaults/routes now agree on ordinary
  `1:1` plus `output_count: 1`.
- Explicit history/admin reads, historical Result/Graph Template readability, redirect-only old workspace code, and
  the specialized Script/story response remain declared compatibility boundaries.
- Machine evidence includes related backend, complete `712/712` non-upload backend classification, one Alembic head,
  compile, dependency audit, fresh build, and provider-free Chromium. The complete backend discovery separately
  classifies an unchanged Windows `anyio.to_process` upload-worker initialization failure and is not called PASS.

## Exact Next Action

Human Owner performs the frozen final visual, interaction, and complete-journey review and records `ACCEPT` or
`ACCEPT_WITH_DECLARED_BOUNDARIES`. If accepted, close T6-027 with a final REPORT and state-only reconciliation;
create no successor Task.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- Keep T6-027 `VERIFYING / PENDING` unless the Human Owner records `ACCEPT` or
  `ACCEPT_WITH_DECLARED_BOUNDARIES`; create no successor Task.
