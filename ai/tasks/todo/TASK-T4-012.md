# Task: Canvas 交互与前后端持久化联调

## Task ID
T4-012

## Phase
Phase 4D — Canvas 与最终联调

## Category
Frontend / Canvas Integration

## Priority
P0

## Assigned To
Frontend Executor

## Objective
完成节点和连线的真实加载/保存、连线 pointer 交互、双击新增、框选、右键菜单和 minimap，并拆分当前 1000+ 行 CanvasStage。

## Chosen Technology and Components
- Leafer UI 负责画布、坐标转换和 pointer events。
- Pinia canvas store 负责 server state/cache。
- Naive UI `NDropdown` 负责右键菜单，`NMessage` 负责保存失败反馈。
- domain API/types 放 `frontend/src/modules/canvas/`；Canvas 专用 composables 放 `components/canvas/composables/`。

## Scope
- 允许修改：CanvasStage、canvas store/types、Workspace 中 project integration。
- 允许新增：canvas domain API、connection layer、minimap、context menu、selection overlay、专用 composables。
- 禁止修改：backend contract、Auth、Home、Space、global design tokens。

## Dependencies
T4-010、T4-011 已审查通过。

## Implementation Requirements
1. route project ID 驱动 load nodes/connections；loading 完成前不覆盖 server data。
2. create/move/delete node 和 create/delete connection 持久化到 API；失败时回滚 optimistic state。
3. pointer 坐标统一经过 viewport/world conversion，zoom/pan 后连线命中仍正确。
4. 支持锚点拖线、双击添加、框选、多选、右键菜单和 minimap viewport。
5. save 使用 debounce 并在离开路由前 flush；禁止每个 pointermove 直接发请求。
6. CanvasStage.vue 控制在 500 行以内；render、interaction、viewport、persistence 职责拆分。
7. 键盘至少支持 Delete、Escape，输入框聚焦时不得误删节点。

## Acceptance Criteria
- [ ] 创建项目后新增/移动/连接节点，刷新页面完整恢复。
- [ ] API 失败时 UI 回滚并显示错误，不产生幽灵节点/连接。
- [ ] zoom 25%–200% 下锚点、框选和 minimap 正确。
- [ ] `npm run build` 通过。
- [ ] CanvasStage.vue 不超过 500 行，新增文件均职责清晰。
- [ ] 1440×900 和 375px 真实浏览器交互检查通过。

## Verification Commands
```powershell
cd frontend
npm run build
```

## Manual Acceptance
录制或截图证明新增节点、连线、框选、右键、刷新恢复；在 Navicat 核对 nodes/connections 与 UI 一致。

## Deliverables
- Canvas components/composables/store/API/types。
- `ai/tasks/doing/TASK-T4-012-PLAN.md`
- `ai/tasks/doing/TASK-T4-012-PROGRESS.md`
- `ai/reports/REPORT-T4-012.md`

## Codex Prompt
复用 Leafer UI，不引入第二 canvas engine。先拆职责再完成持久化交互，但禁止无关视觉重写。编码前维护 PLAN/PROGRESS；完成浏览器与 Navicat 双重验证后写 REPORT。

