# Report: T5-006 Autosave, conflicts, history, and recovery

## Result

`DONE - PASS` on 2026-07-13.

Revid now persists Canvas edits through one idempotent document boundary, preserves unsaved work across failures and reloads, isolates 100-step undo/redo per Canvas, retains reconstructable durable history, and restores any retained revision by creating a new immutable head.

## Delivered

- Added an atomic exact-Canvas document PATCH with optimistic graph revision, RFC 8785 request fingerprinting, mutation-id idempotency, structured conflicts, one durable revision row, and zero partial writes.
- Added a serialized 500 ms frontend autosave queue with exact `Saving`, `Saved`, `Error`, and `Conflict` states plus deterministic switch, route-exit, page-hide, viewport, and retry boundaries.
- Added versioned Canvas-scoped local recovery. Snapshots keep the original batch base/post-state and payload separate from the latest desired graph, so response-loss retry confirms only the original mutation before saving later edits with a new mutation.
- Added legacy version-1 recovery compatibility and fail-closed structured validation before local data can enter the live graph.
- Added Canvas-keyed 100-command undo/redo for the typed command model with independent switch preservation, forced-reload reset, exact graph-delta inversion, and atomic autosave replay.
- Added newest-first retained revision history, revision-1/periodic/restore checkpoints, reconstructable latest-50 retention, and exact restore-to-new-head without rewriting prior history.
- Added an accessible history/recovery dialog with explicit reload-latest, preserve-local-copy, discard, retry, mobile review-only enforcement, and deterministic focus on success, discard, conflict, and close.
- Strengthened guarded MySQL restart evidence to recreate engine/session/store state, fail closed on identity or Alembic mismatch, exercise the production FastAPI lifespan, list retained revisions, and restore again after restart.

## Acceptance Evidence

| Gate | Evidence | Result |
|---|---|---|
| Atomic persistence | Exact Canvas document PATCH commits graph, revision record, and head in one MySQL transaction | PASS |
| Optimistic conflict | Stale base returns structured HTTP 409 with no partial write or automatic overwrite | PASS |
| Mutation idempotency | Same ID/fingerprint returns the original result after reconstruction; different fingerprint returns HTTP 409 | PASS |
| Autosave timing/state | Normal edits enter `Saving` synchronously and reach `Saved` within one second | PASS |
| Offline and response loss | Exact recovery survives reload; original mutation is retried once semantically, later desired edits use a new revision batch | PASS |
| Navigation lifecycle | Switch, route exit, page hide, reload, retry, and preserve-local-copy remain deterministic | PASS |
| Local history | Latest 100 accepted commands remain Canvas-scoped and exactly reversible | PASS |
| Durable history | Latest 50 edits plus required checkpoint bridge remain reconstructable | PASS |
| Restore | Retained target rebuilds exact graph IDs/relations and commits a new immutable checkpointed head | PASS |
| Mobile and focus | Mobile exposes no recovery mutation/delete action; dialog focus survives conditional recovery/conflict UI | PASS |
| Guarded MySQL focus | 12/12 document/revision tests, including engine reconstruction and production lifespan restart | PASS |
| Focused browser | 16/16 autosave/recovery/revision tests, including panel axe coverage | PASS |
| Full backend | 200/200 tests on guarded MySQL fixtures | PASS |
| Full Chromium | 56/56 serial tests across performance, accessibility, four viewports, and Canvas regressions | PASS |
| Frontend build | `vue-tsc` and Vite, 4,739 modules | PASS |
| Independent review | Initial restart/recovery/readonly/focus findings corrected; final directed review has no HIGH/MEDIUM findings | PASS |
| Diff and hygiene | Strict UTF-8, file-size, sensitive-path, secret-pattern, tracked DB-artifact, debug-pattern, and `git diff --check` gates | PASS |

## Evidence Classification

- Browser offline, provider-independent autosave, and 200-node/300-connection checks use deterministic API mocks; they are browser evidence, not real-service or local-MySQL performance certification.
- Restart, idempotency, revision listing, and restore use disposable guarded `revid_test_*` MySQL schemas. Production-lifespan wiring is covered without touching user/runtime data.
- The first pre-review full Chromium performance run measured 54.66 FPS against the 55 FPS threshold under concurrent load. An isolated rerun and the final unchanged serial 56/56 suite passed; no threshold or product code was weakened.
- T5-008 still owns the final local-MySQL 200-node/300-connection load/save/reopen/checksum/restart Canvas milestone certification.

## Compatibility And Safety

- Existing granular graph routes remain available during the compatibility window; canonical autosave uses only the document PATCH.
- Invalid recovery data is preserved but never applied. Existing version-1 payload snapshots without batch fields are reconstructed deterministically from the loaded server graph and original payload.
- No schema or migration was added, no user/runtime database was changed, no paid provider was called, no real secret or `.env` content was read, and no local `.db` or destructive filesystem operation occurred.

## Human Owner Gates Remaining

- Applying Alembic revision `f0a1b2c3d4e5` to user/runtime data requires reviewed backup discipline and Human authorization.
- Ignored local `.db` artifacts and the pre-existing `revid_test_db` remain untouched pending exact authorization and ownership confirmation.
- Credential rotation remains required only if the removed T5-002 assignment was ever real or reused.

These gates do not invalidate T5-006 repository acceptance.

## Next Task

Create and activate T5-007 Task/PLAN/PROGRESS before implementing the node registry, project-shared assets/templates, generation tasks/results, and mock provider flows.
