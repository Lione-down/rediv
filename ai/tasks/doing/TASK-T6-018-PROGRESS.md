# TASK-T6-018 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-018](../todo/TASK-T6-018.md).
- Plan: [TASK-T6-018-PLAN](TASK-T6-018-PLAN.md).

## Completed work

- Created the required goal before all other work.
- Read the complete governance, source-of-truth chain, PRD, behavior matrix, T6-017 Task/PLAN/PROGRESS/REPORT,
  redesign plan, linked Direct Delivery ADR, and architecture without reading environment or secret files.
- Preserved the user-owned untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and
  `test-results/` paths.
- Fetched `origin/main` and confirmed the activation baseline:
  `HEAD == origin/main == 39f6c11543e8139013a387edcf80276e32b9a7a2`.
- Verified the repository has one Alembic head, `b7c8d9e0f1a2`, before assigning the T6-018 migration lineage.
- Activated T6-018 as the sole implementation Task.
- Observed RED from the missing model module and missing `c8d9e0f1a2b3` migration before production implementation.
- Added eight additive, fully commented MySQL tables for definition/version/slot/instance/binding/instance-step/run/
  run-step persistence, split across domain-aligned model files below 500 lines.
- Added composite definition/version, project/Canvas, instance/slot, stable-node, run-scope, and run-step lineage
  foreign keys plus lifecycle/state/fingerprint/idempotency constraints and query indexes.
- Added per-parent collation inheritance so historical schemas with different identifier collations upgrade safely.
- Restricted destructive downgrade to migration-verified disposable `revid_test_*` identities; user/runtime databases
  fail closed.
- Proved pre-upgrade legacy `templates` snapshot parity, comments, constraints, wrong dialect/identity/revision failure,
  lowercase fingerprints, additive upgrade, engine restart persistence, and a single Alembic head on real MySQL.
- Completed related legacy Template/Canvas and historical migration regression, full backend classification, compile,
  validator, diff, ignore, path, and high-confidence secret audits.

## Remaining work

- No implementation or verification work remains.
- Precisely stage the T6-018 paths, create one scoped commit, push once, confirm remote parity, and create the T6-019
  session in the same saved project.

## Exact next action

Precisely stage and audit only the T6-018 paths, commit/push once, verify `HEAD == origin/main`, create the separate
T6-019 session, and stop modifying this repository.

## Files changed

- `ai/tasks/todo/TASK-T6-018.md`
- `ai/tasks/doing/TASK-T6-018-PLAN.md`
- `ai/tasks/doing/TASK-T6-018-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T6-018.md`
- `backend/models/__init__.py`
- `backend/models/workflow_template.py`
- `backend/models/workflow_template_lineage.py`
- `backend/models/workflow_run.py`
- `backend/migrations/versions/c8d9e0f1a2b3_add_workflow_template_foundation.py`
- `backend/tests/test_workflow_template_models.py`
- `backend/tests/test_workflow_template_migration.py`
- `backend/tests/test_workflow_template_mysql_constraints.py`

## Commands run and summarized results

- Required Git baseline: only protected untracked paths were present; tracked diff was empty.
- `git fetch origin main`: passed; local and remote commit were identical with ahead/behind `0/0`.
- Alembic heads from the backend environment: one head, `b7c8d9e0f1a2`.
- Focused RED: model/constraint collection failed on missing `models.workflow_template`; migration RED failed on the
  missing `c8d9e0f1a2b3` revision; lowercase-fingerprint RED proved uppercase SHA-256 was initially admitted.
- Focused GREEN: `11 passed`.
- Legacy Template/Canvas plus adjacent/historical migration regression: `40 passed`; one pre-existing
  `TestInMemoryStore` collection warning.
- Full backend broad run: `691 passed`, `203 subtests passed`, `7 failed`, and three pre-existing collection warnings.
  The seven failures are unchanged out-of-scope contract drift: old Image `4:3` expectations versus current `1:1`,
  old cinematic Video `resolution`, and old semantic-video fusion/reference limits superseded by the approved PRD and
  T6-024. No failing production or test file overlaps the T6-018 diff.
- Python compile, single Alembic head `c8d9e0f1a2b3`, project-state validator, and `git diff --check`: passed.
- `.gitignore` review found no env allowlist; tracked env-like paths `0`, candidate env-like paths `0`, and
  high-confidence secret signatures `0`.
- No frontend/browser check was required because this Task changes no route, API, UI, Canvas, or runtime behavior.

## Blockers and release conditions

- No T6-018 blocker.
- Real/paid provider, secret, destructive data/filesystem, arbitrary-code template, and public/team marketplace needs
  remain fail-closed Human gates.
- Required MySQL evidence must use a guarded disposable `revid_test_*` identity; if unavailable after safe diagnostics,
  the Task must record a blocker rather than substitute a different database.
