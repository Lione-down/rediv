# TASK-T5-006 Plan

- State: `DOING`
- Completed units: Units A-C (`COMPLETE - PASS`)
- Completed unit: Unit D - durable revisions, checkpoints, restore, and complete recovery UI (`COMPLETE - PASS`)
- Next unit: Unit E - offline/conflict/restart/browser/regression closure and REPORT
- Updated: 2026-07-13

## Objective

Deliver a Canvas-scoped durable recovery boundary that lists retained edit revisions, writes reconstructable checkpoints, prunes history without breaking restore, restores any retained edit as a new head, and exposes explicit history/conflict recovery actions in the existing V2 Canvas shell.

## Unit D Scope

1. Add authenticated exact-Canvas revision list and restore endpoints under the canonical Canvas document API.
2. Store a full graph checkpoint on revision 1, every tenth edit revision, and every restore revision. Revision 1 anchors graphs that existed before canonical autosave began.
3. Retain the latest 50 edit revisions plus the shortest reconstruction chain beginning at the newest checkpoint at or before the retained window, pruning only after that chain is complete.
4. Reconstruct a target revision from its nearest retained checkpoint and ordered normalized operations, then replace the current graph atomically under the locked Canvas head.
5. Restore by creating a new checkpointed head revision; never renumber or update an existing revision record.
6. Return strict revision summary/list and restore response contracts without exposing graph payloads in the history list.
7. Add a Canvas-scoped frontend revision store and API client. A successful restore reloads the canonical document, clears stale local undo/redo through the existing forced-load boundary, and refreshes revision history.
8. Add one accessible dark-purple history/recovery panel with retained revisions, checkpoint identity, explicit restore confirmation, and conflict actions for reload-latest and preserve-local-copy.

## Unit D Non-goals

- durable cross-session undo/redo;
- schema or migration changes; the existing `canvas_revisions` table is sufficient;
- legacy granular-route revision synthesis or removal;
- offline/restart/full viewport closure owned by Unit E;
- node registry, project assets, templates, or generation persistence owned by T5-007;
- user/runtime migration execution, paid calls, secret access, local `.db` changes, or destructive user-data operations.

## Dependencies And Risks

- Unit A provides normalized atomic operations, the locked Canvas head, request fingerprints, and durable revision rows.
- Unit B provides local recovery storage and forced canonical reload behavior; Unit C clears stale local history on forced reload.
- A retained edit is restorable only if a checkpoint and every following operation through that edit exist. Retention therefore keeps the nearest checkpoint plus the at-most-nine bridge revisions before the latest-50 window.
- Current graphs may contain revision-zero rows created through compatibility routes. A full revision-1 checkpoint prevents those rows from disappearing during later reconstruction.
- Restore must order parent clearing, node revival/deactivation, and connection replacement to satisfy existing composite MySQL foreign keys without weakening constraints.

## TDD And Verification Plan

1. Add focused guarded MySQL/API tests for authenticated listing, periodic checkpoints, exact retention, reconstruction, exact-Canvas isolation, and restore-to-new-head. Run RED before backend business-code edits.
2. Add focused Chromium tests for revision loading, restore confirmation/new head reload, conflict reload-latest, preserve-local-copy, mobile review-only behavior, and accessible panel state. Run RED before frontend business-code edits.
3. Implement the smallest backend revision controller, schemas, routes, checkpoint capture, retention, and atomic restore needed for GREEN.
4. Implement the frontend revision domain store, panel, and recovery actions using existing API, Pinia, V2 tokens, and forced document reload boundaries.
5. Run focused backend and browser suites first; then affected Canvas backend/browser regression and the production frontend build.
6. Perform fresh acceptance/diff review, `git diff --check`, strict UTF-8 and 500-line gates, tracked/staged path and secret hygiene, precise staging, scoped commit, and `origin` push.

## Unit D Success Criteria

- revision list is authenticated, ownership-checked, exact-Canvas scoped, newest-first, and excludes graph payloads;
- every retained latest-50 edit can be reconstructed from a retained checkpoint, including a graph that existed before revision 1;
- checkpoints exist at revision 1, every tenth edit, and each restore head;
- normal retention leaves the latest 50 edit revisions plus only the nearest checkpoint-to-window bridge required to reconstruct them;
- restore atomically recreates exact node/connection IDs, ordering, parent links, endpoints, positions, lock state, and content, then advances the Canvas head by one;
- the target and prior revisions remain immutable; the new restore revision is a full checkpoint;
- the UI exposes revision history and specific conflict recovery choices without enabling graph mutation below 768 px;
- focused MySQL/API and Chromium tests, affected regression, production build, fresh diff review, and hygiene gates pass.

All Unit D success criteria are satisfied. Final evidence is recorded in `TASK-T5-006-PROGRESS.md`.

## Next Unit

- Unit E: offline/conflict/restart/browser/regression closure and REPORT.

## Exact Next Action

Refresh PLAN/PROGRESS for Unit E, then add the remaining offline/restart/real-MySQL recovery closure evidence before final full regression, REPORT, and Task acceptance.
