# TASK-T5-006 Progress

- Task state: `DOING`
- Completed unit: Unit A - atomic backend document PATCH and revision contract (`COMPLETE - PASS`)
- Next unit: Unit B - frontend autosave queue, recovery, and flush boundaries
- Updated: 2026-07-13
- Baseline HEAD: `03a1f9c59df89ceaaec48e33c059ae32d0e7dba4`

## Completed Work

- Reconstructed state from AGENTS, CURRENT, ROADMAP, the locked V2 requirements/architecture, linked ADRs, prior Task evidence, source code, tests, and automation memory.
- Confirmed T5-005 is `DONE - PASS`, T5-006 has no dependency blocker, and the starting `main` worktree is clean.
- Confirmed the schema foundation already contains `canvases.graph_revision` and `canvas_revisions` with per-Canvas revision and mutation-ID uniqueness.
- Confirmed current graph mutations still use granular routes and do not advance graph revision or create durable revisions.
- Activated T5-006 and bounded Unit A to the backend atomic document mutation contract only.
- Added strict PATCH request/response schemas with unique non-overlapping mutation sets, Canvas-safe IDs, finite graph geometry, batch limits, and explicit saved-state output.
- Added RFC 8785 canonical JSON and SHA-256 mutation fingerprinting over the base revision plus four mutation arrays, excluding `client_mutation_id`.
- Added a serialized MySQL transaction that locks the active Canvas, resolves idempotent retries before base validation, validates the prospective exact-Canvas graph, applies normalized node/connection mutations, writes one durable revision, and advances the head exactly once.
- Added structured `stale_graph_revision` and `mutation_id_reused` HTTP 409 responses with `current_revision`; invalid graph batches return 422 with zero partial writes.
- Preserved granular compatibility routes and revision-neutral viewport persistence; no migration, user/runtime database write, frontend change, paid call, secret access, or destructive operation occurred.
- Added pure and guarded MySQL evidence for canonicalization, mixed batches, implicit edge cleanup, group-child normalization, rollback, ownership, restart persistence, idempotent retry, fingerprint mismatch, and stale base behavior.

## Remaining Work

- Refresh PLAN/PROGRESS for Unit B and inspect the existing frontend persistence/command/lifecycle boundaries.
- Implement the autosave queue, save-state reducer, retry/local recovery, and deterministic switch/exit/page-hide flush in Unit B.
- Deliver Units C-E in later runs.

## Exact Next Action

Refresh PLAN/PROGRESS for Unit B, then add failing focused tests for compatible-command batching, `Saving/Saved/Error/Conflict`, retry/local recovery, and deterministic flush before frontend business-code edits.

## Files Changed

- `ai/tasks/todo/TASK-T5-006.md` - Task objective, scope, units, acceptance, and risks.
- `ai/tasks/doing/TASK-T5-006-PLAN.md` - dependency-ready Unit A implementation and verification plan.
- `ai/tasks/doing/TASK-T5-006-PROGRESS.md` - baseline findings, remaining work, and exact next action.
- `ai/state/CURRENT.md` - activate T5-006 Unit A.
- `ai/state/ROADMAP.md` - mark T5-006 `DOING`.
- `backend/core/canvas_document_fingerprint.py` - RFC 8785 canonical JSON and mutation SHA-256 fingerprint.
- `backend/schemas/canvas_document.py` - strict document PATCH request and committed response contracts.
- `backend/controllers/canvas_document_mutations.py` - atomic Canvas-scoped mutation, idempotency, validation, revision, and conflict controller.
- `backend/api/canvas_documents.py` - canonical PATCH route and structured 409/422 mapping.
- `backend/tests/test_canvas_document_fingerprint.py` - canonicalization and fingerprint unit coverage.
- `backend/tests/test_canvas_document_api.py` - guarded MySQL transaction, conflict, retry, rollback, normalization, ownership, and restart coverage.

## Commands And Results

- Same-automation instance query - UNAVAILABLE; the Codex thread-list capability did not return and was terminated after repeated waits, so no repository write occurred before the check completed as unavailable.
- Required source-document reads and Git baseline commands - PASS; clean `main`, HEAD `03a1f9c59df89ceaaec48e33c059ae32d0e7dba4`.
- T5-006 requirements/architecture/ADR and source inspection - PASS; Unit A can use the existing Alembic head without a schema change.
- Initial fingerprint unit run - EXPECTED RED; missing helper import fixed by the Unit A implementation.
- RFC 8785 fingerprint unit suite - PASS; 2/2 tests cover standard number/string/key vectors, safe-integer rejection, order stability, and mutation-ID exclusion.
- Initial guarded document PATCH suite - 5/7 PASS; exposed MySQL `DATETIME` microsecond truncation and an invalid ownership-test payload. Timestamp normalization and test separation resolved both without schema change.
- Final focused Unit A suite - PASS; 10/10 pure and guarded MySQL tests.
- Canvas backend regression - PASS; 44/44 schema, metadata, duplication, document, node, and connection tests; final combined pure/Canvas run 46/46 PASS.
- Final full backend regression - PASS; 196/196 tests in 165.01 seconds on guarded MySQL fixtures.
- Fresh concurrency review - PASS after changing revision and graph queries to locking/current reads so `REPEATABLE READ` retries resolve idempotency before base validation.
- Compile, strict UTF-8, business-file size, suspicious-pattern, tracked database-artifact, and `git diff --check` gates - PASS; all business files are below 500 lines. Ruff is not installed, so no Ruff result is claimed.
- First staged hygiene wrapper - INVALID FINAL SUBCHECK; all path/diff/secret/database/remainder gates passed, but PowerShell misparsed the unquoted upstream token after those gates. The corrected quoted upstream check confirmed `origin/main` and ahead/behind `0/0` before commit.

## Blockers And Release Conditions

- No Unit A implementation or verification blocker remains.
- No blocker prevents Unit B planning and implementation.
- Any guarded MySQL fixture failure must be classified as product failure or environment/setup failure before completion is claimed.
- Applying `f0a1b2c3d4e5` to user/runtime data remains Human-authorized migration work and is outside Unit A.
- Ignored `.env`, local `.db`, and the pre-existing `revid_test_db` must remain unopened and untouched.
