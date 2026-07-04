# Rev33 Status Canonicalization and Cron Recovery

## Plan

### Goal

修复 deterministic reconciler 对全文件 malformed/duplicate canonical fields 的漏检，重建单一 canonical rev33 execution status，完成 terminal reconciliation，然后恢复 Hermes scheduled Supervisor cron。

### Root Cause

`ai/runtime/reconcile-hermes-execution-status.py::reconcile()` 只校验局部 section 并原地修改已有文件；它不校验全文件 malformed multi-pipe rows，也不拒绝 section 外重复 canonical fields。旧 T4-002 污染前缀因此被保留，而干净 rev33 section 仍可让 `--check` 返回 `STATUS_OK`。现有 test fixture 没有污染前缀，未覆盖该回归。

### Scope

- `ai/runtime/reconcile-hermes-execution-status.py`
- `ai/runtime/tests/test_reconcile_hermes_execution_status.py`
- `ai/automation/HERMES-EXECUTION-STATUS.md`
- PMC-owned CURRENT、ROADMAP、Unit A Task、Queue 与本次 review
- Hermes scheduled Supervisor cron 状态

### Non-goals

- 不修改业务代码、Unit A partial frontend diff、数据库或 secret。
- 不复用 rev31/rev32/rev33 card 或 idempotency key。
- 不手工创建、claim、promote 或 unblock Kanban card。

### Steps

1. 添加污染前缀与 duplicate canonical field regression，确认旧 reconciler fail-open。
2. 增加全文件结构校验：拒绝三重以上 pipe row、重复 canonical scalar fields、重复 active section。
3. 重建 rev33 single canonical status，保留真实 card/run/addendum/fingerprint/history evidence。
4. 运行 targeted/full runtime tests、reconciler、role verifier、hash/Markdown checks 与 `git diff --check`。
5. 将 PMC facts 恢复为 rev33 reconciliation complete，发布 fresh rev34 Queue。
6. 启用 Hermes Supervisor cron，确认 job enabled/next run，并只观察 ACK，不直接操作 worker card。

### Success Criteria

- 污染 fixture 在旧逻辑失败、修复后被明确拒绝。
- canonical status 中 malformed multi-pipe rows 为 0，关键 canonical fields 唯一。
- `--check` 返回 `STATUS_OK`，实际 Task/Queue/addendum hashes 一致。
- rev34 是唯一 APPROVED Queue，继承 rev31/rev32/rev33 fingerprints。
- Hermes Supervisor cron 已启用且有下一次运行时间。

## Progress

- [x] 复现 status 污染：278 lines、19 malformed rows、重复冲突 PMC action/task fields。
- [x] 定位 root cause：reconciler 局部 section 校验 + in-place preservation，tests 缺污染 fixture。
- [x] 添加 regression 并修复 reconciler：旧逻辑 2 failures，修复后 targeted `6 passed`。
- [x] 重建 canonical status 并完成验证：113 lines、0 malformed、关键 canonical fields 唯一、rev33 `STATUS_OK`。
- [x] 发布 rev34：唯一 `APPROVED — WAITING_FOR_HERMES_ACK` Queue，dry-run 精确且未创建 card。
- [x] 启用并验证 Hermes cron：job `72a21342a164` active，Gateway PID `12912` heartbeat 正常，next run `2026-07-04T01:15:00+08:00`。

## Final Verification

- Reconciler regressions: `6 passed`.
- All `ai/runtime/tests`: `21 passed`.
- Launcher + reconciler focused suite: `15 passed`.
- Role verifier: `ROLE_CONTRACTS_OK`.
- `git diff --check`: exit `0`.
- Kanban before cron resume: `0 ready / 0 running / 0 review / 0 todo`.
- Immediate `hermes cron run` CLI wait exceeded the shell timeout; follow-up inspection confirmed the job is active, no duplicate card exists, and the normal scheduler will run at 01:15.
