# TASK-T1-007 开发计划

## 目标

实现后端画布节点（CanvasNode）CRUD：创建、列表、详情、更新、删除，并保证节点严格归属当前用户自己的项目，兼容 SQLite 持久化与 InMemoryStore 双实现。

## 范围

- 新增 `backend/models/canvas_node.py`
- 新增 `backend/schemas/canvas_node.py`
- 新增 `backend/api/canvas_nodes.py`
- 更新 `backend/controllers/store.py`
- 更新 `backend/api/router.py`
- 更新 `backend/models/__init__.py`
- 新增 `backend/tests/test_canvas_node_crud.py`
- 新增 `ai/reports/REPORT-T1-007.md`

## 实施步骤

1. 阅读任务、状态文档、`xq/03_canvas_node_system.md`、`xq/04_canvas_frontend.md` 与现有项目 CRUD 实现，确认字段、权限和排序要求。
2. 创建 `CanvasNode` SQLAlchemy 模型与对应 Pydantic schema，保持时间字段、JSON 字段和命名风格与现有模型一致。
3. 在 `InMemoryStore` 与 `DatabaseStore` 中补充节点 CRUD 方法，并先校验项目归属，再执行节点读写。
4. 新增 `/projects/{project_id}/nodes` 路由，统一使用 `Depends(current_user)`，实现项目 ownership 校验、节点归属校验和错误码处理。
5. 参考 `backend/tests/test_project_crud.py` 新建节点专项测试，覆盖创建、排序、详情、更新、删除、错误项目访问、SQLite 持久化和内存实现可用性。
6. 运行 `cd backend && python -m compileall .` 与 `cd backend && python tests/test_canvas_node_crud.py`，记录结果并生成报告。

## 验收标准

- `POST /projects/{project_id}/nodes` 返回节点详情且状态码为 `201`。
- `GET /projects/{project_id}/nodes` 仅返回当前用户该项目节点，按 `position_x` 升序。
- `GET /projects/{project_id}/nodes/{node_id}` 对本人项目返回详情，对错误项目返回 `403`，节点不存在返回 `404`。
- `PUT /projects/{project_id}/nodes/{node_id}` 仅允许更新本人项目节点，并返回最新结果。
- `DELETE /projects/{project_id}/nodes/{node_id}` 仅允许删除本人项目节点，成功返回 `204`。
- `InMemoryStore` 与 `DatabaseStore` 均支持节点 CRUD。
- `cd backend && python -m compileall .` 通过。
- `cd backend && python tests/test_canvas_node_crud.py` 通过。
