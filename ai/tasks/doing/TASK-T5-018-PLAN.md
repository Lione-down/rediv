# TASK-T5-018 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: a quiet graphite workbench with one contextual continuation surface; violet denotes the active typed action only.
- Utility flow: orient to the dragged source, show compatible continuations, commit one atomic action.
- Interaction thesis: existing edge preview leads into a release-point chooser; keyboard selection and cancellation are deterministic and reduced-motion safe.

## Units

1. Add pure registry-backed continuation option resolution and tests. Complete.
2. Add release-point continuation state and one-command node-plus-edge insertion. Complete.
3. Add an accessible compact chooser using existing Canvas tokens. Complete.
4. Verify direct connections, continuation, cancel, undo/redo, autosave, readonly, and viewport behavior. Complete.
5. Perform fresh diff review, synchronize durable state, write REPORT, commit, and push. Complete.

## Risks

- Pointer-up ordering could close the chooser immediately.
- Viewport transforms could place the new node or chooser at the wrong coordinate.
- Separate node/edge mutations would fragment undo history or autosave.
- A generic node menu could expose incompatible or semantically useless targets.
