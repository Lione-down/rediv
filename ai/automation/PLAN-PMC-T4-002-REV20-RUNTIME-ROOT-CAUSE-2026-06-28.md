# PMC Plan — T4-002 Revision 20 Runtime Root Cause

## Goal

查明 revision `-20` Coordinator `t_1617a921` 在 Executor dispatch 前超时的原因，并在不误判为业务 REWORK 的前提下收敛 Queue 与项目状态。

## Evidence Steps

1. 核对 Queue、Task、execution status、card、run、worker log 与 active chain。
2. 对照 `revid-pm` worker policy source、profile config 与 revision `-20` 实际 card body。
3. 判断 120s budget、business scope、runtime policy activation 三类假设。
4. 记录 PMC runtime advisory 与解除条件。
5. 将 revision `-20` 和 Queue 标记为 terminal/non-executable；同步 CURRENT、ROADMAP、parent Task。
6. 运行 `git diff --check` 与一致性检查。

## Non-goals

- 不发布 revision `-21`，不增加 Coordinator budget，不继续拆分 Unit C2。
- 不修改 Hermes runtime、profile、cron、Kanban card 或 execution status。
- 不修改业务代码、migration、tests 或 Executor artifacts。
- 不读取、使用或输出 secret。

## Success Criteria

- root cause 能同时解释缺少 Executor、run #114 工具轨迹与 121s timeout。
- Queue 不再把已耗尽的 revision `-20` 表示为 executable。
- remediation gate 包含 regression test 与 fresh scheduled-path runtime proof。
