# Task: SQLite → MySQL 数据迁移工具

## Task ID
T4-002

## Current Attempt

- Human-approved Revision：`phase4-wave2-manual-rework-2026-06-24-01`
- Dispatch Revision：`phase4-wave2-manual-rework-2026-06-24-03`
- Governance Revision：`phase4-wave2-dispatch-blocked-2026-06-24-04`
- Redispatch Revision：`phase4-wave2-manual-rework-2026-06-24-05`
- Blocking Governance Revision：`phase4-wave2-executor-blocked-2026-06-24-06`
- Recovery Dispatch Revision：`phase4-wave2-recovery-dispatch-2026-06-24-07`
- Final Rework Revision：`phase4-wave2-final-rework-2026-06-25-08`
- Final Attempt Blocking Revision：`phase4-wave2-final-attempt-blocked-2026-06-25-09`
- Final Attempt Continuation Revision：`phase4-wave2-final-attempt-continuation-2026-06-25-10`
- Unit A Static Fixes Revision：`phase4-wave2-unit-a-static-fixes-2026-06-25-11`
- Unit A Coordinator Budget Revision：`phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`
- Unit A PMC Rework Revision：`phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`
- Unit B Unit Tests Revision：`phase4-wave2-unit-b-unit-tests-2026-06-26-14`
| Status：`UNIT B APPROVED — Unit A correction revision -13 passed PMC; Unit B same-PK and rollback unit-test semantics queued` |
| Approved By：Codex Project Master Controller（继承 Human User 的 T4-002 product/destructive authorization） |
| Previous Coordinator Card：`t_b788cdb9` (blocked; timed_out run #82) |
| Previous Executor Card：`t_3769f8ec` (attempt 1 continuation; crashed run #83; retry blocked by parent) |
| Previous Reviewer Card：`t_4014b64c` (todo; parent blocked) |
- PMC Review：`ai/reviews/REVIEW-T4-002-PMC-2026-06-24.md`
- Dispatch Review：`ai/reviews/REVIEW-T4-002-PMC-DISPATCH-2026-06-24.md`
- Blocking Review：`ai/reviews/REVIEW-T4-002-PMC-DISPATCH-BLOCKED-2026-06-24.md`
- Redispatch Review：`ai/reviews/REVIEW-T4-002-PMC-REDISPATCH-2026-06-24.md`
- Running Checkpoint：`ai/reviews/REVIEW-T4-002-PMC-CHECKPOINT-2026-06-24.md`
- Executor Blocking Review：`ai/reviews/REVIEW-T4-002-PMC-EXECUTOR-BLOCKED-2026-06-24.md`
- Recovery Dispatch Review：`ai/reviews/REVIEW-T4-002-PMC-RECOVERY-DISPATCH-2026-06-24.md`
- Final Rework Review：`ai/reviews/REVIEW-T4-002-PMC-REWORK-2026-06-25.md`
- Final Attempt Blocking Review：`ai/reviews/REVIEW-T4-002-PMC-FINAL-ATTEMPT-BLOCKED-2026-06-25.md`
- Continuation Approval Review：`ai/reviews/REVIEW-T4-002-PMC-CONTINUATION-APPROVAL-2026-06-25.md`
- Revision -10 Runtime Advisory：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV10-2026-06-25.md`
- Bounded Split Approval：`ai/reviews/REVIEW-T4-002-PMC-BOUNDED-SPLIT-APPROVAL-2026-06-25.md`
- Unit A Coordinator Timeout Decision：`ai/reviews/REVIEW-T4-002-PMC-UNIT-A-COORDINATOR-TIMEOUT-2026-06-26.md`
- Unit A PMC Rework Decision：`ai/reviews/REVIEW-T4-002-PMC-UNIT-A-REWORK-2026-06-26.md`
- Unit A Correction Blocking Review：`ai/reviews/REVIEW-T4-002-PMC-UNIT-A-CORRECTION-BLOCKED-2026-06-26.md`
- Unit A Evidence Correction Request：`ai/reviews/REVIEW-T4-002-PMC-EVIDENCE-CORRECTION-REQUEST-2026-06-26.md`
- Unit A Correction PASS：`ai/reviews/REVIEW-T4-002-PMC-UNIT-A-CORRECTION-PASS-2026-06-26.md`
- Safety Decision：`ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`

revision `phase4-wave2-recovery-dispatch-2026-06-24-07` 已终止：Coordinator `t_e23d9043` done；Executor `t_748c116d` attempt 0 的 run `#75` crash、run `#76` gave_up，process retry `2/2 exhausted`，且没有 REPORT、Independent REVIEW 或 HANDOFF。

revision `phase4-wave2-final-rework-2026-06-25-08` 已终止：Executor run `#78` timeout，唯一 retry run `#79` 以 `pid not alive` crash；没有 REPORT、Independent REVIEW 或 HANDOFF。partial diff 仍保留，但未通过真实 MySQL 验证，且 fresh static audit 发现 missing-source 仍依赖 secret gate、AC12 cleanup failure patch 未作用于实际函数绑定。

revision `phase4-wave2-final-attempt-continuation-2026-06-25-10` 已由 PMC 批准并被 Hermes ACK：Human Owner 确认 `revid-pm` 为 Hermes runtime owner，并接受 2026-06-25 12:10 diagnostic 的 `READY_FOR_CONTINUATION` 结论。该 revision 是 business attempt 1 continuation，不是 attempt 2。当前 fresh continuation chain 进入 `EXECUTOR_CRASHED_PARENT_BLOCKED`：Coordinator `t_b788cdb9` timeout，Executor `t_3769f8ec` crash 后因 parent blocked 无法 retry，暂无 REPORT、Independent REVIEW 或 HANDOFF。

revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11` 已由 PMC 批准：这是 T4-002 bounded work unit split 的首个 executable revision。Unit A 仅覆盖静态修复，不需要 MySQL，不允许读取 `.env` 或 database credential，不允许执行 CREATE/DROP/TRUNCATE/DELETE/migration write。

revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11` 已终止：Coordinator `t_083a9aab` run `#84` 在 121s 超过 120s limit，且未创建 Executor/Reviewer。PMC 批准一次受控 Unit A redispatch revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`，Coordinator dispatch budget 调整为 300s；若再次派发失败，T4-002 进入 infrastructure blocked，不再发布业务 Queue。

revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` 已 HANDOFF_READY 但 PMC 最终验收未通过：fresh verification 证明 missing-source 仍先被 `REVID_TEST_MYSQL_ADMIN_URL` secret gate 阻断，AC12 cleanup failure injection patch 未命中实际 callable binding，且 REPORT/Independent REVIEW 未准确覆盖 `backend/tests/test_migration_tool.py` 的继承 diff。PMC 批准 narrow Unit A correction revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`；该 correction 仍为 business attempt 1 continuation，不是 attempt 2。

revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` 已由 PMC 最终验收通过：fresh verification 证明 missing-source-before-secret-gate、AC12 patch binding 和 revision `-13` REPORT/Independent REVIEW addendum/HANDOFF 证据链一致。

revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14` 已由 PMC 批准：这是 T4-002 bounded work unit split 的第二个 executable revision。Unit B 仅覆盖 same-PK conflict 与 partial rollback 的 unit-test 语义，不需要 MySQL，不允许读取 `.env` 或 database credential，不允许执行 CREATE/DROP/TRUNCATE/DELETE/migration write。

## Current Continuation Conditions

1. Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` 已 PMC PASS，仅作为 Unit A correction 完成证据；不得重复 ACK 或 dispatch。
2. business attempt ordinal 仍为 `1`；禁止 attempt 2，禁止通过 revision 清零任何 infrastructure/business fingerprint。
3. 当前 executable revision 为 `phase4-wave2-unit-b-unit-tests-2026-06-26-14`；Hermes Coordinator 必须短生命周期 dispatch 后 done，Executor target 800s。
4. Unit B 必须保留并审计两个 allowed files 的 partial diff，聚焦 AC10 same-PK conflict 与 AC11 partial rollback unit-test 语义；不得进入 Unit C 或 MySQL integration。
5. 禁止手工 claim、promote、unblock、重试或复用 revision `-08` 及更早 card。
6. Unit B 必须继承全部历史 failure fingerprints，尤其是 `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`。

## Bounded Work Units

| Unit | Status | Scope | MySQL Required |
|---|---|---|---:|
| A | PMC PASS via correction revision `-13` | Static fixes for validation order, cleanup failure visibility, idempotency comparison and rollback test preparation | No |
| A-correction | PMC PASS revision `-13` | Missing-source before secret gate, AC12 actual patch binding, Unit A evidence correction | No |
| B | approved executable revision `-14` | Same-PK and rollback unit tests | No |
| C | planned only | Disposable MySQL integration tests under ADR-003 | Yes |
| D | planned only | Consolidated final REPORT | No |
| E | planned only | Independent REVIEW and HANDOFF | No |

Units C-E require separate PMC Queue approval after Unit B evidence is reviewed.

## Historical Final Business Rework Conditions (revision -08, terminal)

以下条件是 revision `-08` 的原始授权约束，仅作历史记录；当前由上方 Current Continuation Conditions 控制，不得重新执行。

1. revision `-08` 当时要求创建新的 Coordinator/Executor chain 和 revision-based idempotency key；业务 attempt ordinal 固定为 `1`。
2. attempt 1 是 T4-002 最后一次 business REWORK；禁止 attempt 2，也禁止用后续 revision 清零旧 failure fingerprint。
3. 禁止手工 claim、promote、unblock 或复用任何 `-07` 及更早 card/evidence chain。
4. 新 Executor 必须保留并审计两个 allowed files 的 current partial diff，按 PMC final rework review 修复，不得无依据整文件覆盖。
5. 使用 revision `-08` / attempt 1 专属 PLAN/PROGRESS/REPORT，并按静态语义修复、隔离 integration verification、REPORT 三个 bounded checkpoint 落盘。
6. destructive verification 前必须确认 `REVID_TEST_MYSQL_ADMIN_URL` presence、权限与 database identity 精确为 `revid_test_t4_002`；任一 Hard Gate 失败时立即 BLOCKED。

## Phase
Phase 4A — MySQL 主数据库

## Category
Backend / Data Migration

## Priority
P0

## Assigned To
Backend Executor

## Objective
提供可 dry-run、可重复执行、可验证的 ETL 工具，将 `revid.db` 的现有数据迁移到由 Alembic 创建的 MySQL schema。

## Chosen Technology
- Python CLI script。
- SQLAlchemy Session/Core 做结构化读取和写入。
- Alembic 只负责 schema；ETL 只负责 data。

## Scope
- 允许新增：`scripts/migrate_sqlite_to_mysql.py`、迁移专项测试和纯计数/校验报告模板。
- 必要时允许修改：`backend/models/**` 中已确认的跨数据库类型兼容问题。
- 禁止修改：前端、业务 API、原始 `revid.db`、MySQL credentials。

## Dependencies
T4-001 已审查通过，MySQL schema 已由 Alembic 创建。

## Implementation Requirements
1. CLI 默认 dry-run；只有显式 `--execute` 才写入 MySQL。
2. source path 和 target connection 从参数/env 读取；密码不得出现在命令输出。
3. 按 foreign key 依赖顺序迁移；每批使用 transaction。
4. 使用主键 upsert/存在性检查实现幂等，重复执行不得重复额度流水或资产。
5. 校验每表 row count、主键集合、外键孤儿、关键 JSON 和 quota 数值。
6. 输出只包含表名、数量、checksum、耗时和错误摘要，不输出 raw_profile、token 或 secret。
7. 任何校验失败返回非零 exit code，且不得切换 runtime。

## Acceptance Criteria
- [ ] dry-run 不改变 MySQL 数据。
- [ ] 在临时 SQLite/MySQL 测试数据上完整迁移成功。
- [ ] 连续执行两次后 row count 和业务值保持不变。
- [ ] 人为制造外键孤儿或重复冲突时脚本失败并给出具体表名。
- [ ] 用户的原始 `revid.db` 未被覆盖或删除。
- [ ] 迁移报告证明 SQLite/MySQL 的 12 张表数据一致。
- [ ] fixture 只接受 `REVID_TEST_MYSQL_ADMIN_URL`；secret 缺失时明确 BLOCKED，无 credential fallback。
- [ ] 使用 structured URL API，并在 CREATE/DROP 前后证明 database identity 精确为 `revid_test_t4_002`。
- [ ] 测试 schema 由 Alembic `upgrade head` 创建，不手写 12-table DDL。
- [ ] same-PK different-value conflict 实际触发 non-zero exit，且既有数据未被静默覆盖。
- [ ] partial rollback 测试实际制造 batch 中途失败，并证明该 batch 没有部分提交。
- [ ] cleanup 失败可见且会导致失败或 BLOCKED，不静默吞异常。

## Verification Commands
```powershell
python scripts/migrate_sqlite_to_mysql.py --dry-run
python scripts/migrate_sqlite_to_mysql.py --execute
cd backend
python -m unittest discover -s tests -p "test_*migration*.py"
```

## Manual Acceptance
使用 Navicat 对比 SQLite 源数据摘要和 MySQL 中 users、quotas、quota_ledger、projects、canvas_nodes、assets 的记录数量和关键值。

## Deliverables
- 迁移 CLI 与测试。
- `ai/tasks/doing/TASK-T4-002-PLAN-phase4-wave2-final-rework-2026-06-25-08.md`
- `ai/tasks/doing/TASK-T4-002-PROGRESS-phase4-wave2-final-rework-2026-06-25-08.md`
- revision `-10` / attempt 1 continuation 的新 PLAN、PROGRESS、REPORT；必须声明 revision、attempt continuation 和 inherited failure fingerprints，不得覆盖 revision `-08` 产物。
- revision `-10` / attempt 1 continuation 的全新 Independent REVIEW 与 HANDOFF。
- Unit A revision `-11` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-A-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-A-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-A.md`
  - `ai/reviews/REVIEW-T4-002-UNIT-A.md`
  - `ai/handoffs/HANDOFF-T4-002-UNIT-A.md`
- Unit B revision `-14` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-B-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-B-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-B.md`
  - `ai/reviews/REVIEW-T4-002-UNIT-B.md`
  - `ai/handoffs/HANDOFF-T4-002-UNIT-B.md`

## Codex Prompt
先读取 T4-001 报告及 Alembic revision。禁止解析 `sqlite_master` 后字符串替换 DDL；使用 SQLAlchemy 做 data ETL。编码前创建 PLAN/PROGRESS，完成 dry-run、execute、幂等和一致性测试后提交 REPORT。不得删除或覆盖任何数据库。
