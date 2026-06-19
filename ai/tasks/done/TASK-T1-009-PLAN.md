# TASK-T1-009 Plan

## Objective

完成 Admin 后台接口增强，补齐项目列表、用户详情和 admin 操作日志能力，并保持 SQLite / InMemory 双实现一致。

## Scope

- 增强 `backend/controllers/store.py`：新增 `list_all_projects`、`get_user_detail`、`log_admin_operation` 和日志查询支持
- 增强 `backend/api/admin.py`：新增 `/admin/projects`、`/admin/users/{user_id}`、`/admin/logs`，并在 admin 写操作中记录日志
- 评估并按需扩展 `backend/schemas/admin.py`
- 新增 `backend/tests/test_admin_enhancements.py`
- 生成 `ai/reports/REPORT-T1-009.md`

## Steps

1. 阅读 `TASK-T1-009`、`xq/07_admin_system.md`、现有 `admin.py` / `store.py` / admin 相关模型与测试。
2. 在 `store.py` 中为 InMemory 与 DatabaseStore 实现项目总览、用户详情统计、admin 日志写入与列表逻辑。
3. 在 `admin.py` 中新增读取接口，并对 ban / freeze / grant / disable 等写接口补充日志记录。
4. 新增 `test_admin_enhancements.py`，覆盖接口行为、404、日志写入和 SQLite 持久化。
5. 运行 `python -m compileall .` 与 `python tests/test_admin_enhancements.py`。
6. 更新进度文档并生成 `REPORT-T1-009.md`。

## Success Criteria

- `GET /admin/projects` 返回全部项目，并包含所属用户和 `node_count`
- `GET /admin/users/{user_id}` 返回用户基础信息、额度余额、资产数、项目数
- `GET /admin/logs` 按时间倒序返回最近日志
- admin 写操作会写入 `admin_logs`
- SQLite 与 InMemory 行为一致
- 编译检查与新增测试通过
