# Task: Canvas connection 后端持久化

## Task ID
T4-011

## Phase
Phase 4D — Canvas 与最终联调

## Category
Backend / Canvas Data

## Priority
P0

## Assigned To
Backend Executor

## Objective
为 Canvas 连线建立明确的 MySQL 数据模型和 CRUD API，使连接可通过 Navicat 查看并在刷新后恢复。

## Chosen Technology
FastAPI router/schema + SQLAlchemy model + Alembic revision + existing DatabaseStore pattern。

## Scope
- 允许新增：`backend/models/canvas_connection.py`、`schemas/canvas_connection.py`、`api/canvas_connections.py`、migration、tests。
- 允许修改：models/router/store 中仅为 connection 注册和 CRUD 所需部分。
- 禁止修改：前端、生成 API、Auth、其他 store 重构。

## Dependencies
T4-003 已审查通过。

## Implementation Requirements
1. 字段至少包含 id、project_id、source_node_id、source_port、target_node_id、target_port、status、metadata JSON、created_at、updated_at，并补齐表/字段备注。
2. endpoint 使用 `/projects/{project_id}/connections`，支持 list/create/update/delete。
3. source/target 必须存在且属于同一 project；禁止 self-loop；重复 edge 返回明确冲突。
4. 本轮允许有向图出现 cycle，不实现 DAG 调度；该语义写入 schema/技术说明。
5. 删除 node 时 connection 使用明确 cascade 或事务清理，并有测试。
6. 权限沿用 project ownership，跨用户和跨项目均拒绝。

## Acceptance Criteria
- [ ] CRUD、duplicate、self-loop、cross-project、permission、node cascade 均有 tests。
- [ ] SQLite 和 MySQL integration tests 通过。
- [ ] Navicat 可查看 connection 与 node/project foreign keys 和备注。
- [ ] 重启 backend 后连接仍存在。

## Verification Commands
```powershell
cd backend
python -m unittest discover -s tests -p "test_*connection*.py"
python -m unittest discover -s tests -p "test_*.py"
```

## Manual Acceptance
在一个项目创建三节点两连接，Navicat 核对 source/target/port；删除中间节点后验证关联连接清理。

## Deliverables
- Connection model/schema/router/store/migration/tests。
- `ai/tasks/doing/TASK-T4-011-PLAN.md`
- `ai/tasks/doing/TASK-T4-011-PROGRESS.md`
- `ai/reports/REPORT-T4-011.md`

## Codex Prompt
只实现 connection backend 数据边界，不做前端 pointer 交互或 DAG 执行。编码前创建 PLAN/PROGRESS；所有数据库备注和权限测试必须完成后写 REPORT。

