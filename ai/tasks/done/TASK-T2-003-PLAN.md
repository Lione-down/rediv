# TASK-T2-003 Plan

## Task ID

TASK-T2-003

## Objective

将 `frontend/src/views/app/Space.vue` 从简化骨架迁移为完整的个人空间页，对齐 `ui/revid-space.html` 的信息结构，并遵循 `ui/design-direction.md` 的浅色 OKLCH 设计系统。

## Scope

- `frontend/src/views/app/Space.vue`
- `ai/tasks/doing/TASK-T2-003-PROGRESS.md`
- `ai/reports/REPORT-T2-003.md`

## Constraints

- 只处理当前任务要求的个人空间页，不改后端与其他前端页面。
- 顶栏必须复用 `AppTopBar.vue`。
- 保持 Vue 3 + TypeScript + SCSS + `<script setup>` 现有风格。
- 不引入新依赖，优先复用已有 store 与 tokens。

## Implementation Steps

1. 基于任务文档、`ui/revid-space.html` 和 `ui/design-direction.md` 整理页面分区与交互结构。
2. 重构 `Space.vue`：实现 hero、额度统计、入口导航、section-switcher 和四个子页面骨架。
3. 使用 `useAuthStore` / `useAssetStore` 生成页面展示数据，补齐空状态和 mock 内容。
4. 完成浅色主题样式、hover/active 反馈、首次加载与 tab 切换动画，以及移动端断点布局。
5. 执行 `cd frontend && npm run build`，然后更新进度文档与完成报告。

## Success Criteria

- 页面结构与任务验收项一致，四个 tab 和导航卡片都可切换内容。
- 样式遵循浅色 OKLCH tokens，无深色原型残留。
- 桌面端与 `<=760px` 布局都合理，构建通过。
