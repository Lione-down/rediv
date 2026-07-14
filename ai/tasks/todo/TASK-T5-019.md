# TASK-T5-019 - Reverse typed port dragging and upstream continuation

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-018 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make input ports first-class graph entry points: users can drag backward to an existing compatible output or release on empty Canvas space to create and connect a compatible upstream node atomically.

## Scope

- Preserve output-to-input dragging and downstream continuation.
- Add input-to-output reverse dragging with the same typed compatibility contract.
- Add an upstream continuation chooser filtered through the canonical node registry.
- Create the selected upstream node and edge through one `insert-graph` command.
- Keep preview direction, copy, port labels, keyboard behavior, cancellation, viewport clamping, and reduced motion coherent in both directions.
- Verify direct reverse connection, upstream continuation, cancellation, readonly behavior, undo/redo, persistence request shape, and branched/convergent graph scenarios.

## Non-goals

- Edge rerouting, edge insertion, replacing occupied inputs, paid generation calls, timeline controls, or a Canvas engine replacement.

## Acceptance criteria

- Dragging from an input to a compatible existing output creates an edge in canonical source-to-target orientation.
- Empty-space release opens an upstream chooser without mutating the graph.
- The chooser lists only canonical subtypes whose output is compatible with the originating input.
- Choosing an item inserts one upstream node and one typed edge in one undoable command and one autosave PATCH.
- Click, Escape, outside click, pointer cancel, outside-Canvas release, readonly mode, and incompatible targets leave the graph unchanged.
- Existing downstream continuation, graph interaction, mobile review-only, and 200/300 contracts do not regress.
- Focused browser tests, relevant regression, full Chromium, build, viewport screenshots, UTF-8, file-size, diff, and sensitive-path gates pass.

## Result

Complete. See `ai/reports/REPORT-T5-019.md`.
