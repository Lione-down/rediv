# TASK-T3-009 Plan

## Goal

为 Agnes 多模态链路补齐后端端到端集成测试，验证微信 mock 登录、项目创建、画布节点创建、文本生成、资产入库和额度扣减可以在同一条业务链路中串联通过。

## Scope

- 新增 `backend/tests/test_e2e_workflow.py`
- 生成 `ai/reports/REPORT-T3-009.md`
- 更新 `ai/tasks/doing/TASK-T3-009-PROGRESS.md`

## Implementation Steps

1. 参考现有 `test_wechat_callback`、`test_text_generate` 和相关 API 路由，确定临时 SQLite、`DatabaseStore`、`TestClient`、认证 header 与 Agnes mock 的复用方式。
2. 新增端到端测试，用真实接口串联 `/auth/wechat/mock`、`/projects`、`/projects/{project_id}/nodes`、`/api/text-generate` 和 `/assets`。
3. 使用 `@patch` 替换 Agnes provider，断言生成内容、资产归属、额度扣减和 quota ledger 记录。
4. 运行任务要求的 unittest 与 compileall，并补充一次 backend compileall 基础检查。
5. 生成 REPORT 与进度文档，记录测试结果、风险与说明。

## Success Criteria

- 端到端测试通过真实后端路由覆盖登录到资产沉淀的完整链路
- 测试仅使用临时 SQLite，不污染现有数据库
- Agnes 调用完全由 mock 驱动，不依赖外网和真实 API key
- `python -m unittest backend.tests.test_e2e_workflow` 与 `python -m compileall backend/tests/test_e2e_workflow.py` 通过
