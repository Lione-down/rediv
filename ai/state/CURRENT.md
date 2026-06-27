# Revid — 当前项目状态

> 更新时间：2026-06-28
> 状态来源：Codex PMC 自动治理、Hermes scheduled reports 与 fresh source/diff audit

## Current Phase

`Phase 4 - Personal Integration Edition（执行中，T4-002 Unit B revision -15 已 PMC PASS；Unit C1 runtime-enforced revision -18 已批准）`

## Current Task

- `T4-002`：Unit A revision `-13` 与 Unit B revision `-15` 已 PMC PASS。Unit C1 revision `-18` Executor 已完成，两项真实 MySQL tests 通过；当前已发布 `REVIEW_DISPATCH_ONLY` lifecycle continuation，等待 Independent Review 与 post-review HANDOFF。

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
| T4-002 | Runtime diagnostic — Unit B revision `-14` ready for bounded continuation decision | `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV14-2026-06-26.md`；Coordinator `t_bbbf72bd` timeout 302s；Executor `t_7275328d` timeout 847s/848s；Gateway restored PID 6692；local `TestUnitB` 7 passed |
| T4-002 | PMC APPROVED — Unit B fresh bounded continuation revision `-15` | `ai/reviews/REVIEW-T4-002-PMC-UNIT-B-BOUNDED-CONTINUATION-2026-06-26.md`；Queue revision `phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15` |
|| T4-002 | Unit B revision `-15` 验证链已完成 — Executor `t_1a9f1d32` done，Independent Review `t_6b4b7bc8` VERDICT = PASS，HANDOFF `t_67184ab2` done | 7/7 TestUnitB 通过，0.27s，HANDOFF_READY_REV15，等待 PMC 最终验收 |
|| T4-002 | **HANDOFF_READY_REV15 — 等待 Codex PMC 最终验收** | 全证据链完整：PLAN, PROGRESS, REPORT, REVIEW(PASS), HANDOFF |
| T4-002 | **PMC PASS — Unit B revision `-15`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-B-REV15-PASS-2026-06-26.md`；fresh PMC verification：`TestUnitB` 7 passed in 0.38s，allowed business diff empty |
| T4-002 | **PMC APPROVED — Unit C disposable MySQL integration revision `-16`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C-MYSQL-INTEGRATION-APPROVAL-2026-06-26.md`；Queue revision `phase4-wave2-unit-c-mysql-integration-2026-06-26-16` |
| T4-002 | **PMC RUNTIME ADVISORY — Unit C revision `-16` Coordinator retry exhausted** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV16-2026-06-26.md`；无 Executor/REPORT/REVIEW/HANDOFF |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C1 fixture/schema preflight revision `-17`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-BOUNDED-CONTINUATION-APPROVAL-2026-06-27.md`；精简 Task 与 120s Coordinator dispatch target |
| T4-002 | **PMC RUNTIME ADVISORY — Unit C1 revision `-17` Coordinator retry exhausted** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV17-2026-06-27.md`；无 Executor/PLAN/REPORT/REVIEW/HANDOFF，不发布 rev18 |
| T4-002 | **PMC BLOCKED — 选择重评 execution route** | `ai/reviews/REVIEW-T4-002-PMC-QUEUE-DECISION-REV17-2026-06-28.md`；不立即拆分 rev17，不单独提高 budget，不发布 rev18 |
| T4-002 | **PMC BLOCKED — rev17 runtime diagnostic 证据不足** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV17-2026-06-28.md`；未定位具体 pre-dispatch 步骤，未提供越过旧 boundary 的 same-profile sustained-run |
| T4-002 | **PMC BLOCKED — root-cause comparator 无效且 Hermes state 冲突** | `ai/reviews/REVIEW-T4-002-PMC-ROOT-CAUSE-REV17-2026-06-28.md`；run #96 包含 tests/artifacts，不证明 dispatch duration；rev17 仍 terminal |
| T4-002 | **PMC RUNTIME REMEDIATION GUIDANCE — thin dispatcher** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-REMEDIATION-GUIDANCE-2026-06-28.md`；要求 Coordinator mode tool boundary、step timings、3 次 isolated smoke 与 negative test |
| T4-002 | **PMC BLOCKED — thin-dispatcher remediation evidence invalid** | `ai/reviews/REVIEW-T4-002-PMC-THIN-DISPATCHER-REMEDIATION-2026-06-28.md`；仅 2 次成功 smoke，negative path 未执行，无 numeric step timings，status 仍使用非法 READY state |
| T4-002 | **PMC PASS — runtime remediation verified; revision -18 approved** | `ai/reviews/REVIEW-T4-002-PMC-THIN-DISPATCHER-RUNTIME-FIX-PASS-2026-06-28.md`；runtime exact policy + 94 tests + final smokes 3/3；Queue `phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18` |
| T4-002 | **PMC CONTINUATION APPROVED — revision -18 review-dispatch lifecycle stage** | `ai/reviews/REVIEW-T4-002-PMC-REV18-LIFECYCLE-GAP-2026-06-28.md`；Executor 2/2 PASS，Reviewer stage 缺失，Queue `phase4-wave2-unit-c1-rev18-review-dispatch-2026-06-28-18r1` |

## Verified Baseline

- T4-002 安全复验：排除 destructive `DisposableMySQLTests` 后 29 tests passed；源码内存语法检查 passed。
- frontend：`npm run build` passed，4622 modules transformed。
- MySQL：8.0.43；`revid_db` revision `a1b2c3d4e5f6`；12 张 app table 均为 InnoDB/utf8mb4，表与字段备注完整。
- 系统 Python 缺少 `annotated_doc`；backend 验证必须使用项目 `.venv` 或先修复环境。
- 工作区存在大量未提交修改，Executor 必须先核对目标文件 diff，不得覆盖其他任务或用户工作。

## Ready / Running

- 当前 executable Queue 为同一 business revision -18 的 lifecycle continuation `phase4-wave2-unit-c1-rev18-review-dispatch-2026-06-28-18r1`。Hermes 只应创建一个 `REVIEW_DISPATCH_ONLY` Coordinator stage，由该 stage 派发 Reviewer 与 dependent `HANDOFF_ONLY` stage。
- T4-010 — T4-006 dependency 已满足，但尚未进入 APPROVED Queue，不得执行。
- Unit C2/C3 与 Units D-E 仅作为后续顺序计划，尚未进入 APPROVED Queue；必须等待 Unit C1 Independent REVIEW verdict 与 PMC final PASS。

## Blockers

- T4-003 继续依赖 T4-002 完成与 PMC 验收。
- T4-002 Unit B revision `-15`：PMC final acceptance 已通过；不得重复 dispatch 或复用 rev15 chain。
- T4-002 Unit A revision `-11`：Coordinator `t_083a9aab` run `#84` 在 121s timeout，未创建 Executor/Reviewer；该 chain 已终止，不得复用。
- T4-002 revision `-10`：Coordinator `t_b788cdb9` run `#82` 在 908s timeout；Executor `t_3769f8ec` run `#83` `pid not alive` crash 后因 parent blocked 无法 claim retry；REPORT/Independent REVIEW/HANDOFF 均不存在。
- T4-002 Unit A revision `-12`：只允许修改 `backend/scripts/migrate_sqlite_to_mysql.py`、`backend/tests/test_migration_tool.py` 及 Unit A PLAN/PROGRESS/REPORT/REVIEW/HANDOFF；Coordinator dispatch budget 为 300s；禁止 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE 和 migration write。
- T4-002 Unit A revision `-12` 已 HANDOFF_READY 但 PMC 未通过：fresh missing-source check 仍先返回 `REVID_TEST_MYSQL_ADMIN_URL is not set`，AC12 cleanup failure injection patch 未命中实际 local callable binding，REPORT/Independent REVIEW 未准确覆盖 `backend/tests/test_migration_tool.py` diff。
- T4-002 Unit A correction revision `-13`：PMC final acceptance 已通过；不得重复 dispatch 或复用 revision `-13` chain。
- T4-002 Unit B revision `-14`：只允许修改 `backend/scripts/migrate_sqlite_to_mysql.py`、`backend/tests/test_migration_tool.py` 及 Unit B PLAN/PROGRESS/REPORT/REVIEW/HANDOFF；不允许 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE、migration write、Unit C 或 attempt 2。
- T4-002 Unit B revision `-14` 当前不可验收：REPORT 存在但 Executor card 未完成，Independent REVIEW 与 HANDOFF 缺失；Hermes Gateway 已恢复；local bounded verification shows Unit B tests are fast (`7 passed`), so blocker is runtime/dispatcher completion, not business-test duration。
- T4-002 Unit C revision `-16`：Coordinator `t_aeaefef4` 在 Executor dispatch 前 300s timeout，process retry `1/1` exhausted；没有 PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。该 chain 已终止，不得复用或重试。
- T4-002 Unit C1 revision `-17`：Coordinator dispatch target 为 120s；若再次 pre-dispatch timeout，转 infrastructure blocked，不自动发布 rev18。若 `REVID_TEST_MYSQL_ADMIN_URL` 缺失、权限不足或 identity 不明，必须 BLOCKED；禁止回退 `.env` 或触碰 `revid_db`。
- T4-002 Unit C1 revision `-17` 已触发上述 stop condition：Coordinator `t_3e1f6a06` run `#101` 在 Executor dispatch 前 120s timeout，process retry `1/1` exhausted；没有 Executor、PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。不得重复 dispatch 或自动发布 rev18。
- T4-002 thin-dispatcher remediation：Smoke 1 `t_20945c04` crash，只有 runs `#103/#105` 两次成功；run `#107` 未实际尝试违规操作；metadata 只有 timing step 名称而无数值 elapsed；worker logs 出现 allowlist 外的 navigate/skills/cron/terminal；当前不能证明 runtime tool boundary。
- 上述 Hermes 自报 remediation blocker 已由后续 Codex direct runtime fix supersede：mode-specific exact policy 已进入 worker spawn、schema filtering 和 invalid-call fast fail；旧 failure fingerprint 仍由 revision `-18` 继承，不得删除。
- T4-002 revision `-08`：Executor run `#78` timeout，retry run `#79` `pid not alive`；process retry `1/1` exhausted，REPORT/Independent REVIEW/HANDOFF 均不存在。
- 2026-06-25 12:10 runtime diagnostic 已说明 run `#78` 更像 900s budget timeout、run `#79` 为 process crash；Human Owner 已确认 `revid-pm` 即 Hermes runtime owner，并接受该 diagnostic 的 `READY_FOR_CONTINUATION` 结论作为解阻依据。
- historical partial diff 曾未通过真实 MySQL 13 tests；Unit A correction 已通过 fresh static verification 和同 revision/attempt evidence chain，但 full MySQL verification 仍未执行，需等 Unit C。
- continuation 条件：Hermes 应为 Executor 使用 1800s runtime budget；若 runtime 不支持该预算，则必须拆成适配现有限制的 bounded work units。禁止 attempt 2，禁止清零 failure fingerprint。
- T4-002 旧 Executor `t_68c68e4e` 的 run `#72`、`#73` 均因 `pid not alive` crash，旧 chain 已作废且禁止复用；该历史不再阻止 revision `-07` 创建新 chain。
- revision `-07` 只有 PLAN 和未完成 PROGRESS，没有 REPORT、Independent REVIEW 或 HANDOFF；execution 已终止，旧 chain 不再 active。
- 旧 Coordinator `t_d626b42d` 与 Executor child `t_4a89bb5e` 已作废；禁止手工恢复、claim、promote、unblock 或复用。
- PMC 已基于 Gateway UP、无 active worker 与 Human User 明确推进指令接受一次 recovery dispatch 风险；不再等待额外 worker stability 证明。
- 禁止在用户现有数据库执行 downgrade/drop/truncate；destructive 验证只能在专用测试库并获得明确授权。
- T4-002 historical fresh audit 曾发现 idempotency comparison、AC10、AC11、cleanup failure、missing-source coverage 与 test isolation 缺陷；Unit A/B 已通过对应 bounded verification，剩余真实 disposable MySQL 端到端验证进入 Unit C。

## Next Review Gate

- T4-002：等待 Hermes ACK revision `-18`，随后核对 Coordinator 只创建一个 `revid-backend` child；最终 gate 仍是两个真实 MySQL tests、revision `-18` REPORT、Independent REVIEW、HANDOFF 与 PMC final acceptance。
- T4-006：已完成并归档。依赖 T4-006 的 Task 仅视为该 dependency 已满足；是否执行仍由后续 Queue revision 决定。
