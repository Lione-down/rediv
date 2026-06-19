# REPORT-T1-004

## Status

DONE

## Task ID

TASK-T1-004

## Summary

新增了 `GET /admin/users/{user_id}/quotas/ledger` Admin 接口，支持按用户查询额度流水并按 `created_at` 倒序返回；同时补充了 quota flow 专项测试，覆盖默认额度发放、Admin 派发、多次派发、按用户过滤 ledger、Admin 权限与缺失用户 404 场景。

## Files Changed

- `backend/api/admin.py`
- `backend/tests/test_quota_flow.py`
- `ai/tasks/doing/TASK-T1-004-PLAN.md`
- `ai/tasks/doing/TASK-T1-004-PROGRESS.md`
- `ai/reports/REPORT-T1-004.md`

## Tests Run

- `cd backend && python -m compileall .`
- `cd backend && python -m pytest tests/test_quota_flow.py -v` （环境缺少 `pytest`，未执行）
- `cd backend && python tests/test_quota_flow.py`

## Test Result

PASS

## Risks

- 当前环境未安装 `pytest`，尚未按任务首选命令执行同一套测试；不过 `unittest` 直跑已通过。

## Notes

- 任务文件保留在 `ai/tasks/doing/`，未移动到 `done/`。
- 本次仅修改任务范围内的后端接口与测试，未调整 `CURRENT.md`、`ROADMAP.md`、`reviews/`、`decisions/`。

## Need Hermes Review

YES
