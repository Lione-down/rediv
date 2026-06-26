# T4-002 PMC Review — Revision -07 Blocked / Final Business Rework

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Execution revision：`phase4-wave2-recovery-dispatch-2026-06-24-07`
- Coordinator：`t_e23d9043`
- Executor：`t_748c116d`，attempt 0
- Runtime terminal state：`BLOCKED`
- Runtime failure fingerprint：`EXECUTOR_GAVE_UP: iteration budget exhausted (90/90) after pid not alive crash`
- Decision date：2026-06-25

## Authorization and Evidence Chain

1. revision `-07` 由 Codex PMC 正式批准，Task、ADR-003、Scope、Allowed Files 与 destructive boundary 有效。
2. Hermes execution status 已 ACK 同一 revision；run `#75` 因 `pid not alive` crash，run `#76` 因 90/90 iteration budget exhausted 而 `gave_up`。
3. 当前无 revision `-07` REPORT、Independent REVIEW 或 HANDOFF；因此不存在可执行 PMC PASS 验收链。
4. Executor PLAN/PROGRESS 仅声明 checkpoint A/B 完成、checkpoint C 未完成；这些声明不能替代测试证据。
5. 当前业务修改仅位于两个 Task allowed files；本 review 不接管或修改这些业务文件。

## Fresh Read-only Verification

- `backend/scripts/migrate_sqlite_to_mysql.py`：AST parse passed。
- `backend/tests/test_migration_tool.py`：AST parse passed。
- `git diff --check`：passed。
- automation runtime 的 `REVID_TEST_MYSQL_ADMIN_URL` presence 为 `MISSING`；未读取或输出 secret 值，未执行 CREATE/DROP DATABASE。
- 明确运行 AC7 单测入口时，`setUpClass` 先因 secret 缺失报错，结果为 `Ran 0 tests`；该结果是 BLOCKED 证据，不是 AC7 PASS。

## Blocking Findings

1. **Idempotency comparison is structurally incorrect.** `migrate_table()` 比较 source row 时排除 PK，但 destination row 保留 PK；同一数据的 existing row 会被错误分类为 `stale_diff`，无法证明 second-run idempotency。
2. **AC10 can pass for the wrong reason.** test 调用 CLI 时没有传入临时 fixture 的 `--source`，non-zero exit 可能来自默认 `revid.db` 路径或其他前置失败，而不是 same-PK conflict。
3. **AC11 does not prove mid-batch rollback.** 预置冲突使用 `user-001`，fixture 的第一条 quotas row 就会失败；测试没有先成功写入一行再在后续行失败，因此没有证明已执行语句被整批 rollback。
4. **Cleanup failure semantics remain unsound.** `_setup_test_db()` 对预清理使用宽泛 `except Exception: pass`；AC12 的 dropped-database 检查同样用宽泛 `except Exception` 包住 `self.fail()`，数据库仍存在时也可能假通过。
5. **Validation errors can be hidden.** CLI 重新读取 source 失败时直接 `except Exception: pass`，随后仍继续 validation，违反失败必须 non-zero 且证据可见的要求。
6. **Missing-source coverage is absent.** 当前没有 Queue Hard Gate 要求的 missing-source 专项测试；CLI 在 `isfile` 检查前调用 `os.stat`，且 secret gate 先于 source path 校验，无法证明 missing-source 在无 secret 时仍按预期失败而非被跳过/遮蔽。
7. **Test isolation is insufficient.** class-level shared database 被多个有状态测试依序修改、drop 与 recreate；测试名称排序与执行顺序可能影响结果，当前无独立性证明。

## Failure Fingerprint

`T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`

该 fingerprint 必须写入后续 Queue，不能通过 revision 或新 card 清零。

## PMC Verdict

**PMC_REWORK — FINAL BUSINESS ATTEMPT 1 AUTHORIZED**

- 问题均可在既有 Scope、Allowed Files 与 Acceptance Criteria 内修复，不需要产品方向、secret 内容或重大 contract 决策。
- attempt 0 因 infrastructure/runtime 终止，但 fresh audit 同时确认 partial implementation 存在业务测试语义缺陷；因此不接受 clean PASS continuation。
- 授权新的 Queue revision `phase4-wave2-final-rework-2026-06-25-08`，业务 attempt ordinal 固定为 `1`。这是 T4-002 唯一且最后一次 business REWORK；不得再创建 attempt 2 或通过新 revision 重置 attempt/fingerprint。
- 旧 Coordinator、Executor、PLAN、PROGRESS 与 runtime event 仅作历史证据，不得复用为新 attempt 的 completion evidence。

## Attempt 1 Hard Gates

1. 对 source/destination 使用对称列集合与规范化值比较，真实 second-run 必须为 exit 0、row count/关键值不变。
2. AC10 必须显式传临时 fixture `--source`，并证明 non-zero 来自 same-PK conflict，既有目标值未被覆盖。
3. AC11 必须在同一 table transaction 中先成功执行至少一行、后续行真实失败，并证明先前行被 rollback。
4. setup/teardown 不得宽泛吞 cleanup 异常；AC12 必须注入或制造 cleanup failure 并断言异常向上可见，不能用会吞掉 `self.fail()` 的宽泛 catch。
5. source read/validation exception 必须可见并返回 non-zero；新增 missing-source 测试，且该测试不得依赖 MySQL secret 或被 class-level MySQL setup 阻断。
6. integration tests 必须隔离状态或显式重建 fixture，不能依赖 unittest 方法名排序。
7. Hermes runtime 必须先验证专用 secret presence、权限和 database identity；任何失败均转 infrastructure/security BLOCKED，禁止 fallback、skip 或写入 `revid_db`。
8. 生成 revision `-08` / attempt 1 的全新 PLAN、PROGRESS、REPORT；Reviewer 独立复跑后才允许 HANDOFF。

## Recommendation

`DISPATCH FINAL BUSINESS REWORK ATTEMPT 1`

