# PMC Progress — T4-002 Revision 20 Runtime Root Cause

## Completed

- [x] 核对 revision `-20` Queue、Task、card `t_1617a921`、run `#114`、context、worker log 与 active chain。
- [x] 对照 installed runtime source 与 `revid-pm` profile policy，确认 card body 缺少 standalone action marker 导致 exact policy 未激活。
- [x] 排除 Unit C2 scope 与 120s budget 是根因。
- [x] 写入 PMC runtime advisory，并将 revision `-20` Task 标为 terminal。
- [x] 同步 parent Task、CURRENT、ROADMAP。
- [x] 最后将 Queue 设为 terminal/non-executable；未发布 revision `-21`。

## Preserved Boundaries

- 未修改 Hermes runtime、profile、cron、Kanban card 或 execution status。
- 未修改业务代码、migration、tests、数据库或 Executor artifacts。
- 未复用、重试或解除任何旧 card。

## Verification

- [x] `git diff --check` passed。
- [x] Queue、Task、CURRENT、ROADMAP 均将 revision `-20` 标为 terminal/non-executable。
- [x] Kanban `running`、`review`、`ready`、`scheduled` 均为空。
- [x] Historical contract 已明确标记为 non-executable，不构成新授权。
