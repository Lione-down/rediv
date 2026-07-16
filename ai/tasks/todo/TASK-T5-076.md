# TASK-T5-076 - Runtime generation visibility

- State: `DONE - PASS`
- Objective: make local submission plus durable queued/running/terminal generation state continuously visible on the source card and Inspector during successful long requests, without backend/schema or graph-document mutation.

## Scope

- Add task-only project refresh and one project-level polling owner with quick discovery, two-second active cadence, bounded error backoff, and deterministic lifecycle cleanup.
- Begin polling after the local running-state PATCH is flushed and before awaiting the long image/video POST.
- Resolve one runtime presentation per `canvas_node_id`, with local submission covering pre-discovery and the newest strict durable task becoming authoritative after discovery.
- Project runtime labels into the existing generation-card lifecycle slot and Inspector/run history without writing poll ticks to Canvas content, history, selection, or viewport.
- Add targeted renderer updates for changed generation-node IDs.
- Preserve final durable task/asset/result reconciliation and graceful fallback when polling fails.

## Non-goals

- No backend/schema/migration change, progress percentage, fabricated stage percentage, pending result slot, new worker/runtime, WebSocket/SSE, cancellation, provider call, secret access, or graph model change.
- No generation-node-to-media mutation and no full graph reconciliation on each task poll.

## Acceptance criteria

- Successful held image/video requests show `正在提交 -> 排队中 -> 模型生成中 -> 已完成/失败/已超时` from local plus durable state.
- Polling fetches tasks only, uses one project timer, continues safely through selection changes/background nodes, and stops on settlement/terminal/auth/project/Canvas/unmount transitions.
- Poll failures preserve the long POST and an honest local indeterminate state; final POST reconciliation still succeeds.
- Runtime ticks cause zero graph PATCH, zero undo entry, and zero selection/camera mutation.
- Renderer updates only affected generation nodes and keeps the existing 128px card plus 30px lifecycle geometry.
- Desktop, compact, readonly, refresh recovery, reduced motion, long localized copy, related browser suites, build, and owned 200/300 performance verification pass.

## Boundaries

- T5-077 owns durable `progress_stage` and `progress_percent` plus progress tracks.
- T5-078 owns non-persistent pending output placement and result handoff.
