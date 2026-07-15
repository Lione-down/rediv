# TASK-T5-037 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Selection composition already creates a preview command and validates it through `resolveGenerationContext`, so its connections are authoritative for eligibility and ordering.
- The current intent projection keeps only aggregate counts. Four selected sources therefore share one violet treatment and do not reveal prompt versus reference roles or independent ordering.
- Existing selected-generation provenance proves the post-creation graph, but no equivalent projection explains the pre-creation selection.

## Direction

- Visual thesis: graphite-black workspace with tiny semantic markers, not a louder selection shell.
- Content plan: selected node content remains primary; one corner marker states its future `T` or `R` role; the toolbar menu summarizes totals and output choices.
- Interaction thesis: select sources, inspect roles/order, choose image or video, then see the same roles on the created generation provenance.
- CSS strategy: a new scoped component using existing V2 tokens and fixed screen-space geometry.

## Units

1. Extend the authoritative selection intent with ordered source entries derived from preview-command connections.
2. Render a small dedicated Canvas overlay for eligible multi-selection sources.
3. Add pure and browser assertions for exact T/R ordering, no mutation, responsive, readonly, and post-create handoff.
4. Build, run focused and related regressions, and inspect desktop/compact screenshots.
5. Synchronize state, write REPORT, review diff and hygiene, commit, and push.

## Risks

- A second node classifier could disagree with command eligibility or provider input order.
- World-scaled labels become unreadable at low zoom and oversized at high zoom.
- Reusing selected-generation provenance classes could blur pre-creation versus persisted graph state.
- Adding template logic directly to the nearly 500-line CanvasStage would violate the file-size boundary.
