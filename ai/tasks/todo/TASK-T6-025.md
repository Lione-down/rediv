# TASK-T6-025 - Deliver durable WorkflowRun orchestration

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: add explicit, durable, owner-scoped WorkflowRun orchestration for one exact instantiated workflow-template
  version, with a fresh runtime preflight, dependency-aware reuse of the existing compact generation-job/provider
  path, and exact run/step/job/card lineage across browser refresh and backend restart.
- Dependency: `T6-024 - DONE / PASS`; activation baseline
  `5724fdfa0880a5ac6a9bf166e6467414b935d853`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Canvas authority:
  [V2 Canvas architecture](../../architecture/REVID-V2-CANVAS-ARCHITECTURE.md).
- Decision:
  [Codex Direct Delivery](../../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).
- Plan: [TASK-T6-025-PLAN](../doing/TASK-T6-025-PLAN.md).
- Progress: [TASK-T6-025-PROGRESS](../doing/TASK-T6-025-PROGRESS.md).
- Report: [REPORT-T6-025](../../reports/REPORT-T6-025.md).

## Scope

1. Add strict owner/project/Canvas/instance-scoped run start, read, and cancel contracts. A run starts only after an
   explicit user action with one bounded client run id, accepted runtime preflight fingerprint, and explicit cost
   confirmation where required.
2. In one request-scoped MySQL transaction, lock and revalidate the exact active instance, immutable template version,
   current Canvas/node lineage, persisted variable and target-project asset/source-revision bindings, manifest DAG,
   current capability, quota units/cost class, and preflight fingerprint before creating one `WorkflowRun` and one
   `WorkflowRunStep` per exact instance step.
3. Compile each executable step from the current ordinary Canvas card plus frozen instance-step configuration. Reuse
   the T6-023 typed Script/Image lineage, T6-024 provider-valid Video compiler, current provider capability/adapters,
   and the existing `revid.generation-job.v2` transaction/lease/runner/result authority.
4. Queue only dependency-ready steps. Persist exact run -> instance step -> stable Canvas node -> generation task
   lineage and deterministic per-step idempotency before provider execution.
5. Reconcile job lifecycle durably and cross-process safely: succeeded prerequisites release downstream steps exactly
   once; failed/cancelled prerequisites block descendants; run state derives from persisted step state; backend
   restart or browser absence does not lose or duplicate work.
6. Keep result materialization on the existing owning-card, project-asset, typed Canvas command/history/autosave, and
   generation-job sync authorities. WorkflowRun never mutates the Canvas graph directly.
7. Add the minimal frontend/API integration for an explicit confirmed run, durable status recovery, safe cancel, and
   provider-free browser proof. Instantiation, parsing, page load, or card creation must never start a run.
8. Prove strict replay/conflict, stale/foreign/drifted facts, concurrent reconcile, dependency failure/cancellation,
   restart recovery, exact lineage, provider-valid request projection, and zero unintended mutation.

## Non-goals

- No automatic generation, implicit run, page-load run, instantiate-time run, or silent Image 2.0 precomposition.
- No third provider path, browser-owned runner, `sessionStorage`/`localStorage` authority, or legacy mock
  `execution_mode` promotion.
- No rewrite of T6-017 through T6-024 schema, lifecycle, preflight, instantiate, Script/Image, Video, compact job,
  same-card, Canvas mutation/history/autosave, or provider contracts.
- No T6-026 version diff, compatible upgrade, clone, detach, local-override migration, or version selection change.
- No T6-027 compatibility retirement, legacy removal, release proof, or Human visual/interaction/journey acceptance.
- No real/paid provider call, secret/env/provider-raw/prompt/source-content/user-owned evidence access, external
  account action, user/production database mutation, destructive operation, or irreversible migration.

## Dependencies and risks

- T6-018 supplies commented run/run-step persistence; T6-021 supplies exact-version instance/binding/step-node
  lineage; T6-023/T6-024 supply typed Script/Image and provider-valid Video lineage.
- Cross-process reconciliation must serialize by durable rows and deterministic client request ids; in-memory locks
  or browser timers are insufficient.
- A generation task can become terminal before run reconciliation after process failure. Reconciliation therefore
  must be repeatable from persisted state and must not depend on an in-process callback alone.
- Any current card/asset/capability/preflight drift must fail before a new run/job/quota/provider side effect.

## Acceptance criteria

1. Focused backend and browser tests first fail because the T6-025 run contracts/orchestration are absent, and the
   expected RED is recorded before production implementation.
2. An explicit start with current exact facts creates one durable run, exact run steps, and only dependency-ready
   existing generation jobs. Parsing, instantiate, reload, and ordinary card creation create zero run/job side
   effects.
3. Identical `client_run_id` replay returns the same run, step IDs, job IDs, and preflight snapshot. Reuse with a
   changed instance, fingerprint, cost confirmation, or selected step scope conflicts with zero additional write.
4. Fresh runtime preflight revalidates exact version, owner/project/Canvas, current bindings/source revisions, graph,
   capability, quota/cost, and stable node lineage before execution; stale, foreign, malformed, drifted, or unsupported
   facts fail closed.
5. DAG execution is durable and exact: only ready roots queue initially; succeeded dependencies release each child
   once; failed/cancelled dependencies block descendants; concurrent/repeated reconcile and backend restart neither
   duplicate nor skip a step.
6. Every executable run step links exactly one current generation task and stable owning Canvas card. Current compact
   job leases, provider adapters, T6-023 Script/Image lineage, T6-024 legal Video modes, owned result ingestion, and
   same-card/history/autosave authorities remain authoritative.
7. Run read/cancel returns only bounded sanitized state. Cancel stops queued/active owned jobs through the existing
   job cancellation contract and never fabricates provider completion or expose prompt, raw response, secret, owner,
   or source content.
8. Guarded disposable `revid_test_*` MySQL evidence covers transaction rollback, idempotency, concurrency, restart,
   dependency success/failure/cancel, and zero partial run/job/quota/provider/Canvas mutation on rejected starts.
9. Provider-free focused/related backend tests, browser regression, fresh production build, built-artifact browser
   proof, state validator, diff/security audit, exact-path staging, one conventional commit/push, and remote parity
   are recorded.
10. Machine browser/build evidence is not described as Human acceptance; final program-level Human visual,
    interaction, and journey acceptance remains T6-027.
