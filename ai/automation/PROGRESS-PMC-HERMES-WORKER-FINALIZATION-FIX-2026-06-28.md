# PMC Progress — Hermes Worker Finalization Fix

## Status

`COMPLETE`

## Evidence

- run `#113` worker log：`text_response(finish_reason=stop)`，tool turns `0`，随后 CLI cleanup。
- `cli.py` single-query path：`result.failed` 为 false 时直接 `sys.exit(0)`，没有 terminal task-state check。
- fresh Windows probe：相同 spawn flags 下 `Popen.poll() == 0`、`wait() == 0`；“Windows 上 poll 对已退出进程返回 None”被证伪。
- Hermes worktree 已存在未提交修改；本修复将只追加最小 scoped changes。

## Completed

- 已完成 RED→GREEN regression tests、worker in-process finalizer、retained-handle waiter 与 exit registry wiring。
- Targeted tests：10 + 11 + 2 passed；compile 与 scoped diff check passed。
- Gateway 已重启；isolated board 三次 positive 与一次 negative runtime evidence 满足 gate。
- PMC verdict：`PMC_RUNTIME_FIX_PASS — READY_FOR_CONTINUATION`。

## Remaining

- Revision `-19` 旧 chain 保持 terminal；后续由 PMC 单独发布 bounded continuation revision。
