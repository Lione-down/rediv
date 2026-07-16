# TASK-T5-079 - Canvas media containment and keyframe rail isolation

- State: `DONE - PASS`
- Objective: keep every image/video media root inside its canonical Canvas surface while preserving collision-aware video keyframe rail placement outside that surface.

## Scope

- Add a browser regression guard that measures media-root containment against its owning media surface.
- Remove video-keyframe placement styling from the shared image/video media root.
- Give the video keyframe rail explicit ownership of its own above/below placement state.
- Preserve native image/video rendering, selected-video frame capture, toolbar collision avoidance, zoom behavior, readonly behavior, and graph immutability.

## Non-goals

- No node/card collision-layout redesign, graph geometry change, persisted document mutation, backend/schema/provider change, generation parameter work, paid call, or secret access.
- No visual redesign of media cards or keyframe previews.

## Acceptance criteria

- The mixed image/video browser scenario fails on the pre-fix implementation because at least one media root escapes its owning surface, then passes after the fix.
- Image media roots remain fully contained by their owning `.canvas-node-surface.is-media` bounds.
- Moving a selected video's keyframe rail above or below never changes the video media-root bounds.
- Existing selected-video keyframe navigation, capture, toolbar clearance, compact/readonly behavior, and zero graph mutation remain green.
- Focused browser regression, related video-frame tests, production build, retained visual inspection, UTF-8, diff, file-size, and sensitive-path gates pass.

## Boundaries

- T5-062 and T5-063 remain authoritative for keyframe and contextual-toolbar behavior.
- T5-073 media-first geometry remains unchanged.
- User-owned `.hermes` plans and `output/` evidence remain excluded from staging.
