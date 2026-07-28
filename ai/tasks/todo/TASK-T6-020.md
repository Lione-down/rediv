# TASK-T6-020 - Deliver portable workflow-template capture and provider-free preflight

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: deliver strict Canvas-to-workflow-template portable capture, explicit project-asset slot promotion,
  fail-closed non-portable field classification, and deterministic provider-free preflight on the T6-019 lifecycle
  API.
- Dependency: `T6-019 - DONE / PASS`; activation baseline
  `617e514454212f359eefe2de87c07c6d66a8dc6f`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-020-PLAN](../doing/TASK-T6-020-PLAN.md).
- Progress: [TASK-T6-020-PROGRESS](../doing/TASK-T6-020-PROGRESS.md).
- Report: [REPORT-T6-020](../../reports/REPORT-T6-020.md).

## Scope

1. Add a strict portable classifier that recognizes only frozen portable, local-ID remap, project-asset promotion,
   source-revision revalidation, server-owned reference, and strip cases; unknown or ambiguous fields fail closed.
2. Add provider-free Canvas capture that:
   - authenticates project/Canvas ownership and reads one current active graph without mutating it;
   - creates deterministic template-local node/connection IDs and a strict V1 topology skeleton;
   - requires every referenced project asset to be explicitly promoted to a declared asset slot;
   - strips generation job/provider task/result URL/base64/quota/owner/local-path runtime state;
   - returns sanitized classifications and binding candidates without persisting source asset IDs in the manifest.
3. Add `/api/workflow-templates/{template_id}/versions/{version}/preflight` with the frozen validation order:
   schema/version, owner/scope, typed variables, asset owner/project/status/source revision, graph
   ports/capacity/cycle, capability, quota units/cost class, then deterministic canonical fingerprint.
4. Keep capture and preflight pure with respect to Canvas revision, template instance/binding/step/run rows, quota,
   generation jobs/tasks, and provider requests.
5. Preserve T6-019 lifecycle contracts, the legacy `/templates` Graph Template runtime, and the T6-017 frozen
   manifest/fingerprint authority.

## Non-goals

- No T6-021 Canvas instantiate, ID map persistence, instance/binding/step lineage, idempotent graph patch, or
  revision mutation.
- No T6-022 frontend Template Library/drawer/Workflow/Storyboard UI or Human visual/interaction claim.
- No T6-023 Script/Image, T6-024 Video projection, T6-025 WorkflowRun, T6-026 upgrade/clone/detach, or T6-027
  compatibility retirement/release proof.
- No schema migration, user/runtime database mutation, import/export, team/public marketplace, arbitrary code,
  real/paid provider call, secret access, or mock `execution_mode`/`sessionStorage` production authority.
- No change to the T6-019 create/list/get/draft-update/new-version/publish/retire contract.

## Acceptance criteria

1. Focused portability/capture/preflight tests first fail only because T6-020 modules/routes/contracts are absent.
2. Capture returns a strict V1 draft manifest with deterministic local IDs/topology and never serializes source
   project asset IDs, job/task IDs, result URLs/base64, quota/ledger, owner IDs, local paths, provider credentials,
   raw responses, or undeclared fields.
3. Every captured project asset is explicitly and deterministically promoted to one asset slot; missing, foreign,
   inactive, duplicate, mismatched-media, or unclassified references fail closed.
4. Unknown or ambiguous capture fields fail closed instead of silently becoming portable.
5. Preflight validates exactly in the frozen order and returns bounded errors, resolved safe slot summaries,
   graph/capability/quota/cost snapshots, and one SHA-256 canonical fingerprint.
6. Variable defaults/bindings obey declared type, required, enum, integer bounds, text length, boolean, and bounded
   list constraints.
7. Asset bindings obey authenticated owner, target project, active status, media type, cardinality, and exact source
   revision; foreign/stale bindings reveal no other-owner data.
8. Graph endpoints, ports, capacity, and step dependency DAG plus current capability requirements fail closed.
9. Quota estimates are conservative backend-authoritative units by step intent; insufficient quota and confirmation
   cost class remain provider-free.
10. Success and every failure leave zero Canvas revision, zero template instance/binding/step/run, zero quota/ledger,
    zero generation task/job, and zero provider request mutation.
11. Guarded disposable MySQL focused evidence, relevant frozen/legacy/Canvas regression, relevant broad backend
    classification, state validator, diff/security audit, one scoped commit/push, and remote parity are recorded.
