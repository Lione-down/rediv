# TASK-T6-019 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-019](../todo/TASK-T6-019.md).
- Plan: [TASK-T6-019-PLAN](TASK-T6-019-PLAN.md).

## Completed work

- Created the required goal before all other work.
- Loaded the strict test-driven-development workflow.
- Read the complete governance/source-of-truth chain, approved PRD, frozen behavior matrix, T6-018 handoff,
  redesign plan, Direct Delivery ADR, and linked architecture without reading environment or secret files.
- Confirmed the latest program instruction assigns clone/detach to T6-026; T6-019 excludes the redesign proposal's
  older clone mention.
- Preserved all protected untracked paths and confirmed the tracked worktree was clean.
- Fetched `origin/main` and confirmed the activation baseline:
  `HEAD == origin/main == 9bdd5806a8c377b732a3218fd052dfd762fa3583`, ahead/behind `0/0`.
- Audited the T6-018 persistence models, frozen Pydantic/canonical fingerprint authority, current auth dependency,
  API/router layering, legacy Graph Template route, transaction patterns, and guarded MySQL fixture.
- Activated T6-019 as the sole implementation Task.
- Observed the focused RED as `8 failed`, all caused by the absent `/api/workflow-templates` lifecycle routes.
- Added strict create/update/new-version/response DTOs without weakening the frozen manifest parser.
- Added exactly three server-owned read-only V1 built-ins; the product-ad seed retains the frozen canonical
  fingerprint `bb3f4c5214f5e2ff18138d9ac8809cc7cdbcded8e0f3e03b729e1be9bb35bbbb`.
- Added a request-session repository and transaction-owning lifecycle controller for owner-scoped create/list/get,
  draft update, exact-source next draft, publish, and retire.
- Persisted definition, version, canonical manifest/fingerprint, and normalized variable/asset slots atomically.
- Serialized lifecycle writes with definition row locks; concurrent next-draft requests produced exactly one version
  and one deterministic conflict with no partial slot rows.
- Kept published payloads immutable; retire changes only lifecycle availability while preserving manifest,
  fingerprint, normalized slots, and exact-version readability.
- Registered a separate `/api/workflow-templates` router while preserving legacy `/templates`, Canvas, quota, job,
  provider, and generation authorities unchanged.
- Completed guarded disposable-MySQL lifecycle/restart proof, focused/legacy/Canvas regression, full backend
  classification, compile, route, diff, state, and security audits.

## Remaining work

- No implementation or verification work remains.
- Precisely stage the T6-019 paths, create one scoped commit, push once, confirm remote parity, and create the T6-020
  session in the same saved project.

## Exact next action

Precisely stage and audit only the T6-019 paths, commit/push once, verify `HEAD == origin/main`, create the separate
T6-020 session in the correct saved `project_revid`, and stop modifying this repository.

## Files changed

- `ai/tasks/todo/TASK-T6-019.md`
- `ai/tasks/doing/TASK-T6-019-PLAN.md`
- `ai/tasks/doing/TASK-T6-019-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T6-019.md`
- `backend/api/router.py`
- `backend/api/workflow_templates.py`
- `backend/controllers/workflow_templates.py`
- `backend/core/builtin_workflow_templates.py`
- `backend/repositories/workflow_templates.py`
- `backend/schemas/workflow_template.py`
- `backend/tests/test_workflow_template_lifecycle_api.py`

## Commands run and summarized results

- Required Git baseline: only protected untracked paths were present; tracked diff was empty.
- `git fetch origin main`: passed; local and remote commit were identical with ahead/behind `0/0`.
- Source-of-truth and architecture reads: complete.
- Focused RED: `8 failed`; every failure was the expected missing lifecycle route/behavior.
- Focused lifecycle GREEN on guarded disposable MySQL: `8 passed`, including owner isolation, built-ins, immutable
  publish, retire, concurrency, zero unrelated mutation, and backend restart.
- Final security RED proved FastAPI's default nested-validation 422 echoed a rejected `provider_endpoint` field/value;
  bounded route validation removed the echo, then targeted `1 passed` and lifecycle `8 passed`.
- Frozen workflow-template contract/model/migration/constraint plus lifecycle group: `49 passed`.
- Legacy Graph Template regression: `21 passed`; one unchanged `TestInMemoryStore` collection warning.
- Canvas document regression: `17 passed` plus `3 subtests passed`.
- Full backend: `700 passed`, `203 subtests passed`, `7 failed`, and three unchanged `TestInMemoryStore` collection
  warnings. The seven out-of-scope REDs are the same approved-program drift recorded by T6-018: old Image `4:3` and
  missing `output_count`, old cinematic Video `resolution`, and superseded semantic-video fusion/9-reference
  expectations owned by T6-023/T6-024. No failing production or test file overlaps the T6-019 diff.
- Python compile, exact seven-route audit, canonical built-in fingerprint, project-state validator, and
  `git diff --check`: passed.
- `.gitignore`, intended-path, env-like path, and high-confidence secret-signature audits passed; no protected
  user-owned path was staged or modified.
- No frontend/browser check is claimed because T6-019 changes no frontend, Canvas presentation, or interaction.

## Blockers and release conditions

- No current T6-019 blocker.
- Real/paid provider, secret, destructive data/filesystem, arbitrary-code template, public/team marketplace, and
  user/runtime migration gates remain fail closed.
- Required MySQL evidence must use a guarded disposable `revid_test_*` identity; if unavailable after safe
  diagnostics, record the exact blocker and release condition without substituting another database.
