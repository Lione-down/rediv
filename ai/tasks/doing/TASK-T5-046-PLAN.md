# TASK-T5-046 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- The 375x812, 15% overview shows unavailable and broken messages at a fixed 12px while their result nodes shrink to overview size.
- Native image/video surfaces remain geometrically correct because their replaced content fits the scaled frame; ordinary fallback text does not.
- `surfaceNodeRectStyle` already owns the exact viewport zoom for every DOM node surface.
- `CanvasNodeMedia` uses one message class for placeholder, loading, and error states.

## Direction

- Publish the exact zoom as a scoped CSS custom property from the shared surface style.
- Multiply fallback font, padding, and radius by that property.
- Keep image/video elements and the outer media frame contract unchanged.
- Add direct geometry assertions rather than relying only on screenshot visibility.

## Units

1. Add focused RED coverage for placeholder/error geometry at low, normal, and extreme zoom.
2. Implement the scoped media fallback zoom variable and proportional styles.
3. Build and run focused plus related media/lineage/status regressions.
4. Capture and inspect desktop, compact, mobile, and extreme zoom evidence.
5. Synchronize report/state/pitfalls, review hygiene, commit, and push.

## Risks

- Scaling only font while leaving padding fixed would keep the same obstruction at 10%.
- Applying the variable globally could unintentionally resize panels or native controls.
- Browser computed styles can introduce subpixel rounding at fit-derived zoom.
- Error state must remain accessible even when overview text is intentionally tiny.
