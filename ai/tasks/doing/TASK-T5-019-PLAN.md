# TASK-T5-019 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: preserve the quiet graphite media workbench; reveal typed ports and violet direction only while the connection is active.
- Utility flow: begin from either port direction, resolve only compatible opposite ports, then commit one correctly oriented graph mutation.
- Interaction thesis: reverse dragging mirrors downstream continuation without adding permanent chrome; keyboard and cancellation remain deterministic and reduced-motion safe.

## Units

1. Generalize pure target resolution and continuation option/command builders for both directions. Complete.
2. Generalize renderer and stage draft state for input and output port origins without growing the 500-line stage boundary. Complete.
3. Adapt the compact chooser copy and port labels to downstream and upstream context. Complete.
4. Verify direct reverse connections, upstream continuation, cancel, undo/redo, autosave, readonly, topology, and viewport behavior. Complete.
5. Perform fresh diff review, synchronize durable state, write REPORT, commit, and push. Complete.

## Risks

- Reverse preview geometry could visually imply the wrong source-to-target direction.
- Generic registry compatibility could offer upstream nodes that are type-valid but not useful.
- Input click handling could accidentally open the inspector or mutate occupied inputs.
- Duplicated directional branches could exceed the stage file-size limit and drift from output behavior.
