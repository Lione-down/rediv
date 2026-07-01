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
- Unit B Bounded Continuation Revision：`phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15`
- Unit C MySQL Integration Revision：`phase4-wave2-unit-c-mysql-integration-2026-06-26-16`
- Unit C1 Fixture Preflight Revision：`phase4-wave2-unit-c1-fixture-preflight-2026-06-27-17`
- Unit C1 Runtime-Enforced Revision：`phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18`
- Unit C1 Review Lifecycle Revision：`phase4-wave2-unit-c1-rev18-review-dispatch-2026-06-28-18r1`
- Unit C2 Migration Core Revision：`phase4-wave2-unit-c2-migration-core-2026-06-28-19`
- Unit C2 Migration Core Continuation Revision：`phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20`
- Unit C2 Policy-Handoff Revision：`phase4-wave2-unit-c2-migration-core-policy-handoff-fixed-2026-06-29-21`
- Unit C2 Child-Contract Revision：`phase4-wave2-unit-c2-child-contract-corrected-2026-06-29-22`
- Unit C2 AC3 Remediation Revision：`phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23`
- Unit C2 AC3 Transport-Fixed Revision：`phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24`
- Unit C2 Dedicated Dispatcher Revision：`phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25`
- Unit C2 Atomic Dispatch Revision：`phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26`
- Unit C2 Review Lifecycle Revision：`phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1`
- Unit C3 Verification Revision：`phase4-wave2-unit-c3-integrity-verification-2026-07-01-27`
- Unit C3 Remediation Revision：`phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28`
- Unit C3 AC4 Cleanup Correction Revision：`phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`
- Unit C3 Bound Failure Cleanup Revision：`phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30`
| Status：`UNIT C1/C2 PMC PASS — UNIT C3 REVISION -30 TERMINAL PMC_BLOCKED — NO EXECUTABLE QUEUE` |
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
- Unit B Runtime Diagnostic Rev14：`ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV14-2026-06-26.md`
- Unit B Bounded Continuation Approval：`ai/reviews/REVIEW-T4-002-PMC-UNIT-B-BOUNDED-CONTINUATION-2026-06-26.md`
- Unit B Rev15 PMC PASS：`ai/reviews/REVIEW-T4-002-PMC-UNIT-B-REV15-PASS-2026-06-26.md`
- Unit C MySQL Integration Approval：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C-MYSQL-INTEGRATION-APPROVAL-2026-06-26.md`
- Unit C Revision -16 Runtime Advisory：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV16-2026-06-26.md`
- Unit C1 Bounded Continuation Approval：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-BOUNDED-CONTINUATION-APPROVAL-2026-06-27.md`
- Unit C1 Revision -17 Runtime Advisory：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV17-2026-06-27.md`
- Unit C1 Revision -17 Runtime Diagnostic Review：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV17-2026-06-28.md`
- Unit C1 Revision -17 Root-Cause Review：`ai/reviews/REVIEW-T4-002-PMC-ROOT-CAUSE-REV17-2026-06-28.md`
- Unit C1 Runtime Remediation Guidance：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-REMEDIATION-GUIDANCE-2026-06-28.md`
- Unit C1 Rev18 PMC PASS：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-REV18-PASS-2026-06-28.md`
- Unit C2 Rev20 Continuation Approval：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV20-CONTINUATION-APPROVAL-2026-06-28.md`
- Unit C2 Rev20 Runtime Advisory：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV20-2026-06-28.md`
- Unit C2 Rev22 PMC Rework：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV22-REWORK-2026-06-29.md`
- Unit C2 Rev23 Runtime Transport Review：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV23-2026-06-29.md`
- Unit C2 Rev25 Runtime Advisory：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV25-2026-06-29.md`
- Unit C3 Rev27 PMC Rework：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV27-REWORK-2026-07-01.md`
- Unit C3 Rev28 PMC Blocked：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV28-BLOCKED-2026-07-01.md`
- Unit C3 Rev29 Rework Authorization：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-REWORK-AUTHORIZATION-2026-07-01.md`
- Unit C3 Rev29 PMC Blocked：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`
- Hermes Atomic Dispatch Fix Report：`ai/reports/REPORT-HERMES-ATOMIC-DISPATCH-FIX-2026-06-29.md`
- Hermes Atomic Dispatch PMC PASS：`ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md`
- Safety Decision：`ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`

revision `phase4-wave2-recovery-dispatch-2026-06-24-07` 已终止：Coordinator `t_e23d9043` done；Executor `t_748c116d` attempt 0 的 run `#75` crash、run `#76` gave_up，process retry `2/2 exhausted`，且没有 REPORT、Independent REVIEW 或 HANDOFF。

revision `phase4-wave2-final-rework-2026-06-25-08` 已终止：Executor run `#78` timeout，唯一 retry run `#79` 以 `pid not alive` crash；没有 REPORT、Independent REVIEW 或 HANDOFF。partial diff 仍保留，但未通过真实 MySQL 验证，且 fresh static audit 发现 missing-source 仍依赖 secret gate、AC12 cleanup failure patch 未作用于实际函数绑定。

revision `phase4-wave2-final-attempt-continuation-2026-06-25-10` 已由 PMC 批准并被 Hermes ACK：Human Owner 确认 `revid-pm` 为 Hermes runtime owner，并接受 2026-06-25 12:10 diagnostic 的 `READY_FOR_CONTINUATION` 结论。该 revision 是 business attempt 1 continuation，不是 attempt 2。当前 fresh continuation chain 进入 `EXECUTOR_CRASHED_PARENT_BLOCKED`：Coordinator `t_b788cdb9` timeout，Executor `t_3769f8ec` crash 后因 parent blocked 无法 retry，暂无 REPORT、Independent REVIEW 或 HANDOFF。

revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11` 已由 PMC 批准：这是 T4-002 bounded work unit split 的首个 executable revision。Unit A 仅覆盖静态修复，不需要 MySQL，不允许读取 `.env` 或 database credential，不允许执行 CREATE/DROP/TRUNCATE/DELETE/migration write。

revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11` 已终止：Coordinator `t_083a9aab` run `#84` 在 121s 超过 120s limit，且未创建 Executor/Reviewer。PMC 批准一次受控 Unit A redispatch revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`，Coordinator dispatch budget 调整为 300s；若再次派发失败，T4-002 进入 infrastructure blocked，不再发布业务 Queue。

revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` 已 HANDOFF_READY 但 PMC 最终验收未通过：fresh verification 证明 missing-source 仍先被 `REVID_TEST_MYSQL_ADMIN_URL` secret gate 阻断，AC12 cleanup failure injection patch 未命中实际 callable binding，且 REPORT/Independent REVIEW 未准确覆盖 `backend/tests/test_migration_tool.py` 的继承 diff。PMC 批准 narrow Unit A correction revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`；该 correction 仍为 business attempt 1 continuation，不是 attempt 2。

revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` 已由 PMC 最终验收通过：fresh verification 证明 missing-source-before-secret-gate、AC12 patch binding 和 revision `-13` REPORT/Independent REVIEW addendum/HANDOFF 证据链一致。

revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14` 已由 PMC 批准：这是 T4-002 bounded work unit split 的第二个 executable revision。Unit B 仅覆盖 same-PK conflict 与 partial rollback 的 unit-test 语义，不需要 MySQL，不允许读取 `.env` 或 database credential，不允许执行 CREATE/DROP/TRUNCATE/DELETE/migration write。

revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14` 已终止且不可复用：Coordinator `t_bbbf72bd` timeout 302s，Executor `t_7275328d` timeout 847s/848s 且 retry exhausted；REPORT 存在但 Executor card 未完成，Independent REVIEW 与 HANDOFF 缺失。runtime diagnostic 证明 `TestUnitB` 本地快速通过，blocker 是 runtime/dispatcher completion 而非业务测试耗时。

revision `phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15` 已由 PMC 批准：这是 Unit B fresh bounded continuation，只允许最小验证链，不允许 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE、migration write、Unit C 或 attempt 2。必须产出 completed Executor card、Independent REVIEW、HANDOFF 后才能进入 PMC final acceptance。

revision `phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15` 已由 PMC 最终验收通过：Hermes status 已同步到 `HANDOFF_READY_REV15`，REPORT/Independent REVIEW/HANDOFF 均属同一 revision，fresh PMC verification 通过。

revision `phase4-wave2-unit-c-mysql-integration-2026-06-26-16` 已由 PMC 批准：这是 Unit C disposable MySQL integration verification。仅允许使用 ADR-003 授权的 `revid_test_t4_002` 专用测试库；若 secret、权限或 identity hard gate 失败，必须 BLOCKED，不得读取 `.env`、不得回退 `revid_db`、不得触碰用户数据库。

revision `phase4-wave2-unit-c-mysql-integration-2026-06-26-16` 已因 runtime failure 终止：Coordinator `t_aeaefef4` 在 Executor dispatch 前 300s timeout，process retry `1/1` exhausted，且没有 PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。Human Owner 指示将 Unit C 拆为更小 work units；PMC 发布精简 Unit C1 fixture/schema preflight revision `phase4-wave2-unit-c1-fixture-preflight-2026-06-27-17`。Revision `-17` 继承全部历史 fingerprints，不得复用 `t_aeaefef4` 或任何旧 card。

revision `phase4-wave2-unit-c1-fixture-preflight-2026-06-27-17` 已因重复 runtime failure 终止：Coordinator `t_3e1f6a06` run `#101` 在 Executor dispatch 前 120s timeout，process retry `1/1` exhausted；没有 Executor、PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。PMC 保持 infrastructure blocked，不发布 revision `-18`；必须先取得 fresh runtime diagnostics 与 same-profile health evidence。

Hermes thin-dispatcher remediation report 已由 PMC 审阅并判定未通过 re-enable gate：Smoke 1 `t_20945c04` crash，只有两次成功 dispatch；negative run `#107` 未实际触发禁止操作；缺少逐步数值 timing；worker logs 显示 allowlist 外工具仍可调用；status 使用非枚举 READY state。正式 verdict 见 `ai/reviews/REVIEW-T4-002-PMC-THIN-DISPATCHER-REMEDIATION-2026-06-28.md`。

Codex 已按 Human Owner 明确指令直接修复 Hermes runtime：为 `Action: DISPATCH_ONLY` 增加 mode-specific exact tool policy、schema filtering 和 invalid-call fast fail，同时保留 HANDOFF 等其他 lifecycle mode。Final-config isolated smokes `#9/#11/#13` 分别 41s/42s/40s，均只使用 show/create/show/complete；runtime gate 已 PMC PASS，revision `phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18` 已批准。正式证据见 `ai/reviews/REVIEW-T4-002-PMC-THIN-DISPATCHER-RUNTIME-FIX-PASS-2026-06-28.md`。

revision `phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18` 与 lifecycle continuation `-18r1` 已由 PMC 最终验收通过：Executor 与 Independent Reviewer 分别完成两项真实 MySQL preflight tests，canonical post-review HANDOFF 存在，allowed business diff 为空。Executor 提前创建的旧 HANDOFF 作为 non-canonical scope-drift evidence 保留，不得复用。

revision `phase4-wave2-unit-c2-migration-core-2026-06-28-19` 的 Coordinator `t_b493a47f` 因 worker plain-text exit 未写 terminal transition 而终止；旧 chain 不得复用。Codex 随后直接修复 Hermes `chat -q` worker finalization，并增加 retained-handle waiter/exit registry。Targeted tests、3 个 same-profile positive cards 与 1 个 negative direct-block smoke 已通过，正式 verdict 为 `PMC_RUNTIME_FIX_PASS — READY_FOR_CONTINUATION`。后续新 bounded revision 必须继承 rev19 全部 fingerprints，不能重试旧 card。

revision `phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20` 已由 PMC 批准：保持原 Unit C2 four-selector scope、ADR-003 boundary、120s dispatch-only Coordinator 与 1800s Executor budget。该 revision 继承 `REV19_COORDINATOR_CRASH` 及全部历史 fingerprints，不复用旧 card，Stop After 为 `UNIT_C2_REPORT_READY_REV20`。

revision `-20` 已因 Supervisor card-body contract 缺陷终止：Coordinator `t_1617a921` 的 card body 只有 `@Task.md` 引用，缺少 standalone `Action: DISPATCH_ONLY`，导致 exact tool policy 未激活；run `#114` 执行 allowlist 外探索并在 121s timeout，retry `1/1` exhausted，未创建 Executor。该问题与 Unit C2 business scope 无关；不提高 budget、不继续拆分、不发布 revision `-21`，等待 fail-closed runtime remediation 与 fresh scheduled-path smoke。

revision `-21` 已因 child payload contract 冲突终止；revision `-22` 随后完成四项真实 MySQL verification。AC1、AC2、AC5 通过，AC3 因 `stale_same` rows 仍进入 INSERT loop 而失败。PMC 已以 `AC3_STALE_SAME_DUPLICATE_INSERT` 收口为 `PMC_REWORK`，revision `-22` 不得复用。

revision `phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23` 已由 PMC 批准：只允许过滤 stale-same INSERT execution set、保留 stale-diff fail-closed semantics、补直接 regression evidence，并在 ADR-003 disposable database 复跑 AC1/AC2/AC3/AC5。该 revision 是 scope 改变后的新 remediation revision，不是 rev22 attempt 2。

revision `-23` 在 Executor dispatch 前因 Supervisor transport failure 终止。Raw cron session 证明 Supervisor 的 Bash terminal 先破坏了 double-quoted nested PowerShell variables，随后显式 fallback 为 `--body "@...REV23.md"`；不是 CLI 截断了已传入的完整 body。Coordinator `t_1dea37a2` run `#120` 以 `MISSING_WORKER_ACTION_MARKER` gave_up，且无 Executor/business artifacts。该 card 保留为 terminal evidence，不删除、不复用。

PMC 已增加 project-owned `ai/runtime/create-hermes-coordinator.py`，用 scalar args 构造 canonical body 并通过 subprocess argv list 调用 direct `hermes.exe`；4 个 regression tests 与 dry-run transport proof 通过。Revision `-24` 是业务 Scope 不变、transport 修复后的 fresh continuation。

Revision `-25` Dispatcher `t_cc15e296` 在 child `t_25ac2145` commit 后、parent completion 前 timeout，暴露 split-transaction deadlock。PMC 已验收 Hermes atomic dispatch runtime fix：future `DISPATCH_ONLY` child create/link、parent complete 与 child promote 在同一 SQLite transaction 提交，terminal transition 后 agent loop 不再发 follow-up model call。Live Gateway smoke parent `t_9f0ea8f5` / child `t_cff37a21` 通过且 worker process 归零。旧 rev25 chain 仍 terminal，不得复用。

Revision `-26` 已由 PMC 发布为 fresh bounded continuation：Task `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md`，Queue revision `phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26`。它使用 fresh dispatch/executor cards 与 idempotency keys，继承全部历史 fingerprints，等待 Hermes ACK；rev25 cards 保持不变。

Revision `-26` Executor `t_9f24648e` 已完成并产出 REPORT，execution state 为 `REPORT_READY`。PMC 已审计 REPORT 与 actual diff，未发现必须在 Independent Review 前收口的明确 AC failure；revision `phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1` 仅授权 `REVIEW_DISPATCH_ONLY` 与 dependent `HANDOFF_ONLY` lifecycle，不允许重复 business work。

Revision `-26r1` Coordinator `t_f46c8d6e` run `#126` persisted `Action: DISPATCH_ONLY` instead of the authorized `REVIEW_DISPATCH_ONLY`, then timed out at `121s > 120s` with retry exhausted and no children. The chain is terminal `INFRASTRUCTURE_BLOCKED`; formal closure is `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV26R1-2026-06-30.md`. No replacement Queue is authorized until fresh runtime health evidence passes the advisory gates.

Revision `-26r2` completed the corrected review lifecycle. Independent Reviewer `t_bcbc25b7` returned PASS after 4 unit and 4 real disposable-MySQL tests; HANDOFF `t_c481b6ad` reached `UNIT_C2_HANDOFF_READY_REV26`. Codex PMC final acceptance is `PMC_PASS` in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-PASS-2026-07-01.md`.

Revision `-27` completed five real disposable-MySQL selectors with `1 PASS / 4 FAIL / 1 ERROR`. PMC source audit confirmed destination FK orphan validation and deterministic test isolation/cleanup defects. Revision `-27` is terminal `PMC_REWORK` with fingerprint `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`; revision `-28` is the sole approved bounded remediation continuation.

Revision `-29` reached `REPORT_READY`, but PMC source audit found orphan deletion still inside the main `try` body after the failure-producing assertion; its `finally` only closes resources. The non-MySQL regression observes mocked `close()` calls rather than the real orphan cleanup lifecycle/state. Revision `-29` is terminal `PMC_BLOCKED` with fingerprint `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`; no Independent Review, HANDOFF or replacement Queue is authorized.

Revision `-30` reached `REPORT_READY`, but PMC source/diff audit found that the non-MySQL regression does not observe FK-restoration-equivalent state, the shared helper cannot guarantee FK restoration after cleanup failure, and resource-close failures remain silently swallowed. Revision `-30` is terminal `PMC_BLOCKED` with fingerprint `REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`; no Independent Review, HANDOFF or replacement Queue is authorized.

## Current Continuation Conditions

1. Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` 已 PMC PASS，仅作为 Unit A correction 完成证据；不得重复 ACK 或 dispatch。
2. business attempt ordinal 仍为 `1`；禁止 attempt 2，禁止通过 revision 清零任何 infrastructure/business fingerprint。
3. Revision `-18` 与 `-18r1` 已 PMC PASS，不得重复 ACK、dispatch 或复用其 cards/idempotency keys。
4. Revision `-26` / lifecycle `-26r2` 已 PMC PASS；revision `-26r1` 与 revisions `-20` through `-25` 均 terminal。所有历史 cards/idempotency keys 均不得重复执行或复用。
5. Revisions `-27`、`-28`、`-29`、`-30` 均已 terminal；revision `-30` 因 FK restoration 未被 regression 证明、cleanup failure path 不保证恢复 FK checks、resource-close failure 被吞掉而 `PMC_BLOCKED`。当前无 executable Queue，不得进入 Unit D/E、T4-003 或 T4-010。
6. 禁止手工 claim、promote、unblock、重试或复用 revision `-08` 及更早 card。
7. Unit C 必须继承全部历史 failure fingerprints，尤其是 `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`。

## Bounded Work Units

| Unit | Status | Scope | MySQL Required |
|---|---|---|---:|
| A | PMC PASS via correction revision `-13` | Static fixes for validation order, cleanup failure visibility, idempotency comparison and rollback test preparation | No |
| A-correction | PMC PASS revision `-13` | Missing-source before secret gate, AC12 actual patch binding, Unit A evidence correction | No |
| B | PMC PASS revision `-15` | Same-PK and rollback unit tests, minimal bounded verification chain | No |
| C | revision `-16` runtime blocked/terminal | Original full disposable MySQL integration dispatch；Coordinator retry exhausted before Executor | Yes |
| C1 | PMC PASS revision `-18` / lifecycle `-18r1` | Runtime-enforced fixture identity + Alembic schema preflight | Yes |
| C2 | PMC PASS revision `-26` / lifecycle `-26r2` | Dry-run、full migration、second-run idempotency、source immutability | Yes |
| C3 | revision `-27` PMC_REWORK；`-28`/`-29`/`-30` PMC_BLOCKED | Destination FK validation、conflict、partial rollback、consistency、AC4 failure-safe cleanup | Yes |
| D | planned only | Consolidated final REPORT | No |
| E | planned only | Independent REVIEW and HANDOFF | No |

Units D-E require separate PMC Queue approval after Unit C evidence is reviewed.

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
- Unit B revision `-15` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-B-REV15-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-B-REV15-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-B-REV15.md`
  - `ai/reviews/REVIEW-T4-002-UNIT-B-REV15.md`
  - `ai/handoffs/HANDOFF-T4-002-UNIT-B-REV15.md`
- Unit C revision `-16` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C-REV16-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C-REV16-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C-REV16.md`
  - `ai/reviews/REVIEW-T4-002-UNIT-C-REV16.md`
  - `ai/handoffs/HANDOFF-T4-002-UNIT-C-REV16.md`
- Unit C1 revision `-17` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV17-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV17-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C1-REV17.md`
  - `ai/reviews/REVIEW-T4-002-UNIT-C1-REV17.md`
  - `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV17.md`
- Unit C2 revision `-19` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV19-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV19-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C2-REV19.md`
- Unit C2 revision `-20` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV20-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV20-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C2-REV20.md`
- Unit C2 revision `-23` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV23-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV23-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C2-REV23.md`
- Unit C2 revision `-24` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV24-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV24-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C2-REV24.md`
- Unit C2 revision `-25` artifacts（均未创建）:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV25-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV25-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C2-REV25.md`
- Unit C3 revision `-27` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV27-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV27-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C3-REV27.md`
- Unit C3 revision `-28` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV28-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV28-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C3-REV28.md`
- Unit C3 revision `-29` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV29-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV29-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C3-REV29.md`
  - `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`

- Unit C3 revision `-30` artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV30-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV30-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-C3-REV30.md`
  - `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-AUTHORIZATION-2026-07-01.md`
  - `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-BLOCKED-2026-07-01.md`

Independent REVIEW 与 HANDOFF 未获授权。Revision `-30` 已由 PMC 明确判定 terminal `PMC_BLOCKED`，不得进入 review lifecycle、复用或重试；当前没有 executable Queue。

## Codex Prompt
先读取 T4-001 报告及 Alembic revision。禁止解析 `sqlite_master` 后字符串替换 DDL；使用 SQLAlchemy 做 data ETL。编码前创建 PLAN/PROGRESS，完成 dry-run、execute、幂等和一致性测试后提交 REPORT。不得删除或覆盖任何数据库。
