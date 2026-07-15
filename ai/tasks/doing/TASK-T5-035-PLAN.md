# TASK-T5-035 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Reference findings

- AIGCCanvasFlow commit `c88c00c58c6fcf613d58c6674c46b4a11c1d9911` places a hover/selected `+` beyond the node output edge and opens a teleported compatible-node picker.
- Its useful principle is action discoverability near graph intent; its hard-coded type colors, glow, forced centering, and parallel compatibility list are not adopted.
- Revid already owns typed registry compatibility, atomic insertion, accessible chooser, panel-aware reveal, and history. T5-035 only adds the missing contextual entry point.

## Direction

- Visual thesis: graphite-black graph workspace with one quiet selected-node continuation affordance.
- Content plan: node content stays primary; the trigger means next step; the existing chooser owns compatible type detail.
- Interaction thesis: select, reveal trigger, open chooser, keyboard or pointer choose, atomically create, select, minimally reveal.
- CSS strategy: existing scoped SCSS and V2 CSS tokens only.

## Units

1. Derive one canonical eligible downstream output from node registry compatibility.
2. Render an accessible fixed-screen contextual trigger in the Vue surface layer.
3. Open the existing chooser from the canonical port anchor and tag explicit foreground invocation.
4. Select and panel-safely reveal the explicit continuation result without changing drag continuation semantics.
5. Verify geometry, compatibility, atomicity, history, responsive/readonly boundaries, visual quality, and repository hygiene.
6. Synchronize state, write REPORT, commit, and push.

## Risks

- A DOM overlay can steal Canvas drag gestures if its hit area overlaps the port.
- Recomputing compatibility in UI code can diverge from the command resolver.
- Applying foreground selection/reveal to port-drag continuation would silently change an established workflow.
- Scaling the button with world zoom makes it unusable at 10% or oversized at 800%.
