# TASK-T5-069 - Canvas single-active video playback

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-068 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Objective

Prevent overlapping audio and competing motion when creators review multiple video nodes or a video result family. Starting one Canvas media preview must pause every other active `CanvasNodeMedia` instance while preserving native playback state and controls.

## Product direction

- Runway keeps playback ownership in the actively reviewed output.
- Figma prototypes and embedded media treat the current preview as the interaction owner.
- Professional NLE source/program monitors avoid two simultaneous audible previews during inspection.
- Revid will coordinate only its Canvas media surfaces, retaining native controls and persisted node independence.

## Scope

- Coordinate playback among all mounted `CanvasNodeMedia` instances in one browser document.
- Cover ordinary Canvas video nodes and comparison-tray video duplicates.
- Preserve current time, volume, mute, keyboard controls, CORS-readable/playback-only capability, frame capture, and explicit failures.

## Non-goals

- Autoplay, automatic mute, audio mixing, global app media control, Asset panel changes, timeline editing, provider calls, graph mutations, or schema changes.

## Acceptance criteria

- Playing video B pauses already-playing video A without rewinding either video.
- Playing a comparison-tray preview pauses its background Canvas counterpart, and later resuming the background pauses the tray preview.
- Paused, ended, unavailable, broken, and unmounted media remain stable.
- Keyboard Space/K playback participates in the same ownership contract.
- Playback coordination creates no document or viewport PATCH.

## Verification

- Add focused Chromium RED coverage with two playable video result nodes and tray/background duplication.
- Run video playback, result comparison, mixed-scenario, captured-frame, build, visual, diff, file-size, and sensitive-path gates.
