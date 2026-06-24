# TASK-T2-007 Plan

## Goal

在不改变现有视觉表现的前提下，把 `ui/design-direction.md` 中约定的全局设计 tokens 补齐到前端样式变量，并把首页、工作流页、个人空间页及必要公共组件中的硬编码值替换为变量引用。

## Scope

- `frontend/src/assets/styles/variables.scss`
- `frontend/src/assets/styles/global.scss`
- `frontend/src/views/app/Home.vue`
- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/Space.vue`
- 按需处理：
  - `frontend/src/components/layout/AppTopBar.vue`
  - `frontend/src/components/common/PromptComposer.vue`
  - `frontend/src/components/canvas/CanvasStage.vue`
- `ai/reports/REPORT-T2-007.md`

## Steps

1. 对比 `ui/design-direction.md` 与 `variables.scss`，补齐 spacing、radius、font、shadow token，并为新增 token 添加用途注释。
2. 调整 `global.scss`，让全局字体栈切到 `--font-family`，保留现有视觉表现。
3. 在 `Home.vue`、`Workspace.vue`、`Space.vue` 中替换 design token 范围内的硬编码 spacing、radius、字体与可复用颜色值。
4. 在必要公共组件中做同类替换，避免页面仍依赖硬编码值。
5. 运行 `cd frontend && npm run build` 验证构建。
6. 生成 `REPORT-T2-007.md` 并同步进度文档。

## Success Criteria

- `variables.scss` 含设计文档要求的 token，并附带清晰注释。
- 目标页面中常见的 `4/8/12/16/24/32/999px` 与可复用色值已替换为 `var(...)`。
- 全局字体栈与设计文档一致。
- `npm run build` 通过。
