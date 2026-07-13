# TASK-T5-006 Plan

- State: `DOING`
- Completed unit: Unit A - atomic backend document PATCH and revision contract (`COMPLETE - PASS`)
- Next unit: Unit B - frontend autosave queue, recovery, and flush boundaries
- Updated: 2026-07-13

## Objective

Unit A delivered the first dependency-ready persistence boundary: a strict Canvas document mutation API that is atomic, revision-aware, idempotent, and backed by the existing MySQL `canvas_revisions` foundation.

## Unit A Scope

1. Add strict Pydantic request/response contracts for node upserts, connection upserts, deletes, mutation identity, committed revision, normalized changed entities, timestamp, and save state.
2. Compute the architecture-defined SHA-256 fingerprint over canonical UTF-8 JSON containing `base_revision` and the four mutation arrays, excluding `client_mutation_id`.
3. Lock the authenticated active Canvas, then resolve an existing mutation ID before validating `base_revision`.
4. Return the original committed result for an identical retry; reject mutation-ID reuse with a different fingerprint and stale bases with structured HTTP 409 details.
5. Validate exact Canvas ownership, node/group parents, endpoint existence, self-loops, duplicate edges, and delete/upsert overlap before committing.
6. Apply all node and connection changes, create one `CanvasRevision`, advance `graph_revision` once, and return normalized committed entities in one transaction.
7. Add guarded real-MySQL API tests for success, mixed create/update/delete, rollback, conflict, idempotent retry, fingerprint mismatch, ownership, and restart persistence.

## Unit A Non-goals

- frontend autosave queue or save-state UI;
- local recovery storage, route/page-hide flush, or conflict-choice UI;
- undo/redo history;
- revision listing, pruning, checkpoint generation, or restore;
- changing or removing the existing granular Canvas node/connection routes;
- applying migrations to a user/runtime database.

## Dependencies And Existing Foundation

- T5-005 typed commands are complete and provide the future frontend mutation source.
- `canvases.graph_revision` and `canvas_revisions` already exist at Alembic head `f0a1b2c3d4e5`; Unit A requires no schema change.
- `GET /document` and separate viewport persistence already enforce authentication, active Canvas scope, and revision-neutral viewport writes.
- Existing guarded `revid_test_*` fixtures provide authorized MySQL integration evidence.

## Verification Plan

1. Run the focused canonical-fingerprint unit tests.
2. Run the focused guarded `test_canvas_document_api.py` MySQL suite.
3. Run the relevant Canvas backend regression suites.
4. Restart the test application/store and verify committed graph/revision/idempotency persistence.
5. Run a fresh diff review, file-size check, strict UTF-8 check, suspicious-pattern scan, and `git diff --check`.
6. Update PROGRESS and CURRENT with exact evidence; precisely stage only owned Unit A paths, run staged secret/diff hygiene, commit, and push `main` when all Unit A gates pass.

## Unit A Success Criteria

- one valid mixed batch commits atomically and advances the head exactly once;
- exact retries are stable across a reconstructed application/store and do not duplicate graph rows or revisions;
- stale bases and fingerprint mismatches return structured 409 responses with the current revision and zero partial writes;
- invalid parents/endpoints/duplicates and overlapping operations leave the graph and revision unchanged;
- viewport writes remain revision-neutral and legacy granular routes remain operational;
- focused and relevant regression evidence passes with no secret, database-scope, or unrelated-worktree violations.

All Unit A success criteria are satisfied. Final evidence is recorded in `TASK-T5-006-PROGRESS.md`.

## Later Units

- Unit B: autosave queue, save-state reducer, retry/local recovery, and deterministic flush.
- Unit C: Canvas-scoped 100-step undo/redo.
- Unit D: revision list, retention/checkpoints, restore, and recovery UI.
- Unit E: offline/conflict/restart/browser/regression closure and REPORT.

## Exact Next Action

Refresh this PLAN and PROGRESS for Unit B, then inspect the existing Canvas command executor, mutation adapter, route lifecycle, identity bar, and browser tests before changing frontend business code.
