# T4-002 PMC Review — Executor Retry Exhausted

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Queue revision：`phase4-wave2-manual-rework-2026-06-24-05`
- Coordinator：`t_f53b3c08`（done）
- Executor：`t_68c68e4e`（attempt 0，blocked / gave_up）
- Review time：2026-06-24 21:02 +08:00

## Verified Evidence

1. Executor run `#72` 与 retry run `#73` 均以 `pid not alive` crash；Hermes dispatcher 记录 `consecutive_failures=2`、达到 effective retry limit，并将 card 标记为 `blocked / gave_up`。
2. 15:00 至 21:00 的 scheduled reports 连续记录相同状态，没有新的 run、REPORT、Independent REVIEW 或 HANDOFF。当前 revision 只有 PLAN 与未完成的 PROGRESS。
3. `ai/tasks/doing/TASK-T4-002-PROGRESS.md` 仍将实现和测试列为 TODO；旧 revision 的 REPORT、REVIEW 与 HANDOFF 不得作为本轮完成证据。
4. 当前 allowed files 存在实质性未报告修改。`git diff --ignore-space-at-eol --numstat` 显示迁移脚本 `437/409`、测试 `681/1048` 行变更，不是部分 scheduled reports 所称的纯 line-ending normalization。修改位于 Task scope 内，但归属和完成度未经 Executor REPORT 证明。
5. 当前 partial implementation 仍不满足 Hard Gates：
   - `backend/tests/test_migration_tool.py` 在缺少 `REVID_TEST_MYSQL_ADMIN_URL` 时抛出 `SkipTest`，而 ADR-003 要求明确 BLOCKED/失败；
   - fixture setup 与 teardown 仍静默吞掉 database cleanup 异常；
   - same-PK different-value test 实际允许 `ON DUPLICATE KEY UPDATE` 覆盖目标值，并断言覆盖成功，没有验证 non-zero exit 或原值保持；
   - partial rollback test 没有制造 batch 中途失败，只验证 second-run row count；
   - PROGRESS 未记录实现完成或任何测试结果。
6. 本轮只执行 non-destructive 检查：两份 Python 文件 AST parse passed。automation runtime 中专用 secret presence 为 `MISSING`，因此没有运行 CREATE/DROP 或 disposable MySQL tests；该 presence check 不推断 Hermes runtime 当前状态。

## Impact

- revision `-05` 已无法继续自动执行；继续保留 Queue `APPROVED` 会误导 Hermes 重复扫描一个已耗尽 retry 的执行链。
- 没有当前 attempt 的 REPORT/REVIEW/HANDOFF，T4-002 不能进入 PMC acceptance，T4-003 依赖继续阻塞。
- partial implementation 不能丢弃，也不能视为完成成果；后续 Executor 必须先审计并接管现有 allowed-file diff，再继续修复和验证。
- scheduled reports 对 diff 性质的陈述互相冲突，后续验收必须以 fresh diff、源码和可复跑命令为准。

## PMC Verdict

**BLOCKED — EXECUTOR RETRIES EXHAUSTED; PARTIAL IMPLEMENTATION UNVERIFIED**

## Responsibility And Unblock Conditions

- 责任角色：Hermes runtime owner / `revid-pm` 负责 worker stability 与可持续 run 证据；后续 `revid-backend` Executor 负责审计并完成 partial implementation。
- 在重新派发前，必须提供针对 `pid not alive` 的新鲜 diagnostics 或成功的同 profile sustained-run 证据，不能仅再次启动相同配置。
- 由 Codex PMC 在解除条件满足后发布全新的 APPROVED Queue revision、Coordinator chain 和 revision-based idempotency key；不得复用 `t_f53b3c08`、`t_68c68e4e` 或 revision `-05`。
- 新 Executor 必须先核对现有两个 allowed files 的 diff，保留可证明正确的部分，禁止覆盖无关用户工作。
- 完成实现后必须生成新 PLAN/PROGRESS/REPORT，并真实证明 missing-secret failure、identity、Alembic schema、cleanup failure、same-PK conflict、partial rollback、12-table consistency；之后再由 Independent Reviewer 复跑。
- 在这些条件满足前，不创建新的 Coordinator、Executor 或 Reviewer card，不运行 destructive verification。

## Recommendation

`BLOCKED`
