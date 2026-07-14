# TASK-T5-021 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: selected edges gain one quiet midpoint plus affordance; the graph remains hairline-thin and media-first outside the current insertion intent.
- Utility flow: select edge, open compatible bridge choices, preview the intended semantic node, commit one atomic topology replacement.
- Interaction thesis: midpoint action uses existing compact chooser rhythm, deterministic keyboard focus, viewport clamping, and no decorative motion.

## Units

1. Add pure two-sided compatibility resolution and atomic insertion command tests.
2. Add same-ID upstream edge replacement plus new downstream edge mutation execution.
3. Add selected-edge midpoint affordance and accessible insertion chooser.
4. Verify text/media/result compatibility, cancellation, readonly, history, autosave, branch/convergence, and viewport visuals.
5. Perform fresh diff review, synchronize durable state, write REPORT, commit, and push.

## Risks

- Checking only the incoming side could expose a node whose output cannot feed the original target.
- Reusing generic `insert-graph` would reject the intentionally reused original edge ID.
- Splitting delete/create mutations would fragment autosave and undo history.
- Midpoint controls could collide with dense edges or become permanent visual noise.
