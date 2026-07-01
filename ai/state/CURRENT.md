# Revid — 当前项目状态

## 2026-07-01 Unit C3 Revision 30 Approved

Human Owner 已明确批准新的 bounded correction。Revision `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30` 是唯一 executable Queue：只允许修改 `backend/tests/test_migration_tool.py`，使 real AC4 与 non-MySQL regression 绑定同一个 failure-safe cleanup lifecycle，并证明 orphan deletion、deletion verification、FK restoration 与 cleanup-failure visibility。Revision `-29` 保持 terminal `PMC_BLOCKED`，不得复用。当前状态：`WAITING_FOR_HERMES_ACK`。

## 2026-07-01 Unit C3 Revision 29 PMC Blocked

Revision `-29` reached `REPORT_READY` and reported six passing verification commands. PMC source/diff audit found that orphan deletion still executes inside the main `try` body after validation/assertion; the `finally` block only closes resources and therefore does not delete `q-orphan` on the required failure paths. The new non-MySQL regression observes mocked `close()` calls in a separate local lifecycle and is not bound to the actual AC4 deletion cleanup. Verdict: `PMC_BLOCKED`, fingerprint `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`. No Independent Review, HANDOFF or replacement Queue is authorized.

## 2026-07-01 Unit C3 Revision 28 PMC Blocked

Revision `-28` reached `REPORT_READY` and the Executor reported five passing real-MySQL selectors. PMC source audit nevertheless found that AC4 orphan deletion is still reached only after migration, validation and the failure-producing assertion; those paths are not enclosed by the cleanup `finally`. This violates the Task's failure-safe cleanup constraint and makes the REPORT cleanup claim inconsistent with source. Verdict: `PMC_BLOCKED` with fingerprint `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`. The Queue is `BLOCKED / NOT EXECUTABLE`; no Independent Review or HANDOFF is authorized.

## 2026-07-01 Unit C3 Revision 27 Rework and Revision 28 Queue

Unit C3 revision `-27` reached `REPORT_READY`, but required verification returned `4 failed, 1 passed, 1 error`. PMC source audit confirmed that explicit FK orphan validation reads source FK values rather than target child-table FK values, while AC4/AC6/AC10/AC12 also have deterministic isolation, patch-binding and resource-disposal defects. Revision `-27` is terminal `PMC_REWORK` with fingerprint `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`; it must not enter Independent Review or be reused. Revision `phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28` is the sole approved Queue for one bounded remediation continuation.

## 2026-07-01 Unit C2 Final Acceptance and Unit C3 Queue

Unit C2 revision `-26` / lifecycle `-26r2` is `PMC_PASS`. Executor `t_9f24648e`, Independent Reviewer `t_bcbc25b7` and canonical HANDOFF `t_c481b6ad` form a consistent evidence chain; Reviewer independently passed 4 unit and 4 real disposable-MySQL tests with 0 skip/mock substitution. Fresh PMC verification passed `py_compile`, 4 scoped unit selectors and `git diff --check`; PMC runtime had no MySQL credential and did not repeat CREATE/DROP-capable tests. Unit C3 revision `phase4-wave2-unit-c3-integrity-verification-2026-07-01-27` is now the sole approved Queue and covers only conflict, FK orphan, partial rollback, consistency and cleanup visibility.

## 2026-06-30 Revision 26r2 Review Continuation（completed）

Shared Agnes/APIHub credential rotation was verified across all five profiles; `revid-pm` live probe returned `CREDENTIAL_OK`. Revision `26r2` completed with Reviewer PASS and canonical HANDOFF, then received PMC final acceptance on 2026-07-01. It is historical evidence and no longer executable.

## 2026-06-30 Hermes Update Durability Blocker

The earlier runtime `PMC_PASS` is temporarily superseded. Hermes update reset the upstream checkout and preserved local runtime changes in `stash@{0}`, but an obsolete Desktop bundle conflict prevented automatic restoration. Python runtime changes are recovered and 107 affected tests pass; Chinese output rules are restored in all six SOULs; however Gateway has not been reloaded and the conflict/post-update deployment mechanism is not closed. Queue remains non-executable. See `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-BLOCKED-2026-06-30.md`.

Resolution: `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-PASS-2026-06-30.md`. The patch is project-owned/repeatable, deploy+verify is a pre-Queue hard gate, 107 Hermes + 14 project tests pass, Chinese SOUL checks pass, and Gateway PID `11888` is running. Human Owner authorized archiving 34 invalid/obsolete cards; 18 valid evidence cards remain and no active chain exists. Only credential rotation remains before a fresh review-only Queue decision.

## 2026-06-30 Hermes Runtime Contract Update

Hermes action/profile/tool contract remediation has `PMC_PASS` and `READY_FOR_CONTINUATION` runtime evidence: `ai/reports/REPORT-HERMES-ROLE-CONTRACT-HARDENING-2026-06-30.md`. Launcher, Supervisor, five profile policies/SOULs, child-card validation, retry semantics, and drift verification are aligned; 105 Hermes tests + 11 project tests + isolated positive/negative smokes passed; Gateway restarted cleanly.

Revision `26r1` remains terminal and archived. Credential rotation and `ROLE_CONTRACTS_OK` are complete; revision `26r2` is the sole approved review-only Queue. Do not repeat Executor revision 26.

> 更新时间：2026-07-01
> 状态来源：Codex PMC 自动治理、Hermes scheduled reports 与 fresh source/diff audit

## Current Phase

`Phase 4 - Personal Integration Edition（执行中，T4-002 Unit C1 与 Unit C2 已 PMC PASS；Unit C3 revision -30 等待 Hermes ACK）`

## Current Task

- `T4-002`：Unit C2 revision `-26` / lifecycle `-26r2` 已 PMC PASS。Unit C3 revision `-29` 已 terminal `PMC_BLOCKED`；Human Owner 已批准 revision `-30` bounded correction，等待 Hermes ACK。

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
| T4-002 | **PMC PASS — Unit C1 revision `-18`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-REV18-PASS-2026-06-28.md`；Executor 2/2 real MySQL tests PASS，Independent Reviewer 2/2 PASS，canonical post-review HANDOFF complete，business diff empty |
| T4-002 | **PMC APPROVED — Unit C2 migration core revision `-19`** | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV19.md`；Queue `phase4-wave2-unit-c2-migration-core-2026-06-28-19` |
| T4-002 | **PMC RUNTIME ADVISORY — Unit C2 revision `-19` Coordinator crash** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV19-2026-06-28.md`；`t_b493a47f` run `#113` `pid not alive`，retry `1/1` exhausted；无 Executor/REPORT/REVIEW/HANDOFF |
| T4-002 | **PMC BLOCKED — revision `-19` runtime diagnostic reviewed** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV19-2026-06-28.md`；direct logs 证明 worker text/partial exit 未写 terminal transition，Windows dispatcher 丢失 return code 并在下一 60 秒 tick 泛化为 `pid not alive` |
| T4-002 | **PMC BLOCKED — revision `-19` escalation rejected** | `ai/reviews/REVIEW-T4-002-PMC-ESCALATION-REV19-2026-06-28.md`；Hermes 复用了旧 94 tests/3+1 smoke，未实现 worker terminal finalization 或 Windows exit-code capture，也没有 fresh post-fix evidence |
| T4-002 | **PMC BLOCKED — runtime fix report remains analysis-only** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-FIX-REPORT-REV19-2026-06-28.md`；报告声明未修改 runtime，且没有 fresh tests/smokes；Popen handle/poll 根因仍缺直接证据 |
| T4-002 | **PMC RUNTIME FIX PASS — ready for bounded continuation** | `ai/reviews/REVIEW-T4-002-PMC-HERMES-WORKER-FINALIZATION-FIX-PASS-2026-06-28.md`；真实根因是 `chat -q` 缺少 terminal finalization；targeted tests 与 isolated 3+1 smokes 通过 |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C2 revision `-20`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV20-CONTINUATION-APPROVAL-2026-06-28.md`；原 four-selector scope，继承全部 fingerprints，等待 Hermes ACK |
| T4-002 | **PMC RUNTIME ADVISORY — revision `-20` terminal** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV20-2026-06-28.md`；card body marker 丢失导致 policy bypass；不提高 budget、不拆 business scope、不发布 rev21 |
| T4-002 | **PMC REWORK — Unit C2 revision `-22` AC3 failed** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV22-REWORK-2026-06-29.md`；fingerprint `AC3_STALE_SAME_DUPLICATE_INSERT` |
| T4-002 | **PMC APPROVED（historical）— Unit C2 AC3 remediation revision `-23`** | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV23.md`；已因 transport failure terminal |
| T4-002 | **PMC RUNTIME FIX PASS — revision `-23` terminal** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV23-2026-06-29.md`；raw cron trace disproves CLI truncation，launcher regression 4/4 PASS |
| T4-002 | **PMC APPROVED — transport-fixed revision `-24`** | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV24.md`；fresh cards/keys，business Scope unchanged |
| T4-002 | **PMC BLOCKED — revision `-25` Dispatcher timeout with unclaimable child** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV25-2026-06-29.md`；等待 fresh runtime diagnostics，不发布 rev26 |
| T4-002 | **PMC RUNTIME FIX PASS — atomic dispatch verified** | `ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md`；atomic parent/child transaction + terminal worker short-circuit，ready for bounded continuation |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C2 revision `-26`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-CONTINUATION-APPROVAL-2026-06-29.md`；fresh cards/keys，继承全部 fingerprints，等待 Hermes ACK |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C2 revision `-26r1` review lifecycle** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-REVIEW-LIFECYCLE-2026-06-29.md`；Executor 8/8 自报 PASS，发布 `REVIEW_DISPATCH_ONLY`，等待 Hermes ACK |
| T4-002 | **PMC BLOCKED — revision `-26r1` review dispatch terminal** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV26R1-2026-06-30.md`；persisted `DISPATCH_ONLY` 与 Queue `REVIEW_DISPATCH_ONLY` 冲突，run `#126` timeout，未创建 Reviewer/HANDOFF |
| T4-002 | **PMC PASS — Unit C2 revision `-26` / lifecycle `-26r2`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-PASS-2026-07-01.md`；Reviewer 4 unit + 4 real MySQL PASS，canonical HANDOFF complete |
| T4-002 | **PMC APPROVED — Unit C3 revision `-27`** | `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV27.md`；read-only business files，等待 Hermes ACK |
| T4-002 | **PMC REWORK — Unit C3 revision `-27`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV27-REWORK-2026-07-01.md`；5 selectors = 1 PASS / 4 FAIL / 1 ERROR |
| T4-002 | **PMC APPROVED — Unit C3 remediation revision `-28`** | `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV28.md`；destination FK validation + deterministic test isolation/resource cleanup |
| T4-002 | **PMC BLOCKED — Unit C3 revision `-28` cleanup hard gate failed** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV28-BLOCKED-2026-07-01.md`；fingerprint `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`；不进入 Review lifecycle |
| T4-002 | **PMC REWORK AUTHORIZED（historical）— Unit C3 revision `-29`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-REWORK-AUTHORIZATION-2026-07-01.md`；Human Owner 明确授权的 bounded correction 已执行并进入 terminal review |
| T4-002 | **PMC BLOCKED — Unit C3 revision `-29` cleanup correction failed** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`；fingerprint `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`；不进入 Review lifecycle |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C3 revision `-30`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-AUTHORIZATION-2026-07-01.md`；仅允许绑定 AC4 failure-safe cleanup 与 regression；等待 Hermes ACK |

## Verified Baseline

- T4-002 安全复验：排除 destructive `DisposableMySQLTests` 后 29 tests passed；源码内存语法检查 passed。
- frontend：`npm run build` passed，4622 modules transformed。
- MySQL：8.0.43；`revid_db` revision `a1b2c3d4e5f6`；12 张 app table 均为 InnoDB/utf8mb4，表与字段备注完整。
- 系统 Python 缺少 `annotated_doc`；backend 验证必须使用项目 `.venv` 或先修复环境。
- 工作区存在大量未提交修改，Executor 必须先核对目标文件 diff，不得覆盖其他任务或用户工作。

## Ready / Running

- Revision `-30` 是唯一 executable Queue，状态 `WAITING_FOR_HERMES_ACK`。Revision `-27`/`-28`/`-29` Dispatcher/Executor/cards/keys 均为 terminal evidence，不可复用。
- Hermes 中文输出：`REPORT-SOUL-DEPLOYMENT-2026-06-28.md` 声明五个 SOUL 已部署并通过 marker 检查；execution profile 的实际 Kanban sample output 尚未验证。当前 paused cron 不得自动恢复。
- T4-010 — T4-006 dependency 已满足，但尚未进入 APPROVED Queue，不得执行。
- Units D-E 仍仅为后续顺序计划，必须等待 Unit C3 获得 fresh authorization、完成 REPORT、Independent REVIEW/HANDOFF 与 PMC final PASS。

## Blockers

- T4-003 继续依赖完整 T4-002 完成与 PMC 验收；Unit C1 PASS 不单独解锁 T4-003。
- T4-002 Unit C1 revision `-18` 与 lifecycle continuation `-18r1`：PMC final acceptance 已通过；不得重复 dispatch 或复用该 chain。Executor 的 premature HANDOFF 为 non-canonical historical evidence。
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
- T4-002 Unit C2 revision `-19`：Coordinator `t_b493a47f` run `#113` 未创建 Executor；该旧 chain terminal 且不得复用。Hermes worker finalization 已由后续 PMC runtime fix 修复并通过 fresh tests/smokes；revision `-20` 是唯一获批 continuation。
- T4-002 Unit C2 revision `-20`：Coordinator `t_1617a921` run `#114` 的 card body 只有 Task path 引用，缺少 standalone `Action: DISPATCH_ONLY`；runtime 静默回退 unrestricted tools，日志出现 `git status`、`hermes profile list`、`ls`，121s timeout、retry `1/1` exhausted、Executor 未创建。Hermes execution status 文件仍停在 revision `-19`，与 direct card evidence 冲突，需由 Supervisor reconcile。
- T4-002 Unit C2 revision `-22`：Executor `t_4f178d0c` run `#119` 完成四项 verification，3 PASS / 1 FAIL。AC3 失败根因是 `migrate_table()` 统计 `stale_same` 后仍遍历全部 source rows 执行 INSERT。Revision 已 `PMC_REWORK` 收口，禁止 redispatch/retry/unblock/reuse。
- T4-002 Unit C2 revision `-23` 已 terminal：Coordinator `t_1dea37a2` run `#120` 在 spawn 前 `MISSING_WORKER_ACTION_MARKER`。禁止删除、archive、retry、unblock 或复用；无 business diff/artifacts。
|- T4-002 Unit C2 revision `-24`：Coordinator `t_53630896` run `#121` 在 Executor dispatch 前 timeout，旧 chain terminal 且不得复用。Revision `-25` 已改由专用 `revid-dispatcher` 承担初始 dispatch，使用 fresh key/card。
- T4-002 Unit C2 revision `-25`：Dispatcher `t_cc15e296` run `#122` 与 child `t_25ac2145` 保持 terminal evidence。后续 runtime fix 已将 child create/link、parent complete 和 child promote 合并为一个 transaction，并在 terminal transition 后跳过 follow-up model call；live Gateway smoke 已证明 parent/child 状态与 worker 退出。旧 child contract 仍不合格，因此不得释放或复用。
- T4-002 Unit C2 revision `-26` / lifecycle `-26r2`：PMC final acceptance 已通过；不得重复 dispatch 或复用任何 business/review/handoff card。Executor REPORT 的 command/cleanup wording 缺陷已在 PMC review 记录，后续 REPORT 不得复制。
- T4-002 Unit C3 revision `-27`：Executor `t_d97dcb15` 完成 5 个 real-MySQL selectors，但仅 AC11 PASS；AC4/AC6/AC10/AC12 FAIL 且 teardown ERROR。该 revision 已 `PMC_REWORK`，禁止进入 Review lifecycle、重派或复用；只允许 revision `-28` 的 bounded remediation。
- T4-002 Unit C3 revision `-28`：Executor `t_670af729` 自报 5/5 PASS，但 AC4 orphan cleanup 仍位于 assertion 之后，failure path 会跳过删除并污染 disposable database。由于 Queue 明确禁止进一步 automatic business rework，本轮 `PMC_BLOCKED` 且不发布 lifecycle/replacement Queue。
- T4-002 Unit C3 revision `-29`：Executor `t_77c46dc4` 自报 6 个 verification commands PASS，但 orphan deletion 仍未进入 failure-safe `finally`，non-MySQL regression 也未绑定实际 deletion cleanup state。该 revision 已 terminal `PMC_BLOCKED`，禁止进入 Review lifecycle、重派或复用。
- T4-002 review lifecycle revision `-26r1`：Coordinator `t_f46c8d6e` run `#126` action mismatch/timeout chain 保持 terminal historical evidence；后续 `-26r2` 已以 fresh keys 完成，不改变该历史 fingerprint。
- Hermes revision `-19` escalation 未通过 PMC：`94 tests + 3 positive smokes + 1 negative smoke` 属于旧 thin-dispatcher policy evidence，不证明新识别的 terminal-transition/Windows exit-status 缺陷已修复；card-body、board、OOM、segfault 推测没有直接证据。
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

- T4-002：revision `-29` 已 terminal `PMC_BLOCKED`；不发布 Review lifecycle 或 replacement revision。未来 fresh authorization 必须把 orphan deletion 绑定到 failure-safe cleanup，并以同一 lifecycle/helper 的 non-MySQL injected-failure test 证明 deletion-equivalent state。
- Hermes language：五个 SOUL 模板已部署（default + 4 execution profiles），中文 marker 验证通过，profile descriptions 已更新。Revid cron 保持 paused。
- T4-006：已完成并归档。依赖 T4-006 的 Task 仅视为该 dependency 已满足；是否执行仍由后续 Queue revision 决定。
