# DIAGNOSTIC-T4-003-REV47R1-EXECUTOR-WORKER-EXIT-2026-07-09

## 结论

`STILL_INFRA_BLOCKED`

## 范围

- Queue revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`
- Task: `T4-003`
- Coordinator: `t_50707802`, run `#208`
- Executor: `t_dfaef3d8`, run `#209`
- Executor session: `20260709_220308_cac36d`
- Failure fingerprint: `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`

## 采集到的非 secret 证据

### Kanban card 证据

`hermes kanban --board revid show t_dfaef3d8` 显示：

- card 状态为 `blocked`
- assignee 为 `revid-backend`
- parent 为 `t_50707802`
- body 中 standalone `Action: IMPLEMENT_AND_TEST_ONLY`
- revision 为 `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`
- latest summary 为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION: worker returned without calling kanban_complete or kanban_block`
- run `#209` 在 `2026-07-09 22:05` claim/spawn，随后持续 heartbeat，最终在 `2026-07-09 22:24` blocked

`hermes kanban --board revid runs t_dfaef3d8 --json` 显示：

- run id: `209`
- profile: `revid-backend`
- status/outcome: `blocked`
- started_at: `1783605908`
- ended_at: `1783607061`
- duration: `1153s`
- summary: `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION: worker returned without calling kanban_complete or kanban_block`
- error: `null`
- metadata: `null`
- worker_pid: `null`

`hermes kanban --board revid show t_50707802` 与 `runs t_50707802 --json` 显示：

- Coordinator `t_50707802` 状态为 `done`
- run `#208` completed，duration `106s`
- result/summary: `DISPATCH_COMPLETE: child created and parent committed atomically`
- verified child: `t_dfaef3d8`
- metadata: `{ "atomic_dispatch": true, "child_id": "t_dfaef3d8" }`

### worker 进程与 session 证据

- Kanban events 记录 run `#209` 曾 spawn `pid 33476`。
- 本轮 `ps -W | grep -E '33476|PID'` 只返回表头，未发现该 PID 仍在运行。
- `find /c/Users/mkd -iname '*20260709_220308_cac36d*'` 与 `find . -iname '*20260709_220308_cac36d*'` 未找到可读取的 session/log 文件。
- 因此本轮无法从文件系统取得 stdout/stderr tail、stack trace 或完整 transcript tail；这本身是诊断缺口。

### Executor artifact 证据

`ai/tasks/doing/TASK-T4-003-REV47R1-PLAN.md` 已存在，记录了修复 stale `_engine` reference 的计划。

`ai/tasks/doing/TASK-T4-003-REV47R1-PROGRESS.md` 已存在，当前进度显示：

- Step 1 `Fix stale _engine reference in database.py`: `DONE`
- Step 2 `Add regression test for rev47 bug`: `IN_PROGRESS`
- Step 3 unit tests: `PENDING`
- Step 4 compileall: `PENDING`
- Step 5 MySQL import smoke: `PENDING`
- Step 6 real MySQL runtime verification: `PENDING`
- Step 7 write REPORT: `PENDING`

`search_files` 未找到 `ai/reports/REPORT-T4-003-REV47R1.md`。该 REPORT 缺失。

### 源码/worktree 证据

`git status --short` 与 `git diff --name-only` 当前无输出，说明本轮读取时 worktree 没有未提交 diff。虽然 `backend/database.py` 与 `backend/tests/test_mysql_runtime_cutover.py` 当前源码中可见 rev47r1 相关内容，但没有新的可审计未提交 diff，且 Executor 未写 REPORT，因此不能把该状态提升为 business acceptance evidence。

## 诊断判断

1. Coordinator dispatch path 正常：`t_50707802` 已完成 atomic dispatch，并创建唯一 Executor child `t_dfaef3d8`。
2. Executor path 仍不可靠：run `#209` 有 heartbeat 并运行 `1153s`，但最终未调用 `kanban_complete` 或 `kanban_block`。
3. REPORT 缺失，且 PROGRESS 停留在 regression-test 阶段；required unit tests、compileall、MySQL import smoke、real MySQL/Navicat evidence 或 BLOCKED REPORT 均未完成。
4. 本轮无法取得 stdout/stderr、stack 或 transcript 文件；可观察证据不足以证明 safe continuation path 已恢复。
5. 该事件仍属于 Hermes runtime/process incident，不是业务 REWORK，也不是 `REPORT_READY` 或 `PMC_PASS`。

## Required Fix / 下一步建议

- 保留 rev47r1 当前 terminal/non-executable 状态。
- Codex PMC 若要继续，需发布 fresh continuation/recovery revision；该 revision 必须继承 `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`。
- 在 continuation 前，Hermes runtime owner 需要补齐 worker stdout/stderr、session transcript 或等价 finalization trace 的可读取证据；当前 Kanban 只给出泛化的 no-terminal-transition 摘要。
- 不建议直接扩大权限或重试旧 card；旧 Coordinator `t_50707802` 与 Executor `t_dfaef3d8` 必须保持 terminal evidence，不得 claim/promote/unblock/retry/reparent/reuse。

## 禁止动作确认

本轮未 redispatch rev47r1，未 claim/promote/unblock/retry/reparent/delete/archive `t_50707802` 或 `t_dfaef3d8`，未创建 Reviewer/HANDOFF，未修改业务代码、Task、Queue、CURRENT、ROADMAP、PMC REVIEW、Executor REPORT、Independent REVIEW 或 HANDOFF，未读取 `.env`，未输出 secret，未执行 destructive `revid_db` 操作。
