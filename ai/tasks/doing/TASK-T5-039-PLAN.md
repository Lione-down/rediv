# TASK-T5-039 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- T5-038 projects V1..Vn markers from the canonical output resolver, but selected-generation provenance still returns only `resolveGenerationContext(...).provenance`.
- CanvasConnectionLayer already owns restrained result-edge styling and selected-result emphasis. No new visual language is needed.
- Existing result connection labels call outputs “participating in generation”, which is input semantics and should be corrected while this contract is under test.

## Direction

- Visual thesis: one selected generation reveals a continuous, quiet violet trace from sources through the task to all outputs.
- Content plan: T/R markers explain ordered inputs, the selected generation anchors intent, V markers and muted output paths explain the result family.
- Interaction thesis: select generation for the whole flow; select result for one stronger lineage edge; deselect to return edges to the background.
- CSS strategy: reuse existing result provenance classes and V2 tokens; no new style rules.

## Units

1. Build selected-generation output provenance from `resolveGenerationResultVariants`.
2. Merge it with generation context provenance without duplicating filtering logic.
3. Correct result-edge accessible labels and extend browser assertions.
4. Build, run related regression, and inspect desktop/compact evidence.
5. Synchronize state, write REPORT, review diff and hygiene, commit, and push.

## Risks

- Including every outgoing edge would highlight malformed or inactive graph data.
- Reusing selected-result provenance with `isSelected: true` would overemphasize every generation output.
- Increasing edge weight or adding motion would overpower media and violate the low-noise direction.
- Accessible labels must distinguish output generation from included/excluded input semantics.
