# REPORT-T1-003

## Status

DONE

## Task ID

TASK-T1-003

## Summary

修复了后端邀请码过期判断，改为基于 `datetime` 比较；新增邀请码注册专项测试，覆盖 `open`、`invite_only`、`closed` 三种注册模式，以及邀请码缺失、无效、过期、用尽等边界场景。

## Files Changed

- `backend/controllers/store.py`
- `backend/tests/test_invitation_code.py`
- `ai/tasks/doing/TASK-T1-003-PLAN.md`
- `ai/tasks/doing/TASK-T1-003-PROGRESS.md`
- `ai/reports/REPORT-T1-003.md`

## Tests Run

- `cd backend && python -m compileall .`
- `cd backend && python tests/test_invitation_code.py`
- `python backend/tests/test_invitation_code.py`

## Test Result

PASS

## Risks

- 仓库当前存在较多非本次任务产生的未提交改动，本次未处理也未回滚。
- 现有 `backend/tests/test_database_store.py` 以脚本方式直接运行时仍有导入路径问题，不属于本次任务范围。

## Notes

- `backend/api/auth.py` 未做逻辑修改，现有注册分支通过新增专项测试完成行为确认。
- 任务按要求保留在 `ai/tasks/doing/`，未移动到 `done/`。

## Need Hermes Review

YES
