# TASK-T5-007 Progress

- Task state: `DONE - PASS`
- Completed unit: Unit E - Canvas resource and generation experience (`COMPLETE - PASS`)
- Updated: 2026-07-14
- Unit D baseline: `af8196fc165eb5d2cacc16a8ede9fa57213e0942`

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
- Completed Unit D through transaction, concurrency, provider-validation, restart, browser, build, migration, independent-review, and hygiene closure.
- Added one database transaction boundary that links a durable generation task, one generated project asset, one quota debit, and one ledger record. Duplicate completion is idempotent, late failure cannot overwrite success, and all terminal failure paths remain no-charge.
- Added project/Canvas/node ownership validation, project-scoped task queries, cross-Canvas retained origin history, bulk-bounded input asset validation, and database-authoritative task/quota reads.
- Added quota reservation leases with startup and request-time reconciliation. `Quota` row locking serializes reservations, debit, and admin grant without holding a transaction open during provider work.
- Added Alembic head `c9d0e1f2a3b4` with non-null commented quota revision state and microsecond quota-ledger timestamps. Balance, revision, and ledger mutations commit atomically.
- Added strict provider result validation for content, HTTPS URLs, and bounded request identifiers before completion. Malformed results, cancellation, timeout, provider failure, and persistence failure durably terminate the task without creating an asset or consuming quota.
- Extracted the frontend Canvas generation service and replaced manual quota decrement with same-transaction backend quota snapshots. Pinia applies snapshots monotonically per auth session and resets revision state across logout/login.
- Preserved mock-only provider evidence and did not access real secrets, call paid providers, apply user/runtime migrations, or touch the retained `revid_test_db` schema.
- Locked the Unit E design direction to the approved graphite-black and violet Canvas system, using existing V2 tokens, Naive UI overrides, Lucide icons, 40px targets, focus-visible states, and reduced-motion behavior.
- Defined six browser RED contracts for cross-Canvas project resources, registry-backed asset insertion, atomic template instantiate, canonical generation success/failure linkage, desktop/narrow keyboard behavior, and the 375px review-only boundary.
- Added isolated Unit E Playwright fixture/spec files under 500 lines. The repository-standard Chromium runner collected all six tests and produced the expected RED result: `6 failed`, with five failures at the missing `打开项目资源` entry and one at the missing canonical `生成任务编辑器`; no syntax, web-server, auth, document, or mock-route failure occurred before those product assertions.
- Implemented the Unit E project resource, template, contextual generation, persistent generation-result linkage, serialized Canvas action, responsive drawer, desktop resize, and mobile review-only experience. Final Chromium regression is `117 passed`; the production build completed with `4,761` transformed modules.
- Resolved the Canvas revision reload regression found by the full browser run. Conflict recovery now bypasses the conflicting autosave flush while ordinary reload and retry still flush current work; focused resource-race plus revision coverage is `10 passed`.
- Implemented the first secure upload boundary with bounded JSON/multipart bodies, strict metadata and form contracts, quota/free-floor checks, threadpool staging, structural media validation, malformed-body cleanup, and upload-focused tests. The current backend baseline is `312 passed, 28 subtests passed`; `compileall` passes and Alembic has the single head `c9d0e1f2a3b4`.
- Closed every upload security finding with short-lived cross-process reservations, provisional active slots, per-user/global concurrency and scan budgets, same-volume named staging, idle/total deadlines, and cancellation-safe acquire/open/write/seek/close/commit/cleanup behavior.
- Replaced synthetic positive media with independently decodable fixtures and strengthened PNG/JPEG/WebP, WebM VP8/VP9, AVC BMFF, Opus/Ogg, and classic/fragmented BMFF structure checks. Validation now has explicit pixel, decoded-byte, process-concurrency, element, and aggregate sample budgets.
- Raised the multipart dependency floor to `python-multipart>=0.0.32,<1`, retained independent header byte/count limits, rejected truncated bodies, and normalized oversized-boundary parser errors to a controlled `400`.
- Completed final full backend, upload, browser, build, migration/static, visual/accessibility, and independent review gates. Final review is `0 HIGH / 0 MEDIUM / 0 LOW`.
- Wrote `ai/reports/REPORT-T5-007.md`, reconciled Task/PLAN/PROGRESS/CURRENT/ROADMAP, and recorded durable upload/cancellation/test-isolation pitfalls.

## Remaining Work

- None for T5-007.
- T5-008 remains separate and must be activated with its own Task/PLAN/PROGRESS before business-code edits.

## Exact Next Action

Commit and push T5-007, then create and activate T5-008 for the final Canvas first-acceptance E2E, real-MySQL 200/300 persistence/performance, browser, accessibility, visual, and security matrix.

## Files Changed

- Migration/models: `backend/migrations/versions/a6b7c8d9e0f1_add_canvas_resource_foundation.py`, and asset, generation-task, quota, and template models.
- Controllers/APIs: `resource_scope.py`, `resource_links.py`, scoped store wiring, all semantic node-delete paths, asset/task query surfaces, and controlled project-delete conflict handling.
- Schemas: asset, generation-task, and strict template graph response contracts.
- Tests: resource schema/backfill/downgrade, resource node-link/cache/race coverage, asset scope/API coverage, and project deletion consistency.
- Unit C controllers/APIs: `controllers/assets.py`, `controllers/template_graphs.py`, `controllers/template_projects.py`, project asset query wiring, Canvas template routes, and the caller-owned Canvas document transaction boundary.
- Unit C schema/migration: audio upload request contract, template capture/instantiate contracts, asset type comment migration `b8c9d0e1f2a3`, and updated ORM comment.
- Unit C tests: project asset services, template graph services, template security/restart, legacy template project use, and the updated resource head assertion.
- Unit D transaction/runtime: generation transaction, reservation, record, quota, provider, and provider-result modules; scoped text/image/video APIs; generation task query updates; quota revision model/migration; atomic store quota grant/cache synchronization.
- Unit D frontend: Canvas generation service, auth quota revision state/types, both workspace generation callers, and authenticated/service Playwright coverage.
- Unit D tests: transaction success/failure/restart, duplicate completion, late failure, reservation expiry, lock ordering, grant/debit concurrency, provider malformed results, quota revision migration, and updated endpoint/E2E coverage.
- Unit E frontend: Canvas asset/context panels, project resource store/API/types, serialized resource/template/generation actions, generation-result state, responsive workspace integration, and focused/full Chromium fixtures.
- Unit E backend: bounded upload API, multipart parser, cross-process sidecar reservations, cancellation lifecycle, structural media validators, real fixtures, patched dependency/configuration, and focused security/resource tests.
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
- Unit D focused transaction/provider/migration GREEN - PASS: `24 passed`.
- Unit D affected backend regression - PASS: `94 passed, 3 subtests passed` across generation transactions, concurrency, provider validation, restart, text/image/video routes and E2E, quota/admin/store, resource schema, assets, and templates.
- Unit D browser/build evidence - PASS: generation service `5 passed`, authenticated workflow and four accepted viewports `6 passed`, and the Vue TypeScript/Vite production build completed with `4,748` transformed modules.
- Unit D migration/static gates - PASS: `compileall`, Alembic single head `c9d0e1f2a3b4`, `git diff --check`, file-size review, and staged/tracked sensitive-path checks. No user/runtime migration ran.
- Independent Unit D review - PASS, `0 HIGH / 0 MEDIUM / 0 LOW`; independent backend runs passed `53 + 3 subtests` and `34`, frontend Playwright passed `11`, and build/migration/diff gates passed.
- Unit E planning - PASS: existing Canvas design, acceptance, architecture, registry, autosave, resource APIs, generation transaction contract, and browser conventions were audited. `npx` is available for the repository-standard Playwright runner; no production code changed during the audit.
- Unit E browser RED - EXPECTED FAIL: `npx playwright test tests/e2e/canvas-resource-generation.spec.ts --project=chromium` collected 6 tests and failed only at missing resource/context UI capability. Failure artifacts are under ignored `output/playwright/test-results/`.
- Unit E frontend focused/final evidence - PASS: resource, generation, graph, race, autosave, revision, responsive, and keyboard coverage passed; final full Chromium is `117 passed in 2.3m`, and production build passed with `4,761` transformed modules.
- Unit E final backend regression - PASS: project `.venv` `pytest -q` reported `384 passed, 56 subtests passed` in 400.99 seconds.
- Unit E final upload/security regression - PASS: `134 passed, 48 subtests passed`; parser/dependency post-fix focus passed `23`; `pip check` passed.
- Unit E final static/migration gates - PASS: `compileall`, Alembic single head `c9d0e1f2a3b4`, strict UTF-8, 500-line maximum, and `git diff --check` apart from CRLF notices.
- Unit E independent frontend review - PASS after remediation, `0 HIGH / 0 MEDIUM / 0 LOW`.
- Unit E independent upload security review - PASS after remediation, `0 HIGH / 0 MEDIUM / 0 LOW`; independent pure matrix passed `65`, 13,000 randomized validator inputs and 500 randomized multipart inputs produced no unhandled exception.

## Blockers And Release Conditions

- No T5-007 blocker remains.
- Applying `a6b7c8d9e0f1` to user/runtime data remains a Human Owner gate and did not occur.
- Applying `b8c9d0e1f2a3` to user/runtime data remains part of the same Human Owner migration gate and did not occur.
- Applying `c9d0e1f2a3b4` to user/runtime data remains part of the same Human Owner migration gate and did not occur.
- Automatic deletion or detachment of project resources is intentionally not inferred; any destructive lifecycle requires explicit product direction and authorization.
- Paid provider calls, real secret access, destructive MySQL/filesystem work, and ignored artifact cleanup remain Human Owner gates.
