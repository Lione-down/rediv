# TASK-T2-004 Plan

## Task ID

TASK-T2-004

## Objective

将 `frontend/src/views/admin/` 下的 Admin 页面从占位骨架迁移为统一的后台管理界面，完成 `AdminLayout`、`Dashboard` 以及 `Users`、`Invitations`、`Quotas`、`Assets`、`Tasks` 的基础管理台布局，并对齐 `ui/design-direction.md` 的浅色 OKLCH 设计方向。

## Scope

- `frontend/src/views/admin/AdminLayout.vue`
- `frontend/src/views/admin/Dashboard.vue`
- `frontend/src/views/admin/Users.vue`
- `frontend/src/views/admin/Invitations.vue`
- `frontend/src/views/admin/Quotas.vue`
- `frontend/src/views/admin/Assets.vue`
- `frontend/src/views/admin/Tasks.vue`
- `ai/tasks/doing/TASK-T2-004-PROGRESS.md`
- `ai/reports/REPORT-T2-004.md`

## Constraints

- 只处理当前任务要求的 Admin 前端页面，不改后端、路由配置和其他 App 页面。
- 保持 Vue 3 + TypeScript + SCSS + `<script setup>` 现有模式。
- 不引入新依赖，优先复用 `useAuthStore`、`useAssetStore` 和现有 design tokens。
- 页面数据以 mock 和 store 当前值为主，真实接口联调留给后续任务。

## Implementation Steps

1. 读取任务文档、`xq/progress.md`、`ui/design-direction.md`、现有 Admin 页面和相关 store，确认布局、数据和响应式要求。
2. 重构 `AdminLayout.vue`：完善侧边导航、顶部说明区、hover/active 动效和移动端横向导航。
3. 重构 `Dashboard.vue`：接入 `useAuthStore`，补齐管理员信息、四个指标卡片和辅助状态区。
4. 重构 `Users`、`Invitations`、`Quotas`、`Assets`、`Tasks`：统一页面头部、状态摘要和表格或卡片骨架。
5. 运行 `cd frontend && npm run build`，确认构建通过后更新进度文档与完成报告。

## Success Criteria

- `AdminLayout`、`Dashboard` 与五个子页都统一使用浅色 OKLCH tokens，并且风格一致。
- 桌面端布局稳定，`<=760px` 时导航变为顶部横向滚动，内容仍可阅读。
- Dashboard 至少显示四个指标卡片，其他页面具备可继续联调的结构化骨架。
- `npm run build` 通过。
