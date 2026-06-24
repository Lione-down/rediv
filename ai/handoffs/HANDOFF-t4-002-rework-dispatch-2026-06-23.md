# PMC HANDOFF — T4-002 MySQL Integration Rework

> 日期：2026-06-23
> Queue Revision：`phase4-wave2-rework-2026-06-23-02`
> 状态：APPROVED FOR DISPATCH

## 派发摘要

T4-002 允许创建专用 disposable MySQL 测试环境。授权边界和成功标准以 `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md` 与 `ai/reviews/REVIEW-phase4-wave2-PMC-2026-06-23.md` 为准。

## Executor

- Profile：`revid-backend`
- Task：`T4-002 REWORK`
- Target database：仅 `revid_test_t4_002`
- Secret input：`REVID_TEST_MYSQL_ADMIN_URL`，由 Hermes runtime secret/environment 注入
- 禁止：读取项目 `.env`、在卡片中索要或记录密码、使用现有 `revid_db` 作为测试目标

## 执行顺序

1. 检查 secret 是否存在，但不得输出其值。
2. 连接后读取 server/database metadata，确认没有选中 `revid_db`。
3. 仅创建或重建 `revid_test_t4_002`。
4. 使用 Alembic 建立 schema。
5. 修复 integration tests 的硬编码路径与 fixture。
6. 运行完整 MySQL integration suite 和 unit tests。
7. 清理 `revid_test_t4_002`，更新 PLAN/PROGRESS/REPORT。
8. 创建新的独立 Reviewer 卡；Reviewer PASS 后停止并等待 PMC。

## Blocked 规则

以下任一情况立即 BLOCKED，不执行数据库写操作：

- `REVID_TEST_MYSQL_ADMIN_URL` 未注入；
- 无 CREATE/DROP DATABASE 权限；
- 无法证明目标名称严格等于 `revid_test_t4_002`；
- 发现命令将作用于 `revid_db` 或其他数据库；
- 测试需要扩大 destructive scope。

## 幂等键

`phase4-wave2-rework-2026-06-23-02:T4-002`

