# PMC Plan — Hermes Worker Finalization Fix

## Objective

修复 Windows 上 Kanban worker 产生 plain-text/partial result 后未写 terminal transition、最终被 dispatcher 误报为 `pid not alive` 的 runtime 缺陷。

## Root Cause Hypothesis

`cli.py` single-query path 在 `run_conversation()` 返回后直接按 `result.failed` 选择 exit code，没有检查 `HERMES_KANBAN_TASK` 对应 task 是否仍为 `running`。因此 plain-text response 会以 rc=0 退出但留下 running card；dispatcher 只能在后续 tick 通过进程状态兜底。

## Scope

- 为 Kanban worker 添加进程内 deterministic finalization。
- 为 abnormal process exit 添加 retained `Popen.wait()` registry watcher。
- 增加 regression tests，覆盖 clean/no-transition、partial/policy failure、normal terminal transition 与 exit registry。
- 重启 Gateway 后执行 fresh isolated smokes。

## Non-goals

- 不修改 Revid 业务代码、migration、tests 或数据库。
- 不复用、claim、promote、unblock 或 retry revision `-19` 的旧 cards。
- 不读取或输出 secret，不自动恢复 Revid cron。

## Success Criteria

- unfixed behavior 有明确 failing regression test，修复后通过。
- plain-text worker 在进程退出前被标记为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`，不等待 dispatcher tick。
- 已完成 task 不被二次修改；abnormal exit code 可由 watcher registry 分类。
- targeted/full relevant tests、compile、fresh 3+1 isolated smokes 与 `git diff --check` 通过。

