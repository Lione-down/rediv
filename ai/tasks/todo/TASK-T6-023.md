# TASK-T6-023 - Deliver template-aware Script/Image and close old T6-014

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: carry exact workflow-template instance lineage through strict Story Production and selected-shot Image
  card authoring, then close the remaining old T6-014 same-card Image/batch-sibling lifecycle gaps without adding
  automatic generation or another Canvas/provider authority.
- Dependency: `T6-022 - DONE / PASS`; activation baseline
  `327e5d216592c8286f643e14d6819320934aed56`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-023-PLAN](../doing/TASK-T6-023-PLAN.md).
- Progress: [TASK-T6-023-PROGRESS](../doing/TASK-T6-023-PROGRESS.md).

## Scope

1. Resolve one authenticated, active template instance and Script step from existing T6-021 lineage, then bind exact
   template ID/version, instance ID, step ID, stable Script node ID, and shot lineage to sanitized Story Director
   requests and validated Story Production results.
2. Preserve immutable local IDs for roles, scenes, props, references, and shots after first validation; partial
   regeneration merges only the requested target ID and never re-derives identity from editable names or text.
3. Create N ordinary Image Generation cards for N selected validated shots through one existing atomic typed Canvas
   command, with no provider, quota, generation task/job, or WorkflowRun side effect.
4. Persist each Image card's source Script/shot and template/version/instance/step lineage plus capability-authoritative
   Image size, ratio, output count, and only allowed local overrides through existing history/autosave.
5. Reuse the existing Image 2.1 default shot-image contract and expose Image 2.0 composition only for an explicit
   user action accepted by current capability; never select or run it automatically.
6. Preserve supported `output_count` through the existing request and same-card/batch-sibling result authority. Each
   returned output remains independently addressable for result, asset, and card-local retry without a hidden normal
   Result authoring card.
7. Add bounded provider-free backend and browser contract evidence for lineage, strict merge, atomic card creation,
   zero automatic execution, persistence/reload, same-card/batch sibling behavior, and safe failure.
8. Record that the useful remainder of provisional old T6-014 is absorbed and closed by this Task; do not fabricate a
   historical old T6-014 Task, state, or REPORT.

## Non-goals

- No T6-024 Video compiler, provider projection, semantic-reference reinterpretation, Image 2.0 precomposition run, or
  old T6-015 replacement.
- No T6-025 WorkflowRun, batch orchestration, durable dependency runner, or third provider/job path.
- No T6-026 version diff, compatible upgrade, clone, or detach.
- No T6-027 compatibility retirement, legacy payload/result removal, release proof, or final Human journey acceptance.
- No automatic generation, real/paid provider call, secret access, external account, user/production database
  mutation, migration, destructive filesystem/database operation, or frozen T6-017 through T6-022 contract rewrite.
- No second Canvas graph/history/autosave authority and no localStorage/sessionStorage production lineage.

## Acceptance criteria

1. Focused backend/frontend tests first observe missing template-aware Script/Image lineage or old T6-014 closeout
   behavior before production implementation.
2. A template-backed Script request/result retains exact template ID/version, instance ID, instance step ID, stable
   Script node ID, and deterministic shot lineage without returning prompt, source content, provider raw, or owner data.
3. Strict Story Production keeps immutable local entity/shot IDs; targeted partial regeneration updates only the exact
   target and malformed/mismatched lineage fails closed while preserving the last validated state.
4. Selecting N valid shots creates exactly N ordinary Image Generation cards in one atomic typed command with stable
   source/shot/template lineage, current Image size/ratio/output count, and allowed overrides.
5. Creating cards makes zero provider request, quota mutation, generation task/job, WorkflowRun, or automatic Image
   2.0 composition.
6. Supported `output_count` reaches the existing Image request and every returned output uses the existing
   same-card/batch-sibling result/asset/retry authority; unsupported counts fail closed before dispatch.
7. Undo/redo, autosave/reload, Canvas switching, Workflow/Storyboard stable identity, stale/foreign lineage, and safe
   error boundaries are covered by focused and related regression.
8. Fresh production build, provider-free runtime/browser evidence, state validator, diff/security audit, exact-path
   staging, one conventional commit/push, and remote parity are recorded.
9. Machine evidence is not described as Human acceptance; the program-level Human visual/interaction/journey gate
   remains T6-027.

## Completion state

T6-023 is `DONE / PASS`. Every non-deferred acceptance criterion passed; the useful remainder of provisional old
T6-014 is absorbed and closed here. Machine browser/build evidence is not Human acceptance, and the program-level
Human visual/interaction/journey gate remains T6-027.
