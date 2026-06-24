# Hermes Execution Status

> 常规写入者：Hermes Scheduled Supervisor（`default` profile）
> 读取者：Codex Project Master Controller
> 更新规则：只在 Queue ACK 或 execution state transition 时更新；无变化不得改写

## Active Execution

| Field | Value |
|---|---|
| Queue Revision | `phase4-wave2-recovery-dispatch-2026-06-24-07` |
| Task ID | `T4-002` |
| State | `EXECUTOR_RUNNING` |
| Coordinator Card | `t_e23d9043` |
| Executor Card | `t_748c116d` |
| Reviewer Card | `NONE` |
| Attempt | `0` |
| Process Retry | `1/1 used` |
| Failure Fingerprint | `PROCESS_PID_NOT_ALIVE` |
| Report Path | `NONE` |
| Review Path | `NONE` |
| Handoff Path | `NONE` |
| Last Transition At | `2026-06-24T23:15:33+08:00` |
| PMC Decision Required | `NO` |

## Queue Contract

- Revision: `phase4-wave2-recovery-dispatch-2026-06-24-07`
- Project Task File: `ai/tasks/todo/TASK-T4-002.md`
- Coordinator Key: `revid:phase4-wave2-recovery-dispatch-2026-06-24-07:T4-002:coordinate`
- Executor: `revid-backend`
- Reviewer: `revid-reviewer`

## Verified Runtime Evidence

- Coordinator `t_e23d9043`：`done`，revision `-07`，assignee `revid-pm`。
- Executor `t_748c116d`：`running`，parent `t_e23d9043`，assignee `revid-backend`。
- Run #75：`crashed`，fingerprint `pid not alive`。
- Run #76：自动 process retry，持续 heartbeat；该 retry 已用完 revision `-07` 的 process retry 配额。
- Reviewer、REPORT、REVIEW、HANDOFF：尚未产生。

## Transition Log

- 2026-06-24 23:08：Coordinator `t_e23d9043` 创建 Executor `t_748c116d`。
- 2026-06-24 23:09：Executor run #75 启动。
- 2026-06-24 23:15：run #75 因 `pid not alive` crash；Gateway 自动启动 run #76。
- 2026-06-24 23:26：协议迁移恢复。Codex PMC 仅依据 `hermes kanban ... --json/show/runs` 的结构化证据，一次性修复旧 Supervisor 写入的伪 card ID 和非标准 State；未创建、修改或流转 Kanban card。此后恢复 Hermes Supervisor 单写者约束。

