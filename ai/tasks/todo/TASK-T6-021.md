# TASK-T6-021 - Deliver atomic workflow-template instantiate and lineage

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: atomically instantiate one exact immutable workflow-template version into one owned active Canvas
  through the existing Canvas document patch authority while persisting exact instance, binding, step/node, slot,
  and source-revision lineage.
- Dependency: `T6-020 - DONE / PASS`; activation baseline
  `61c88b3c51a4dfdf4cfafb320206abe5ea23e55b`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-021-PLAN](../doing/TASK-T6-021-PLAN.md).
- Progress: [TASK-T6-021-PROGRESS](../doing/TASK-T6-021-PROGRESS.md).
- Report: [REPORT-T6-021](../../reports/REPORT-T6-021.md).

## Scope

1. Add the strict owner-scoped
   `POST /api/projects/{project_id}/canvases/{canvas_id}/workflow-template-instances` contract for exact
   `template_id + template_version`, `base_revision`, `client_mutation_id`, optional anchor, variable/asset
   bindings, and the T6-020 preflight fingerprint.
2. Revalidate under one request-scoped MySQL transaction:
   - exact immutable published version and normalized manifest fingerprint;
   - authenticated owner, target project, active Canvas, and current base Canvas revision;
   - preflight fingerprint against current typed bindings, asset owner/project/status/source revision,
     graph ports/capacity/cycle, capability, quota/cost snapshot;
   - target Canvas entity-ID collisions.
3. Allocate deterministic stable instance, node, connection, binding, and step IDs. Translate the frozen
   topology-only manifest into ordinary canonical Canvas nodes/connections with server-owned deterministic layout
   and safe configuration only.
4. Reuse `apply_document_patch_in_session` as the sole graph write authority. Persist Canvas revision metadata,
   exact template instance, variable/asset bindings, and step-to-stable-node lineage in the same transaction.
5. Add two narrow additive lineage tables:
   - ordered asset-binding items because the T6-018 parent binding row is unique per slot while frozen V1 slots
     allow cardinality up to nine;
   - an immutable instance-commit snapshot because Canvas revision retention must not erase strict instantiate
     idempotency.
   Keep the T6-018 tables and constraints compatible; do not apply migrations to a user/runtime database in this
   Task.
6. Make `client_mutation_id` replay strict: an identical retry returns the same instance and entity ID maps without
   a second revision; a reused key with any different request fact returns conflict and writes nothing.
7. Prove every stale, foreign, invalid, collision, or concurrency path leaves zero partial Canvas/instance/lineage,
   zero quota/ledger, zero generation task/job/run, and zero provider request.

## Frozen-schema interpretation

- T6-017/T6-020 define a topology-only graph manifest containing node local ID, node type/subtype, connections,
  ports, and steps. T6-021 must not add layout, content, group-parent, provider, or runtime fields to that manifest.
- Canvas node shape and layout are therefore deterministic server-owned projection defaults. Bindings and step/node
  provenance are durable lineage rows, not a second graph authority.
- Group-parent remap is supported only when a future frozen contract can express parent lineage; T6-021 does not
  invent an undeclared parent field or widen the V1 schema.

## Non-goals

- No T6-022 Template Library, configuration drawer, Workflow/Storyboard projection, frontend mutation controller,
  or Human visual/interaction acceptance.
- No T6-023 Script/Image behavior, T6-024 Video compiler, T6-025 WorkflowRun, T6-026 upgrade/clone/detach, or
  T6-027 retirement/release.
- No migration other than the required additive asset-binding-item and instance-commit lineage tables; no
  user/runtime database application, legacy Graph Template contract rewrite, second Canvas write path, mock `execution_mode`,
  `sessionStorage` authority, provider call, quota mutation, generation task/job, or WorkflowRun.
- No environment/secret/provider-raw/prompt/source-content/user-owned evidence access.

## Acceptance criteria

1. Focused instantiation/idempotency/security tests first fail only because the T6-021 route/service/contracts are
   absent.
2. Two distinct mutation IDs for one exact version create logically identical topology with isolated stable Canvas
   IDs and exactly one Canvas revision per instance.
3. An identical mutation replay returns the same instance, node map, connection map, binding IDs, step IDs, and
   committed revision without duplicate rows.
4. A mutation-key replay with changed version, base revision, anchor, bindings, source revision, cost confirmation,
   or preflight fingerprint returns conflict with zero write.
5. Exact published version, owner/project/Canvas, current preflight fingerprint, asset source revision,
   ports/capacity/cycle, capability/quota/cost, base revision, and target IDs are revalidated under transaction.
6. Graph revision plus instance, bindings, and step/node lineage commit together or roll back together.
7. Persisted lineage pins definition/version/fingerprint, target project/Canvas, stable node map, typed variable
   values, target-project asset/source revisions, and every workflow step's template-local/stable Canvas node.
8. Created nodes/connections are ordinary canonical Canvas entities and remain under existing document
   revision/history/autosave authority.
9. Success and every failure produce zero quota/ledger, generation task/job/run, and provider request mutation.
10. Guarded disposable `revid_test_*` MySQL evidence, focused and related regression, broad backend
    classification, state validator, diff/security audit, one scoped commit/push, and remote parity are recorded.
