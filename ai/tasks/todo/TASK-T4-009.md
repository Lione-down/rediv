# Task: Space 个人资产页重构

## Task ID
T4-009

## Phase
Phase 4C — 前端视觉与页面

## Category
Frontend / Asset Workspace

## Priority
P1

## Assigned To
Frontend Executor

## Objective
将 Space 重构为暗色个人资产空间，使用真实资产、模板和额度数据，并拆分当前超大单文件。

## Chosen Technology and Components
- Vue 3 + 现有 asset store + template API/domain module。
- Naive UI：`NTabs`、`NCard`、`NImage`、`NTag`、`NPagination`、`NEmpty`、`NDrawer`。

## Scope
- 允许修改：`frontend/src/views/app/Space.vue`、现有 asset API/store/types。
- 允许新增：`views/app/components/space/**`、`modules/template/**`。
- 禁止修改：backend、Home、Workspace、Canvas、global tokens。

## Dependencies
T4-003、T4-006 已审查通过。

## Implementation Requirements
1. Tabs 至少覆盖 assets/templates/quota overview，数据来自真实 API。
2. 资产支持 type filter、分页、查看详情和进入所属项目；删除沿用现有权限语义。
3. 图片/视频/prompt 使用不同可访问预览组件；URL 加载失败有 fallback。
4. `Space.vue` 控制在 500 行以内，列表、筛选、详情拆为局部组件。
5. loading、empty、error、pagination boundary 状态明确。
6. 保持 v3 暗色视觉，不重新发明主题 tokens。

## Acceptance Criteria
- [ ] Navicat 中 asset/template 数据与页面列表、筛选和总数一致。
- [ ] 详情、软删除/隐藏后的刷新行为符合 API 语义。
- [ ] `npm run build` 通过。
- [ ] 1440×900、920px、375px 浏览器检查通过。
- [ ] Space.vue 不超过 500 行。

## Verification Commands
```powershell
cd frontend
npm run build
```

## Manual Acceptance
至少用 prompt/image/video 三类资产验收筛选、预览和失败 fallback；记录截图路径及 Navicat 对照记录。

## Deliverables
- Space 页面、局部组件、template module 调整。
- `ai/tasks/doing/TASK-T4-009-PLAN.md`
- `ai/tasks/doing/TASK-T4-009-PROGRESS.md`
- `ai/reports/REPORT-T4-009.md`

## Codex Prompt
只重构 Space/资产域，复用 design system 和真实 API。编码前创建 PLAN/PROGRESS；完成 build、浏览器和 Navicat 数据核对后写 REPORT。

