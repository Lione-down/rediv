# T4-002 PMC Review — Final Attempt Infrastructure Blocked

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Queue revision：`phase4-wave2-final-rework-2026-06-25-08`
- Coordinator：`t_fba90f6a`（done）
- Executor：`t_8ee01149`（attempt 1，blocked）
- Reviewer：`t_e0024944`（todo，未执行）
- Runtime terminal state：`EXECUTOR_BLOCKED`
- Runtime failure fingerprint：`PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout`
- Decision time：2026-06-25 06:02 +08:00

## Authorization And Evidence Chain

1. revision `-08`、Task、ADR-003、Scope、Allowed Files 与 destructive boundary 均有正式授权。
2. Executor run `#78` 在 909 秒后 timeout；唯一 process retry run `#79` 随后以 `pid not alive` crash。Hermes 已将 Executor 标记 blocked，Coordinator 已结束。
3. attempt 1 只有 revision-specific PLAN 与 PROGRESS；不存在 REPORT、Independent REVIEW 或 HANDOFF，因此不能进入 PMC acceptance。
4. PROGRESS 声明 checkpoint A/B/C 完成，但仍明确列出真实 MySQL 13 tests 与 REPORT 为 pending。未经 REPORT 和独立复跑，这些声明不能作为完成证据。
5. 当前 business diff 仅位于两个 allowed files；PMC 不接管、不修改也不丢弃该 partial implementation。

## Fresh Read-only Verification

- `backend/scripts/migrate_sqlite_to_mysql.py`：AST parse passed。
- `backend/tests/test_migration_tool.py`：AST parse passed。
- `git diff --check`：passed。
- 未读取或输出 secret，未执行 CREATE/DROP DATABASE 或 disposable MySQL integration tests。
- source validation 静态路径仍为 `get_admin_url()` / `build_test_db_url()` 先执行，之后才检查 source 是否存在；因此 AC13 所称“missing-source 不依赖 MySQL secret”尚未成立。
- AC12 通过 patch 模块属性注入 failure，但测试调用的是文件顶部直接导入的 `cleanup_test_database` 绑定；该调用不会被所示 patch 替换，因此 exception propagation 断言尚未证明目标行为。
- `_setup_test_db()` 与 AC11 cleanup 仍捕获并忽略 `RuntimeError` / `ConnectionError`；identity mismatch、权限或 cleanup failure 可能被当作“database 不存在”继续执行，仍需真实失败语义验证。

## Impact

- final business attempt 1 的唯一 process retry 已耗尽；继续保留 Queue `APPROVED` 会误导 Hermes 重复扫描 terminal chain。
- 没有当前 attempt 的 REPORT/REVIEW/HANDOFF，T4-002 不能 PASS，T4-003 依赖继续阻塞。
- partial diff 不能视为完成成果，也不能被自动覆盖；后续只允许在 runtime health 恢复后继续 attempt 1，并继承全部 failure fingerprints。
- 当前问题不涉及新的产品方向、付费资源、secret 内容、不可逆操作或重大 contract 变化，无需 Human Owner 决策。

## Failure Fingerprints

- Infrastructure：`PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout`
- Business inherited：`T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`
- Fresh static evidence：`T4-002-ATTEMPT1-STATIC: SECRET_BEFORE_SOURCE_VALIDATION + INEFFECTIVE_CLEANUP_PATCH_BINDING + CLEANUP_FAILURE_SWALLOWED`

以上 fingerprints 不得通过 revision、card ID 或 continuation 清零。

## PMC Verdict

**PMC_BLOCKED — FINAL ATTEMPT PROCESS RETRY EXHAUSTED; NO ACCEPTANCE EVIDENCE**

## Responsibility And Unblock Conditions

- 责任角色：Hermes runtime owner / `revid-pm` 负责提供同 profile 的新鲜 crash diagnostics 或可持续运行证据；后续 `revid-backend` 只负责在原 Scope 内继续 attempt 1。
- 在解除条件满足前，Queue 不含 executable Task；不得创建、claim、promote、unblock、重试或复用当前及历史 card。
- 若未来恢复，必须由 Codex PMC 发布新 revision，但 business attempt ordinal 仍为 `1` continuation；禁止 attempt 2，且必须继承全部 fingerprints。
- continuation Executor 必须先审计现有两个 allowed files，修复本 review 的静态缺口，完成真实 MySQL 13 tests，并生成新的 REPORT；之后由 Independent Reviewer 独立复跑和 HANDOFF。
- 若没有新的 runtime health 证据，保持 BLOCKED，不再重复 dispatch。

## Recommendation

`BLOCKED`
