# TASK-T5-030 - Selection composition output validation

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-029 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make multi-selection composition intent legible before creation and prove that workflows created from selection produce correct image/video results or honest durable failures end to end.

## Scope

- Show exact included prompt/reference counts in the compose menu.
- Describe video semantics as text-to-video, img2vid, or ordered keyframes from the verified selection.
- Extend the shared mock browser boundary with scoped image and playable-video success responses.
- Bind success and failure tasks to the actual composed generation node and media type.
- Execute selection-created image and video workflows and verify provider payload, quota, task, result node, edge, lineage, media presentation, reload, and run history.
- Verify failure creates no result and does not debit quota or retry.

## Non-goals

- Paid provider calls, immediate execution inside the compose menu, real video synthesis, backend changes, retry/cancel controls, or mobile editing.

## Acceptance criteria

- Compose menu counts exactly match the selected sources that enter the authoritative request.
- Video copy distinguishes zero, one, and multiple image references without implying unsupported behavior.
- Image and video requests contain the exact composed prompt and ordered image IDs.
- Successful mock tasks/assets preserve project, Canvas, node, media, model, and task identity and materialize one canonical playable result.
- Reload preserves result lineage and history; no duplicate result is created.
- Failure remains durable on the composed node, creates no result, consumes no quota, and emits one provider request.
- Desktop, 920px compact, and 375px readonly behavior remain bounded.
- Focused/relevant/full Chromium, build, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
