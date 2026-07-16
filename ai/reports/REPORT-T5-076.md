# REPORT-T5-076 - Runtime generation visibility

## Result

`DONE - PASS`

Generation requests now remain visibly continuous from the flushed local submit through durable queue, model execution, and terminal task state. The source generation card and Inspector share one transient projection while the Canvas graph remains free of poll-tick content, history, selection, and camera writes.

## Delivery

- `refreshTasksIfCurrent(projectId)` fetches only generation tasks, deduplicates concurrent reads, preserves mutation revisions, and leaves asset/template loading state untouched.
- One Canvas runtime owner performs quick local discovery, two-second active polling, bounded error backoff, and deterministic auth/project/Canvas/unmount cleanup.
- Local request state begins after the running-state PATCH is flushed and before the long provider-facing POST is awaited.
- Strict project, Canvas, source-node, and media matching ignores unrelated tasks. Existing task IDs are snapshotted at local start so an old terminal run cannot mask `正在提交`; the newest newly discovered durable task then wins.
- Card and Inspector labels are `正在提交`, `排队中`, `模型生成中`, `已完成`, `失败`, and `已超时`.
- Runtime stays outside serialized node content. The renderer diffs presentation keys and updates only changed generation nodes while retaining the existing card geometry.
- Successful and failed terminal reconciliation still uses the durable task/asset/result boundary. A task-list failure keeps an honest local indeterminate state and never fails, retries, or duplicates the long POST.
- Reloaded queued/running tasks resume polling after both task and Canvas node hydration, including compact readonly review.

## Verification

| Gate | Result |
|---|---|
| RED missing-runtime fingerprint | PASS |
| Focused runtime browser | PASS, 6/6 |
| History/result/presentation/store regression | PASS, 26/26 |
| Authenticated/resource/multi-origin/provenance/authoring regression | PASS, effective 38/38 after T5-075 fixture alignment |
| Production frontend build | PASS, 4,833 modules |
| Task-only network and in-flight deduplication | PASS |
| Active queued/running ticks: graph PATCH, asset/template reload, camera drift | PASS, zero |
| Held image/video POST count through poll failure | PASS, one each |
| Fresh owned 200-node/300-connection supervisor | PASS, `t5008-30864-168f3792dc34eace` |
| Performance | PASS, 183 ms stable render, 59.95 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 0 long tasks |
| File-size boundary | PASS, stage 500, Inspector 499, resource experience 413 lines |

## Visual evidence

- `output/playwright/t5-076-runtime-generation/running-background-1440x900.png`
- `output/playwright/t5-076-runtime-generation/recovered-readonly-375x812.png`
- Live summary: `output/playwright/t5-008-live/t5008-30864-168f3792dc34eace/summary.json`

## Explicit boundaries

- No backend, schema, migration, provider, quota, paid call, secret, or user/runtime data change.
- No progress percentage or provider-stage fabrication; durable stage/percent is T5-077.
- No pending result slot or output reservation; pending placement/result handoff is T5-078.
