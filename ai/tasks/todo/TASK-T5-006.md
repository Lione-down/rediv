# TASK-T5-006 - Autosave, conflicts, history, and recovery

- State: `DOING`
- Phase: Product V2 / Phase 5
- Dependency: T5-005 `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Started: 2026-07-13

## Objective

Make Canvas editing durable and recoverable through one idempotent autosave boundary, visible conflict handling, Canvas-scoped 100-step undo/redo, retained edit revisions, checkpoints, and non-destructive restore.

## Scope

- atomic Canvas document mutation batches with optimistic graph revisions and mutation idempotency;
- a client autosave queue with visible save states, retry, local recovery, and deterministic flush boundaries;
- Canvas-scoped undo/redo retaining at least 100 commands;
- durable revision listing, 50-revision retention, periodic checkpoints, and restore-to-new-head semantics;
- conflict recovery choices for reload-latest and preserve-local-copy;
- focused MySQL, unit, browser, build, restart, and failure evidence.

## Non-goals

- node registry, project-shared asset/template, or generation integration owned by T5-007;
- final 200-node/300-connection milestone certification owned by T5-008;
- real-time collaboration, cross-canvas edges, mobile editing, global page redesign, paid calls, secret access, user/runtime migration execution, or destructive user data/filesystem work.

## Delivery Units

1. Unit A - atomic backend document PATCH, revision conflict, idempotency, and durable revision record.
2. Unit B - frontend autosave queue, save-state reducer, retry/local recovery, and navigation flush.
3. Unit C - Canvas-scoped 100-step undo/redo through the existing typed command boundary.
4. Unit D - durable revision list, retention/checkpoints, restore-to-new-head, and recovery UI.
5. Unit E - offline/conflict/restart/browser/regression closure and Task report.

## Acceptance Criteria

- [x] Graph load returns Canvas metadata, nodes, connections, and the current revision as one document.
- [x] Each mutation batch uses `base_revision` and `client_mutation_id`; one MySQL transaction applies the graph change, writes its revision, and advances the head.
- [x] A stale base returns HTTP 409 with the current revision and no partial write.
- [x] Retrying the same mutation ID and fingerprint returns the original committed result; reusing the ID with a different fingerprint returns HTTP 409.
- [x] Autosave enters `Saving` immediately, reaches `Saved` within one second under normal local conditions, and preserves rejected or unsent work on error/conflict.
- [x] Canvas switch, route exit, and page hide use deterministic flush/retry/preserve-local-copy behavior.
- [x] Undo/redo is isolated by Canvas and retains at least 100 applied commands.
- [ ] Durable history retains the latest 50 edit revisions plus required checkpoints; restore creates a new head and never rewrites prior history.
- [x] Viewport persistence stays separate and does not advance graph revision.
- [ ] Focused unit/MySQL/browser tests, backend regression, frontend build, restart evidence, fresh diff review, and hygiene gates pass.

## Linked Decisions And Specifications

- `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`
- `ai/decisions/ADR-002-v3-1-technology-stack.md`
- `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- `ai/decisions/ADR-005-project-multi-canvas.md`
- `ai/requirements/REVID-V2-PRD.md`
- `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`

## Risks And Controls

- Partial graph writes: lock the exact active Canvas and commit nodes, connections, revision, and head advancement in one transaction.
- Retry races: resolve an existing `(canvas_id, client_mutation_id)` before comparing the base revision, and bind it to a canonical request fingerprint.
- Scope leakage: validate every upsert, delete, parent, and endpoint against the authenticated project and exact Canvas.
- Legacy-route drift: keep existing granular routes usable during T5-006, while new autosave code uses only the canonical document PATCH.
- Lost local work: automatic conflict handling never overwrites; rejected commands remain recoverable until the user chooses a recovery action.
- History growth: checkpoint before pruning and retain every checkpoint required to reconstruct the retained revision window.
