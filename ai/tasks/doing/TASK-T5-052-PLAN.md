# TASK-T5-052 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Generation accepts at most 8 unique image references and can combine them with text sources.
- The current composition panel has one 360px scroll container around summary, sources, and actions.
- A 10-source list therefore pushes image/video actions below the initial visible region.
- Existing tests cover 2 and 4 sources but not the near-limit dense composition surface.

## Direction

- Keep the popover frame bounded and non-scrolling.
- Give only the ordered source list a named maximum height and vertical overflow.
- Retain stable node keys, accessible reorder buttons, and fixed action hierarchy.

## Units

1. Add a 10-node browser RED proving actions leave the initial visible panel.
2. Introduce an independently scrolling source queue with fixed actions.
3. Verify R8 keyboard reorder and exact image/video semantics.
4. Verify desktop, compact, readonly, long localization, and no-mutation boundaries.
5. Build, related regression, visual review, report/state/pitfalls, diff review, commit, and push.

All units are complete. The final implementation keeps the popover frame fixed and assigns vertical overflow only to the ordered source queue.

## Risks

- Nested scrolling can trap wheel or keyboard navigation.
- Fixed actions can reduce the list to too few visible rows in compact height.
- Many Canvas markers can visually dominate low zoom if dense selection is not inspected.
