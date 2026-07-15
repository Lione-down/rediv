# TASK-T5-069 Plan

- State: `DONE - PASS`
- Objective: make one Canvas video preview the sole active playback owner.

## Design thesis

- Visual thesis: keep native media-first surfaces unchanged; ownership is expressed by motion and sound, not new chrome.
- Content plan: the actively played node or tray card continues; every other Canvas preview pauses in place.
- Interaction thesis: native click and Space/K both acquire playback ownership without rewind, focus theft, or graph mutation.

## Delivery sequence

1. Add RED browser cases proving two node videos and tray/background duplicates can currently play together.
2. Add the smallest instance-scoped playback coordination contract inside `CanvasNodeMedia`.
3. Verify one active video, resume handoff, preserved times, keyboard behavior, unmount cleanup, failure behavior, and zero PATCH.
4. Run related regression, build, screenshot, fresh diff review, documentation, commit, and push.

## Invariants

- Browser user intent still starts playback; no autoplay is introduced.
- Losing ownership pauses only, never seeks, mutes, or reloads.
- Coordination stays within `CanvasNodeMedia`; graph and provider layers remain unaware.
- Existing CORS fallback and frame extraction capability remain unchanged.
