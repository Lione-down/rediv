# REPORT-T5-078 - Pending output reservation and exact result handoff

## Result

`DONE - PASS`

Active image and video generation now reserves the exact collision-aware result position immediately, mirrors the authoritative runtime stage and truthful optional percentage, and hands that position to the existing canonical result command only after durable success.

## Delivery

- One pure resolver owns canonical image/video result geometry and existing vertical collision scanning for both prediction and final materialization.
- Local submission projects immediately. Strict queued/running durable tasks replace or reconstruct the reservation after discovery or reload without duplication.
- Stable task ordering plus virtual occupancy keeps concurrent recovered runs in deterministic, non-overlapping slots even when API order or progress values change.
- `CanvasPendingGenerationLayer.vue` is a quiet graphite world-space overlay with existing warning/text tokens, a neutral media identity, truthful stage/percentage, a 3 px track, and static reduced-motion behavior.
- The reservation is `aria-hidden` and pointer-passive, with no graph/minimap/Graph Access identity, port, control, selection, context menu, keyboard stop, autosave, or history representation.
- Success removes the transient reservation and inserts the existing one-node/one-edge canonical result at the same coordinates in one reconciliation turn. Existing selection, Inspector, V ordering, lineage, comparison, branching, undo, and panel-safe reveal behavior remain intact.
- Failure and timeout remove the projection without an asset/result/edge caused by the projection. Existing terminal source-state reconciliation remains the only document-side lifecycle write.

## Verification

| Gate | Result |
|---|---|
| Focused pending placement/projection/browser | PASS, 6/6 |
| Related placement/reveal/result/lineage/progress | PASS, 36/36 |
| Full backend | PASS, 463 plus 78 subtests |
| Full Chromium diagnostic | 353/355; classified one pre-existing recipe timing assertion and one external-load FPS variance |
| Functional Chromium matrix | PASS, 354/354 excluding the separately certified 200/300 threshold case |
| Compact recipe timing correction | PASS, detached `5e99f74` reproduction plus repeat 4/4 and full-matrix pass |
| Fresh owned 200-node/300-connection supervisor | PASS, `t5008-3904-186ebbc9447b2bb7` |
| Performance | PASS, 204 ms stable render, 59.87 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 0 long tasks |
| Production frontend build | PASS, 4,841 modules |
| Alembic/UTF-8/diff/file-size/sensitive paths | PASS; single head `e1f2a3b4c5d6` |

The all-in Chromium diagnostic first exposed an old compact recipe assertion that incorrectly demanded zero camera writes from a `选择并定位` action. The same exact `x=120, y=38, zoom=1` panel-safe reveal reproduced on detached unchanged T5-077 HEAD. The test now accepts only the two valid outcomes: no write when already safe, or one exact reveal write. The diagnostic's performance-only failure occurred while two user-owned `Ld9BoxHeadless` processes held roughly 30% total CPU; no threshold was relaxed, and the canonical fresh supervisor passed all certified metrics.

## Visual evidence

- `output/playwright/t5-078-pending-result/image-pending-2048x1080.png`
- `output/playwright/t5-078-pending-result/image-result-handoff-2048x1080.png`
- `output/playwright/t5-078-pending-result/video-recovered-375x812.png`
- `output/playwright/t5-078-pending-result/dense-active-slots-1440x1300.png`
- Live summary: `output/playwright/t5-008-live/t5008-3904-186ebbc9447b2bb7/summary.json`

## Explicit boundaries

- No backend/schema/provider change, paid call, real secret access, user/runtime migration, persistent ghost node, cancellation transport, new worker, WebSocket, or SSE.
- Visual asset recipes retain their backend-owned fixed `1024x768` output. Ordinary ratio controls never enter the recipe request path.
- Real Agnes intermediate progress remains unverified. Missing or invalid provider percentage remains honestly indeterminate.
