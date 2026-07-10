# Task: Home 项目/资产概览页重构

## Status

- State: `DOING`
- Owner: Codex Project Lead Engineer

## Task ID
T4-008

## Phase
Phase 4C — 前端视觉与页面

## Category
Frontend / Project Dashboard

## Priority
P1

## Assigned To
Codex Project Lead Engineer

## Objective
把当前营销型 Home 改为个人项目工作台，真实展示 MySQL 中的项目、最近资产、额度和快捷入口。

## Chosen Technology and Components
- Vue 3 + Pinia + domain module。
- Naive UI：`NCard`、`NGrid`、`NEmpty`、`NSkeleton`、`NButton`、`NDropdown`、`NModal`。
- 项目 domain 新增 `frontend/src/modules/project/api.ts`、`types.ts`、`store.ts`；资产复用现有 asset store。

## Scope
- 允许修改：`frontend/src/views/app/Home.vue`、相关路由入口。
- 允许新增：`views/app/components/home/**`、`modules/project/**`。
- 允许按真实数据契约最小修改：`frontend/src/api/assets.ts`、`frontend/src/store/assets.ts`、`frontend/src/types/asset.ts`，仅用于移除伪造初值并补齐 loading、error、request single-flight 和 session reset 语义。
- 允许最小修改 `frontend/src/api/request.ts`，仅用于在 session 切换前同步绑定 mutating request 的 Authorization，防止跨账户 credential retarget。
- 必要时允许修复前端 API 路径与现有 backend `/projects`、`/assets` 对齐。
- 禁止修改：backend、Space、Workspace、Canvas。

## Dependencies
T4-003、T4-006、T4-007 已完成。

## Implementation Requirements
1. 数据全部来自 project/assets/quota API，不保留伪造的 quickStarts 数值。
2. 支持项目列表、创建项目、进入 Workspace、最近资产和额度摘要。
3. loading、empty、error、partial data 状态均有 UI。
4. 页面组件拆分后 `Home.vue` 控制在 500 行以内，每个组件职责单一。
5. 导航进入 Workspace 时携带 project ID，不使用隐式 demo project。
6. 卡片、按钮、菜单使用 design tokens 和 Naive UI，不新增另一 UI library。

## Acceptance Criteria
- [ ] MySQL 中项目和资产与 Home 显示一致。
- [ ] 创建项目后列表即时更新，刷新后仍存在。
- [ ] 无项目、API 失败、额度为零均正确呈现。
- [ ] `npm run build` 通过。
- [ ] 1440×900、920px、375px 浏览器检查通过。

## Verification Commands
```powershell
cd frontend
npm run build
```

## Manual Acceptance
创建一个验收项目，在 Navicat 和 Home 双向核对 ID/name/created_at；截图记录正常、空状态和移动端。

## Deliverables
- Home 页面、局部组件、project module。
- `ai/tasks/doing/TASK-T4-008-PLAN.md`
- `ai/tasks/doing/TASK-T4-008-PROGRESS.md`
- `ai/reports/REPORT-T4-008.md`

## Codex Prompt
将 Home 从营销页改为真实个人工作台。禁止伪造数据和修改 backend。编码前维护 PLAN/PROGRESS；完成 MySQL 数据核对、build 和浏览器验证后写 REPORT。
