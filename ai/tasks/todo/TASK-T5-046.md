# TASK-T5-046 - Zoom-consistent media fallback content

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-045 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Keep loading, unavailable, and broken media fallback content proportional to result nodes across Canvas zoom so overview layouts remain legible without fixed-size placeholder text covering node geometry.

## Scope

- Expose the current Canvas zoom to DOM node surfaces through a read-only CSS variable.
- Scale media fallback font, padding, and corner radius with that variable.
- Hide the browser-native broken replaced-element artifact once the explicit product error state is visible.
- Verify placeholder, loading, and error states without changing native image/video rendering.
- Verify dense full-trace, desktop, compact desktop, and mobile readonly overview.

## Non-goals

- Media copy redesign, new icons, media loading behavior, native control restyling, result geometry changes, backend work, provider calls, or mobile editing.

## Acceptance criteria

- At 15%, 44%, and 51% overview zoom, placeholder/error content stays proportional and contained by its node.
- At 100% fallback appearance remains unchanged.
- At 10% and 800% font, padding, and radius remain finite and scale predictably.
- Image/video sizing, object-fit, playback controls, metadata adoption, and error transitions remain unchanged.
- Failed replaced elements do not remain visibly behind the explicit error message.
- Unavailable and broken result nodes remain visibly distinct through existing copy and lifecycle color semantics.
- Browser evidence covers 1440x900, 920x760, and 375x812.

## Visual direction

- Visual thesis: fallback content is media content inside the node, not fixed screen-space copy floating over an overview.
- Content plan: node silhouette first, lifecycle border/status second, fallback message readable after zoom-in.
- Interaction thesis: zoom continuously scales fallback typography without adding motion or changing media state transitions.
