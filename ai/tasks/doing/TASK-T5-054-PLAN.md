# TASK-T5-054 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Selection-created generation edges persist independent prompt and media `input_order` values.
- `resolveGenerationContext` converts those values into authoritative T/R request order and exclusion state.
- `resolveGenerationResultVariants` computes authoritative V order from canonical active result edges.
- T5-053 currently discards those resolvers and shows only generic prompt, reference, or generated-result roles.
- Selecting an edge therefore loses the exact notation already shown when selecting a generation or result node.

## Direction

- Project exact role notation from existing authoritative resolvers into the selected-edge presentation.
- Keep fallback roles for unsupported, partial, or generic connection shapes.
- Add one muted excluded-state token without changing edge color semantics or graph data.

## Units

1. Add pure and browser REDs for reordered T/R identity, V variants, excluded inputs, reload, and readonly.
2. Extend connection presentation with authoritative semantic-order resolution.
3. Render exact role and excluded state in the existing collision-aware surface.
4. Verify provider context equality, dense graph quietness, responsive evidence, build, and related regression.
5. Close report/state/pitfalls, fresh diff review, commit, and push.

All units are complete. The final presentation delegates input and result order to the established generation context and result lineage resolvers.

## Risks

- Reconstructing order from metadata directly could drift from request semantics.
- Excluded reference order differs from effective provider request order and must remain unambiguous.
- Longer role chips can crowd compact localized surfaces.
- Result variant order must not be inferred from task timestamps or node positions.
