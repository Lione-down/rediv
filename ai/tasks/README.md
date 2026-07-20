# Revid Task Management

本目录记录 Codex Direct Delivery 模式下的 Task、PLAN 和 PROGRESS。`ai/state/CURRENT.md` 是当前唯一 active Task 的入口。

## Directory Contract

```text
ai/tasks/
├── README.md
├── todo/       # Task 定义；状态以文件内容和 CURRENT 为准
├── doing/      # Active 或近期 Task 的 PLAN / PROGRESS
└── done/       # 已归档的完成 Task 定义
```

为保持 durable link 稳定，Task 状态变化不强制移动文件；目录名不具备状态语义。`CURRENT.md`、`ROADMAP.md` 和当前 Task chain 的 `State` / `Verification outcome` 必须一致。

## Required Files

每个 implementation Task 至少包含：

- `TASK-{TaskID}.md`：Objective、Scope、Non-Goals、Acceptance Criteria、Hard Gates 和 Deliverables。
- `TASK-{TaskID}-PLAN.md`：bounded units、实施顺序、验证策略、风险和停止条件。
- `TASK-{TaskID}-PROGRESS.md`：Completed、Remaining、Exact Next Action、Files Changed、Commands And Summarized Results、Blockers And Release Conditions。
- `REPORT-{TaskID}.md`：仅在全部非 deferred AC 和 Hard Gates 满足后创建或定稿。

## State Model

允许状态：

- `TODO`：dependency 尚未满足或未进入执行。
- `DOING`：正在实现唯一 active Task。
- `VERIFYING`：实现已完成，正在完成要求的验证和验收证据。
- `BLOCKED`：存在明确 blocker，且已记录解除条件。
- `DONE`：REPORT、实现、验证、CURRENT 和 ROADMAP 已一致。

同一时间只允许一个 implementation Task 处于 `DOING` 或 `VERIFYING`。

Verification outcome 与 State 分离：

- `PENDING`：尚未完成全部要求的验证。
- `PASS`：全部非 deferred acceptance 与 hard gates 已满足。
- `FAIL`：验证已执行但存在未关闭失败。
- `DEFERRED`：仅用于 Human Owner 明确接受并记录的边界。

T4/T5 历史文件中的复合 metadata 保持为历史证据；从 T6 起，Task、PLAN、PROGRESS、REPORT、CURRENT 和 ROADMAP 必须使用精确 State token 与独立 Verification outcome。运行 `python scripts/validate-project-state.py` 验证当前 durable state。

## Direct Delivery Flow

1. 从 `CURRENT.md` 打开精确 Task、PLAN 和 PROGRESS。
2. 核对 Scope、依赖、Human gates 和 worktree ownership。
3. 选择一个可实现、验证、记录并提交的 bounded unit。
4. 先跑 focused verification，再按风险跑 regression、build、browser 或 integration。
5. fresh self-review 实际 diff，更新 PROGRESS 和 CURRENT。
6. 精确暂存拥有的 path 或 hunk，创建一个本地 commit。
7. 全部 AC 满足后写 REPORT，并将 Task 和 ROADMAP 标为 `DONE`。

不得创建或恢复 Hermes Queue、card、profile、Reviewer、HANDOFF 或 runtime reconciliation。旧文件只作为历史证据。

## Naming

```text
TASK-T5-002.md
TASK-T5-002-PLAN.md
TASK-T5-002-PROGRESS.md
REPORT-T5-002.md
```

Commit 使用 `type(scope): subject`，一个 commit 只包含一个已验证的逻辑单元。

## Active Chain

- `T6-001`: Revid-native cinematic director Skills v2, `DONE / PASS`。
- `T6-002`: project audit remediation and structural hardening, `DOING / PENDING`。
- 精确 active unit 与 next action 见 [CURRENT](../state/CURRENT.md)，完整 dependency 顺序见 [ROADMAP](../state/ROADMAP.md)。
