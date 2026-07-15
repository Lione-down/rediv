# TASK-T5-058 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Objective

Prove and, where needed, correct the full identity lifecycle of a two-origin result merge when reference inputs are reordered, undone, redone, and reloaded: downstream `Rn` must follow request order while each upstream `Vn` and origin-generation target remains attached to the same canonical result.

## Scope and acceptance criteria

- Start with G1 V2 as R1 and G2 V1 as R2 in one downstream image generation.
- Reorder the two Inspector reference rows and immediately show G2 V1 as R1 and G1 V2 as R2 on Canvas and in the request preflight.
- Send exact reordered provider image IDs.
- Undo and redo as one command each, restoring exact R order without changing either V or origin target.
- Reload after redo and preserve row order, marker identity, and both independent navigation targets.
- Keep compact and readonly review stable, mutation-free where editing is unavailable, and visually quiet.

## Non-goals

- Recursive ancestry, drag-to-reorder, provider/schema changes, or global Inspector redesign.
- Reordering upstream variant families or changing canonical V order.

## Direction

- Visual thesis: graphite-black utility surface with quiet violet lineage cues and no new decorative layer.
- Content plan: identify each source, expose current R plus stable V, enable explicit order and origin actions.
- Interaction thesis: existing 40px controls, keyboard focus ring, and press-scale; reorder changes only downstream role identity.

## Units

1. Extend the real two-origin browser fixture with RED assertions for reorder, provider payload, undo/redo, reload, and origin navigation.
2. Fix only authoritative resolver/projection behavior exposed by the RED.
3. Run build, focused and related Chromium regression, plus desktop, compact, and readonly visual review.
4. Close report/state/pitfalls, perform fresh diff review, commit, and push.

All units are complete. The existing implementation passed the stronger lifecycle contract without a business-code correction; the durable browser matrix now protects that behavior.

## Risks

- Bridge arrays can remain in node order while request order changes, causing the right V to display beside the wrong R.
- Reorder controls can save exact metadata but Canvas projections may update one render behind.
- Reload can normalize equal or missing order metadata differently from the foreground command.
