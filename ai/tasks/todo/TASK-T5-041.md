# TASK-T5-041 - Result-origin full lineage fit

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-040 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Let users start from any canonical generated result and explicitly fit its complete authoritative `T/R -> generation -> V family` lineage while retaining the selected result.

## Scope

- Reuse the existing quiet `适配完整生成链路` context action for canonical results.
- Resolve the origin generation from canonical result lineage, then fit its authoritative inputs and all canonical variants.
- Preserve the selected V result, exact-output emphasis, inspector context, graph history, and readonly review behavior.
- Place the retained selection toolbar at the least-obstructive node-adjacent dock when its default top position would cover sibling lineage nodes.
- Verify image, video, unavailable, broken, noncanonical, desktop, compact, readonly, and no-mutation states.

## Non-goals

- New visual styling, automatic camera movement, graph layout changes, result mutation, output reordering, backend changes, provider execution, or mobile editing.

## Acceptance criteria

- Selecting any canonical V result exposes the existing accessible fit action.
- The action fits authoritative T/R sources, origin generation, and its complete canonical V family.
- The originally selected result and stronger exact-output provenance remain selected after fitting.
- The retained toolbar does not cover another lineage node; selected-generation composer space remains protected.
- Noncanonical or lineage-free nodes do not expose a misleading action.
- Compact drawers close before fitting; readonly review remains mutation-free.
- One action performs exactly one viewport update and zero document PATCHes or undo-history entries.
- Build, focused/related Chromium, desktop/compact/readonly visual, diff, and sensitive-path gates pass.
