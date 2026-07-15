# TASK-T5-048 - Video current-frame reuse as Canvas image input

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-047 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Turn the current frame of a selected playable video node into a durable project image asset and a canonical Canvas image-source node that can immediately participate in multi-node image or video generation.

## Scope

- Expose one restrained current-frame capture action on selected editable video surfaces.
- Capture the decoded video frame at the current playback time without external or paid calls.
- Upload the PNG through the existing project asset boundary.
- Insert a collision-aware image asset node carrying source-video and capture-time provenance.
- Select and reveal the inserted frame node while retaining normal undo, autosave, and reload behavior.
- Verify the captured image can join text/image multi-selection composition for both image and video workflows.

## Non-goals

- Full frame-strip generation, batch extraction, transcoding, backend video processing, generated-result lineage reinterpretation, audio extraction, mobile editing, or paid provider execution.

## Acceptance criteria

- The action appears only for a selected, editable, decoded video media node.
- Capture uses the video's current time and intrinsic dimensions and uploads a non-empty PNG.
- Upload failure, tainted canvas, decode failure, and stale project/canvas context do not insert a node and surface an accessible error.
- Success inserts exactly one canonical image asset node near the source without overlap and records source node ID plus capture time.
- The new node is selected, visible, undoable in one graph history boundary, autosaved, and reload-stable.
- The frame asset participates in canonical multi-selection image and video generation requests as an ordered image reference.
- Desktop and compact browser evidence show a quiet selected-video action and the resulting frame node; readonly mobile exposes no mutation action.

## Visual direction

- Visual thesis: frame reuse is a contextual continuation of video review, not a permanent film-editing panel.
- Content plan: video remains primary; a small capture affordance appears only when the node is selected and ready.
- Interaction thesis: seek with native controls, capture the exact current frame, then continue through existing Canvas composition semantics.
