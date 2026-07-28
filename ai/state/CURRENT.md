# Revid Current Project State

- State: `DONE`
- Verification outcome: `DEFERRED`
- Last updated: `2026-07-28`

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`; Codex is the single engineering owner.
- Human gates remain real/paid provider calls, secrets, external accounts, destructive user data/filesystem operations,
  arbitrary-code templates, and public/team marketplace scope.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- T6-001 through T6-004 and T6-006 through T6-011: `DONE / PASS`.
- T6-005 and T6-012: terminal `BLOCKED / FAIL`.
- T6-013: `DONE / DEFERRED`; implementation and classified machine evidence are complete, while final visual,
  interaction, and journey acceptance is aggregated into T6-027.
- Old T6-014 through T6-016 were provisional scopes before formal Task creation. They were superseded by the Revid V3
  reusable workflow-template PRD and must not receive fabricated Task files, REPORTs, `DONE`, or `FAIL` states.
- Database authority remains MySQL-only.

## Active Delivery

- No implementation Task is active during the bounded post-T6-013 baseline commit/push transition.
- Closed Task: [TASK-T6-013](../tasks/todo/TASK-T6-013.md).
- Plan: [TASK-T6-013-PLAN](../tasks/doing/TASK-T6-013-PLAN.md).
- Progress: [TASK-T6-013-PROGRESS](../tasks/doing/TASK-T6-013-PROGRESS.md).
- Report: [REPORT-T6-013](../reports/REPORT-T6-013.md).

## Live Gates

- Human program direction on 2026-07-28 authorizes sequential T6-017 through T6-027 goal-mode delivery, normal
  implementation/testing/browser QA, the planned T6-018 expand-first additive migration, one scoped commit/push per
  Task, and creation of the next session after remote parity.
- This authorization does not create historical T6-013 `ACCEPT/PASS`; machine evidence remains distinct from Human
  acceptance.
- Fresh closure evidence: backend `51 + 43 subtests`, `32 + 9 subtests`, and `20 + 5 subtests`; preview-backed frontend
  `63/63`; exact historical legacy edge Delete case `1/1`; fresh build `5,041`; validator and diff check passed.
- The historical broad browser record remains `59/60`; the complete 60-test group was not rerun.
- No real/paid provider call, migration, runtime-data mutation, or secret access occurred in Unit 0.

## Exact Next Action

Precisely stage and push the official T6-012/T6-013 baseline. After `HEAD == origin/main`, create and activate only
T6-017 Task/PLAN/PROGRESS for PRD V1 and workflow-template contract freeze.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- T6-013 is closed as `DONE / DEFERRED`.
- T6-017 may activate only after the baseline commit is pushed and remote parity is verified.
