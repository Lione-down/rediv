# Hermes Worker Finalization Fix Report

## Verdict

`READY_FOR_CONTINUATION`

Hermes runtime 的 worker finalization 缺陷已修复并完成 fresh Windows runtime verification。Revision `-19` 旧 chain 仍为 terminal，不得复用；本报告只满足后续新 continuation revision 的 runtime health gate。

## Root Cause

实际根因不在 Windows `Popen.poll()`：fresh probe 使用与 worker 相同的 `CREATE_NO_WINDOW`、`start_new_session=True` 与 file stdout，退出后 `poll()` 和 `wait()` 均返回 `0`。

根因是 `cli.py` 的 dispatcher 实际入口 `hermes ... chat -q <query>` 在 `cli.chat()` 返回 plain text/partial result 后直接结束 single-query session，没有检查 `HERMES_KANBAN_TASK` 对应 card 是否已经调用 `kanban_complete` 或 `kanban_block`。因此 task 留在 `running`，只能等下一个 dispatcher tick 根据 PID 做兜底分类。Run `#113` 的 `text_response`、0 tool turn 与 CLI cleanup 完整符合该路径。

## Fix

### In-process terminal finalization

- `cli.py::_finalize_kanban_worker_result`：worker 返回后重新读取 task；若仍为 `running`，按当前 run identity 原子执行 terminal transition。
- clean/plain-text 或 invalid-tool partial：`capability` block，reason 为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`；禁止 auto-complete。
- nonzero failure：进入现有 `_record_task_failure` / retry-budget 语义。
- rate limit/billing：保留 exit-code sentinel 与 dispatcher release 语义。
- 已经 `done`/`blocked` 的 task 不做二次修改。
- 同时覆盖 fully-quiet 分支和 dispatcher 实际使用的 human-facing `-q` single-query 分支；goal-mode 先运行既有 goal loop，再执行 terminal-state check。

### Cross-platform abnormal-exit fallback

- `_default_spawn` 为 retained Popen 启动 daemon waiter。
- waiter 使用 `proc.wait()` 记录 return code 到 `_worker_exit_registry`，关闭 parent log handle 并释放 `_spawn_handles`。
- `_classify_worker_exit` 优先读取 registry，区分 clean、rate-limited 与 nonzero exit。
- 恢复 protocol violation event kind，避免把 clean/no-transition 误记为普通 crash。

## Regression Tests

RED evidence：新增 tests 在旧代码上因 `_finalize_kanban_worker_result`、`_watch_worker_exit` 缺失以及 classifier 不读取 registry 而失败。

GREEN evidence：

- CLI single-query/finalization：`10 passed`。
- worker exit/classifier/spawn policy targeted：`11 passed`。
- protocol violation/nonzero semantics：`2 passed`。
- `py_compile cli.py hermes_cli/kanban_db.py`：PASS。
- scoped `git diff --check`：PASS。

扩大 suite：`390 passed, 1 skipped, 15 failed`。15 项为当前 Windows/dirty-worktree 的既有 path/profile/zombie/stale fixture failures；targeted rerun 未复现本修复相关失败。未降低或跳过本修复 tests。

## Fresh Runtime Evidence

Isolated board：`revid-runtime-finalization-20260628`；未触碰 `revid` board、旧 revision `-19` cards、业务代码、数据库或 secret。

### Positive `DISPATCH_ONLY`

| Card | Run | Result | Child | Duration |
|---|---:|---|---|---:|
| `t_19a0d302` | `#5` | completed | `t_a9fe2b48` | 84s |
| `t_44d37951` | `#6` | completed | `t_869173fd` | 55s |
| `t_a9f202a6` | `#7` | completed | `t_946326fc` | 76s |

三张同 profile cards 均只创建一个 inert child 并完成自身 terminal transition。

### Negative plain-text

- Card `t_c1ac3e41` / run `#12`。
- 模型按要求只返回 plain text，未调用 terminal tool。
- worker 结束时立即写入 `blocked` event；run outcome 为 `blocked`，reason 精确为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`。
- 没有等待下一 dispatcher reconciliation，也没有出现 `pid not alive`、普通 crash 或 auto-complete。

额外 adversarial cards 出现模型 timeout/hallucinated context 时，新 finalizer 均将未完成 run 明确 block，未留下 silent `running` card；这验证了 failure containment，但不计入三次 positive evidence。

## Residual Risks

- Hermes worktree 在本修复前已存在未提交 runtime/tool-policy 与 desktop changes；本轮未 reset 或覆盖它们。
- 扩大 suite 的 15 个既有 Windows/environment failures 仍需单独治理，不能算作本修复 PASS。
- Revision `-19` failure fingerprint 保留；runtime PASS 不会清零旧 fingerprint 或自动授权旧 card retry。

## Next Gate

Codex PMC 可以创建新的 bounded Unit C2 continuation revision；必须继承 revision `-19` failure fingerprint，使用新 Coordinator/card/idempotency，且不得复用旧 chain。

