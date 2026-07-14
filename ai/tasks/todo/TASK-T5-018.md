# TASK-T5-018 - Continue connections into new typed nodes

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-017 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make output-port dragging continue naturally when released on empty Canvas space: show only compatible node choices at the release point, then create and connect the selected node as one undoable graph command.

## Scope

- Preserve direct port-to-port connection behavior.
- Open a compact typed continuation chooser only after an output drag ends on empty Canvas space.
- Filter choices through the canonical node registry and existing port compatibility rules.
- Create the chosen node and edge atomically through `insert-graph`.
- Support keyboard focus, arrow navigation, Enter, Escape, outside dismissal, reduced motion, and narrow workspace positioning.
- Verify direct connect, continuation, cancellation, invalid targets, undo/redo, persistence request shape, and viewport visuals.

## Non-goals

- Reverse input-to-output dragging, edge rerouting, edge insertion, sequence timeline controls, paid generation calls, or a Canvas engine replacement.

## Acceptance criteria

- Empty-space release opens a chooser anchored near the pointer without mutating the graph.
- The chooser lists only subtype choices compatible with the dragged source port.
- Choosing an item inserts one node and one typed edge in a single undoable command.
- Escape, outside click, pointer cancel, readonly mode, and incompatible sources leave the graph unchanged.
- Existing direct port connection, autosave, undo/redo, mobile review-only, and 200/300 interaction contracts do not regress.
- Focused browser tests, relevant regression, full Chromium, build, viewport screenshots, UTF-8, file-size, diff, and sensitive-path gates pass.

## Result

Complete. See `ai/reports/REPORT-T5-018.md`.
