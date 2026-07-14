# TASK-T5-020 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: keep edges quiet and hairline-thin; selection reveals one violet line and two compact endpoint handles only at the moment of intent.
- Utility flow: select edge, identify source/target, drag one endpoint, commit only on a compatible typed port.
- Interaction thesis: a generous invisible hit area improves precision, while pointer preview, cancellation, keyboard deletion, and undo remain deterministic.

## Units

1. Add reconnect command validation, atomic mutation execution, and history tests. Complete.
2. Enrich edge presentation with endpoints, selection state, and accessible hit targets. Complete.
3. Add source/target endpoint drag state and direct compatible reroute with deterministic cancellation. Complete.
4. Verify dense topology, zoom, readonly, keyboard, autosave, history, and viewport visuals. Complete.
5. Perform fresh diff review, synchronize durable state, write REPORT, commit, and push. Complete.

## Risks

- A large hit path could steal node, marquee, or pan interactions.
- Reroute could accidentally create a new edge ID or split autosave/history into delete plus create.
- Source-end gestures can invert canonical edge direction if modeled as ordinary input-origin continuation.
- Endpoint handles could become permanent visual noise or scale incorrectly with zoom.
