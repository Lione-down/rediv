# TASK-T5-007 Progress

- Task state: `DOING`
- Active unit: Unit C - project assets and templates
- Updated: 2026-07-13
- Unit B baseline: `029605230b49040d327cbc72cb1c4d5046837777`

## Completed Work

- Completed Unit A through registry, browser, build, visual, accessibility, independent-review, and hygiene closure.
- Completed Unit B through RED -> GREEN -> affected regression -> independent review.
- Added Alembic head `a6b7c8d9e0f1` after `f0a1b2c3d4e5` with additive asset/task origin attribution, versioned template graphs, deterministic legacy backfill, comments, indexes, checks, composite FKs, quota-ledger task linkage, and guarded downgrade refusal.
- Added ORM and strict Pydantic contracts for `origin_canvas_id`, `schema_version`, and graph envelopes; legacy `node_data` remains available during the compatibility window.
- Added one scope controller that derives and validates owner/project/Canvas/node relationships. Database writers lock `Project -> Canvas -> CanvasNode` and revalidate active scope before insert.
- Added one node-link helper used by every semantic delete/restore path. It locks node IDs deterministically, clears asset/task node links in the caller transaction, and preserves origin history.
- Made asset/task getters database-authoritative so direct document mutations cannot expose stale cached links.
- Defined safe project deletion semantics: linked resources block deletion with an authenticated `409`; neither store silently deletes or orphans resource history.
- Preserved mock-only provider evidence and did not access real secrets, call paid providers, apply user/runtime migrations, or touch the retained `revid_test_db` schema.

## Remaining Work

- Unit C: project-scoped asset/template services, audio assets, exact graph capture, and atomic target-Canvas instantiation.
- Unit D: durable mock-provider generation transactions, task/result linkage, failure rollback, and authoritative quota synchronization.
- Unit E: Canvas resource/generation UI, responsive/mobile boundaries, full regression, review, REPORT, and Task closure.

## Exact Next Action

Write guarded MySQL/API RED tests for audio assets, ownership and project/origin filters, cross-Canvas visibility, exact graph template capture, atomic target-Canvas instantiation, ID remapping, and invalid graph rejection; then introduce focused services instead of adding domain orchestration to `store.py`.

## Files Changed

- Migration/models: `backend/migrations/versions/a6b7c8d9e0f1_add_canvas_resource_foundation.py`, and asset, generation-task, quota, and template models.
- Controllers/APIs: `resource_scope.py`, `resource_links.py`, scoped store wiring, all semantic node-delete paths, asset/task query surfaces, and controlled project-delete conflict handling.
- Schemas: asset, generation-task, and strict template graph response contracts.
- Tests: resource schema/backfill/downgrade, resource node-link/cache/race coverage, asset scope/API coverage, and project deletion consistency.
- State/docs: active Task, PLAN, PROGRESS, CURRENT, ROADMAP, and `pitfalls.md`.

## Commands And Results

- TDD RED - PASS: observed missing resource columns/FKs/backfill/revision/schema fields; MySQL 3823 for impossible CHECK plus `SET NULL`; uncaught asset scope errors; stale resource cache; unhandled project FK conflict; store divergence; and delete/create concurrency failure before each fix.
- Guarded MySQL core regression - PASS: resource schema, node-link/cache/race, metadata closure, project CRUD, node CRUD, document mutation, and revision restore, `47 passed`.
- Affected resource/generation regression - PASS: asset upload, database store, templates, text/image/video mock generation, `49 passed`.
- Additional focused evidence - PASS: migration foundation `7 passed`; asset/schema/link combined `25 passed`; project/Canvas regression `29 passed`; Alembic single head `a6b7c8d9e0f1`; compileall and `git diff --check` clean apart from CRLF notices.
- Safe downgrade evidence - PASS on an empty disposable schema; unsafe retained-origin/template-connection downgrade refusal is covered by the guarded foundation suite.
- Independent Unit B review - PASS after remediation, `0 HIGH / 0 MEDIUM`.

## Blockers And Release Conditions

- No repository blocker prevents Unit C.
- Applying `a6b7c8d9e0f1` to user/runtime data remains a Human Owner gate and did not occur.
- Automatic deletion or detachment of project resources is intentionally not inferred; any destructive lifecycle requires explicit product direction and authorization.
- Paid provider calls, real secret access, destructive MySQL/filesystem work, and ignored artifact cleanup remain Human Owner gates.
