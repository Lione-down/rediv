# TASK-T6-020 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-020](../todo/TASK-T6-020.md).
- Plan: [TASK-T6-020-PLAN](TASK-T6-020-PLAN.md).
- Report: [REPORT-T6-020](../../reports/REPORT-T6-020.md).

## Completed work

- Created the required goal before all other work, read the complete Direct Delivery source-of-truth chain, and
  activated T6-020 from pushed T6-019 baseline `617e514454212f359eefe2de87c07c6d66a8dc6f`.
- Added a strict cross-language portability classifier. Frozen cases remain exact, only recognized portable layout
  survives, runtime/provider/job/result/quota/owner/source-content fields strip, asset references promote to slots,
  and every unknown field fails closed.
- Added owner-scoped Canvas capture that reads one active graph, emits deterministic template-local IDs and strict
  V1 topology, requires one-to-one explicit asset promotion, returns safe binding candidates/source revisions, and
  never persists source-project asset IDs or Canvas runtime content into the manifest.
- Added exact-version provider-free preflight with bounded request errors and ordered checks for lifecycle/schema,
  owner/project/Canvas scope, typed variables, asset owner/project/status/type/revision/cardinality, graph
  ports/capacity/cycle, current capability, quota units, cost confirmation, and canonical fingerprint.
- Kept the capture/preflight dependency graph read-only: no Canvas document patch, template instance/binding/step,
  WorkflowRun, quota ledger/reservation, GenerationTask/job, provider adapter, or provider request is reachable.
- Preserved the T6-019 lifecycle contract, three built-ins, strict manifest/fingerprint authority, legacy Graph
  Template runtime, and all T6-021 through T6-027 boundaries.
- Split the MySQL fixture/helpers from the test module so all production and test-support files remain below the
  project 500-line guideline.

## Verification evidence

- RED portability: `4 failed, 1 passed`; unknown fields were incorrectly portable before the classifier change.
- RED capture/preflight API: `6 failed`; the capture route and T6-020 contracts did not exist.
- First backend GREEN: `10 passed, 1 failed`; the single failure was an incorrect test fixture that generated
  different template IDs for a determinism comparison. With identical input the focused group passed.
- RED frontend classifier: `1 failed, 2 passed`; unknown fields did not fail closed. Final Chromium contract:
  `3/3 passed`.
- RED bounded error/retired-version checks: `2 failed`; raw validation detail leaked rejected field names and retired
  versions remained preflightable. Final bounded/retired cases passed.
- Final focused guarded MySQL group: `13 passed`; this includes deterministic capture/preflight, explicit asset-slot
  promotion, stripped runtime fields, unknown-field rejection, fixed failure order, foreign/inactive/stale asset
  rejection, graph port/capacity/cycle, capability, quota/cost, retired lifecycle, bounded errors, and zero
  unintended mutation.
- Related frozen workflow-template, lifecycle/security/model/constraint, legacy Graph Template, and Canvas
  regression: `85 passed, 3 subtests passed`.
- Broad backend split classification: `713 passed, 203 subtests passed, 7 failed`. The seven failures are unchanged
  out-of-scope baseline REDs: two old Image E2E `4:3` expectations, one old Image transaction with
  `4:3`/`output_count` mismatches, one old Video transaction missing current `resolution`, and three superseded
  semantic multi-image Video contract tests. No T6-020 test failed.
- Two monolithic full-suite attempts exceeded `604s` and `904s`; deterministic three-way file sharding then
  completed the broad classification without weakening or skipping any test file.
- Guarded disposable database:
  `revid_test_workflow_template_capture_preflight`; the helper enforced the `revid_test_*` identity, ran Alembic
  head, selected the exact schema, and removed it at teardown. Independent residue probe returned `residue_count=0`.
- Python changed-file `py_compile`: PASS.
- Fresh frontend production build: PASS, `5,041 modules transformed`; existing chunk-size advisory only.
- `git diff --check`: PASS before final state reconciliation.

## Remaining work

- Repository delivery operations only: exact-path stage, staged security/path audit, one scoped commit/push, fetch
  parity confirmation, then create the T6-021 local saved-project session without further repository edits.
- No T6-020 implementation or verification gap remains.

## Exact next action

Run final state validator/diff/security audit, precisely stage only the listed T6-020 paths, commit and push once,
confirm `HEAD == origin/main`, then list saved projects and create the T6-021 local session.

## Files changed

- `ai/tasks/todo/TASK-T6-020.md`
- `ai/tasks/doing/TASK-T6-020-PLAN.md`
- `ai/tasks/doing/TASK-T6-020-PROGRESS.md`
- `ai/reports/REPORT-T6-020.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `backend/api/router.py`
- `backend/api/workflow_templates.py`
- `backend/controllers/workflow_templates.py`
- `backend/controllers/workflow_template_preflight.py`
- `backend/core/workflow_template_contract.py`
- `backend/schemas/workflow_template.py`
- `backend/services/workflow_templates/__init__.py`
- `backend/services/workflow_templates/portable_classifier.py`
- `backend/services/workflow_templates/preflight.py`
- `backend/tests/test_workflow_template_portability.py`
- `backend/tests/test_workflow_template_capture_preflight.py`
- `backend/tests/workflow_template_capture_preflight_support.py`
- `frontend/src/modules/template/workflow-template-contract.ts`
- `frontend/tests/e2e/canvas-workflow-template-contract.spec.ts`

## Blockers and release conditions

- No T6-020 blocker.
- No real/paid provider call, secret access, user/production database operation, schema migration, Canvas
  instantiate, or frontend Human visual/interaction acceptance was performed or claimed.
- T6-021 owns atomic instantiate/lineage. T6-022 through T6-027 remain dependency-blocked; final Human
  visual/interaction/journey acceptance remains T6-027.
