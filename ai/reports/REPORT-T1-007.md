# REPORT-T1-007

## Status

DONE

## Task ID

TASK-T1-007

## Summary

本次完成了后端画布节点 CRUD：新增 `CanvasNode` 模型、节点 schema 和 `/projects/{project_id}/nodes` 路由，在 `InMemoryStore` 与 `DatabaseStore` 中补齐节点创建、列表、详情、更新、删除能力，并新增 9 个专项测试覆盖 ownership、项目错配、排序和 SQLite 持久化。

## Files Changed

- `backend/models/canvas_node.py`
- `backend/schemas/canvas_node.py`
- `backend/api/canvas_nodes.py`
- `backend/controllers/store.py`
- `backend/api/router.py`
- `backend/models/__init__.py`
- `backend/tests/test_canvas_node_crud.py`
- `ai/tasks/doing/TASK-T1-007-PLAN.md`
- `ai/tasks/doing/TASK-T1-007-PROGRESS.md`
- `ai/reports/REPORT-T1-007.md`

## Tests Run

- `cd backend && python -m compileall .`
- `cd backend && python tests/test_canvas_node_crud.py`

## Test Result

PASS

## Risks

- 为确保 `init_db()` 能创建 `canvas_nodes` 表，额外修改了 `backend/models/__init__.py` 注册新模型导入；这是任务外最小必要配套改动。
- 当前节点删除采用软删除（`status=deleted`）而不是物理删除；如果后续需要恢复或级联清理资产，需要 Hermes 在后续任务中明确策略。

## Notes

- 本次只实现任务要求的后端节点 CRUD，没有改动前端、`CURRENT.md`、`ROADMAP.md`、`ai/reviews/` 或其他业务模块。
- 节点列表按 `position_x` 升序返回；当节点与 URL 中的 `project_id` 不匹配时，详情接口返回 `403`，以满足任务对“非本项目禁止访问”的要求。

## Need Hermes Review

YES
