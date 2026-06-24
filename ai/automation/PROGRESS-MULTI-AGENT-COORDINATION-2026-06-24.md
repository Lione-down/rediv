# Revid 多 Agent 协同治理进度

## 2026-06-24

- [x] 审计 Codex PMC automation 模板及 Desktop 实际 automation 配置。
- [x] 审计 Hermes 主体 SOUL、四个 profiles SOUL、Kanban 和实际 cron。
- [x] 确认真实 Hermes 主体为 `default` profile，四个执行 profiles 独立存在。
- [x] 确认所有 Hermes profiles 当前缺少 orchestrator description。
- [x] 确认 Hermes 主体 cron 当前为每 20 分钟运行、delivery=`all`，已产生重复报告和 delivery rate limit。
- [x] 创建本治理计划。
- [x] 建立 7 角色 operating model 与权限矩阵。
- [x] 完成双 automation 状态机与事件协议。
- [x] 更新 Codex PMC 与 Hermes Supervisor prompt 模板。
- [x] 新增 Hermes 主体和四 profiles 部署模板。
- [x] 同步项目与全局 pitfalls 规则变更。
- [x] 更新 Codex Desktop PMC automation：每天 8 次、每 3 小时整点运行。
- [x] 更新 Hermes cron：每小时 `:15/:45` 运行，项目工作目录固定，事件外严格 `[SILENT]`。
- [x] 补齐 Hermes `default` 与四个执行 profiles 的 orchestrator descriptions。
- [x] 完成 UTF-8、引用、diff 与一致性验证。
- [x] 实测发现 revision `-07` 已由旧 cycle 创建 matching chain，补充新 Supervisor 对既有 idempotent chain 的 adopt/reconcile 规则。
- [x] 修复 Windows PowerShell 5 传递多行 Hermes cron prompt 时只保存首行的问题；实际 cron prompt 已以语义等价单行写入，并验证长度、`adopt/reconcile`、`[SILENT]`、workdir 和 schedule。
- [x] 首轮 ACK 暴露伪造 card ID 与非标准 State；补充 Kanban JSON + show 双证据、禁止构造 ID、固定 State 枚举和最深阶段同步 Hard Gate。
- [x] 清理 job `72a21342a164` 遗留的 18 个旧 Supervisor/manual-run 进程，不触碰 Gateway、Kanban 或 Backend execution chain。
- [x] 依据结构化 Kanban 证据一次性修复迁移期错误 status：Coordinator `t_e23d9043`、Executor `t_748c116d`、State `EXECUTOR_RUNNING`；记录 process retry 1/1 已使用。

## 已验证事实

- Codex automation ID：`revid-codex-pmc-advisor`，当前每天 09:00、14:00、21:00 运行。
- Hermes cron ID：`72a21342a164`，当前 `*/20 * * * *` 运行。
- Hermes 主体：`default`，角色为 Scheduled Supervisor / Execution Controller。
- Hermes profiles：`revid-pm`、`revid-backend`、`revid-frontend`、`revid-reviewer`。
- Hermes Gateway 正常运行；旧 T4-002 execution chain 仍为 blocked。

## 部署结果

- Codex automation：`revid-codex-pmc-advisor`，显示名称已更新为 `Revid Codex PMC Controller`，状态 ACTIVE。
- Hermes cron：`72a21342a164`，显示名称已更新为 `Revid Hermes Execution Supervisor`，状态 active。
- Hermes cron 更新时执行了 pause -> edit -> resume，没有触发手工 run、Gateway 重启或 Kanban 修改。
- Hermes 五个 profile descriptions 已按唯一职责写入；外部 SOUL 正文未覆盖，项目内模板作为 canonical 配置源。

## 完成状态

计划内角色治理、prompt、状态机和真实双 automation 配置已完成。后续由下一次 Hermes scheduled cycle 消费 `HERMES-AUTO-QUEUE.md` 并写入首次 ACK；Codex PMC 只在新的 execution event 后决策。

## 最终验证

- 9 个核心治理/prompt 文件：UTF-8 replacement character = 0。
- Codex automation：ACTIVE，schedule 和 workspace 正确，prompt 无 shell 包装头。
- Hermes cron：active，prompt length 6195，workdir、schedule、`[SILENT]`、真实 ID Hard Gate 均已持久化。
- 部署遗留的旧 Supervisor writer 进程：0。
- Hermes execution status 与 Kanban 结构化证据一致：`t_e23d9043` -> `t_748c116d`，State `EXECUTOR_RUNNING`。
- 治理范围 `git diff --check -- ai/automation ai/prompts pitfalls.md`：PASS。
- 全仓 `git diff --check` 当前仅报告 active Backend Executor 在 `backend/scripts/migrate_sqlite_to_mysql.py:263` 的 trailing whitespace；按角色边界未越权修复，交当前 Executor/Reviewer 处理。
