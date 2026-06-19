# TASK-T1-006 开发计划

## 目标

实现后端项目系统基础 CRUD：创建项目、项目列表、项目详情、删除项目，并保证权限隔离、SQLite 持久化与现有后端风格一致。

## 范围

- 新增 `backend/models/project.py`
- 新增 `backend/schemas/project.py`
- 新增 `backend/api/projects.py`
- 更新 `backend/controllers/store.py`
- 更新 `backend/api/router.py`
- 新增 `backend/tests/test_project_crud.py`
- 如为保证模型注册与 ORM 关系所必需，可最小范围补充相关模型导入
- 生成 `ai/reports/REPORT-T1-006.md`

## 实施步骤

1. 阅读任务、状态文档、`xq/02_project_system.md`、现有后端 store/router/test 模式，确认接口语义与权限边界。
2. 创建 `Project` SQLAlchemy 模型与对应 Pydantic schema，保持字段命名与时间格式和现有模块一致。
3. 在 `InMemoryStore` 和 `DatabaseStore` 中补充项目创建、列表、详情、删除方法，并确保数据库模式在重载后可读取项目数据。
4. 新增 `/projects` 路由，统一使用 `Depends(current_user)`，实现 ownership 校验与错误码处理。
5. 参考 `backend/tests/test_asset_upload.py` 新建项目专项测试，覆盖创建、列表排序、详情权限、删除权限、SQLite 持久化，并补一条内存实现可用性验证。
6. 运行 `cd backend && python -m compileall .` 与 `cd backend && python tests/test_project_crud.py`，记录结果并生成报告。

## 验收标准

- `POST /projects` 返回 `{id, user_id, name, created_at}` 且状态码为 `201`。
- `GET /projects` 仅返回当前用户项目，按 `created_at` 倒序。
- `GET /projects/{project_id}` 对本人返回详情，对他人返回 `403`。
- `DELETE /projects/{project_id}` 对本人返回 `204`，对他人返回 `403`。
- `InMemoryStore` 与 `DatabaseStore` 均支持项目 CRUD 接口。
- `cd backend && python -m compileall .` 通过。
- `cd backend && python tests/test_project_crud.py` 通过。
