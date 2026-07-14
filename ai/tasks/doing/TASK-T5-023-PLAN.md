# TASK-T5-023 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: graphite-black media workbench with lineage shown only for the selected result; G/T/R/V markers carry meaning without turning the graph into a permanent history diagram.
- Utility flow: select result, trace back to generation and ordered inputs, scan sibling variants, confirm task/model metadata in the detail panel.
- Interaction thesis: lineage appears and clears immediately with selection; video remains user-controlled and all presentation is static under reduced motion.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- Runway variation grids make siblings from one intent comparable.
- ComfyUI keeps generation ancestry inspectable through graph paths.
- Figma branches make one source and multiple outcomes legible without merging them.
- Revid combines these ideas as a compact in-Canvas G/T/R/V lineage layer rather than a modal gallery.

## Units

1. Add a pure canonical result-lineage resolver with active typed edge validation and stable sibling order.
2. Extend Canvas provenance presentation with origin generation and sibling result roles.
3. Add result detail metadata from the same lineage model.
4. Verify mixed image/video siblings, broken/unavailable media, invalid lineage, selection clearing, readonly, zoom, compact viewport, and screenshots.
5. Perform fresh diff review, synchronize durable state, write REPORT, commit, and push.

## Risks

- Matching only by nearby position or node type could fabricate ancestry.
- A generation node can have many outputs, so sibling order must follow persisted connection order.
- Latest generation task state may differ from an older result task and must not overwrite result identity.
- Dense G/T/R/V chrome could compete with selection and status overlays.
