# T4-002 PMC Review — Redispatch Approved

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Previous blocked revision：`phase4-wave2-dispatch-blocked-2026-06-24-04`
- Redispatch revision：`phase4-wave2-manual-rework-2026-06-24-05`
- Decision authority：Human User
- Review time：2026-06-24 13:12 +08:00

## Authorization Evidence

Human User 明确要求将 Active Queue 改为 `APPROVED`，恢复 T4-002 Task 条目，使下一轮 Hermes Scheduled Supervisor 创建新的协调链并启动执行。

该授权只解除 Queue dispatch blocker，不恢复或复用旧 cards：

- 旧 Coordinator `t_d626b42d` 保持 blocked；
- 旧 Executor child `t_4a89bb5e` 保持 todo/no-run，仅作历史辅助证据；
- 新 revision 必须生成新的 Coordinator、Executor 和 revision-based idempotency key；
- 不得手工 claim、promote、unblock 或修改旧 cards。

## PMC Verdict

**REDISPATCH — HUMAN APPROVED**

本次是 dispatch infrastructure recovery，不是 T4-002 业务代码自动 REWORK。旧链没有 Executor run，因此没有新的代码 failure fingerprint 或完成证据。

## Hard Gates

新 Executor 必须在任何 destructive verification 前验证：

1. `REVID_TEST_MYSQL_ADMIN_URL` 在自身 runtime 中存在；
2. admin identity 具备必要权限；
3. database identity 精确为 `revid_test_t4_002`；
4. 无 credential fallback、替代 database 或项目 `.env` 读取。

任一检查失败时立即 BLOCKED，禁止执行 CREATE/DROP。其余 structured URL、Alembic schema setup、cleanup、same-PK conflict、partial rollback 与 12-table consistency 要求继续完整适用。

## Authorized Execution Chain

- Executor：`revid-backend`
- Independent Reviewer：`revid-reviewer`
- Project Task File：`ai/tasks/todo/TASK-T4-002.md`
- Parallel mode：`serial-t4-002`
- Required evidence：本 revision 的全新 PLAN、PROGRESS、REPORT、Independent REVIEW 和 HANDOFF

## Recommendation

`DISPATCH`
