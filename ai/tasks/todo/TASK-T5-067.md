# TASK-T5-067 - Generation-owned output variant comparison

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-066 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Objective

Let a creator select one canonical generation with multiple output variants and open the existing Canvas-local comparison tray directly from that generation's Inspector, without first navigating to an arbitrary result node.

## Product direction

- LibTV communicates multiple outputs as one version family through restrained stacking.
- Runway groups outputs around their generation session and makes comparison a session-level action.
- Figma exposes variants as one explicit family while keeping each item independently addressable.
- Revid will keep persisted result nodes spatially honest, use existing V1..Vn identity, and open the existing graphite comparison tray from the generation owner.

## Scope

- Reuse `resolveGenerationResultVariants` as the only output-family authority.
- Show one output-family summary and comparison action for canonical generation nodes with at least two valid results.
- Reuse `CanvasResultCompareTray`; do not add a second gallery or result-card implementation.
- Preserve mixed image/video playback, playback-only fallback, unavailable media, exact V order, result selection handoff, lineage, compact drawer ownership, readonly review, and zero graph mutation.

## Non-goals

- Physical node stacking, graph re-layout, hidden result nodes, automatic ranking, pixel diff, batch deletion, auto-generation, provider calls, schema changes, or mobile editing.

## Acceptance criteria

- Selecting a generation with two or more canonical active typed outputs exposes `比较 N 个生成结果` in its Inspector.
- One output or invalid/inactive/foreign edges expose no misleading comparison action.
- Opening from a generation renders the exact existing V1..Vn tray in persisted connection order without choosing an arbitrary current result.
- Selecting one tray item closes the tray, selects and reveals that exact result, and preserves its generation lineage.
- Mixed image/video, unavailable, playback-only, desktop 1440x900, compact 920x900, and readonly 375x812 remain usable and bounded.
- Opening, closing, scrolling, and selecting for inspection create no Canvas document mutation.

## Verification

- Add focused pure and Chromium coverage for resolver filtering, generation entry, mixed outputs, selection handoff, compact drawer transition, readonly, invalid states, and no PATCH.
- Run result-lineage, generation-provenance, comparison, media playback, responsive, build, screenshot, diff, file-size, and sensitive-path gates.
