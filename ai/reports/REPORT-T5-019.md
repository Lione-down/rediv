# REPORT-T5-019 - Reverse Typed Port Dragging

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `8bc3c65288d51b281d9f90471a017b3c09e9f4fe`
- Scope: input-origin reverse dragging and upstream typed continuation

## Delivered outcome

Canvas input ports are now first-class connection origins. Dragging an input backward to a compatible existing output creates the same canonical output-to-input edge as a forward drag. Releasing on empty Canvas space opens a compact upstream chooser filtered through the canonical node registry and the exact originating input port.

Choosing an upstream subtype creates one node to the left of the release point and one correctly oriented edge through a single `insert-graph` command. The mutation therefore remains one autosave PATCH and one undo/redo entry. Output-origin direct dragging and downstream continuation keep their existing behavior.

The draft path, compatibility overlays, pointer target lookup, chooser title/copy, keyboard behavior, cancellation, readonly boundary, viewport clamping, and reduced-motion treatment now share one directional model. No permanent toolbar or graph chrome was added.

## Verification evidence

- Pure and focused browser continuation suite: PASS, 12/12.
- Relevant command, history, graph commit, generation context, registry, geometry, and multi-scenario Chromium regression: PASS, 54/54.
- Full Chromium: PASS, 167/167.
- Frontend build: PASS, 4,786 modules transformed.
- Visual evidence: `output/playwright/t5-019-reverse-port-drag/upstream-continuation-1440x900.png`, manually reviewed.
- Hygiene: strict UTF-8 PASS, changed files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Visual assessment

The upstream chooser preserves the graphite media-workbench direction and uses violet only for the focused typed action. The menu remains subordinate to the graph, keeps registry-backed icons and labels, and appears only after a deliberate four-pixel drag. Reverse preview geometry reads left-to-right in canonical data-flow direction even though the pointer gesture began at the input.

## Safety and contract notes

- No backend, database, migration, quota, provider, secret, paid API, or destructive operation changed.
- Occupied-input replacement, edge rerouting/insertion, and Canvas engine changes remain explicit non-goals.
- Existing Canvas command history and autosave remain the only persistence boundary.
- The user-owned retired-Hermes plan and local QA output remain unstaged.
