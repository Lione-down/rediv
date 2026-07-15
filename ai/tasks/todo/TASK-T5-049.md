# TASK-T5-049 - Captured-frame provenance and repeat capture loop

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-048 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Make captured image frames visibly traceable to their exact source video and time, then support a clear return-to-source loop for capturing multiple independent frames and combining them as ordered generation inputs.

## Scope

- Resolve captured-frame provenance only from valid canonical image asset metadata and an existing video source node.
- Show source video identity and capture time in the frame inspector.
- Provide keyboard-accessible source navigation through the existing desktop, compact, and readonly locate contract.
- Add a restrained Canvas source-video emphasis while a captured frame is selected.
- Verify returning to the source, seeking to another time, and capturing a second durable frame asset.
- Verify two captured frames remain independent and can participate together in ordered image/video composition.

## Non-goals

- Persistent frame strips, batch extraction, synthetic graph edges, generated-result lineage changes, backend frame processing, provider calls, or mobile editing.

## Acceptance criteria

- Valid provenance requires an image asset node, finite non-negative capture time, non-empty source video ID, and an existing video node.
- Malformed, missing, self-referential, non-video, or deleted sources expose no misleading provenance UI.
- The inspector displays source title and a stable `m:ss.SSS` capture time.
- Source navigation preserves graph history, selects the exact source, and reveals it without reopening compact drawers.
- Selecting a captured frame gives the source video one quiet, zoom-consistent Canvas emphasis without inventing a persisted edge.
- Returning to the source allows another frame capture; two captures create two distinct assets, URLs, nodes, times, and PNG byte payloads.
- The two frame nodes can form ordered media inputs for both image and video generation composition.
- Desktop, compact, and readonly mobile evidence cover provenance visibility and mutation boundaries.

## Visual direction

- Visual thesis: a captured frame should read as a reusable still with an inspectable origin, not as an unexplained duplicate image.
- Content plan: inspector carries exact identity and time; Canvas uses only a quiet source outline.
- Interaction thesis: locate source, seek, capture again, then combine existing frame nodes through normal Revid selection semantics.
