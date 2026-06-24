# T4-002 PMC Review — Dispatch Approved

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Previous governance revision：`phase4-wave2-blocked-2026-06-24-02`
- Dispatch revision：`phase4-wave2-manual-rework-2026-06-24-03`
- Decision authority：Human User
- Review time：2026-06-24 11:38 +08:00

## Readiness Evidence

Human User 明确确认 `REVID_TEST_MYSQL_ADMIN_URL` 已完成设置，并要求派发 T4-002。PMC 不读取、不复制、不记录 secret 值或完整 connection URL。

该确认解除“等待 runtime owner 注入 secret”的调度阻塞，但不替代 Executor 的入口 Hard Gate。Executor 必须在任何 CREATE/DROP 或连接测试前验证：

1. 变量在 Hermes Executor runtime 中存在；
2. admin identity 具备必要权限；
3. 所有 destructive operation 的目标 database 精确为 `revid_test_t4_002`；
4. 无 credential fallback、替代 database 或 `.env` 读取。

任一检查失败时必须返回 BLOCKED，且不得执行 destructive verification。

## PMC Verdict

**DISPATCH — HUMAN APPROVED MANUAL REWORK**

Human User 的一次性人工 REWORK 授权尚未消耗。新 revision 使用新的 revision-based idempotency key，不得复用旧 Coordinator `t_64d6db92`、旧 card 或旧 evidence chain。

## Authorized Execution Chain

- Executor：`revid-backend`
- Independent Reviewer：`revid-reviewer`
- Project Task File：`ai/tasks/todo/TASK-T4-002.md`
- Required new evidence：PLAN、PROGRESS、REPORT、Independent REVIEW、HANDOFF
- Parallel mode：串行；禁止与其他 database migration/destructive verification 并行

## Scope And Quality Gates

继续执行 `ai/reviews/REVIEW-T4-002-PMC-2026-06-24.md`、`ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md` 和 Queue 中的全部要求，包括 structured URL、database identity、Alembic schema setup、可靠 cleanup、same-PK conflict、真实 partial rollback 与 12-table consistency。

Reviewer PASS 后仍需 Codex PMC 最终验收；不得自动将 T4-002 移入 done，也不得自动启动 T4-003。

## Recommendation

`DISPATCH`
