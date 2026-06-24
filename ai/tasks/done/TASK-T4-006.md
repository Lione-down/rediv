# Task: 暗色 design system 与 Naive UI provider

## Task ID
T4-006

## Phase
Phase 4C — 前端视觉与页面

## Category
Frontend / Design System

## Priority
P0

## Assigned To
Frontend Executor

## Objective
把 v3 的暗色、品牌色和布局规则固化为可复用 design system，并正确配置 Naive UI 全局暗色主题和反馈 providers。

## Chosen Technology
Vue 3 + TypeScript + Naive UI `NConfigProvider`/`darkTheme`/`GlobalThemeOverrides` + SCSS tokens。

## Scope
- 允许新增：`ui/design-system.md`、`frontend/src/assets/styles/naive-theme.ts`。
- 允许修改：`App.vue`、`main.ts`、`variables.scss`、`global.scss`、`style.css`、`index.html`。
- 禁止修改：业务页面布局、Canvas 行为、backend。

## Dependencies
无。可与 T4-001 并行。

## Implementation Requirements
1. `NConfigProvider` 必须在 Vue template 中包裹应用，传入 `darkTheme` 和 typed `themeOverrides`；禁止 `app.use(NConfigProvider, ...)`。
2. Provider 层同时提供 message、dialog、notification/loading 所需上下文，避免页面重复挂载。
3. SCSS tokens 覆盖 background/surface/text/border/brand/status/radius/spacing/shadow/motion/z-index。
4. 主色固定 `#6347C2`，提供 hover/active/focus/disabled tokens。
5. 删除 Vite 默认 demo style 对 `#app` 宽度、居中和浅色主题的干扰。
6. `ui/design-system.md` 定义 1440×900 目标布局、76px 工具栏、320px 面板、Prompt Dock、节点状态和 responsive 规则。
7. 所有颜色满足基本可读性；focus-visible 和 reduced-motion 不得缺失。

## Acceptance Criteria
- [ ] `npm run build` 通过。
- [ ] Naive UI Button/Input/Drawer/Dropdown/Modal/Message 在暗色背景下统一使用品牌 tokens。
- [ ] 页面不再受到 Vite 默认 `#app` 1126px 限制。
- [ ] design system 有完整 token 表、组件状态和布局尺寸。
- [ ] 本任务不改业务页面结构或 Canvas 逻辑。

## Verification Commands
```powershell
cd frontend
npm run build
```

## Manual Acceptance
在本地浏览器渲染 provider smoke 页面或现有页面，检查 dark theme、focus、message/dialog 以及 1440×900 和 375px 背景行为；将截图路径记录在 REPORT。

## Deliverables
- Design system、theme overrides、provider 配置、global styles。
- `ai/tasks/doing/TASK-T4-006-PLAN.md`
- `ai/tasks/doing/TASK-T4-006-PROGRESS.md`
- `ai/reports/REPORT-T4-006.md`

## Codex Prompt
先读取 v3 视觉原则和现有 styles。只建立 design system 和 provider，不重写业务页面。编码前创建 PLAN/PROGRESS；用真实浏览器完成桌面/移动端视觉检查后写 REPORT。

