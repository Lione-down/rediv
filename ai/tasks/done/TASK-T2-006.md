# Task: 响应式验证（桌面端 + 375px 移动端）

## Task ID
T2-006

## Phase
Phase 2

## Objective
对 Home.vue、Workspace.vue、Space.vue 三个已迁移页面进行响应式验证，确保在桌面端和 375px 移动端均能正常展示，修复发现的布局断裂问题。

## Scope
- 修改的文件范围：
  - `frontend/src/views/app/Home.vue`（当前断点：1080px / 860px / 560px）
  - `frontend/src/views/app/Workspace.vue`（当前断点：920px）
  - `frontend/src/views/app/Space.vue`（当前断点：1040px / 760px）
  - 可能涉及的公共组件：`AppTopBar.vue`、`PromptComposer.vue`、`CanvasStage.vue`
- 不涉及的文件范围：后端代码、Admin 页面、新建页面

## Constraints
- 使用 Vue 3 + TypeScript + SCSS + Composition API + `<script setup>`
- 响应式断点需与 `ui/design-direction.md` 中定义的 375px 移动端基准对齐
- 不改变桌面端已有布局和行为
- 单模块任务：仅验证和修复现有页面的响应式问题，不新增功能
- 修改后必须 `npm run build` 通过

## Acceptance Criteria
- [ ] Home.vue 在 375px 宽度下布局合理（hero 纵向排列、无水平溢出、按钮可点击）
- [ ] Workspace.vue 在 375px 宽度下布局合理（工具栏底部化、面板折叠为抽屉、画布不溢出）
- [ ] Space.vue 在 375px 宽度下布局合理（hero 纵向排列、tab 横向滚动、grid 单列）
- [ ] 三个页面在 768px / 1024px 中等断点下无明显布局断裂
- [ ] 所有断点的过渡动画流畅（transition duration ≤ 200ms）
- [ ] `npm run build` 构建通过

## Deliverables
- `frontend/src/views/app/Home.vue` — 修复后的响应式样式
- `frontend/src/views/app/Workspace.vue` — 修复后的响应式样式
- `frontend/src/views/app/Space.vue` — 修复后的响应式样式
- `ai/reports/REPORT-T2-006.md` — 完成报告

## Codex Prompt
请执行以下任务：

1. 读取 `ai/state/CURRENT.md`、`ai/state/ROADMAP.md` 了解项目上下文
2. 读取 `ui/design-direction.md` 了解响应式规范
3. 依次读取 `frontend/src/views/app/Home.vue`、`Workspace.vue`、`Space.vue` 的 `<style scoped lang="scss">` 部分，检查现有的 `@media` 断点覆盖情况

对每个页面执行：
- 在 375px 宽度下检查：布局是否断裂、元素是否溢出、按钮是否可点击、文字是否可读
- 在 768px 宽度下检查：中等屏幕布局是否合理
- 发现问题的地方修复 SCSS 样式（调整 grid/flex 布局、断点阈值、overflow 处理）
- 保持桌面端布局不变

完成后执行 `cd frontend && npm run build` 验证构建通过，然后生成完成报告。
