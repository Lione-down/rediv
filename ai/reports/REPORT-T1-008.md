# REPORT-T1-008

## Status

DONE

## Task ID

TASK-T1-008

## Summary

完成后端模板系统 CRUD：支持从项目节点快照保存模板、列出/查看/删除模板，并支持使用模板创建新项目并复制节点。

## Files Changed

- `ai/tasks/doing/TASK-T1-008-PLAN.md`
- `ai/tasks/doing/TASK-T1-008-PROGRESS.md`
- `backend/api/router.py`
- `backend/api/templates.py`
- `backend/controllers/store.py`
- `backend/models/__init__.py`
- `backend/models/template.py`
- `backend/schemas/template.py`
- `backend/tests/test_template_system.py`

## Tests Run

- `cd backend && python -m compileall .`
- `cd backend && python tests/test_template_system.py`

## Test Result

PASS

## Risks

- `POST /templates/{template_id}/use` 的任务定义未提供项目命名入参，本次按最小假设直接使用模板名作为新项目名；若后续需要自定义名称，需要补充请求 schema。

## Notes

- 模板详情接口返回了 `node_data`，以便验证快照内容并支撑模板复用。
- 使用模板创建项目时，节点通过现有 `create_node` 流程重建，因此会生成新的节点 ID。

## Need Hermes Review

YES
