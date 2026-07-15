# TASK-T5-056 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Result branching already creates a typed result-to-generation media edge and sends the correct generated asset ID.
- `resolveGenerationContext` owns downstream R order and inclusion state.
- `resolveResultLineage` owns canonical upstream G/V identity and rejects ambiguous or task-mismatched origins.
- The current selected-generation marker and inspector discard that upstream identity, so a chained result looks indistinguishable from an uploaded asset.

## Direction

- ComfyUI precedent: preserve the role of data as it crosses node stages.
- Unreal Blueprints precedent: expose local source provenance without expanding an entire graph automatically.
- DaVinci Resolve precedent: emphasize only the currently inspected node chain.
- Use one pure bridge resolver that composes existing authoritative resolvers rather than parsing metadata independently.
- Reuse scoped SCSS, V2 tokens, pill geometry, typography, and navigation behavior.

## Units

1. Add pure REDs for exact R/V bridge resolution and invalid lineage rejection.
2. Add browser REDs for chained branch identity, inspector copy, payload equality, reload, compact, readonly, and no mutation.
3. Implement the bridge resolver and project it into Canvas markers plus inspector rows.
4. Run build, focused and related Chromium regression, plus 1440px, 920px, and 375px visual review.
5. Close report/state/pitfalls, perform fresh diff review, commit, and push.

All units are complete. One pure bridge resolver composes downstream request context with upstream canonical result lineage, and both Canvas and inspector consume that exact result.

## Risks

- Result titles or asset IDs are not proof of lineage; only canonical active typed edges and task consistency are authoritative.
- A longer dual-role pill can crowd overview zoom or localized nodes.
- Duplicate or excluded generated assets must not inherit a request role they do not have.
- Adding recursive ancestors would turn a local inspection feature into an uncontrolled graph expansion.
