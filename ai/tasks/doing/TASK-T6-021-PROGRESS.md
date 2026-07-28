# TASK-T6-021 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-021](../todo/TASK-T6-021.md).
- Plan: [TASK-T6-021-PLAN](TASK-T6-021-PLAN.md).

## Completed work

- Reconstructed the Direct Delivery source-of-truth chain from repository files and activated only T6-021 from
  pushed T6-020 baseline `61c88b3c51a4dfdf4cfafb320206abe5ea23e55b`.
- Fetched `origin`, confirmed ahead/behind `0/0`, verified no tracked diff, and preserved all protected user-owned
  untracked paths.
- Read the frozen PRD/behavior matrix, T6-020 delivery chain, redesign plan, Direct Delivery ADR, accepted modular
  architecture, and Canvas document architecture.
- Audited the additive T6-018 instance/binding/step persistence, exact-version lifecycle and pure preflight,
  Canvas document patch transaction, and legacy Graph Template deterministic remap/idempotent replay.
- Found a dependency-schema cardinality gap before production persistence: the T6-018 parent binding is unique per
  slot, while frozen V1 asset slots permit up to nine ordered items. Recorded one additive child-lineage table as
  the smallest compatible correction instead of dropping the unique constraint or misclassifying assets as values.
- Found that Canvas revision pruning would otherwise erase instantiate replay metadata. Added a RED requiring
  replay after the owning revision leaves the retention window; the release condition is one immutable
  instance-commit snapshot in the same transaction, not indefinite Canvas revision retention.
- Recorded the topology-only frozen-schema interpretation and T6-021 stop boundaries before business-code edits.
- Added a strict owner/project/active-Canvas instantiate route, exact-version/fingerprint revalidation, deterministic
  stable instance/node/connection IDs, and server-owned topology projection without widening the frozen manifest.
- Reused `apply_document_patch_in_session` as the only graph authority and committed the Canvas revision, instance,
  typed bindings, ordered asset/source revisions, step/node lineage, and immutable replay snapshot once.
- Added guarded additive MySQL revisions `d9e0f1a2b3c4` and `e0f1a2b3c4d5`; no user/runtime schema was migrated.
- Split projection, lineage persistence, and request orchestration into bounded files while retaining one
  transaction and the existing Canvas mutation authority.

## Verification evidence

- Baseline `git rev-parse HEAD`: `61c88b3c51a4dfdf4cfafb320206abe5ea23e55b`.
- Post-fetch `git rev-list --left-right --count HEAD...origin/main`: `0 0`.
- Baseline tracked diff: empty. Only protected user-owned untracked paths are present.
- Initial route RED: `5 failed`, all expected `404` because the T6-021 route was absent.
- Single-item atomic instantiate/replay GREEN: `5 passed`.
- Multi-item asset-lineage RED: `1 failed` with bounded
  `workflow_template_asset_lineage_unsupported`; Canvas and parent lineage rolled back.
- Durable replay RED after simulated normal revision pruning: `1 failed` with `mutation_id_reused`.
- Final focused guarded MySQL group: `24 passed, 3 subtests passed`. It covers atomic one-revision persistence,
  isolated stable IDs, complete variable/asset/step lineage, optional and multi-item slots, strict replay after
  revision pruning and runtime restart, changed-request conflict, concurrent identical requests, forced rollback,
  version/owner/project/Canvas/asset/base/preflight/graph/quota drift, collision, and bounded validation.
- Final related workflow-template/lifecycle/legacy Graph Template/Canvas regression:
  `125 passed, 6 subtests passed`.
- Broad backend classification covered all 112 sorted `test_*.py` files:
  `734 passed, 206 subtests passed, 7 failed`. The seven failures exactly match the T6-020 out-of-scope baseline:
  three old Image expectations, one old Video transaction missing current `resolution`, and three superseded
  semantic multi-image Video contract REDs. No T6-021 test failed.
- One three-way shard exceeded `604s`; its complete file set was rerun as deterministic `%6 == 1` and `%6 == 4`
  sub-shards, which passed `273` tests plus `94` subtests without skips.
- Changed-file `py_compile`: PASS. Alembic single head: `e0f1a2b3c4d5`.
- Fresh frontend production build: PASS, `5,041 modules transformed`; existing chunk-size advisory only.
- The forced-timeout residue probe found inactive disposable `revid_test_db`; exact guarded cleanup removed only
  that schema, and the independent recheck returned `residue_count=0`.
- Final bounded-file check: instantiate controller `385` lines and lineage service `158` lines.

## Remaining work

- Repository delivery operations only: final state/diff/security audit, exact-path staging, one scoped commit/push,
  fetch, and remote-parity confirmation.
- No T6-021 implementation or verification gap remains.

## Exact next action

Run the final state/diff/security audit, precisely stage only the listed T6-021 paths, commit and push once, then
fetch and confirm `HEAD == origin/main`.

## Files changed

- `ai/tasks/todo/TASK-T6-021.md`
- `ai/tasks/doing/TASK-T6-021-PLAN.md`
- `ai/tasks/doing/TASK-T6-021-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T6-021.md`
- `backend/api/router.py`
- `backend/api/workflow_template_instances.py`
- `backend/controllers/workflow_template_instances.py`
- `backend/migrations/versions/d9e0f1a2b3c4_add_workflow_template_asset_binding_items.py`
- `backend/migrations/versions/e0f1a2b3c4d5_add_workflow_template_instance_commits.py`
- `backend/models/__init__.py`
- `backend/models/workflow_template.py`
- `backend/models/workflow_template_lineage.py`
- `backend/schemas/workflow_template_instance.py`
- `backend/services/workflow_templates/__init__.py`
- `backend/services/workflow_templates/instances.py`
- `backend/services/workflow_templates/lineage.py`
- `backend/tests/test_workflow_template_asset_binding_migration.py`
- `backend/tests/test_workflow_template_idempotency.py`
- `backend/tests/test_workflow_template_instance_commit_migration.py`
- `backend/tests/test_workflow_template_instance_security.py`
- `backend/tests/test_workflow_template_instantiation.py`
- `backend/tests/test_workflow_template_migration.py`
- `backend/tests/workflow_template_capture_preflight_support.py`
- `backend/tests/workflow_template_instantiation_support.py`

## Blockers and release conditions

- No current blocker.
- No real/paid provider call, secret access, user/production database operation, runtime schema migration, frontend
  Human visual/interaction acceptance, or T6-022+ behavior occurred in this Task.
