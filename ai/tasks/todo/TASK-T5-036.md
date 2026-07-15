# TASK-T5-036 - Intent-safe continuation affordance

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-035 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Keep the selected-node continuation affordance aligned with user-authored graph intent: source nodes may expose the quiet contextual `+`, while generation and result nodes retain their canonical typed connections without advertising misleading blank-result creation or duplicating dedicated result branching.

## Scope

- Add a registry-owned capability for the selected-node downstream continuation affordance.
- Enable the affordance only for canonical script and asset sources.
- Preserve port-drag compatibility, continuation chooser resolution, atomic commands, and dedicated image-result branching.
- Verify script, image asset, video asset, generation, image result, video result, note, group, locked, readonly, and multi-selection states.
- Capture desktop and compact visual evidence for representative mixed-node workflows.

## Non-goals

- Removing generation-to-result compatibility, changing provider result materialization, redesigning the chooser, adding new node types, copying AIGCCanvasFlow styling, or changing backend behavior.

## Acceptance criteria

- Selected script and asset nodes expose the existing accessible continuation action when canonical downstream options exist.
- Selected generation, result, note, and group nodes expose no generic continuation action.
- Port dragging continues to resolve canonical generation-to-result and result-to-generation compatibility where currently supported.
- Dedicated valid image-result branching remains available and readonly, locked, unsupported, and multi-selection boundaries remain unchanged.
- Focused and related Chromium checks, frontend build, desktop/compact screenshots, file-size, diff, and sensitive-path gates pass.
