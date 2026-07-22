# T6-003 Human reference - shared anchor and elastic output port

- Date: `2026-07-21`
- Source: two Human-supplied screenshots from the official LibTV Canvas.
- Evidence class: Human-provided visual reference. Viewport, zoom, pointer coordinates, and timing were not measured live, so pixel thresholds below remain Revid-owned deterministic contracts rather than claimed LibTV measurements.

## Confirmed interaction facts

1. Multiple incoming connections from different card families visually converge on one target-side anchor instead of being separated by logical input role.
2. The outgoing `+` has an acquisition region materially larger than its visible circle.
3. After the pointer enters that region, the visible `+` follows the pointer along the card edge while remaining clamped to a safe vertical span.
4. The `+` returns to its canonical midpoint after the pointer leaves the region or the interaction is cancelled.

## Revid contract derived from the reference

- Preserve typed logical port IDs for compatibility, persistence, lineage, reroute, keyboard access, and undo/redo.
- Project all logical ports of the same direction onto one visible midpoint anchor for persisted paths and compatible-target disclosure.
- Keep the `20 world px` visible control, but supersede the old circle-only `40 CSS px` output acquisition contract with a CSS-stable edge band.
- While pointer-hovering the output band, project the visible output control to the pointer's vertical position, clamped inside the card edge; a new drag begins from that projected point.
- Reset the projected control on leave, pointer cancel, blur, readonly, Canvas switch, node removal, or viewport/layout invalidation. Keyboard initiation remains at the canonical midpoint.

## Required proof

- Pure tests: shared logical-port anchor, CSS-stable acquisition band, clamped follow position, deterministic reset, zoom applied once, readonly/locked fail closed.
- Browser tests: broad entry, edge follow, leave/reset, drag from the followed point, compatible landing on the target's one shared anchor, and unchanged typed connection/history behavior.
