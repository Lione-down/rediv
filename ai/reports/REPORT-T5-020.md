# REPORT-T5-020 - Direct Edge Selection And Typed Rerouting

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `9c121fc2293515a4ec27f26bbf3f7eb897acace3`
- Scope: direct persisted-edge selection and same-ID endpoint rerouting

## Delivered outcome

Persisted Canvas edges are now directly editable without becoming permanent visual chrome. Each thin visible edge has a separate 16px transparent hit path. Pointer or keyboard selection highlights only the chosen edge and reveals two zoom-stable endpoint handles. Accessible edge labels use node titles instead of internal IDs.

Dragging either endpoint to a compatible typed port dispatches one `reconnect-connection` command. The command revalidates registry ports, locked/grouped/unsupported nodes, same-node loops, unchanged endpoints, and duplicates. A successful reroute updates the same connection ID and preserves metadata, status, and active state, producing one autosave upsert and one undo/redo history entry.

Empty or incompatible release, same-node and duplicate targets, Escape, pointer cancellation, outside-Canvas release, and readonly mode do not mutate the graph. Existing Graph Access selection and Delete/Backspace behavior continue to use the same selected-connection contract.

## Verification evidence

- Command contract: PASS, 10/10.
- Edge reroute browser suite: PASS, 5/5.
- Relevant autosave, history, continuation, generation context, graph commit, topology, and geometry regression: PASS, 57/57.
- Full Chromium after passive-edge contract update: PASS, 173/173.
- Current-source post-accessibility focused suite: PASS, 28/28.
- Frontend build: PASS, 4,789 modules transformed.
- Visual evidence: `output/playwright/t5-020-edge-reroute/selected-edge-920x900.png`, manually reviewed.
- Hygiene: strict UTF-8 PASS, changed files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Visual assessment

Idle edges remain hairline-thin and low contrast. Selection uses a single violet line plus two small endpoint rings, with no card, floating toolbar, or modal layer. The transparent hit path improves precision without changing appearance, and pointer focus no longer leaves a white SVG bounding rectangle. Keyboard focus retains a restrained accent stroke.

## Safety and contract notes

- No backend, database, migration, quota, provider, secret, paid API, or destructive operation changed.
- Node insertion into an existing edge, multi-edge selection, and Canvas engine changes remain explicit non-goals.
- The user-owned retired-Hermes plan and local QA output remain unstaged.
