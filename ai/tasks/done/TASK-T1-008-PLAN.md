# TASK-T1-008 Plan

## Objective

实现后端模板系统 CRUD，包括模板保存、列表、详情、删除，以及使用模板创建新项目并复制节点。

## Scope

- 新增 `Template` SQLAlchemy 模型与 Pydantic schemas
- 新增 `/templates` FastAPI 路由
- 为 `InMemoryStore` 与 `DatabaseStore` 增加模板 CRUD / use 能力
- 注册路由与模型导出
- 新增模板系统测试

## Steps

1. 阅读任务文档、`xq/06_template_system.md` 以及现有 `projects` / `canvas_nodes` 实现。
2. 新增 `backend/models/template.py` 与 `backend/schemas/template.py`。
3. 在 `backend/controllers/store.py` 中实现模板创建、查询、删除和使用逻辑，保持 SQLite 与内存双实现一致。
4. 新增 `backend/api/templates.py` 并在 `backend/api/router.py` 挂载。
5. 在 `backend/models/__init__.py` 注册 `Template`。
6. 新增 `backend/tests/test_template_system.py`，覆盖权限、复制节点和持久化行为。
7. 运行 `python -m compileall .` 与 `python tests/test_template_system.py`，生成报告。

## Success Criteria

- `POST /templates` 能从当前用户项目节点快照创建模板
- `GET /templates` / `GET /templates/{id}` / `DELETE /templates/{id}` 权限正确
- `POST /templates/{id}/use` 能创建新项目并复制节点，节点 ID 重新生成
- SQLite 持久化与 InMemory 行为一致
- 编译与测试通过
