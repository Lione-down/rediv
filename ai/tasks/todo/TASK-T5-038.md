# TASK-T5-038 - Generation output variant map

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-037 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make expanded multi-result layouts read as one generation-owned version family by showing stable `V1..Vn` markers on every canonical output whenever its generation node is selected.

## Scope

- Extract a canonical generation-to-result variant resolver shared by generation and selected-result lineage.
- Project persisted active typed connection order as `V1..Vn` for a selected generation.
- Preserve existing T/R input provenance and selected-result G/V lineage.
- Verify image, video, unavailable, broken, repeated foreground result, inactive, malformed, ambiguous, compact, and readonly states.
- Capture dense multi-result desktop and compact visual evidence.

## Non-goals

- Moving or overlapping persisted result nodes, changing result placement, collapsing graph geometry, changing comparison tray behavior, renaming result nodes, provider execution, backend changes, or mobile editing.

## Acceptance criteria

- Selecting one canonical generation shows one `V` marker per active typed canonical result in persisted connection order.
- T/R input provenance and output provenance edges remain synchronized with the same selected generation.
- Selecting one result retains existing G plus V1..Vn lineage and selected-variant emphasis.
- Inactive, untyped, compatibility, unsupported, foreign-source, and ambiguous edges do not become variants.
- Viewing variant markers creates no document or viewport mutation.
- Build, focused/related Chromium, desktop/compact visual, file-size, diff, and sensitive-path gates pass.
