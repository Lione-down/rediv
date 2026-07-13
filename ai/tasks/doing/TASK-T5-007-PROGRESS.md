# TASK-T5-007 Progress

- Task state: `DOING`
- Active unit: Unit D - generation transactions and frontend service
- Updated: 2026-07-13
- Unit C baseline: `ac487a0ce4751705f813882d9f60fd2f249117b2`

## Completed Work

- Completed Unit A through registry, browser, build, visual, accessibility, independent-review, and hygiene closure.
- Completed Unit B through RED -> GREEN -> affected regression -> independent review.
- Added Alembic head `a6b7c8d9e0f1` after `f0a1b2c3d4e5` with additive asset/task origin attribution, versioned template graphs, deterministic legacy backfill, comments, indexes, checks, composite FKs, quota-ledger task linkage, and guarded downgrade refusal.
- Added ORM and strict Pydantic contracts for `origin_canvas_id`, `schema_version`, and graph envelopes; legacy `node_data` remains available during the compatibility window.
- Added one scope controller that derives and validates owner/project/Canvas/node relationships. Database writers lock `Project -> Canvas -> CanvasNode` and revalidate active scope before insert.
- Added one node-link helper used by every semantic delete/restore path. It locks node IDs deterministically, clears asset/task node links in the caller transaction, and preserves origin history.
- Made asset/task getters database-authoritative so direct document mutations cannot expose stale cached links.
- Defined safe project deletion semantics: linked resources block deletion with an authenticated `409`; neither store silently deletes or orphans resource history.
- Completed Unit C through RED -> GREEN -> affected regression -> independent review.
- Added project-owned asset queries with validated project/origin filters, stable database pagination, audio upload support, cross-Canvas visibility, and real production-lifespan restart evidence. Audio generation remains explicitly unsupported.
- Added authenticated Canvas template capture and atomic target-Canvas instantiation with strict version-1 graph validation, parent/connection preservation, relative anchor placement, deterministic structured ID remapping, create-only collision checks, and one canonical document revision.
- Made template instantiation exactly idempotent through revision metadata, including retry after source-template deletion; changed requests reusing a mutation ID fail with `409`.
- Preserved legacy template-to-new-project behavior while creating the project, first Canvas, complete graph, and revision in one database transaction.
- Added Alembic head `b8c9d0e1f2a3` to document the already-supported audio asset subtype in the MySQL column comment; no user/runtime migration ran.
- Preserved mock-only provider evidence and did not access real secrets, call paid providers, apply user/runtime migrations, or touch the retained `revid_test_db` schema.

## Remaining Work

- Unit D: durable mock-provider generation transactions, task/result linkage, failure rollback, and authoritative quota synchronization.
- Unit E: Canvas resource/generation UI, responsive/mobile boundaries, full regression, review, REPORT, and Task closure.

## Exact Next Action

Write mock-integration RED tests for generation ownership, provider failure, asset persistence failure, exact task/result linkage, no-charge failures, authoritative quota response, and restart persistence; then extract shared generation orchestration without changing the public text/image/video routes.

## Files Changed

- Migration/models: `backend/migrations/versions/a6b7c8d9e0f1_add_canvas_resource_foundation.py`, and asset, generation-task, quota, and template models.
- Controllers/APIs: `resource_scope.py`, `resource_links.py`, scoped store wiring, all semantic node-delete paths, asset/task query surfaces, and controlled project-delete conflict handling.
- Schemas: asset, generation-task, and strict template graph response contracts.
- Tests: resource schema/backfill/downgrade, resource node-link/cache/race coverage, asset scope/API coverage, and project deletion consistency.
- Unit C controllers/APIs: `controllers/assets.py`, `controllers/template_graphs.py`, `controllers/template_projects.py`, project asset query wiring, Canvas template routes, and the caller-owned Canvas document transaction boundary.
- Unit C schema/migration: audio upload request contract, template capture/instantiate contracts, asset type comment migration `b8c9d0e1f2a3`, and updated ORM comment.
- Unit C tests: project asset services, template graph services, template security/restart, legacy template project use, and the updated resource head assertion.
- State/docs: active Task, PLAN, PROGRESS, CURRENT, ROADMAP, and `pitfalls.md`.

## Commands And Results

- TDD RED - PASS: observed missing resource columns/FKs/backfill/revision/schema fields; MySQL 3823 for impossible CHECK plus `SET NULL`; uncaught asset scope errors; stale resource cache; unhandled project FK conflict; store divergence; and delete/create concurrency failure before each fix.
- Guarded MySQL core regression - PASS: resource schema, node-link/cache/race, metadata closure, project CRUD, node CRUD, document mutation, and revision restore, `47 passed`.
- Affected resource/generation regression - PASS: asset upload, database store, templates, text/image/video mock generation, `49 passed`.
- Additional focused evidence - PASS: migration foundation `7 passed`; asset/schema/link combined `25 passed`; project/Canvas regression `29 passed`; Alembic single head `a6b7c8d9e0f1`; compileall and `git diff --check` clean apart from CRLF notices.
- Safe downgrade evidence - PASS on an empty disposable schema; unsafe retained-origin/template-connection downgrade refusal is covered by the guarded foundation suite.
- Independent Unit B review - PASS after remediation, `0 HIGH / 0 MEDIUM`.
- Unit C TDD RED - PASS: asset coverage first observed missing audio schema/comment and unguarded foreign/mismatched filters; template coverage first observed missing Canvas routes, graph capture, atomic instantiate, deterministic identity, create-only collision, retry, and legacy transaction behavior.
- Unit C focused GREEN - PASS: project asset services `9 passed`; latest template graph/security/project-use plus legacy template coverage passed; real engine/session recreation and production FastAPI lifespan are exercised.
- Unit C affected regression - PASS: `123 passed` across assets, resource schema/links, templates, Canvas document/fingerprint/revision/duplication, project/store, text/image/video mocks, and workflow/image/video E2E.
- Unit C static/migration gates - PASS: `compileall`, `git diff --check`, Alembic single head `b8c9d0e1f2a3`, UTF-8/file-size review, and no staged secret or database artifact finding.
- Independent Unit C review - PASS after remediation, `0 HIGH / 0 MEDIUM / 0 LOW`; separate reviewer runs passed template `12`, legacy template `9`, Canvas document `8`, and Canvas revision `4` tests.

## Blockers And Release Conditions

- No repository blocker prevents Unit D.
- Applying `a6b7c8d9e0f1` to user/runtime data remains a Human Owner gate and did not occur.
- Applying `b8c9d0e1f2a3` to user/runtime data remains part of the same Human Owner migration gate and did not occur.
- Automatic deletion or detachment of project resources is intentionally not inferred; any destructive lifecycle requires explicit product direction and authorization.
- Paid provider calls, real secret access, destructive MySQL/filesystem work, and ignored artifact cleanup remain Human Owner gates.
