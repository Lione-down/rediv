# TASK-T5-066 Plan

- State: `DONE - PASS`
- Objective: make valid generated-video results directly operable through native controls inside Canvas nodes while keeping playback capability separate from canvas-readable frame extraction.

## Diagnostic gate

- Compare the same deterministic video in `CanvasNodeMedia` and the project asset panel.
- Record media error, ready/network state, pause/time/duration/dimensions, current source origin, and active `crossOrigin` mode without exposing signed URLs.
- Exercise programmatic play and real pointer/keyboard control ownership.
- Cover CORS-readable, cross-origin no-ACAO, invalid content, 403/404, and second-load failure fixtures.
- Name one confirmed file/condition before production edits.

## Hypotheses

1. `crossorigin="anonymous"` makes an otherwise browser-playable no-ACAO remote video fail inside the node.
2. Canvas event ownership intercepts native video controls even when decoding succeeds.
3. The media URL or response is itself unavailable, expired, unsupported, or range-incompatible.

## Scope and invariants

- Keep native controls and current graphite media-first Canvas styling.
- Permit at most one classified CORS-to-playback fallback if hypothesis 1 is proven.
- Expose frame capture/keyframes only when the active media load is canvas-readable.
- Preserve selection, pan/zoom, lineage, reload, comparison, result persistence, compact review, and explicit unavailable states.
- Use deterministic browser fixtures only; no real or paid Agnes call.

## Delivery sequence

1. Inspect media rendering, event ownership, frame extraction, asset panel, and fixture contracts.
2. Add a diagnostic browser specification and reproduce the failure before source changes.
3. Implement only the confirmed fix and explicit playback/canvas-readability state.
4. Verify pointer and keyboard play, pause, seek, volume, time progression, failure bounds, reload, and responsive layouts.
5. Run related regressions, build, visual inspection, diff/hygiene review, documentation, commit, and push.

## Acceptance evidence

- Focused Chromium proves real user control operation, no graph gesture leakage, and one-shot fallback behavior when applicable.
- CORS-readable media retains keyframes and frame capture; playback-only media hides those actions without becoming an error.
- Invalid and failed media never enter a fallback loop or misleading playable state.
- Desktop 1440x900, compact 920x900, and readonly 375x812 are visually inspected and bounded.
