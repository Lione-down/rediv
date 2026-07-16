# REPORT-T5-077 - Truthful durable generation progress

## Result

`DONE - PASS`

Generation tasks now carry an additive, backward-compatible durable stage/percentage contract. Image work remains honestly indeterminate when the provider exposes no percentage; video accepts only finite, bounded, monotonic provider progress; persistence is explicit; and `100%` becomes visible only with durable success.

## Delivery

- MySQL revision `e1f2a3b4c5d6` adds nullable, commented `progress_percent` and `progress_stage` fields with exact range and stage constraints. Upgrade and downgrade are proven on disposable schemas only.
- Shared backend normalization permits only `queued`, `provider`, and `persisting`, rejects invalid values, and preserves the last truthful percentage/stage on missing, null, regressing, failed, or timed-out updates.
- Image generation moves through provider and persisting with no fabricated percentage. Video polling adopts valid provider percentage from supported response shapes. Durable completion writes `100` in the same asset/task/quota/ledger transaction.
- Task schemas, API serializers, duplicate serializers, and frontend task types preserve nullable compatibility with legacy rows and stale backends.
- Card, Inspector, run history, Graph Access, and asset task summaries use one runtime presentation. The existing 128 px card geometry retains one 3 px progress slot; native DOM progress exposes determinate/indeterminate semantics without announcing every poll tick.
- Active progress remains a transient projection: no Canvas document/history/selection/camera write, quota change, asset/result creation, retry, or duplicate provider request occurs on progress ticks.

## Verification

| Gate | Result |
|---|---|
| Migration upgrade/comments/checks/legacy-null/downgrade | PASS |
| Focused backend progress/transaction/provider | PASS, 40 plus 13 subtests; post-split 29 plus 7 subtests |
| Full backend | PASS, 463 plus 78 subtests |
| Focused progress browser | PASS, 4/4 |
| Prior full Chromium | 348/349; sole performance variance reproduced on unchanged T5-076 HEAD under concurrent emulator load |
| Fresh owned 200-node/300-connection supervisor | PASS, `t5008-29792-2be44ea57c5f02c4` |
| Performance | PASS, 204 ms stable render, 59.85 FPS, 16.8 ms frame p95, 0.1 ms pointer p95, 0 long tasks |
| Production frontend build | PASS, 4,837 modules |
| Alembic/compile/diff/file-size | PASS; head `e1f2a3b4c5d6` |

The full Chromium diagnostic initially found nine stale T5-075 fixture expectations; each failed set passed after fixture alignment. Its remaining performance-only failure was classified with a detached unchanged-HEAD comparison and then cleared by the canonical owned supervisor. A later 10-minute full-suite retry reached its test-runner timeout without assertion output, so it is not claimed as a separate complete full run.

## Visual evidence

- `output/playwright/t5-077-generation-progress/image-indeterminate-1440x900.png`
- `output/playwright/t5-077-generation-progress/video-persisting-1440x900.png`
- `output/playwright/t5-077-generation-progress/failure-preserved-920x900.png`
- Live summary: `output/playwright/t5-008-live/t5008-29792-2be44ea57c5f02c4/summary.json`

## Explicit boundaries

- No paid provider call, real secret access, user/runtime migration, cancellation transport, new worker, WebSocket/SSE, or graph-persisted progress.
- Real Agnes intermediate percentage availability remains unverified. Indeterminate progress is the tested release behavior when percentage is absent or invalid.
- T5-078 exclusively owns pending output projection and exact terminal result placement handoff.
