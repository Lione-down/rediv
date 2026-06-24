# TASK-T3-007 Plan

## Goal

为 Agnes 前端生成链路补齐任务状态反馈，包括节点运行/成功/失败视觉状态、生成按钮 loading 与失败提示，以及额度不足预警。

## Scope

- 修改 `frontend/src/store/canvas.ts`
- 修改 `frontend/src/components/canvas/CanvasStage.vue`
- 修改 `frontend/src/views/app/Workspace.vue`
- 如接入 Naive UI Message Provider 确有必要，可补充最小范围应用入口修改
- 生成 `ai/reports/REPORT-T3-007.md`

## Implementation Steps

1. 阅读当前 `CURRENT`、任务文档、UI tokens 和前端现状，确认已有未提交改动与任务目标的差距。
2. 增强 `canvas store`，补齐节点状态更新方法与必要的节点查询/响应式更新能力。
3. 完善 `CanvasStage.vue` 的状态表现，覆盖 `running`、`success`、`warning` 三种节点视觉反馈和轻量动效。
4. 在 `Workspace.vue` 接入生成按钮状态管理、quota 预警、成功/失败提示，并将操作结果同步到 `canvas store`。
5. 运行前端构建验证；若可行，再做桌面端与移动端检查，最后补齐报告与进度文档。

## Success Criteria

- 生成动作开始时按钮进入 loading，节点进入 `running`
- 成功后节点切换为 `success`，失败后切换为 `warning`
- quota 不足时能阻止请求并显示明确预警
- 前端 `npm run build` 通过
- 文档、进度和完成报告齐全
