# TASK-T5-006 Plan

- State: `DOING`
- Completed unit: Unit A - atomic backend document PATCH and revision contract (`COMPLETE - PASS`)
- Completed unit: Unit B - frontend autosave queue, recovery, and flush boundaries (`COMPLETE - PASS`)
- Next unit: Unit C - Canvas-scoped 100-step undo/redo
- Updated: 2026-07-13

## Objective

Unit B delivered one dependency-ready frontend persistence boundary that converts Canvas graph edits into debounced, idempotent document PATCH batches, exposes accurate save state, preserves unsaved work locally on error or conflict, and deterministically flushes before Canvas or route departure.

## Unit B Scope

1. Add strict frontend types and an API client for the Unit A `PATCH /document` contract.
2. Add a Canvas-scoped autosave controller with one serialized in-flight batch, a maximum 500 ms batching window, one stable `client_mutation_id` per submitted batch, and revision advancement only from committed responses.
3. Reduce graph save state to `saving`, `saved`, `error`, or `conflict`; enter `saving` synchronously when graph state changes and never claim `saved` while unsent or rejected work remains.
4. Replace canonical Canvas graph writes through granular node/connection routes with optimistic local graph mutations followed by atomic document batches. Keep the backend compatibility routes unchanged for legacy clients.
5. Persist a versioned, user/project/Canvas-scoped recovery snapshot in local storage while graph work is unsent, in flight, rejected, or conflicted; remove it only after the matching document is committed.
6. Stop automatic overwrite on HTTP 409, retain the current revision detail, and expose explicit retry and preserve-local-copy boundaries for later recovery UI expansion.
7. Flush graph autosave and the separate viewport queue before Canvas switch and route exit. On page hide, synchronously preserve the recovery snapshot before attempting the async flush.
8. Show the exact graph save state in the existing top-right route status using the locked V2 tokens, icons, 40 px target, and text semantics without adding a second status surface.

## Unit B Non-goals

- Canvas-scoped 100-step undo/redo, owned by Unit C;
- durable revision listing, retention, checkpoints, restore, and the complete conflict-choice panel, owned by Unit D;
- removing backend granular compatibility routes;
- generation/task persistence owned by T5-007;
- final 200-node/300-connection, offline, restart, multi-viewport, and milestone closure owned by later units;
- schema changes, user/runtime migration execution, paid calls, secret access, or destructive data/filesystem operations.

## Dependencies And Existing Foundation

- Unit A provides atomic document PATCH, structured `stale_graph_revision` and `mutation_id_reused` conflicts, exact idempotent retry, normalized committed entities, and durable revisions.
- T5-005 provides the typed command boundary used by pointer, keyboard, toolbar, context-menu, and accessibility interactions.
- The current Pinia Canvas store owns graph/revision state, while viewport persistence already has an independent 500 ms debounce and route/page lifecycle hook.
- Existing V2 identity status styling already distinguishes saving, saved, and error states and can be extended without a new component system.

## TDD And Verification Plan

1. Add focused Playwright tests for one debounced document batch, synchronous `Saving`, committed `Saved` within one second, and revision advancement.
2. Run the focused test and record the expected RED failure caused by missing document PATCH behavior.
3. Add focused tests for HTTP 409 conflict retention, non-409 error retention plus stable-ID retry, local recovery storage, and flush-before-switch ordering. Run each new behavior RED before implementation.
4. Implement the smallest queue, reducer, API, store integration, lifecycle, and status UI needed to make the focused tests GREEN.
5. Run the focused persistence/browser specs, then full Chromium regression and the frontend production build.
6. Verify desktop and 375 px rendered status states, keyboard/label semantics, and no mobile mutation control regression.
7. Run strict UTF-8, business-file size, suspicious-pattern, `git diff --check`, fresh diff review, staged secret/path/database hygiene, precise commit, and `origin` push.

## Unit B Success Criteria

- a local graph edit enters `Saving` immediately and one compatible 500 ms batch reaches `Saved` within one second under the mock local API;
- a batch carries the loaded `base_revision`, one stable mutation ID, and the normalized graph operations, then advances the local revision only from the committed response;
- edits made during an in-flight request remain queued for a later serialized batch and are not overwritten by the earlier response;
- server/network failure keeps the same rejected batch recoverable in memory and local storage, reports `Error`, and succeeds through explicit retry without generating a different mutation ID;
- HTTP 409 reports `Conflict` plus the current server revision, stops automatic overwrite, and retains local recovery data;
- Canvas switch and route exit wait for a successful flush, while failed flush blocks silent navigation loss; page hide preserves recovery synchronously;
- viewport persistence remains a separate revision-neutral request;
- focused browser tests, full Chromium regression, production build, fresh diff review, and hygiene gates pass.

All Unit B success criteria are satisfied. Final evidence is recorded in `TASK-T5-006-PROGRESS.md`.

## Later Units

- Unit C: Canvas-scoped 100-step undo/redo.
- Unit D: revision list, retention/checkpoints, restore, and complete recovery UI.
- Unit E: offline/conflict/restart/browser/regression closure and REPORT.

## Exact Next Action

Refresh this PLAN and PROGRESS for Unit C, then inspect command inversion boundaries and add failing Canvas-isolated 100-step undo/redo tests before business-code edits.
