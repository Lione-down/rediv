# REPORT-T6-018 - Additive MySQL workflow-template persistence foundation

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-28`
- Activation baseline: `39f6c11543e8139013a387edcf80276e32b9a7a2`
- Alembic revision: `c8d9e0f1a2b3`, descended from `b7c8d9e0f1a2`
- Task: [TASK-T6-018](../tasks/todo/TASK-T6-018.md).
- Plan: [TASK-T6-018-PLAN](../tasks/doing/TASK-T6-018-PLAN.md).
- Progress: [TASK-T6-018-PROGRESS](../tasks/doing/TASK-T6-018-PROGRESS.md).

## Delivered

- Added distinct additive persistence for workflow-template definitions, immutable versions, typed slots, exact-version
  instances, bindings, instance-step/node lineage, explicit workflow runs, and run-step/job lineage.
- Added composite definition/version, project/Canvas, instance/version/slot, instance/Canvas/node, run/scope, and
  run/instance-step foreign keys.
- Added lifecycle/state, lowercase SHA-256, binding-shape, unique version, stable slot/step, instantiate idempotency,
  and explicit-run idempotency constraints plus scope/status query indexes.
- Added non-empty comments to every new table and column, with InnoDB/utf8mb4 and per-parent collation inheritance for
  historical schema compatibility.
- Kept the legacy `templates` table, Graph Template routes, runtime stores, APIs, Canvas mutation, quota, generation
  jobs, and provider adapters unchanged.
- Restricted the migration's destructive downgrade path to a database identity that independently matches
  `revid_test_*`; all other identities fail closed.

## TDD and verification

- RED: the model/constraint tests first failed because `models.workflow_template` did not exist; the migration test
  first failed because revision `c8d9e0f1a2b3` did not exist.
- RED refinement: real MySQL proved case-insensitive collation admitted uppercase SHA-256 before binary-lowercase
  checks were added.
- Focused model/migration/constraint/restart GREEN: `11/11`.
- Legacy Graph Template/Canvas and adjacent/historical migration regression: `40/40`; one existing
  `TestInMemoryStore` collection warning.
- Real disposable MySQL evidence proved baseline-to-head upgrade, all table/column comments, legacy-row parity,
  lifecycle/shape/unique/composite-scope enforcement, wrong dialect/database/revision rejection, lowercase
  fingerprints, new-engine persistence, guarded disposable downgrade regression, and one head.
- Python compile, Alembic head `c8d9e0f1a2b3`, project-state validator, and `git diff --check`: passed.

## Broad-suite classification

The full backend run completed with `691 passed`, `203 subtests passed`, `7 failed`, and three pre-existing
`TestInMemoryStore` collection warnings. The seven REDs do not overlap the T6-018 diff:

- three old Image expectations require `4:3` while the current accepted runtime uses `1:1` and includes
  `output_count`;
- one old cinematic Video handoff expects top-level `resolution`;
- three old semantic-video tests require the superseded semantic-fusion/reference schema and nine-reference boundary.

These are existing contract drift owned by the approved T6-013/T6-024 sequence, not persistence regressions. T6-018
does not change those production or test files and does not widen scope to repair them.

## Security and evidence boundaries

- `.gitignore` review found no environment-file allowlist. Tracked env-like paths, candidate env-like paths, and
  high-confidence secret signatures were all `0`.
- No environment file, credential, connection URL, provider payload/response, prompt, user source content, or
  protected evidence was read, copied, staged, or committed.
- Database work used only guarded disposable `revid_test_*` schemas. No user/runtime database was migrated, downgraded,
  dropped, truncated, cleaned, or otherwise mutated.
- No real/paid provider call, external account, Canvas mutation, quota mutation, or generation job occurred.
- No frontend or browser evidence is claimed because this Task adds no API, route, UI, Canvas, or runtime behavior.
  Machine persistence evidence is not Human visual/interaction acceptance; the program-level Human gate remains T6-027.

## Decision

T6-018 is `DONE / PASS`. All T6-018 acceptance criteria are satisfied by focused TDD, real disposable MySQL,
legacy/historical migration regression, state/diff/security audits, and explicit broad-suite classification. T6-019
may start only after the scoped commit is pushed and `HEAD == origin/main`.
