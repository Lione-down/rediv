# Hermes Automatic Queue

该文件是 Hermes scheduled mode 的任务授权白名单。只有 Human User 或 Codex Project Master Controller 明确批准的波次才能写为 `APPROVED`。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-unit-b-unit-tests-2026-06-26-14` |
| Status | `APPROVED` |
| Approved By | `Codex Project Master Controller` |
| Execution Mode | `scheduled` |
| Task ID | `T4-002` |
| Project Task File | `ai/tasks/todo/TASK-T4-002.md` |
| Action | `UNIT B — same-PK conflict and partial rollback unit-test semantics only; no MySQL; no secrets; no destructive operations` |
| Executor Profile | `revid-backend` |
| Review Profile | `revid-reviewer` |
| Parallel Group | `serial-t4-002-unit-b-unit-tests-14` |
| Attempt Policy | `business attempt remains 1 continuation; attempt 2 prohibited; Unit B only; inherit all fingerprints; do not dispatch Unit C` |
| Previous Failure Fingerprint | `PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout` + `PROCESS_RETRY_EXHAUSTED: coordinator timed out before dispatch` + `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE` + `T4-002-ATTEMPT1-STATIC: SECRET_BEFORE_SOURCE_VALIDATION + INEFFECTIVE_CLEANUP_PATCH_BINDING + CLEANUP_FAILURE_SWALLOWED` + `COORDINATOR_TIMEOUT_DEADLOCK: parent_timed_out blocks executor_retry` + `COORDINATOR_PRE_DISPATCH_TIMEOUT: no executor/reviewer created` + `T4-002-UNIT-A-PMC-REWORK: MISSING_SOURCE_STILL_SECRET_GATED + CLEANUP_PATCH_WRONG_BINDING + UNIT_A_EVIDENCE_MISMATCH` |
| Hard Gates | `REVIEW-T4-002-PMC-UNIT-A-CORRECTION-PASS-2026-06-26.md + REVIEW-T4-002-PMC-BOUNDED-SPLIT-APPROVAL-2026-06-25.md + REVIEW-T4-002-PMC-REWORK-2026-06-25.md + ADR-003` |
| Runtime Budget Request | `Unit B Executor target 800s; Coordinator dispatch budget 300s; Coordinator must dispatch Executor/Reviewer then transition done and must not monitor Executor until timeout` |
| Stop After | `UNIT_B_HANDOFF_READY for Codex PMC final acceptance; do not start Unit C` |

## Tasks

当前 executable Task 是 T4-002 Unit B revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14`。Hermes 应 ACK 此 revision，创建 fresh short-lived Coordinator，dispatch Unit B Executor 和 Reviewer，并在 Unit B HANDOFF_READY 后停止等待 Codex PMC。

Unit B 只允许处理 same-PK conflict 与 partial rollback unit-test 语义。允许的业务文件仅限：

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

Unit B required artifacts:

- `ai/tasks/doing/TASK-T4-002-UNIT-B-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-B-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-B.md`
- `ai/reviews/REVIEW-T4-002-UNIT-B.md`
- `ai/handoffs/HANDOFF-T4-002-UNIT-B.md`

Unit B 不需要 MySQL，不允许读取 `.env` 或使用任何 database credential，不允许执行 CREATE/DROP/TRUNCATE/DELETE/migration write，不允许 Unit C。

Revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` 已 HANDOFF_READY 但 PMC 最终验收未通过；不得把该 HANDOFF 作为 Unit A PASS 或 Unit B dispatch 依据。

Revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` 已由 PMC PASS：`ai/reviews/REVIEW-T4-002-PMC-UNIT-A-CORRECTION-PASS-2026-06-26.md`。不得重复 dispatch revision `-13` 或复用旧 card/evidence chain。

Revision `-12` stale REPORT/REVIEW/HANDOFF 仍不得作为当前完成证据；revision `-13` additive correction artifacts 是 Unit A acceptance basis。

Revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11` 已因 Coordinator pre-dispatch timeout 终止；不得复用、claim、promote、unblock 或 retry card `t_083a9aab`。

## Superseded Chain (revision -10)

| Type | Card ID | Profile | Status |
|---|---|---|---|
| Coordinator | `t_b788cdb9` | revid-pm | blocked (timed_out run #82) |
| Executor (attempt 1 continuation) | `t_3769f8ec` | revid-backend | todo / blocked by parent (crashed run #83) |
| Reviewer | `t_4014b64c` | revid-reviewer | todo / obsolete while blocked |

Revision `phase4-wave2-final-attempt-continuation-2026-06-25-10` is infrastructure blocked for queue purposes. Do not reuse, claim, promote, unblock, or retry these cards from the Unit A chain.

## Terminal Chain (revision -08)

|| Type | Card ID | Profile | Status |
|---|---|---|---|---|
| Coordinator | `t_fba90f6a` | revid-pm | done |
| Executor (attempt 1) | `t_8ee01149` | revid-backend | blocked (run #78 timeout; run #79 pid not alive) |
| Reviewer (attempt 0) | `t_e0024944` | revid-reviewer | todo / obsolete while blocked |

## Final Attempt Blocking Decision

- 正式 PMC verdict 见 `ai/reviews/REVIEW-T4-002-PMC-FINAL-ATTEMPT-BLOCKED-2026-06-25.md`。
- revision `-08` 已 terminal blocked；没有 REPORT、Independent REVIEW 或 HANDOFF，不具备验收条件。
- attempt 1 的 process retry 已耗尽；禁止 attempt 2，禁止重复 dispatch，禁止复用任何当前或历史 card。
- Human Owner 已确认 `revid-pm` 为 Hermes runtime owner，并接受 `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-2026-06-25.md` 的 `READY_FOR_CONTINUATION` 结论。
- revision `-10` 的恢复链已因 runtime parent-child deadlock 阻塞；当前恢复方式是 bounded Unit A revision `-11`，并必须继承全部 failure fingerprints。

## Historical Final Rework Decision (revision -08, terminal)

- revision `phase4-wave2-recovery-dispatch-2026-06-24-07` 已进入 terminal BLOCKED：Coordinator `t_e23d9043` done，Executor `t_748c116d` blocked，process retry `2/2 exhausted`，无 REPORT、Independent REVIEW 或 HANDOFF。
- 正式 PMC verdict 见 `ai/reviews/REVIEW-T4-002-PMC-REWORK-2026-06-25.md`。
- fresh audit 证明 partial implementation 仍有可在原 Scope/AC 内修复的业务语义缺陷，因此批准唯一且最后一次 business REWORK attempt 1。
- revision `-08` 必须创建全新的 Coordinator、Executor attempt 1、PLAN、PROGRESS、REPORT、REVIEW、HANDOFF 和 revision-based idempotency key。
- 禁止复用 revision `-07` 及更早 card/evidence chain；禁止 attempt 2 或通过后续 revision 清零 failure fingerprint。

## Manual Rework Authorization

- Human User 对 T4-002 manual REWORK 的产品方向与 destructive boundary 仍有效；ADR-003 授权边界不变。
- 旧 revision、旧 card、旧 REPORT、旧 REVIEW 和旧 HANDOFF 不得作为本轮完成证据。
- revision `-08` 的授权已因 terminal blocked 失效；revision `-09` 是历史 non-executable hold；revision `-10` 已 infrastructure blocked；revision `-11` 已 pre-dispatch timeout；revision `-12` 已 PMC_REWORK。
- attempt 1 的历史 process retry failures 已记录。当前只允许 revision `-14` Unit B unit-test semantics，不得无限重试或创建 attempt 2。
- 禁止手工 claim、promote、unblock 或复用任何旧 card。

## Final Rework Checkpoints

- Executor 必须先审计并保留两个 allowed files 的现有 partial diff，不得无依据整文件覆盖。
- 使用 revision `-08` / attempt 1 专属 PLAN/PROGRESS；每完成一个 bounded checkpoint 立即落盘。
- checkpoint A：修复对称 idempotency comparison、missing-source 路径、validation exception visibility、cleanup failure semantics 与 test isolation。
- checkpoint B：AC10 显式使用临时 source；AC11 同一 transaction 先成功写入、后续失败并证明 rollback。
- checkpoint C：在专用 database 完成 Alembic、identity、12-table、execute、second-run、conflict、rollback、cleanup 与 missing-source verification。
- checkpoint D：生成 revision `-08` / attempt 1 REPORT，随后进入 Independent Review。

## T4-002 Safety Gates

- Human User 与 Codex PMC 已明确授权创建和销毁唯一专用数据库 `revid_test_t4_002`；完整边界见 `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`。
- Hermes runtime 必须通过 secret/environment 注入 `REVID_TEST_MYSQL_ADMIN_URL`；Worker 不读取项目 `.env`，不得在卡片或报告中记录 secret。
- 测试代码只允许读取 `REVID_TEST_MYSQL_ADMIN_URL`；禁止回退 `REVID_MYSQL_URL`、`REVID_DB_*`、`MYSQL_ROOT_PASSWORD`、硬编码密码或其他 database。
- 允许 `CREATE DATABASE` / `DROP DATABASE` 的对象仅限精确名称 `revid_test_t4_002`。执行前必须读取 metadata 并断言目标名；禁止 wildcard、前缀匹配或 fallback database。
- target URL 必须使用 SQLAlchemy structured URL API 构造，禁止 regex 或字符串替换 credentials/database path。
- test schema 必须通过 Alembic `upgrade head` 创建，禁止 fixture 手写 12-table DDL。
- cleanup 失败必须形成失败或 BLOCKED 证据，不得静默吞异常。
- CLI 默认 dry-run，只有显式 `--execute` 才允许写入 MySQL。
- 禁止删除、覆盖或修改原始 `revid.db`；禁止 drop、truncate、reset 或清库。
- 在用户现有 MySQL 数据上执行写迁移前，必须先报告 dry-run 摘要；自动测试应使用隔离数据源/目标。
- 不得打印、复制或写入 credentials、完整 connection URL、token、raw profile。
- 迁移必须幂等；row count、主键、外键、关键 JSON 与 quota 校验失败时返回非零 exit code。
- integration tests 禁止硬编码绝对路径；必须使用专用 disposable MySQL test database，不得写用户现有 `revid_db`。
- 覆盖 execute、second-run、same-PK conflict、FK orphan、partial rollback、12-table consistency；missing-source test 不得因缺密码而 skip。
- rollback test 必须实际制造 batch 中途失败并验证未发生部分提交；test name 或成功路径不能代替 rollback 证据。
- same-PK comparison 必须使用对称列集合和规范化值；真实 second-run 必须 exit 0，不能把等值 existing row 误判为 conflict。
- AC10 必须显式使用临时 SQLite fixture，且 non-zero 原因必须证明来自 same-PK conflict。
- cleanup failure test 必须实际注入/制造失败并验证异常传播；禁止宽泛 catch 吞掉 `self.fail()` 或 setup/teardown cleanup exception。
- missing-source test 不得依赖 MySQL secret 或被 class-level MySQL setup 阻断；source read/validation exception 必须可见且 non-zero。
- 若 secret 缺失、权限不足或 database identity 无法证明，标记 BLOCKED；禁止回退到 `.env` 或 `revid_db`。

## Shared Authorization Rules

- 当前 revision `-14` 是唯一 executable APPROVED Queue；destructive verification is not authorized in Unit B。
- 发现目标文件存在未知归属 diff 时标记 BLOCKED；无关用户文件只记录风险，不扩大 scope。
- 当前 revision 必须使用 `phase4-wave2-unit-b-unit-tests-2026-06-26-14` + `T4-002` + `UNIT-B` 作为 idempotency key，不重复创建 running/review card。
- 历史 scheduled 卡 `t_ae07d489` 已过时，应标记 cancelled/obsolete，不得复用。
- Reviewer PASS 后等待 Codex PMC 最终验收，不自动流转到 Unit C、T4-003 或 T4-010。
- 需要 scope 变更、secret、destructive operation、外部服务或用户决策时停止并记录。

## Future Completion Gate

- T4-002 Unit B 具备 revision `-14` attempt 1 continuation 的最新 PLAN、PROGRESS、REPORT。
- Unit B REPORT 必须明确 same-PK conflict 与 partial rollback unit-test 语义、attempt 1 continuation 与 inherited failure fingerprints。
- T4-002 Unit B 具有同一 revision 的独立 REVIEW 与 HANDOFF；后续 Units C-E 必须等待 PMC 审查后另行批准。
- 测试、安全门、未验证项、风险和 rollback 行为证据已记录；若 Unit B 不能在无 MySQL/secret/destructive operation 下验证，必须 BLOCKED 并说明原因。
- 无 secret 泄露、越权修改或未确认的不可逆操作。
- 新 execution chain 必须由当前 PMC APPROVED revision `-14` 精确指定；旧 terminal chain 不得复用。

完成后生成新的 PMC handoff 并停止，不自动领取后续任务。

*最后更新：2026-06-26，Unit A correction PMC PASS；Unit B APPROVED revision -14*
