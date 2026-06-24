# REPORT-T3-010

## Status

DONE

## Task ID

TASK-T3-010

## Summary

新增后端端到端测试 `backend/tests/test_image_e2e.py` 与 `backend/tests/test_video_e2e.py`，使用临时 SQLite、`DatabaseStore`、`TestClient` 和 Agnes mock 验证图片/视频生成链路中的 mock 登录、接口调用、轮询、资产入库、额度扣减/保持、以及持久化结果。

## Files Changed

- `backend/tests/test_image_e2e.py`
- `backend/tests/test_video_e2e.py`
- `ai/tasks/doing/TASK-T3-010-PLAN.md`
- `ai/tasks/doing/TASK-T3-010-PROGRESS.md`
- `ai/reports/REPORT-T3-010.md`

## Tests Run

- `python -m unittest backend.tests.test_image_e2e`
- `python -m unittest backend.tests.test_video_e2e`
- `python -m compileall backend/tests/test_image_e2e.py`
- `python -m compileall backend/tests/test_video_e2e.py`
- `cd backend && python -m compileall .`

## Test Result

PASS

## Risks

- Agnes 调用在本任务中全部使用 mock，测试覆盖的是本地接口编排、轮询控制、落库与 quota 行为，不覆盖真实网络交互。
- 任务文案中的“视频额度预扣+返还”与当前实现不一致；现有代码实际行为是成功完成后扣额，只有资产落库失败时才触发 refund，测试已按真实实现验证。

## Notes

- 图片 e2e 覆盖了文生图成功、图生图成功、生成失败不扣额、落库失败 refund、额度不足拒绝。
- 视频 e2e 覆盖了创建+轮询成功、轮询失败不扣额、超时不扣额、落库失败 refund、额度不足拒绝。
- 资产持久化同时通过 `/assets` 列表接口与 `store.get_asset()` 做了双重校验。

## Need Hermes Review

YES
