# TASK-T5-006 Plan

- State: `DOING`
- Completed unit: Unit A - atomic backend document PATCH and revision contract (`COMPLETE - PASS`)
- Completed unit: Unit B - frontend autosave queue, recovery, and flush boundaries (`COMPLETE - PASS`)
- Completed unit: Unit C - Canvas-scoped 100-step undo/redo (`COMPLETE - PASS`)
- Next unit: Unit D - durable revisions, checkpoints, restore, and complete recovery UI
- Updated: 2026-07-13

## Objective

Unit C delivered one dependency-ready local history boundary around the existing typed Canvas commands so every accepted edit can be undone and redone without bypassing atomic autosave or leaking history across canvases.

## Unit C Scope

1. Add a Canvas-keyed command-history owner that retains the latest 100 applied command deltas plus its redo stack in memory.
2. Wrap the existing serialized typed command execution boundary so successful graph changes create exactly one history entry; rejected and no-op commands create none.
3. Record deterministic before/after entity deltas with exact node and connection IDs. Recover pointer-drag `from` positions because the renderer updates reactive positions before dispatch on pointerup.
4. Apply undo and redo as one local graph patch through the existing atomic autosave queue, preserving server revision and recovery behavior.
5. Clear redo after a new forward command, cap undo at 100 entries, and prevent undo/redo re-entry while a history transition is in flight.
6. Isolate history by user/project/Canvas identity. Preserve a Canvas stack across a normal flushed switch and clear the affected stack when a forced server reload replaces its document.
7. Add Canvas-focused `Ctrl+Z` and `Ctrl+Shift+Z` / `Cmd` equivalents while preserving editable-target, mobile review-only, repeat-key, and focus-scope guards.
8. Expose exact `canUndo` and `canRedo` state through the existing Canvas store without adding a new visual system or unrelated controls.

## Unit C Non-goals

- durable revision listing, retention, checkpoints, restore, and the complete conflict-choice panel, owned by Unit D;
- durable or cross-session undo/redo history;
- backend, schema, document PATCH contract, or granular compatibility-route changes;
- generation/task persistence owned by T5-007;
- final 200-node/300-connection, offline, restart, multi-viewport, and milestone closure owned by later units;
- schema changes, user/runtime migration execution, paid calls, secret access, or destructive data/filesystem operations.

## Dependencies And Existing Foundation

- Unit B provides the atomic autosave/recovery queue and deterministic flush-before-switch behavior used by every history transition.
- T5-005 provides the typed command boundary used by pointer, keyboard, toolbar, context-menu, and accessibility interactions.
- Commands with generated IDs or compound graph effects require execution-time deltas rather than factory-only inverse commands.
- The current Pinia Canvas store owns graph identity and lifecycle; history remains local and Canvas-scoped as required by ADR-005.

## TDD And Verification Plan

1. Add focused pure Playwright/TypeScript tests for command delta inversion, no-op exclusion, redo invalidation, and the exact 100-entry cap.
2. Add focused browser tests for Canvas-focus shortcuts, atomic autosave of undo/redo, normal switch isolation, and forced reload clearing. Run the new tests RED before implementation.
3. Implement the smallest history controller, graph-patch mutation, Pinia integration, and shortcut handling needed to make focused tests GREEN.
4. Run the focused history and directly affected command/autosave/navigation suites, then full Chromium regression and the frontend production build.
5. Verify desktop keyboard focus and 375 px review-only guards; do not add mobile mutation affordances.
6. Run strict UTF-8, business-file size, suspicious-pattern, `git diff --check`, fresh diff review, staged secret/path/database hygiene, precise commit, and `origin` push.

## Unit C Success Criteria

- every accepted typed command produces at most one reversible history entry and one debounced atomic document batch per undo or redo transition;
- undo restores the exact prior nodes, connections, parents, positions, lock state, and entity IDs; redo restores the exact post-command graph;
- a new forward command clears redo, and the undo stack retains exactly the latest 100 applied commands;
- normal Canvas switching restores each Canvas's independent local stack, while a forced document reload clears stale history for that Canvas;
- shortcuts work only when the Canvas owns focus and editing is allowed, and never mutate from editable controls or mobile review-only mode;
- focused history/browser tests, affected regression, full Chromium regression, production build, fresh diff review, and hygiene gates pass.

All Unit C success criteria are satisfied. Final evidence is recorded in `TASK-T5-006-PROGRESS.md`.

## Later Units

- Unit D: revision list, retention/checkpoints, restore, and complete recovery UI.
- Unit E: offline/conflict/restart/browser/regression closure and REPORT.

## Exact Next Action

Refresh PLAN/PROGRESS for Unit D, inspect the existing revision model/API and retention boundaries, then add failing revision-list/checkpoint/restore contract tests before business-code edits.
