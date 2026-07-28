# TASK-T6-026 PROGRESS - Template instance compatibility lifecycle

- State: `DONE`
- Verification outcome: `PASS`
- Last updated: `2026-07-29`
- Baseline: `9c0c4b57186b5e448180af5932ced6b792a3648b`
- Task: [TASK-T6-026](../todo/TASK-T6-026.md)
- Plan: [TASK-T6-026-PLAN](TASK-T6-026-PLAN.md)

## Completed work

- Created the required session goal before repository work, read every required tracked authority, and verified the
  exact repo root, activation SHA, clean tracked baseline, remote parity, and protected untracked boundary.
- Created and activated the independent T6-026 Task/PLAN/PROGRESS before business-code edits and recorded backend and
  Chromium RED at the missing classifier/routes/lifecycle surface.
- Added deterministic additive-only manifest diff, exact candidate fingerprinting, structured compatible/incompatible
  reasons, immutable-baseline local-override detection, and strict owner/project/Canvas/instance request contracts.
- Implemented explicit compatible upgrade, stable isolated clone, and detach in existing Canvas/MySQL transactions.
  Stable IDs, exact version/binding/step lineage, typed content, local overrides, strict replay, concurrency, revision
  pruning recovery, and active-run fail-closed behavior are preserved.
- Added one commented guarded-MySQL lifecycle-commit table and synchronized every current migration-head assertion.
- Reconciled upgrade undo/redo and detach state through public Canvas document mutations while internal lifecycle
  commits remain one transaction. Browser-local state and legacy mock execution are not authority.
- Added the accessible lifecycle surface with pinned/candidate version, structured changes/blockers, protected local
  overrides, explicit two-stage upgrade/clone/detach confirmation, typed history adoption, and 375px review-only mode.
- Performed fresh diff review and fixed two real late findings: lifecycle integer coercion now fails strict validation,
  and clone replay survives Canvas revision pruning through the durable instance commit.

## Remaining work

- None for T6-026 after the scoped commit/push and remote parity gate recorded at delivery.
- T6-027 is intentionally not created or activated.

## Exact next action

Stop this delivery. Any T6-027 retirement/release/Human-acceptance work requires a separate activation.

## Files changed

- `ai/tasks/todo/TASK-T6-026.md`
- `ai/tasks/doing/TASK-T6-026-PLAN.md`
- `ai/tasks/doing/TASK-T6-026-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T6-026.md`
- `backend/api/workflow_template_instances.py`
- `backend/controllers/canvas_document_mutations.py`
- `backend/controllers/workflow_template_instance_clone.py`
- `backend/controllers/workflow_template_instance_context.py`
- `backend/controllers/workflow_template_instance_lifecycle.py`
- `backend/migrations/versions/g2b3c4d5e6f7_add_workflow_template_instance_lifecycle_commits.py`
- `backend/models/__init__.py`
- `backend/models/workflow_template_instance_lifecycle.py`
- `backend/schemas/workflow_template_instance.py`
- `backend/services/workflow_templates/compatibility.py`
- `backend/services/workflow_templates/instance_bindings.py`
- `backend/services/workflow_templates/instance_lifecycle.py`
- `backend/services/workflow_templates/instance_overrides.py`
- `backend/services/workflow_templates/instance_reconciliation.py`
- `backend/tests/test_workflow_run_cost_confirmation_migration.py`
- `backend/tests/test_workflow_template_asset_binding_migration.py`
- `backend/tests/test_workflow_template_idempotency.py`
- `backend/tests/test_workflow_template_instance_commit_migration.py`
- `backend/tests/test_workflow_template_instance_lifecycle.py`
- `backend/tests/test_workflow_template_instance_lifecycle_security.py`
- `backend/tests/test_workflow_template_migration.py`
- `backend/tests/test_workflow_template_version_compatibility.py`
- `backend/tests/workflow_template_instance_lifecycle_support.py`
- `frontend/src/components/canvas-runtime/CanvasReplacementRuntime.vue`
- `frontend/src/components/canvas-runtime/CanvasRuntimeAttachedSurfaces.vue`
- `frontend/src/components/canvas/CanvasWorkflowRunControls.vue`
- `frontend/src/components/canvas/CanvasWorkflowTemplateLifecycleControls.vue`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/src/modules/canvas/canvas-commands.ts`
- `frontend/src/modules/canvas/canvas-serialized-actions.ts`
- `frontend/src/modules/template/api.ts`
- `frontend/src/modules/template/types.ts`
- `frontend/src/modules/template/use-workflow-template-lifecycle.ts`
- `frontend/src/views/app/CanvasWorkspace.vue`
- `frontend/tests/e2e/canvas-workflow-template-lifecycle.spec.ts`
- `frontend/tests/e2e/workflow-template-library-fixture.ts`

## Commands run and summarized results

- Memory quick pass supplied only historical validator/stable-lifecycle context; repository documents remained the
  current authority.
- Startup read set: complete; protected untracked redesign plan and other user-owned paths were not opened.
- Isolation/fetch/parity: exact repo root; `main`; `HEAD == origin/main`; ahead/behind `0/0`; tracked checkout and
  index clean; no unmerged path or Git operation detected.
- Focused pure RED: `3 failed`, missing `services.workflow_templates.compatibility`.
- Guarded-MySQL API RED: `4 failed`, exact T6-026 endpoints returned `404`.
- Chromium RED: `2 failed`, missing accessible lifecycle region on desktop and 375px review-only paths.
- Final focused backend compatibility/lifecycle/security/idempotency: `16 passed`.
- Final related backend workflow-template/WorkflowRun/Canvas document group: `126 passed, 12 subtests passed`.
- Complete backend classification: `769 passed, 215 subtests passed, 7 failed`; exact rerun fixed all three
  T6-026 migration-head failures. Four untouched image-generation tests remain independently RED on existing
  expected `4:3` versus runtime `1:1` defaults and are outside every T6-026 changed/dependency path.
- Fresh production build: PASS, `5,056 modules transformed`; existing chunk-size warning only.
- Final production-preview Chromium: `15/15` provider-free; lifecycle desktop/mobile focus `2/2`.
- Visual review: desktop and 375px structured diff/override screenshots show no clipping or horizontal overflow;
  machine visual evidence is not Human acceptance.
- Project-state validator and `git diff --check`: PASS before closure; final index/security/parity audit is recorded
  by the delivery commit sequence.

## Blockers and release conditions

- None for T6-026.
- Four broad-suite image-generation assertions remain an explicit unrelated baseline boundary; they do not exercise
  T6-026 paths and were not changed in this Task.
- Real/paid provider calls, secrets/env, external accounts, destructive user/production operations, and major
  long-term contract changes remain Human gates.
- Machine backend/browser/build evidence is not Human acceptance; final Human acceptance remains T6-027.
