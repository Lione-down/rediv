# Revid 多 Agent 协同治理计划

## 目标

为 Human Owner、Codex Project Master Controller、Hermes Scheduled Supervisor 和 Hermes 四个执行 profiles 建立唯一、无重叠、可审计的职责边界，并设计两个定时任务之间基于项目文档的稳定交接协议。

## 范围

- 定义 7 个角色的使命、输入、允许行为、禁止行为、输出和升级条件。
- 建立 Codex PMC 与 Hermes Supervisor 的双 automation 状态机。
- 定义 Queue、ACK、PLAN、PROGRESS、REPORT、REVIEW、HANDOFF 和 PMC verdict 的证据链。
- 定义幂等键、attempt、failure fingerprint、熔断、并发锁和静默规则。
- 提供 Codex automation、Hermes automation、Hermes 主体与四个 profiles 的可部署 prompt 模板。
- 记录项目内模板与 Desktop 实际配置之间的同步边界。

## 非目标

- 不修改业务代码、数据库、测试或产品需求。
- 不改变当前 T4-002 的 Active Queue、任务状态或执行证据。
- 不在本轮修改 `D:/works/codexWorks/project_revid` 之外的 Hermes SOUL/profile 配置。
- 不在未完成配置核对前直接重启 Gateway 或强制运行 cron。

## 核心决策

1. Human Owner 只承担最高级别产品、成本、安全和不可逆决策。
2. Codex PMC 是唯一项目级规划、任务定义、架构决策和最终验收角色。
3. Hermes Scheduled Supervisor 是唯一 Queue 消费与 Kanban 调度入口，不拥有项目决策权。
4. `revid-pm` 是单个 approved execution chain 的协调者，不是项目经理。
5. Backend/Frontend Executor 只实现和自证；Reviewer 只独立验证；二者都不能流转项目状态。
6. 两个 automation 只通过共享项目文档通信，不依赖聊天、delivery 消息或 private memory。
7. 同一 Task 同一时刻只有一个 active revision 和一个 active execution chain。
8. 业务 REWORK、process retry 与新 revision 分开计数，禁止用新 revision 清零失败历史。

## 实施步骤

1. 新增多 Agent operating model，包含权限矩阵、状态机和冲突处理。
2. 更新 Codex PMC automation 模板，明确证据游标、决策门和静默条件。
3. 更新 Hermes Supervisor 模板，明确 Queue ACK、单链调度和事件输出。
4. 新增 Hermes 主体与四 profiles 的部署模板。
5. 将规则变更同步到 `pitfalls.md`。
6. 执行 UTF-8、结构、引用、diff 和 prompt 一致性检查。

## 验收标准

1. 7 个角色均有唯一使命、允许写入范围、禁止行为、输入、输出和升级条件。
2. 任一项目动作只能找到一个 Accountable 角色；不得同时由 Codex 和 Hermes 决策。
3. Codex 和 Hermes automation 之间存在可持久化的 Queue ACK 与 HANDOFF 协议。
4. 定时任务没有新事件时保持静默，不创建重复报告、revision 或 Kanban card。
5. 同一 failure fingerprint 重复、无进展 checkpoint 和 process crash 均有明确熔断路径。
6. 项目内模板可以独立复制到 Desktop 配置，不依赖本次聊天上下文。
7. 本轮 diff 不触及业务代码或当前 Active Queue。

## 风险与回滚

- 风险：项目内 prompt 不会自动同步到 Desktop 实际配置；部署必须单独完成并验证。
- 风险：Hermes cron 当前每 20 分钟运行且 delivery 为 `all`，若不调整仍会产生重复通知和 rate limit。
- 风险：已有未提交变更较多，本轮只新增治理文档并精确修改指定 prompt/pitfalls 文件。
- 回滚：删除本轮新增模板并恢复本轮修改的 prompt/pitfalls，不影响业务数据和 Active Queue。

