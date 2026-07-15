# TASK-T5-034 - Foreground workflow reveal

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-033 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Keep newly created generation workflows visible when foreground composition or result branching places them beyond the current panel-safe viewport, without recentering, changing zoom, or making background graph changes move the camera.

## Scope

- Return the exact created generation node ID from successful selection composition and result branching.
- Reuse the existing panel-aware `revealNode` minimum-translation contract after the foreground command commits.
- Preserve new-node selection, inspector context, zoom, and current panel state.
- Keep already-visible creation, invalid/no-op actions, undo/redo, reload, and background reconciliation camera-neutral.
- Preserve foreground reveal for locally committed workflows even when later autosave fails and recovery remains active.
- Verify desktop dual-panel, 920px drawer, and 375px readonly boundaries.

## Non-goals

- Animated camera travel, automatic fit/center, store-level reveal events, reveal for duplicate/group/continuation commands, backend changes, or mobile editing.

## Acceptance criteria

- Offscreen multi-selection composition reveals exactly the created generation content rect using minimum panel-safe translation.
- Offscreen image-result branching uses the same contract.
- Zoom, selected generation, inspector, source graph, and command history remain unchanged except for the intended insertion and viewport translation.
- Already-visible foreground creation does not write a new viewport.
- Invalid/no-op actions, undo/redo, reload, and background task reconciliation do not reveal.
- Autosave failure keeps the locally inserted workflow visible and recoverable without claiming backend commit.
- Desktop and 920px compact insets are honored; 375px readonly exposes no mutation.
- Build, focused/related Chromium, visual, UTF-8, file-size, diff, and sensitive-path gates pass; any unrelated full-suite performance variance is classified with exact evidence.
