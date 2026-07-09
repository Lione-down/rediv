# DIAGNOSTIC-T4-002-REV45-DISPATCHER-SYNTHETIC-PROOF-2026-07-09

## 结论

`READY_FOR_CONTINUATION`

Hermes runtime owner 在不创建或重试真实 rev45 card、不创建 Executor/Reviewer/HANDOFF、不修改业务文件、不访问数据库、不读取 `.env` 或 secret 的前提下，完成了 `revid-dispatcher / DISPATCH_ONLY` 的 no-card synthetic proof harness。该 harness 证明当前 least-privilege Dispatcher 合同可以使用精确 `Task Path` 读取任务，并通过 project-owned launcher 的 direct `kanban_create` 路径构造完整 `DISPATCH_ONLY` Coordinator body；整个 proof 未调用 `list_files` 或 `search_files`，也未持久化任何 Kanban card。

## 范围

- Queue Revision: `phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45`
- Task ID: `T4-002`
- Task Path: `ai/tasks/todo/TASK-T4-002-UNIT-D-REV45.md`
- Coordinator: `t_d6f567bb`
- Coordinator Run: `#201`
- Failure Fingerprint: `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION`
- Runtime Advisory: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV45-2026-07-09.md`
- Runtime Remediation Review: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-REMEDIATION-REV45-2026-07-09.md`

## 本轮执行

1. 运行 deterministic gate：`python ai/runtime/reconcile-hermes-execution-status.py --check` 返回 `STATUS_MISMATCH`，按 gate 只运行一次 `--apply` 后再次 `--check` 返回 `STATUS_OK`。
2. 运行 `python ai/runtime/verify-hermes-role-contracts.py`，返回 `ROLE_CONTRACTS_OK`。
3. 读取 `ai/tasks/todo/TASK-T4-002-UNIT-D-REV45.md`，确认当前 rev45 仍为 `PMC_BLOCKED - SYNTHETIC_RUNTIME_PROOF_REQUIRED`，且 Unit D REPORT 尚不存在。
4. 读取 `ai/prompts/hermes-revid-dispatcher-soul.md`，确认 `revid-dispatcher / DISPATCH_ONLY` 只允许 `read_file` 与 bounded `kanban_*` 工具，并显式禁止 `list_files` / `search_files` / `terminal`。
5. 执行 no-card synthetic proof harness：导入 `ai/runtime/create-hermes-coordinator.py`，对 `_resolve_kanban_create()` 注入 in-memory `fake_cmd_create`，从而走真实 `create_coordinator_card(..., dry_run=False)` 与 direct `kanban_create` 参数构造路径，但不持久化任何 card。
6. harness 验证传入 synthetic `kanban_create` 的字段：
   - `assignee = revid-dispatcher`
   - `workspace = dir:D:/works/codexWorks/project_revid`
   - `idempotency_key = revid:phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45:T4-002:dispatch`
   - `max_runtime = 120`
   - `max_retries = 2`
   - `parent = []`
   - body 中仅有一个 standalone `Action: DISPATCH_ONLY`
   - body 包含精确 `Task Path: ai/tasks/todo/TASK-T4-002-UNIT-D-REV45.md` 与 `@ai/tasks/todo/TASK-T4-002-UNIT-D-REV45.md`
   - body 包含 `Executor Profile: revid-backend`
   - body 包含 `Executor Action: IMPLEMENT_AND_TEST_ONLY`
   - body 包含 `Executor Idempotency Key: revid:phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45:T4-002:execute:0`
   - body 包含 `Executor Max Runtime: 1800s`
   - body 包含 `Executor Stop After: UNIT_D_CONSOLIDATED_REPORT_READY_REV45`
   - body 不包含 `list_files` 或 `search_files`
7. harness 输出：

```json
{
  "verdict": "READY_FOR_CONTINUATION",
  "proof": "no-card harness exercised create_coordinator_card -> direct kanban_create path with fake _cmd_create, exact Task Path read, no list_files/search_files, no persisted card",
  "synthetic_card_id": "synthetic_no_card_rev45_dispatcher_proof",
  "body_length": 698
}
```

## Board read-back

`hermes kanban --board revid show t_d6f567bb` 与 `hermes kanban --board revid runs t_d6f567bb --json` 仍显示原始真实 Coordinator 保持 terminal blocked：

- Card: `t_d6f567bb`
- Status: `blocked`
- Run: `#201 blocked`
- Duration: `41s`
- Summary: `ROLE_BOUNDARY_VIOLATION: tool 'list_files' is not allowed for Kanban task t_d6f567bb.`
- Executor child: `NONE`

本轮没有修改该真实 card，也没有重试、claim、promote、unblock、reparent、archive 或 delete 任何历史 card。

## 安全边界

本轮未执行以下动作：

- 未创建或重试 rev45 Coordinator。
- 未创建真实 T4-002 Executor、Reviewer 或 HANDOFF。
- 未创建 Unit D PLAN/PROGRESS/REPORT。
- 未修改 backend、frontend、ui、xq、migration、schema、Task、Queue、CURRENT、ROADMAP、既有 REPORT、既有 REVIEW 或既有 HANDOFF。
- 未运行 real MySQL selectors、migration、destructive tests、browser tests 或 broad test suites。
- 未读取 `.env` 或任何 secret 文件。
- 未访问 `revid_db`。
- 未清除 inherited fingerprints。
- 未解锁 T4-003。

## 结论说明

该 no-card harness 是 `HERMES-NEXT-CRON-CONTRACT.md` 授权的“equivalent same-profile harness”路径：它避免了真实 T4-002 card mutation，同时验证当前 Dispatcher 合同已从 `list_files` discovery 迁移到精确 `Task Path` + `read_file` + direct `kanban_create` 构造路径。根据 Branch Table，“Synthetic proof proves least-privilege dispatcher path completes without `list_files`/`search_files`” 对应写入 `READY_FOR_CONTINUATION` diagnostic 并返回 Codex PMC。

## 返回 PMC

Hermes runtime owner 返回 `READY_FOR_CONTINUATION` 证据。rev45 仍保持 terminal/non-executable，除非 Codex PMC 发布新的 approved continuation revision；Hermes 不得自行 redispatch rev45、创建 Executor、创建 Unit D REPORT、启动 Unit E 或解锁 T4-003。
