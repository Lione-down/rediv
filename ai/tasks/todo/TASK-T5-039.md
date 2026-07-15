# TASK-T5-039 - End-to-end generation provenance trace

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-038 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Complete the selected-generation graph explanation by tracing both authoritative T/R inputs and canonical V outputs, so one selection reveals the full `sources -> generation -> variants` flow.

## Scope

- Combine selected-generation input provenance with canonical ordered result variants.
- Highlight output edges with the existing restrained result-provenance treatment.
- Keep selected-result lineage's stronger selected-output edge treatment unchanged.
- Correct result-edge accessible labels to describe generated output rather than input participation.
- Verify active, excluded, inactive, untyped, mixed-media, repeated-output, compact, readonly, and no-mutation states.

## Non-goals

- New edge colors, animation, thicker general graph edges, output reordering, physical result stacking, graph mutation, backend changes, provider execution, or mobile editing.

## Acceptance criteria

- Selecting one canonical generation highlights all included T/R input edges and all active typed V output edges.
- Excluded inputs retain muted dashed treatment; outputs never inherit excluded styling.
- Selecting one result still highlights its exact output edge more strongly than siblings.
- Noncanonical, inactive, untyped, and foreign edges remain ordinary.
- Result-edge accessible names identify `结果变体 N，生成结果`.
- Viewing the full trace causes no document or viewport mutation.
- Build, focused/related Chromium, desktop/compact visual, file-size, diff, and sensitive-path gates pass.
