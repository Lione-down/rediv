# PMC REVIEW — T4-010 Revision 41 Review Lifecycle Authorization

## Verdict

`PMC_CONTINUATION_APPROVED — REVIEW_DISPATCH_ONLY`

Revision 41 的 business execution 已在 `REPORT_READY` 停止。现有 REPORT、actual diff、fresh build、hash 与 PNG 检查未发现必须在 Independent Review 前直接收口的明确 Acceptance Criterion failure；本结论只授权 Independent Review 与其依赖的 HANDOFF stage，不是 `PMC_PASS`，也不授权再次执行或修改业务代码。

## Evidence Reviewed

- Task：`ai/tasks/todo/TASK-T4-010-UNIT-B-REV41.md`
- Unit A REPORT：`ai/reports/REPORT-T4-010-UNIT-A.md`
- Revision 41 REPORT：`ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Executor：`t_d8bc9535` run `#167`，terminal `blocked (review-required)`
- Actual business diff 仅涉及 `frontend/src/views/app/Workspace.vue` 与 `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`。
- 三个 protected Workspace component SHA256 与 Task 完全一致。
- 六张 revision 41 PNG 均存在；实际 IHDR 尺寸、bytes 与 SHA256 匹配 REPORT。PMC 只读视觉核验未见 `920x900` 或 `375x812` drawer 与 Prompt Dock 重叠，drawer 关闭后 Prompt Dock 恢复。
- Fresh PMC `npm run build`：exit `0`，4634 modules。
- Fresh scoped/full `git diff --check`：exit `0`。

## Independent Review Requirements

Reviewer 必须把 Unit A、revision 41 与 master `T4-010` 作为同一最终验收链独立验证，不能只接受 Executor 自证。至少复核：

1. actual diff ownership、五个 Workspace 文件 line count、typed props/emits，以及 CanvasStage、CanvasStore、router、API、backend 与 global tokens 无越界修改；
2. fresh `npm run build` 与 scoped/full `git diff --check`；
3. 使用真实 `browser_set_viewport` 在 `1440x900`、`920x900`、`375x812` 复跑 viewport read-back、overflow、drawer open/close、Prompt action、keyboard、focus-visible、ARIA、reduced-motion、console 与 failed network 检查；
4. 用数值 geometry 或等价可复核 evidence 证明 drawer 与 Prompt Dock 无重叠，并证明 drawer 关闭后 Prompt action 可见、可聚焦、可操作；
5. 在缺少 `project_id` 的真实 interaction 中确认 generation endpoint request 数为 `0`，本地提示清晰；不得使用 secret、生产数据或伪造 success；
6. `NButton` resolution warning 消失，selected node、quota、loading、success/error、asset prepend、endpoint 与 payload contract 保持；
7. REPORT、PLAN、PROGRESS、PNG、revision/attempt/card 与 actual behavior 一致。

任一必需项无法真实复跑时不得返回 PASS；必须返回 `REWORK` 或 `BLOCKED`，附稳定 failure fingerprint、复现步骤与解除条件。由于 revision 41 已使用唯一 business REWORK attempt `1`，Reviewer failure 不授权 attempt `2` 或自动 continuation。

## Approved Lifecycle Revision

- Queue revision：`phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1`
- Action：`REVIEW_DISPATCH_ONLY`
- Coordinator profile：`revid-pm`
- Review profile：`revid-reviewer`
- Task：`ai/tasks/todo/TASK-T4-010-UNIT-B-REV41.md`
- REPORT：`ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Review output：`ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- HANDOFF output：`ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md`
- Coordinator budget：`180s`
- Reviewer budget：`1800s`
- HANDOFF budget：`180s`
- Process policy：每张 card initial run 加最多一次 process retry；不得转化为 business retry。

## Fresh Idempotency Keys

```text
revid:phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1:T4-010:review-dispatch
revid:phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1:T4-010:review:0
revid:phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1:T4-010:handoff:0
```

## Stop Condition

`T4_010_HANDOFF_READY_REV41`

只有 Independent Reviewer verdict 为 PASS，且 HANDOFF stage 完成 revision/attempt/card/evidence consistency checks 后，才允许写 canonical HANDOFF 并返回 PMC 最终验收。不得启动下一 Task。
