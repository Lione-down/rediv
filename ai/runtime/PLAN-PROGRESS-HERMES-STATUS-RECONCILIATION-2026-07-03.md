# Hermes Execution Status Reconciliation — Plan and Progress

## Objective

从根源修复 Hermes Scheduled Supervisor 对 terminal Queue 的 execution status 反复回退问题：用 project-owned deterministic reconciler 代替临时 LLM 文本修补，并纠正 `DIAGNOSTIC_READY` 后仍刷新 `Runtime Diagnostic Due` 的错误语义。

## Root Cause Hypothesis

`ai/prompts/hermes-scheduled-supervisor.md` 要求任何 due 都必须位于当前时间后 60 分钟内，即使同 fingerprint diagnostic 已存在；cron 因此每轮都重写 status。其 ad-hoc verifier 又未把 Active Queue 的 Task/Queue hash、Action 和 terminal reconciliation 状态作为同一原子 contract 校验。PMC 在 ACK 后关闭 reconciliation 还会再次改变 mutable Queue hash，而旧 verifier 不支持 acknowledged 第二阶段，最终导致日志声称已更新但 canonical fields 保留旧值。

## Scope

- 新增 `ai/runtime/reconcile-hermes-execution-status.py`，对 Queue、Task、status 做 deterministic read/check/apply/read-back。
- 新增 targeted regression tests，覆盖 stale hashes、executable Action 回退、错误 Queue Status、二次运行幂等和 completed diagnostic due 不刷新。
- 更新 canonical Supervisor prompt，强制先运行 reconciler；临时脚本和纯文字自证不再算通过。
- 将规则变化同步到 `pitfalls.md`。
- 更新实际 Hermes cron prompt，保持 job paused，待验证完成后再恢复。

## Non-goals

- 不修改业务代码、frontend、backend、migration、数据库或 Kanban card。
- 不创建、retry、claim、promote、unblock 或复用任何 worker。
- 不发布 revision 33，不改变 T4-010 verdict 或 failure fingerprint。

## Success Criteria

- 旧 regression fixture 在修复前失败。
- `--apply` 将 Active Queue 的 revision、Task path/hash、Queue hash、Action 与 terminal status 一次性对齐。
- 同一输入第二次执行为 no-op，status hash 不变化。
- `DIAGNOSTIC_READY` 且 diagnostic path/hash 有效时，已过去的 due 被视为已满足的历史 SLA，不再刷新。
- Targeted tests、当前项目 `--check`、`git diff --check` 全部通过。
- 实际 cron prompt 引用 canonical reconciler，job 在修复验证期间保持 paused。

## Progress

- [x] 复现 status canonical fields 与日志声明不一致。
- [x] 确认 Revid cron job `72a21342a164` 当前 paused，最后一轮为 `[SILENT]`。
- [x] 写入失败 regression tests；初始因 reconciler 不存在得到 `2 failed`。
- [x] 实现 deterministic reconciler，支持 pending/acknowledged terminal Queue 两阶段、真实 Task/Queue/diagnostic SHA256、terminal Action/Queue Status 和 read-back。
- [x] 更新 Hermes Supervisor、Codex PMC prompt、multi-agent operating model 与 pitfalls；`DIAGNOSTIC_READY` due 改为保留历史 timestamp 并标记 `SATISFIED`。
- [x] 更新实际 cron prompt；job `72a21342a164` 保持 paused，未创建或操作 Kanban card。
- [x] Targeted regression `3 passed`；当前项目 `--check` 为 `STATUS_OK`；Queue closure 后首次 check 精确报告 Task/Queue hash mismatch，单次 apply 后通过，二次 apply 为 `NO_CHANGES` 且 status hash 稳定。
- [x] `python -m py_compile` 与 `git diff --check` 通过。

## Verification Caveat

全量 `ai/runtime/tests` 为 `14 passed / 2 failed`。两项失败都来自已有未提交 `ai/runtime/create-hermes-coordinator.py` 缺少 `build_command`，与本次 reconciler 无调用或文件重叠；本次未越界修复该独立问题。

## Status

`COMPLETE — ROOT CAUSE FIXED, CRON REMAINS PAUSED`
