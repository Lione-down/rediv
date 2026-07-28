# TASK-T6-025 PROGRESS - Durable WorkflowRun orchestration

- State: `DONE`
- Verification outcome: `PASS`
- Last updated: `2026-07-29`
- Baseline: `5724fdfa0880a5ac6a9bf166e6467414b935d853`
- Task: [TASK-T6-025](../todo/TASK-T6-025.md)
- Plan: [TASK-T6-025-PLAN](TASK-T6-025-PLAN.md)
- Report: [REPORT-T6-025](../../reports/REPORT-T6-025.md)

## Completed work

- Created the required goal before all other work; read the complete repository authority and verified the exact
  `D:/works/codexWorks/project_revid` root, `main`, activation HEAD/origin parity, and protected-path boundary.
- Observed backend RED as five missing `/runs/preflight` contracts, provider projection RED at ignored workflow
  projection, dependency-lineage RED at a missing upstream result asset, concurrency RED at MySQL deadlock, and
  cost-confirmation replay RED at an incorrect `200`.
- Observed browser RED at the missing WorkflowRun region before production UI implementation.
- Added strict owner/project/Canvas/instance-scoped preflight/start/latest/read/cancel schemas and routes with bounded
  sanitized errors and exact replay/conflict semantics.
- Added durable MySQL orchestration with deterministic run/step/job/request IDs, exact current-instance/version/
  node/binding/source-revision preflight, atomic run-step/job creation, bounded deadlock retry, persisted dependency
  snapshots, and restart-safe reconciliation.
- Added a commented non-null `cost_confirmed` field and guarded test-database migration, with no residual server
  default and no destructive production migration path.
- Reused `revid.generation-job.v2`, the existing lease runner, T6-023 typed Script/Image lineage, T6-024 provider-valid
  Video projection, owned result assets, and current stable Canvas-card/result-sync authorities. No third provider,
  job, Canvas, or browser-local execution authority was introduced.
- Proved dependency completion releases one downstream job with the exact owned upstream result asset; dependency
  failure blocks descendants; cancel uses the existing job cancellation state; repeated/concurrent/restart
  reconciliation does not duplicate work.
- Added minimal explicit-run UI/API state. Page load only reads the latest durable run; preflight, start, and cancel
  require explicit user actions; no run identity or execution state is persisted in session/local storage.
- Added provider-free browser proof for zero implicit start, explicit cost confirmation/preflight/start, reload
  recovery without a second start, and explicit cancel after recovery.
- Split deterministic job construction from orchestration so production modules remain below the project guideline
  of 500 lines.
- Preserved T6-021 through T6-024 frozen contracts and did not implement or activate T6-026/T6-027 behavior.

## Remaining work

- None for T6-025.
- Final program-level Human visual, interaction, and journey acceptance remains T6-027 and is not claimed here.

## Exact next action

Stop. Do not create or activate T6-026 in this task.

## Files changed

- `ai/tasks/todo/TASK-T6-025.md`
- `ai/tasks/doing/TASK-T6-025-PLAN.md`
- `ai/tasks/doing/TASK-T6-025-PROGRESS.md`
- `ai/reports/REPORT-T6-025.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `backend/api/router.py`
- `backend/api/workflow_runs.py`
- `backend/migrations/versions/f1a2b3c4d5e6_add_workflow_run_cost_confirmation.py`
- `backend/models/workflow_run.py`
- `backend/schemas/workflow_run.py`
- `backend/services/generation/job_runner.py`
- `backend/services/generation/provider_dispatch.py`
- `backend/services/workflow_templates/run_context.py`
- `backend/services/workflow_templates/run_jobs.py`
- `backend/services/workflow_templates/run_read_model.py`
- `backend/services/workflow_templates/run_steps.py`
- `backend/services/workflow_templates/runs.py`
- `backend/tests/test_generation_job_provider_dispatch.py`
- `backend/tests/test_workflow_run_cost_confirmation_migration.py`
- `backend/tests/test_workflow_run_orchestration.py`
- `backend/tests/test_workflow_template_asset_binding_migration.py`
- `backend/tests/test_workflow_template_idempotency.py`
- `backend/tests/test_workflow_template_instance_commit_migration.py`
- `backend/tests/test_workflow_template_migration.py`
- `frontend/src/components/canvas-runtime/CanvasReplacementRuntime.vue`
- `frontend/src/components/canvas-runtime/CanvasRuntimeAttachedSurfaces.vue`
- `frontend/src/components/canvas/CanvasContextPanel.vue`
- `frontend/src/components/canvas/CanvasScriptGenerationControls.vue`
- `frontend/src/components/canvas/CanvasWorkflowRunControls.vue`
- `frontend/src/modules/template/api.ts`
- `frontend/src/modules/template/types.ts`
- `frontend/src/modules/template/use-workflow-run.ts`
- `frontend/src/views/app/CanvasWorkspace.vue`
- `frontend/tests/e2e/canvas-workflow-run.spec.ts`
- `frontend/tests/e2e/workflow-template-library-fixture.ts`

## Commands run and summarized results

- Isolation/fetch/parity at activation: exact repo root; `main`; activation
  `HEAD == origin/main == 5724fdfa0880a5ac6a9bf166e6467414b935d853`; ahead/behind `0/0`.
- Observed RED: backend run API `5 failed`; workflow provider projection, dependency result lineage, concurrent start,
  and changed-confirmation replay each failed at the missing T6-025 behavior; browser `1 failed` at the absent run
  controls.
- Focused backend GREEN after final module split: `33 passed`.
- Related backend workflow-template/generation-job/Canvas regression after final module split:
  `152 passed, 31 subtests passed`.
- Migration/model focus: `10 passed`; new head `f1a2b3c4d5e6`, field comment/non-null/no server default verified.
- Fresh frontend production build: PASS, `5,052 modules transformed`; existing large-chunk advisory only.
- Fresh production-preview provider-free browser regression: `21/21`; final explicit run/reload/cancel journey `1/1`.
- Python compile, project-state validator, UTF-8, diff/security, protected-path, and staged-index checks: PASS.

## Blockers and release conditions

- None for T6-025.
- Real/paid provider calls, secrets/env, external accounts, destructive user/production operations, and major
  long-term contract changes remain Human gates.
- Machine backend/browser/build evidence is not Human acceptance; final Human acceptance remains T6-027.
