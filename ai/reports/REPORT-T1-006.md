# REPORT-T1-006

## Status

DONE

## Task ID

TASK-T1-006

## Summary

本次完成了后端项目系统基础 CRUD：新增 `Project` 模型、项目 schema 和 `/projects` 路由，在 `InMemoryStore` 与 `DatabaseStore` 中补齐项目创建、列表、详情、删除能力，并新增 8 个专项测试覆盖 ownership、排序和 SQLite 持久化。

## Files Changed

- `backend/models/project.py`
- `backend/schemas/project.py`
- `backend/api/projects.py`
- `backend/controllers/store.py`
- `backend/api/router.py`
- `backend/models/__init__.py`
- `backend/tests/test_project_crud.py`
- `ai/tasks/doing/TASK-T1-006-PLAN.md`
- `ai/tasks/doing/TASK-T1-006-PROGRESS.md`
- `ai/reports/REPORT-T1-006.md`

## Tests Run

- `cd backend && python -m compileall .`
- `cd backend && python tests/test_project_crud.py`

## Test Result

PASS

## Risks

- 为确保 `init_db()` 能创建 `projects` 表，额外修改了 `backend/models/__init__.py` 注册新模型导入；这是任务外最小必要配套改动。
- 当前删除项目采用物理删除；如后续项目与画布节点、资产形成强关联，可能需要补充级联或软删除策略，但这不在本任务范围内。

## Notes

- 本次只实现任务要求的后端项目 CRUD，没有改动前端、`CURRENT.md`、`ROADMAP.md`、`ai/reviews/` 或其他业务模块。
- 项目列表按 `created_at` 倒序返回，详情与删除都严格限制为当前用户自己的项目。

## Need Hermes Review

YES
