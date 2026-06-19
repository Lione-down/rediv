# TASK-T1-004 开发计划

## 目标

补齐后端 quota 系统的按用户流水查询能力，并新增端到端测试覆盖默认发放、Admin 派发和 ledger 查询链路。

## 范围

- 更新 `backend/api/admin.py`
- 新增 `backend/tests/test_quota_flow.py`
- 生成 `ai/reports/REPORT-T1-004.md`

## 实施步骤

1. 阅读任务、状态文档、quota 相关 `xq/` 设计和现有后端实现，确认接口语义与测试边界。
2. 在 `backend/api/admin.py` 新增 `GET /admin/users/{user_id}/quotas/ledger` 接口，要求仅 Admin 可访问，用户不存在时返回 404，并按 `created_at` 倒序返回当前用户的额度流水。
3. 参考现有后端测试模式，新建 `backend/tests/test_quota_flow.py`，使用 `TemporaryDirectory` 隔离 SQLite 数据，覆盖默认额度发放、Admin 派发、多次派发、按用户过滤 ledger 和排序校验。
4. 运行后端编译检查与专项测试，记录结果并生成任务报告。

## 验收标准

- 新接口只读当前指定用户的 quota ledger，且按 `created_at` 倒序返回。
- 非存在用户请求返回 404。
- `backend/tests/test_quota_flow.py` 覆盖任务要求的 5 个场景。
- `cd backend && python -m compileall .` 通过。
- `cd backend && python -m pytest tests/test_quota_flow.py -v` 通过；若环境缺少 `pytest`，至少保证 `python tests/test_quota_flow.py` 可运行。
