# Revid — 当前项目状态

> 更新时间：2026-06-26
> 状态来源：Codex PMC 自动治理、Hermes scheduled reports 与 fresh source/diff audit

## Current Phase

`Phase 4 - Personal Integration Edition（执行中）`

## Current Task

- `T4-002`：Unit A correction revision `-13` 已 PMC PASS；Queue revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14` 已批准，下一步执行 Unit B same-PK conflict 与 partial rollback unit-test 语义验证。

## Latest PMC Verdicts

|| Task | Verdict | Evidence ||
|---|---|---|---|
| T4-001 | PASS，进入 done | MySQL 8.0.43；Alembic head；12/12 InnoDB + utf8mb4；12/12 table comments；90/90 column comments；97 tests |
| T4-006 | PMC PASS，进入 done | `ai/reviews/REVIEW-T4-006-PMC-2026-06-24.md` |
| T4-002 | PMC REDISPATCH — Human approved | `ai/reviews/REVIEW-T4-002-PMC-REDISPATCH-2026-06-24.md`；Queue revision `phase4-wave2-manual-rework-2026-06-24-05` |
| T4-002 | PMC CHECKPOINT — Executor running，尚不可验收 | `ai/reviews/REVIEW-T4-002-PMC-CHECKPOINT-2026-06-24.md`；Executor `t_68c68e4e` |
| T4-002 | PMC BLOCKED — Executor retries exhausted，partial implementation unverified | `ai/reviews/REVIEW-T4-002-PMC-EXECUTOR-BLOCKED-2026-06-24.md` |
| T4-002 | PMC RECOVERY DISPATCH — 新 revision 已批准 | `ai/reviews/REVIEW-T4-002-PMC-RECOVERY-DISPATCH-2026-06-24.md`；Queue revision `phase4-wave2-recovery-dispatch-2026-06-24-07` |
| T4-002 | PMC REWORK — final business attempt 1 approved | `ai/reviews/REVIEW-T4-002-PMC-REWORK-2026-06-25.md`；Queue revision `phase4-wave2-final-rework-2026-06-25-08` |
| T4-002 | PMC BLOCKED — final attempt retry exhausted，无验收证据 | `ai/reviews/REVIEW-T4-002-PMC-FINAL-ATTEMPT-BLOCKED-2026-06-25.md`；Queue revision `phase4-wave2-final-attempt-blocked-2026-06-25-09` |
| T4-002 | PMC BLOCKED — runtime diagnostic 已审阅，但缺少 revid-backend 同 profile 证明 | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-2026-06-25.md`；不发布 continuation Queue |
| T4-002 | PMC CONTINUATION APPROVED — Human Owner clarified runtime owner；发布 continuation Queue | `ai/reviews/REVIEW-T4-002-PMC-CONTINUATION-APPROVAL-2026-06-25.md`；Queue revision `phase4-wave2-final-attempt-continuation-2026-06-25-10` |
| T4-002 | PMC RUNTIME ADVISORY — revision -10 parent-child runtime deadlock，等待 Hermes runtime diagnostics | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV10-2026-06-25.md` |
| T4-002 | **Runtime Owner Diagnostic — revision -10** | `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV10-2026-06-25.md`；`STILL_INFRA_BLOCKED — NEEDS_BOUNDED_WORK_UNIT_SPLIT` |
| T4-002 | **PMC Request — Bounded Work Unit Split** | `ai/reports/PMC-REQUEST-T4-002-BOUNDED-WORK-UNIT-SPLIT-2026-06-25.md`；已由 PMC 批准 Unit A |
| T4-002 | PMC APPROVED — bounded work unit split；Unit A static fixes dispatch | `ai/reviews/REVIEW-T4-002-PMC-BOUNDED-SPLIT-APPROVAL-2026-06-25.md`；Queue revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11` |
| T4-002 | PMC INFRA CONTINUATION — Unit A Coordinator timeout，批准一次受控 redispatch | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-COORDINATOR-TIMEOUT-2026-06-26.md`；Queue revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` |
| T4-002 | PMC REWORK — Unit A fresh verification failed missing-source secret gate and cleanup patch binding | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-REWORK-2026-06-26.md`；Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` |
| T4-002 | PMC BLOCKED — Unit A correction code fixed, but revision `-13` evidence chain is inconsistent | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-CORRECTION-BLOCKED-2026-06-26.md`；REPORT/HANDOFF still declare revision `-12`; handoff card missing |
| T4-002 | PMC PASS — Unit A correction revision `-13`; Unit B queued | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-CORRECTION-PASS-2026-06-26.md`；Queue revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14` |

## Verified Baseline

- T4-002 安全复验：排除 destructive `DisposableMySQLTests` 后 29 tests passed；源码内存语法检查 passed。
- frontend：`npm run build` passed，4622 modules transformed。
- MySQL：8.0.43；`revid_db` revision `a1b2c3d4e5f6`；12 张 app table 均为 InnoDB/utf8mb4，表与字段备注完整。
- 系统 Python 缺少 `annotated_doc`；backend 验证必须使用项目 `.venv` 或先修复环境。
- 工作区存在大量未提交修改，Executor 必须先核对目标文件 diff，不得覆盖其他任务或用户工作。

## Ready / Running

- 当前 Queue revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14` 已 APPROVED；等待 Hermes ACK 并创建 fresh short-lived Coordinator。Unit B 仅允许 same-PK conflict 与 partial rollback unit-test 语义，不允许 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE 或 migration write。
- T4-010 — T4-006 dependency 已满足，但尚未进入 APPROVED Queue，不得执行。
- Units C-E 仅作为后续顺序计划，尚未进入 APPROVED Queue；必须等待 Unit B REPORT/REVIEW/HANDOFF 与 PMC 审查。

## Blockers

- T4-003 继续依赖 T4-002 完成与 PMC 验收。
- T4-002 Unit A revision `-11`：Coordinator `t_083a9aab` run `#84` 在 121s timeout，未创建 Executor/Reviewer；该 chain 已终止，不得复用。
- T4-002 revision `-10`：Coordinator `t_b788cdb9` run `#82` 在 908s timeout；Executor `t_3769f8ec` run `#83` `pid not alive` crash 后因 parent blocked 无法 claim retry；REPORT/Independent REVIEW/HANDOFF 均不存在。
- T4-002 Unit A revision `-12`：只允许修改 `backend/scripts/migrate_sqlite_to_mysql.py`、`backend/tests/test_migration_tool.py` 及 Unit A PLAN/PROGRESS/REPORT/REVIEW/HANDOFF；Coordinator dispatch budget 为 300s；禁止 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE 和 migration write。
- T4-002 Unit A revision `-12` 已 HANDOFF_READY 但 PMC 未通过：fresh missing-source check 仍先返回 `REVID_TEST_MYSQL_ADMIN_URL is not set`，AC12 cleanup failure injection patch 未命中实际 local callable binding，REPORT/Independent REVIEW 未准确覆盖 `backend/tests/test_migration_tool.py` diff。
- T4-002 Unit A correction revision `-13`：PMC final acceptance 已通过；不得重复 dispatch 或复用 revision `-13` chain。
- T4-002 Unit B revision `-14`：只允许修改 `backend/scripts/migrate_sqlite_to_mysql.py`、`backend/tests/test_migration_tool.py` 及 Unit B PLAN/PROGRESS/REPORT/REVIEW/HANDOFF；不允许 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE、migration write、Unit C 或 attempt 2。
- T4-002 revision `-08`：Executor run `#78` timeout，retry run `#79` `pid not alive`；process retry `1/1` exhausted，REPORT/Independent REVIEW/HANDOFF 均不存在。
- 2026-06-25 12:10 runtime diagnostic 已说明 run `#78` 更像 900s budget timeout、run `#79` 为 process crash；Human Owner 已确认 `revid-pm` 即 Hermes runtime owner，并接受该 diagnostic 的 `READY_FOR_CONTINUATION` 结论作为解阻依据。
- historical partial diff 曾未通过真实 MySQL 13 tests；Unit A correction 已通过 fresh static verification 和同 revision/attempt evidence chain，但 full MySQL verification 仍未执行，需等 Unit C。
- continuation 条件：Hermes 应为 Executor 使用 1800s runtime budget；若 runtime 不支持该预算，则必须拆成适配现有限制的 bounded work units。禁止 attempt 2，禁止清零 failure fingerprint。
- T4-002 旧 Executor `t_68c68e4e` 的 run `#72`、`#73` 均因 `pid not alive` crash，旧 chain 已作废且禁止复用；该历史不再阻止 revision `-07` 创建新 chain。
- revision `-07` 只有 PLAN 和未完成 PROGRESS，没有 REPORT、Independent REVIEW 或 HANDOFF；execution 已终止，旧 chain 不再 active。
- 旧 Coordinator `t_d626b42d` 与 Executor child `t_4a89bb5e` 已作废；禁止手工恢复、claim、promote、unblock 或复用。
- PMC 已基于 Gateway UP、无 active worker 与 Human User 明确推进指令接受一次 recovery dispatch 风险；不再等待额外 worker stability 证明。
- 禁止在用户现有数据库执行 downgrade/drop/truncate；destructive 验证只能在专用测试库并获得明确授权。
- T4-002 partial implementation 的 fresh audit 仍发现 idempotency comparison 不对称、AC10 false-positive、AC11 未制造 mid-batch rollback、cleanup failure 被宽泛 catch 吞没、missing-source coverage 缺失和 test isolation 不足；必须按 final PMC REWORK review 修复。

## Next Review Gate

- T4-002：等待 Hermes 执行 Unit B revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14`，并提供 Unit B PLAN/PROGRESS/REPORT、Independent REVIEW 与 HANDOFF；Unit C 必须等待 PMC 对 Unit B HANDOFF 的最终 PASS。
- T4-006：已完成并归档。依赖 T4-006 的 Task 仅视为该 dependency 已满足；是否执行仍由后续 Queue revision 决定。
