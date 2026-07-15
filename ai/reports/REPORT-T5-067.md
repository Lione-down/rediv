# REPORT-T5-067 - Generation-owned output variant comparison

## Outcome

T5-067 is `DONE - PASS`.

Creators can now select one canonical generation and compare its complete mixed-media output family directly. Revid keeps every persisted result spatially honest on the graph, while the existing graphite comparison tray provides the restrained version-family reading requested by the LibTV reference.

## Implementation

- Reused `resolveGenerationResultVariants` as the only authority for valid output membership and V order.
- Added a compact generation Inspector summary with output count and one comparison action when at least two valid outputs exist.
- Generalized existing comparison items to originate from either selected result lineage or the selected generation family.
- Kept result entry behavior unchanged, including the current V marker.
- Left generation entry intentionally unselected until the creator chooses one exact result.

## Verification

- Focused generation-owned comparison: PASS, 3/3.
- Related result lineage, generation provenance/run result, video playback, selection-generation output, result branching, and multi-scenario regression: PASS, 50/50.
- Frontend production build: PASS, 4,820 modules transformed.
- Desktop 1440x900: generation Inspector and six-output mixed-media filmstrip.
- Compact 920x900: drawer handoff, bounded tray, and exact V2 result selection.
- Readonly 375x812: bounded horizontal family review and Escape dismissal.

The browser contract proves six exact V cards in persisted connection order, four images, one playable video, one unavailable result, no arbitrary current result from generation entry, exact result handoff, one-output fail-closed behavior, and zero document PATCH.

## Product boundary

This is an inspection projection, not physical result stacking. Node positions, edges, minimap, hit testing, generation execution, ranking, and provider behavior remain unchanged. The existing result comparison surface is reused rather than copied.
