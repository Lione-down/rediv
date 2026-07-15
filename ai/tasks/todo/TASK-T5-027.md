# TASK-T5-027 - Generation node run history

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-026 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make repeated runs from one generation node inspectable in place so users can distinguish current and prior queued, running, succeeded, failed, and timed-out attempts without leaving the Canvas.

## Scope

- Resolve project generation tasks for the selected generation node by durable `canvas_node_id`.
- Sort newest-first with deterministic tie behavior and expose the total run count.
- Show the latest five runs with status, media/model identity, duration or timestamp, and bounded failure detail.
- Keep the existing current-status surface and add a collapsible history below it.
- Support desktop, compact drawer, and 375px readonly review.
- Verify repeated success, mixed terminal states, active states, foreign-node filtering, long errors, and empty history.

## Non-goals

- Automatic retry, cancellation, deletion, pagination, provider polling changes, backend schema changes, ranking, or Canvas engine changes.

## Acceptance criteria

- Only tasks whose `canvas_node_id` matches the selected generation node appear.
- Runs are newest-first, stable for equal timestamps, capped to five visible rows, and report the uncapped total.
- All five statuses remain distinguishable without implying unavailable actions or results.
- Long IDs/errors cannot overflow desktop, compact, or 375px readonly surfaces.
- Opening history emits no PATCH, provider request, resource mutation, or selection change.
- Focused/relevant/full Chromium, build, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
