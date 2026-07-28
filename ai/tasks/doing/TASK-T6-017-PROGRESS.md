# TASK-T6-017 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-017](../todo/TASK-T6-017.md).
- Plan: [TASK-T6-017-PLAN](TASK-T6-017-PLAN.md).

## Completed work

- Created the required goal before all other work.
- Read the complete governance, source-of-truth chain, linked contracts/architecture, formal PRD, redesign plan, and Git
  baseline without reading environment or secret files.
- Completed Unit 0 as independent commit `515b8c90097108b05e8cc838e3ba6402e30c366b`, pushed it to `origin/main`, and
  verified remote parity.
- Recorded the Human program-level authorization and the `DONE / DEFERRED` evidence boundary for T6-013.
- Activated T6-017 as the only implementation Task after the baseline push.
- Observed backend `20 failed` and frontend `3 failed` REDs caused only by the missing wished-for contract modules.
- Approved PRD V1 defaults and froze the strict JSON Schema, behavior matrix, portable manifest, field classifier,
  sanitized security/provider fixtures, and canonical SHA-256 fingerprint.
- Implemented strict Pydantic and TypeScript contracts for manifest, definition/version references, variables, asset
  slots, graph, steps, bindings, instances, runs, and provider projections without runtime side effects.
- Preserved legacy Graph Template, Canvas patch, Story Production, typed command/history/autosave, compact job, and
  provider adapter authorities; no second runtime or provider pipeline was introduced.
- Corrected the project-state validator so terminal `BLOCKED / FAIL` history does not fabricate an active-Task
  requirement during the authorized post-push, pre-next-session handoff gap.
- Completed focused, provider, legacy Template/Canvas, build, browser, validator, diff, and security verification.

## Remaining work

- No T6-017 implementation or verification work remains.
- Precisely stage this Task, create its single scoped commit, push, verify `HEAD == origin/main`, then create the separate
  T6-018 session. The new session owns all T6-018 planning and repository changes.

## Exact next action

Precisely stage only the formal T6-017 paths, audit the staged diff, commit/push once, verify remote parity, create the
T6-018 session in the same saved project, and stop modifying this repository.

## Files changed

- `ai/tasks/todo/TASK-T6-017.md`
- `ai/tasks/doing/TASK-T6-017-PLAN.md`
- `ai/tasks/doing/TASK-T6-017-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md`
- `ai/requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md`
- `ai/requirements/contracts/revid-workflow-template.v1.schema.json`
- `ai/requirements/contracts/fixtures/workflow-template/*.json`
- `backend/schemas/workflow_template.py`
- `backend/core/workflow_template_contract.py`
- `backend/tests/test_workflow_template_contract.py`
- `backend/tests/test_workflow_template_security_contract.py`
- `frontend/src/modules/template/types.ts`
- `frontend/src/modules/template/workflow-template-contract.ts`
- `frontend/src/modules/template/workflow-template-contract-guards.ts`
- `frontend/tests/e2e/canvas-workflow-template-contract.spec.ts`
- `scripts/validate-project-state.py`
- `ai/reports/REPORT-T6-017.md`

## Commands run and summarized results

- Unit 0 commands and classified results are recorded in [REPORT-T6-013](../../reports/REPORT-T6-013.md).
- Focused RED: backend `20 failed` with `ModuleNotFoundError: schemas.workflow_template`; frontend `3 failed` with the
  missing TypeScript workflow-template module.
- Focused/provider GREEN: `61 passed, 58 subtests passed`.
- Legacy Template/Canvas regression: `23 passed`, with one pre-existing pytest collection warning.
- Provider-free Playwright contract proof: `3/3` passed.
- Fresh frontend production build: `5,041` modules transformed; only the existing large-chunk advisory remained.
- Project-state validator and `git diff --check`: passed.
- No database, Canvas, quota, job, provider, user-data, or external-account mutation occurred.

## Blockers and release conditions

- No current blocker.
- Real/paid provider, secret, destructive data/filesystem, arbitrary-code template, and public/team marketplace needs
  remain fail-closed Human gates.
