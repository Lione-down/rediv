# TASK-T5-024 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: a graphite-black, media-led horizontal filmstrip floats inside the Canvas and uses violet only for the selected variant.
- Content hierarchy: compact origin header, ordered variant cards, then honest media state and selection action.
- Interaction thesis: open from result lineage, scroll horizontally, choose or close; never autoplay and never mutate graph data.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- Runway variation grids make sibling outcomes easy to scan from one intent.
- Figma filmstrips keep temporary review spatially attached to the working surface.
- Lightroom contact sheets prioritize media comparison without inventing ranking.
- Revid combines these patterns as a non-modal Canvas review layer backed by persisted lineage order.

## Units

1. Add a focused comparison tray that reuses canonical media presentation.
2. Connect the result detail action, selection, compact drawer dismissal, and desktop panel insets.
3. Verify six mixed sibling outcomes, image decode, playable video, unavailable/broken states, readonly, Escape, and responsive bounds.
4. Run build, focused and related tests, full Chromium, visual review, diff and hygiene gates.
5. Synchronize PROGRESS/CURRENT/ROADMAP, write REPORT, commit, and push.

## Risks

- Duplicating media rendering could drift from canonical node states, so the tray must reuse `CanvasNodeMedia` and node presentation.
- A non-modal overlay can collide with side panels or mobile review controls.
- Selecting a sibling can reopen the compact detail drawer unless close and selection ordering is deterministic.
- Video must remain user-controlled and comparison must not trigger autosave.
