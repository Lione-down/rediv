# TASK-T5-047 - Proportional provenance markers at overview zoom

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-046 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Keep T/R/G/V provenance markers proportional to their Canvas nodes across zoom while preserving exact corner anchoring and lineage meaning.

## Scope

- Scale source and result marker pills with the scoped Canvas surface zoom.
- Preserve source markers on the top-left corner and result markers on the top-right corner.
- Cap high-zoom marker growth at 120% while allowing exact proportional reduction below 100%.
- Verify labels, selected-variant emphasis, trace fit, desktop, compact, and mobile readonly overview.

## Non-goals

- Provenance resolution, graph edges, marker copy, node geometry, status/media/composer surfaces, backend work, provider calls, or mobile editing.

## Acceptance criteria

- At 10%, 50%, and fit-derived overview zoom, T/R/G/V pills shrink in direct proportion to node geometry.
- At 100% existing marker size and visual hierarchy remain unchanged.
- At 800% marker growth is capped at 120%.
- Source pill centers remain anchored to the source node top-left corner and result pill centers to the result node top-right corner.
- T1/T2/R1/R2 and V1 through V6 labels remain correct; selected-result emphasis remains intact.
- Browser evidence covers 1440x900, 920x760, and 375x812.

## Visual direction

- Visual thesis: lineage markers are lightweight node annotations, not fixed screen-space controls.
- Content plan: graph topology and node silhouettes dominate overview; marker identity becomes readable after zoom-in.
- Interaction thesis: zoom changes marker scale continuously without motion, reflow, or graph mutation.
