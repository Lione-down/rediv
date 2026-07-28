# REPORT-T6-023 - Template-aware Script/Image and old T6-014 closeout

- Task: [TASK-T6-023](../tasks/todo/TASK-T6-023.md)
- Plan: [TASK-T6-023-PLAN](../tasks/doing/TASK-T6-023-PLAN.md)
- Progress: [TASK-T6-023-PROGRESS](../tasks/doing/TASK-T6-023-PROGRESS.md)
- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-28`
- Activation baseline: `327e5d216592c8286f643e14d6819320934aed56`

## Delivered

T6-023 carries exact T6-021 template ID/version, instance ID, deterministic instance-step ID, step ID, stable Script
node ID, and shot ID through the existing Script/Story/Image path. Template-backed Script cards receive a sanitized
lineage snapshot during exact-version instantiation. Story Director validates that snapshot against the authenticated
active instance and current Canvas card before dispatch, stores only sanitized lineage in the generation-task request,
and stamps it into strict Story Production. Full and targeted regeneration reject source or lineage drift while
preserving immutable entity and shot IDs.

Confirmed selected shots create exactly N ordinary Image Generation cards through one existing typed `insert-graph`
command. Each card persists its Script/shot/template lineage and capability-authoritative size, ratio, and supported
output count through existing history/autosave. Creation makes no provider, quota, generation task/job, WorkflowRun,
or automatic Image 2.0 composition call.

The existing Image request, same-card materialization, and batch-sibling authority remains unchanged. A multi-output
run keeps slot one on the initiating card and clones ordinary siblings with the exact template/shot snapshot, while
clearing only runtime task/result state. Every sibling therefore retains independent request, result, asset, retry,
and reload behavior. This absorbs and closes the useful remainder of provisional old T6-014 without fabricating an
old T6-014 Task, status, or REPORT.

## Fail-closed and authority boundary

- Backend validation binds owner, project, Canvas, active instance status, immutable template version, deterministic
  instance step, step key, and stable Script node.
- Current Script and Image card snapshots must exactly match submitted lineage. Missing, stale, foreign, mismatched,
  or malformed lineage returns a bounded sanitized 409 before provider/task mutation.
- Provider raw, prompt/source content, owner data, env, and secrets are not copied into lineage or evidence.
- Existing typed Canvas command/history/autosave, compact generation task/job, exact result, and Image batch sibling
  paths remain the only authorities. No local/session storage or third provider/Canvas path was added.

## TDD, regression, build, and runtime evidence

| Gate | Result |
|---|---|
| Focused observed RED | backend `1 failed, 4 passed`; frontend `2 failed` |
| Focused template-aware GREEN | backend Story `9/9`; frontend `2/2` |
| Related backend Story/Text/Image/template-instance | `51 passed, 9 subtests passed` |
| Related Chromium template/Script/Image/batch/parameters | `28/28` |
| Final exact-snapshot/provider-authority hardening | backend `28/28`; Chromium `21/21` |
| Fresh production build | PASS, `5,048 modules transformed` |
| Built-artifact Chromium page flows | `2/2` against configured `vite preview` |
| Python compile, project-state validator, diff check | PASS |

Browser fixtures prove atomic card authoring, supported 1-4 output counts, no automatic generation, exact request
lineage, independent sibling retry/reload, and stale fail-closed behavior. They are provider-free machine evidence,
not Human visual, interaction, or journey acceptance.

## Acceptance assessment

All non-deferred T6-023 acceptance criteria pass. T6-017 through T6-022 frozen contracts were not rewritten. T6-024
Video compiler, T6-025 WorkflowRun, T6-026 upgrade/clone/detach, and T6-027 retirement/release were not started.
T6-024 is the next dependency-ready Task for a new Direct Delivery session. Final program-level Human
visual/interaction/journey acceptance remains T6-027.
