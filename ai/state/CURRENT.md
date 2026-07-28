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
- T6-020 and T6-021: `DONE / PASS`; preflight plus exact-version atomic instantiate/lineage are verified.
- Old T6-014 through T6-016 were provisional scopes superseded before formal Task creation.
- Database authority remains MySQL-only.

## Active Delivery

- No implementation Task is active after T6-021 closure.
- Completed Task: [TASK-T6-021](../tasks/todo/TASK-T6-021.md).
- Report: [REPORT-T6-021](../reports/REPORT-T6-021.md).
- T6-022 Template Library/configuration UI is the next dependency-ready Task and must start in a separate run.

## Live Gates

- T6-017 contract authority and V1 defaults remain frozen.
- T6-018 added only definition/version/slot/instance/binding/step/run persistence, constraints, indexes, comments,
  migration compatibility, and guarded disposable MySQL evidence.
- The legacy `templates` table and Graph Template runtime remain unchanged.
- T6-019 added built-in/private definition/version lifecycle and owner-scoped API on the T6-018 tables.
- T6-020 adds deterministic topology-only capture, explicit asset-slot promotion, fail-closed classification, and
  provider-free preflight with zero Canvas/template-instance/quota/job/provider mutation.
- T6-021 adds exact-version atomic Canvas instantiate and durable instance/binding/step-node lineage through the
  existing Canvas document patch with zero quota/job/run/provider mutation.
- UI, generation, WorkflowRun, upgrade/clone/detach, and release proof remain assigned to T6-022 through T6-027.
- Program-level final visual, interaction, and journey acceptance remains T6-027.

## Exact Next Action

Start a separate Direct Delivery run for dependency-ready T6-022; do not mix it into the T6-021 delivery commit.

## Worktree Ownership

- Preserve untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and `test-results/`.
- Do not read, stage, commit, or push environment, secret, provider-raw, prompt, source-content, or user-owned evidence.

## Completion Gate

- T6-017 through T6-021 are `DONE / PASS`. T6-022 is not activated. Final Human visual/interaction and journey
  acceptance remains T6-027.
