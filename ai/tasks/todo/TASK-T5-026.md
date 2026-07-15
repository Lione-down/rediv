# TASK-T5-026 - Undoable generation input ordering

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-025 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Let users deliberately reorder connected prompt and media inputs so multi-node prompt composition, image references, and video keyframes follow an explicit durable order with atomic autosave and undo/redo.

## Scope

- Persist generation input order in typed connection metadata while preserving legacy graph order as fallback.
- Add one atomic command that reorders only compatible active incoming generation connections.
- Keep prompt and media groups independently ordered.
- Add accessible up/down controls to editable generation context rows.
- Update graph provenance, request preflight, and provider payload order immediately from the same resolver.
- Verify autosave, reload, undo/redo, readonly, compact, and invalid-command behavior.

## Non-goals

- Drag sorting, cross-type ordering, node position changes, automatic ranking, backend schema changes, provider calls beyond existing mock generation, or Canvas engine changes.

## Acceptance criteria

- Moving a prompt or media source changes only its compatible group order and writes one atomic document PATCH batch.
- Persisted `input_order` survives reload and drives T/R provenance, final prompt, image IDs, and video keyframes.
- Undo and redo restore exact metadata and derived request order.
- Missing, inactive, incompatible, foreign-target, boundary, readonly, and stale commands are no-ops.
- Desktop, compact, 375px readonly, focused/relevant/full Chromium, build, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
