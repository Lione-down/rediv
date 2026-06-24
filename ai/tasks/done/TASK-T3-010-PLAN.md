# TASK-T3-010 Plan

## Goal

为 Agnes 图片生成与视频生成补齐后端端到端测试，验证 mock 登录、接口调用、额度变化、资产入库和 SQLite 持久化行为。

## Scope

- 新增 `backend/tests/test_image_e2e.py`
- 新增 `backend/tests/test_video_e2e.py`
- 新增 `ai/tasks/doing/TASK-T3-010-PROGRESS.md`
- 新增 `ai/reports/REPORT-T3-010.md`

## Constraints

- 仅修改测试与任务文档，不修改业务实现。
- 使用 `unittest.TestCase`、`TemporaryDirectory`、`DatabaseStore`、`TestClient`。
- Agnes 调用全部使用 mock。
- 测试断言按当前实现语义验证：
  - 生成成功后扣额。
  - Agnes 生成/轮询失败时不扣额。
  - 仅在资产入库失败时触发 refund ledger。

## Steps

1. 复用 `test_e2e_workflow.py` 的登录、临时 SQLite、`TestClient` 结构搭建图片/视频 e2e 测试基类。
2. 编写图片 e2e 测试，覆盖文生图成功、图生图成功、生成失败不扣额、落库失败 refund、额度不足拒绝、资产列表与 `store` 双重持久化校验。
3. 编写视频 e2e 测试，覆盖任务创建+轮询成功、轮询失败不扣额、超时不扣额、落库失败 refund、额度不足拒绝、资产列表与 `store` 双重持久化校验。
4. 运行任务要求的 unittest 与 compileall 校验，整理结果写入 REPORT 和 PROGRESS。
