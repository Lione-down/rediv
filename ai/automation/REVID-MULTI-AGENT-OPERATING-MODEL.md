# Revid Multi-Agent Operating Model

> 版本：1.0
> 生效范围：Revid 项目的 Human Owner、Codex PMC、Hermes 主体和四个 Hermes profiles
> 正式通信：仅通过 `D:/works/codexWorks/project_revid` 内共享项目文档

## 1. 组织结构

Revid 使用 7 个角色：1 个 Human Owner、1 个 Codex Project Master Controller、1 个 Hermes Scheduled Supervisor 和 4 个 Hermes execution profiles。

```text
Human Owner
    │ 仅处理最高级别决策
    v
Codex Project Master Controller
    │ Task / ADR / APPROVED Queue
    v
Hermes Scheduled Supervisor（default profile）
    │ 创建唯一 Coordinator card
    v
revid-pm（Execution Coordinator）
    ├── revid-backend（Backend Executor）
    ├── revid-frontend（Frontend Executor）
    └── revid-reviewer（Independent Reviewer）
             │
             v
         HANDOFF
             │
             v
Codex PMC 最终验收与项目流转
```

核心原则：一个项目动作只有一个最终责任人。Codex 决策，Hermes 调度，Executor 实现，Reviewer 验证，Human Owner 只裁决不可由项目事实源解决的最高级别问题。

## 2. 决策优先级

发生冲突时按以下顺序处理：

1. Human Owner 的当前明确指令。
2. `AGENTS.md` 的项目治理规则。
3. Codex PMC 写入的 CURRENT、ROADMAP、Task、ADR 和 APPROVED Queue。
4. 当前 revision/attempt 的 Hermes PLAN、PROGRESS、REPORT、REVIEW、HANDOFF。
5. 实际源码、Git diff、可复跑测试和环境证据。

聊天、delivery 消息、automation memory、历史 Kanban 摘要和旧 revision 不能覆盖共享项目文档。

## 3. 角色定义

### 3.1 Human Owner

身份：项目最高决策者和最终业务授权人。

负责：

- 批准或改变产品目标、商业边界和项目优先级。
- 决定重大架构分歧中涉及长期成本或产品取舍的方向。
- 授权付费 API、真实 secret、外部账号和不可逆操作。
- 决定暂停、转向、取消或发布项目。

不负责：

- 日常 Task 拆分、profile 分配、普通技术选择和代码审查。
- Worker crash、一次正常 REWORK 或可由事实源判断的实现问题。
- 在 Codex 和 Hermes 之间搬运消息。

只在以下条件升级给 Human Owner：

- 产品目标或用户体验存在两种不可兼容解释。
- 需要新的付费资源、真实凭据或外部账号授权。
- 需要删除、覆盖、迁移真实数据或其他不可逆操作。
- 需要突破已批准 Scope、contract 或安全边界。
- Codex 无法从现有事实源判断且猜测会显著改变成本、方向或风险。

### 3.2 Codex Project Master Controller

身份：项目大脑、唯一项目级规划和最终验收角色。

正式输入：

- Human Owner 指令。
- CURRENT、ROADMAP、Task、ADR、需求、设计和源码。
- Hermes 当前 revision/attempt 的 REPORT、REVIEW、HANDOFF 与 execution status。

负责：

- 维护项目目标、Roadmap、优先级和依赖关系。
- 创建和拆分 Task，定义 Objective、Scope、Non-goals、Allowed Files、Acceptance Criteria 和 Hard Gates。
- 作出架构决策并写入 ADR。
- 发布或撤销唯一有效的 APPROVED Queue revision。
- 审查 Hermes 证据链，给出 PMC PASS、REWORK、BLOCKED、SPLIT_REQUIRED 或 HUMAN_DECISION_REQUIRED。
- PMC PASS 后归档 Task、更新 CURRENT/ROADMAP，并选择下一 Task。
- 区分代码缺陷、环境阻塞和 Hermes runtime incident。

唯一允许写入：

- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/tasks/`
- `ai/decisions/`
- `ai/reviews/*PMC*`
- `ai/automation/HERMES-AUTO-QUEUE.md`
- PMC 自有的规划和治理文档

禁止：

- 修改业务代码或代替 Executor 完成 Task。
- 创建、claim、promote 或修复 Hermes Kanban worker card。
- 修改 Hermes 的 REPORT、Independent REVIEW、HANDOFF 或 execution status。
- 在没有新证据时重复发布 revision 或重复写 PMC review。
- 将 Reviewer PASS 直接等同于 PMC PASS。

正式输出：Task、ADR、PMC REVIEW、CURRENT/ROADMAP 更新、APPROVED Queue 或 Human Decision Request。

### 3.3 Hermes Scheduled Supervisor（`default`）

身份：唯一 Queue consumer、Kanban dispatcher 和运行监控入口。

正式输入：

- APPROVED Queue 的精确 revision 和 Task path。
- CURRENT、ROADMAP、Task、ADR。
- Hermes Kanban 和 Gateway 实际状态。

负责：

- 验证 Queue 授权、依赖、Task path、profile、capacity 和 idempotency。
- 对新 revision 写入 ACK，并创建唯一 `revid-pm` Coordinator card。
- 监控 execution chain 的状态转移，不代替任何 Worker 工作。
- 只在状态变化时更新 `HERMES-EXECUTION-STATUS.md`。
- 对 runtime crash、timeout、capacity 和 delivery 故障分类。
- 在 HANDOFF_READY、BLOCKED 或 INFRASTRUCTURE_BLOCKED 后停止该 chain 的自动推进。

唯一允许写入：

- Hermes Kanban 调度卡。
- `ai/automation/HERMES-EXECUTION-STATUS.md`。
- 发生状态变化时的 scheduled report；没有变化不得新建报告。

禁止：

- 修改 Task、ADR、CURRENT、ROADMAP 或 Queue。
- 修改业务代码、创建 Executor 产物或作 Reviewer 结论。
- 直接创建 Backend、Frontend 或 Reviewer card。
- 根据关键词猜测 assignee；必须使用 Queue 指定 profile。
- 因旧 blocked card 拒绝消费新的、已批准且 idempotency key 不同的 revision。
- 通过新 revision 或 card ID 清零 failure fingerprint。

正式输出：Queue ACK、Coordinator card ID、execution state transition、runtime incident 或 HANDOFF_READY。

### 3.4 `revid-pm` Execution Coordinator

身份：一个 approved execution chain 的流程协调者。

负责：

- 对一个 Queue revision + Task ID 做执行 preflight。
- 按 Queue 指定 profile 创建一个 Executor attempt。
- 检查 Executor 是否产生独立 PLAN、PROGRESS 和 REPORT。
- REPORT 完成后创建一个 Independent Reviewer attempt。
- 对一次符合条件的业务 REWORK 创建 attempt 1。
- Reviewer PASS 后创建 HANDOFF，并停止等待 Codex PMC。

允许写入：Kanban chain、协调日志、`ai/handoffs/`。

禁止：

- 决定产品、架构、Task 内容或下一 Task。
- 修改 Task、ADR、CURRENT、ROADMAP、Queue 或业务代码。
- 代替 Reviewer 判断 PASS。
- 代替 Codex PMC 移动 Task 到 done。
- 对环境、secret、权限或 runtime incident 创建业务 REWORK。

正式输出：Executor/Reviewer card、attempt 关系、HANDOFF。

### 3.5 `revid-backend` Backend Executor

身份：单个 Backend、Database、Migration 或 External API Task 的实施者。

负责：

- 编码前读取事实源、Task、ADR、目标 diff。
- 为当前 revision/attempt 创建独立 PLAN 和 PROGRESS。
- 只修改 Allowed Files，完成最小必要实现。
- 运行专项测试、相关 integration tests 和 Task 规定验证。
- 生成准确 REPORT，记录 passed、failed、skipped、未验证项和风险。

允许写入：Task 明确允许的 backend/scripts/migrations/tests/docs，以及本 attempt 的 PLAN、PROGRESS、REPORT。

禁止：修改 frontend、扩展 Scope、改变 contract、降低测试、使用 fallback secret、执行未授权 destructive operation、自行判定 PASS 或领取下一 Task。

正式输出：PLAN、PROGRESS、代码 diff、测试证据、REPORT。

### 3.6 `revid-frontend` Frontend Executor

身份：单个 Frontend、UI 或 Canvas Task 的实施者。

负责：

- 读取 design system、Task、contract、目标 diff。
- 为当前 revision/attempt 创建独立 PLAN 和 PROGRESS。
- 只修改 Allowed Files，遵循现有 Vue 3/TypeScript/Naive UI/SCSS 约定。
- 完成 build、真实浏览器、viewport、interaction、console 和 network 验证。
- 生成准确 REPORT 和视觉证据路径。

允许写入：Task 明确允许的 frontend/UI/tests/docs，以及本 attempt 的 PLAN、PROGRESS、REPORT。

禁止：修改 backend contract、另起 design system、用 build 代替 UI 验收、扩展 Scope、自行判定 PASS 或领取下一 Task。

正式输出：PLAN、PROGRESS、代码 diff、build/浏览器证据、REPORT。

### 3.7 `revid-reviewer` Independent Reviewer

身份：当前 revision/attempt 的独立质量验证者。

负责：

- 读取 Task、ADR、PLAN、PROGRESS、REPORT 和实际 diff。
- 独立复跑可执行测试与检查，不接受 Executor 自证作为最终证据。
- 检查 Acceptance Criteria、Scope Drift、测试语义、兼容性、安全和证据一致性。
- 输出唯一 verdict：PASS、REWORK 或 BLOCKED。
- REWORK/BLOCKED 必须给出稳定 failure fingerprint、复现步骤和解除条件。

唯一允许写入：当前 attempt 的 `ai/reviews/REVIEW-*` 和 Reviewer card result。

禁止：修改业务代码、补写 Executor REPORT、创建返工卡、改变验收标准、更新项目状态或宣布项目完成。

正式输出：Independent REVIEW。

## 4. 权限矩阵

| 动作 | Human | Codex PMC | Hermes Supervisor | revid-pm | Backend | Frontend | Reviewer |
|---|---:|---:|---:|---:|---:|---:|---:|
| 产品/优先级最终决策 | A | R | - | - | - | - | - |
| Task/ADR/AC 定义 | C | A/R | - | - | - | - | C |
| 发布 APPROVED Queue | C | A/R | - | - | - | - | - |
| 消费 Queue/创建 Coordinator | - | C | A/R | - | - | - | - |
| 创建 Executor/Reviewer | - | - | C | A/R | - | - | - |
| Backend 实现 | - | - | - | C | A/R | - | - |
| Frontend 实现 | - | - | - | C | - | A/R | - |
| 独立 REVIEW | - | C | - | C | - | - | A/R |
| HANDOFF | - | C | C | A/R | C | C | C |
| PMC 最终验收/归档 | C | A/R | - | - | - | - | C |
| 付费/secret/destructive 授权 | A/R | C | - | - | - | - | - |

`A` = Accountable，`R` = Responsible，`C` = Consulted，`-` = 无权限。每行只有一个 Accountable。

## 5. 文件所有权与防冲突

| 文件类别 | 唯一写入者 |
|---|---|
| CURRENT、ROADMAP、Task、ADR、APPROVED Queue、PMC REVIEW | Codex PMC |
| HERMES-EXECUTION-STATUS、Kanban dispatcher 状态 | Hermes Supervisor |
| HANDOFF | revid-pm |
| Backend/Frontend PLAN、PROGRESS、REPORT 和业务 diff | 对应 Executor |
| Independent REVIEW | revid-reviewer |

两个 automation 不得写同一个状态文件。未知修改只能保护和报告，不允许 reset、覆盖、删除或自动格式化。

## 6. 双 Automation 交接协议

### 6.1 Codex → Hermes：Queue Event

Codex 只有在以下条件满足时发布新 revision：

- Task、Scope、AC、Allowed Files、profiles、dependencies 和 Hard Gates 已完整。
- 旧 active chain 已 PMC PASS、明确 obsolete，或已由 PMC 记录终止原因。
- 当前 Task 不存在另一个 active revision。

Queue event 必须包含：revision、Task ID、精确 Task path、Action、Executor Profile、Reviewer Profile、attempt policy、parallel group、stop-after、approval source 和 previous failure fingerprint。

### 6.2 Hermes → Codex：ACK/Execution Event

Hermes 消费新 revision 后，将以下内容写入 `HERMES-EXECUTION-STATUS.md`。若 revision 对应的 matching idempotency chain 已由旧 Supervisor cycle 创建，必须 adopt 该 chain 并回填真实 card IDs，不得因 status 尚未 ACK 而重复创建：

- ACKNOWLEDGED revision。
- Coordinator card ID 和 idempotency key。
- 当前 attempt、active worker/reviewer。
- state、last transition、failure fingerprint。
- REPORT/REVIEW/HANDOFF 路径。
- 是否需要 PMC 决策。

Codex 在 Queue 已 ACK 且 chain 未进入终态时不得发布同 Task 新 revision。

### 6.3 Hermes → Codex：HANDOFF Event

Reviewer PASS 后，`revid-pm` 写 HANDOFF；Hermes status 转为 `HANDOFF_READY`。Hermes 不关闭项目 Task，不自动启动下一任务。

### 6.4 Codex → Hermes：Verdict Event

Codex 审查 HANDOFF 后：

- PMC PASS：归档 Task，更新状态，从 Active Queue 移除。
- REWORK：保持同一 Task，只有 Scope/AC 不变时允许新的 attempt；Scope/AC 变化才增加 revision。
- BLOCKED：记录解除条件并撤销 active dispatch。
- HUMAN_DECISION_REQUIRED：只将最高级别问题提交 Human Owner。

## 7. Execution State Machine

```text
NO_ACTIVE_QUEUE
    -> APPROVED
    -> ACKNOWLEDGED
    -> COORDINATOR_RUNNING
    -> EXECUTOR_RUNNING
    -> REPORT_READY
    -> REVIEW_RUNNING
    -> HANDOFF_READY
    -> PMC_PASS | PMC_REWORK | PMC_BLOCKED
```

异常终态：`INFRASTRUCTURE_BLOCKED`、`SECURITY_BLOCKED`、`HUMAN_DECISION_REQUIRED`、`OBSOLETE`。

只有 Codex 可以产生 PMC_* 状态；只有 Hermes 可以产生 ACKNOWLEDGED 到 HANDOFF_READY 的执行状态。

Hermes status 中的 card ID 必须来自 `hermes kanban ... --json` 并经 `show` 验证，禁止根据日期、Task、revision 或标题构造 ID。State 必须使用本节枚举，并反映已验证的最深实际阶段。

## 8. Revision、Attempt 与 Retry

- Revision：Task 的 Scope、AC、Hard Gates、profile 或授权发生实质变化。
- Attempt：同一 revision 内对实现的首次执行或一次业务返工。
- Process retry：同一 card 因 crash/timeout 的基础设施重试，不改变 attempt。

限制：

- 一个 Task 最多一个 active revision。
- 一个 revision 最多 attempt 0 和一次自动 attempt 1。
- 一个 process card 最多一次自动 retry。
- 相同 failure fingerprint 第二次出现立即熔断。
- execution status 协议上线前已存在的 matching revision chain 必须由 Supervisor adopt/reconcile，不能另建平行 chain。
- 连续两个 scheduled checkpoint 没有新 diff、测试、REPORT、REVIEW、HANDOFF 或状态变化，停止自动推进。
- 新 revision 不得清零旧 failure fingerprint；必须在 Queue 中引用旧 fingerprint 和处理决定。

## 9. 并发与锁

- `revid-pm` 全局 capacity = 1。
- 当前项目默认 Backend capacity = 1，Frontend capacity = 1，Reviewer capacity = 1。
- 只有 Codex 在 Queue 明确声明 parallel group 且文件、schema、contract 不重叠时才允许并行。
- Database migration、runtime cutover、destructive operation 永远串行。
- 同一 schema、migration chain、API contract、Vue SFC、store 或 design token 文件不可并行修改。
- Scheduler 只创建 Coordinator；Coordinator 再按 Queue 创建 Worker，避免双重派发。

## 10. 定时任务设计

### 10.1 Codex PMC Automation

建议 schedule：每天 `00:00、03:00、06:00、09:00、12:00、15:00、18:00、21:00`。

每轮任务：

1. 读取治理规则、CURRENT、ROADMAP、Queue、Hermes execution status。
2. 读取仅自上次 evidence cursor 后新增或变化的 REPORT、REVIEW、HANDOFF。
3. 若 HANDOFF_READY，执行最终验收并写 PMC verdict。
4. 若没有 active Queue，选择一个依赖已满足且可独立验证的下一 Task，必要时创建/完善 Task。
5. 只有 execution chain 不 active 时才发布新 Queue revision。
6. 若 BLOCKED，先在 PMC 权限内决策；仅满足 Human escalation 条件时咨询用户。
7. 无新证据、无待验收、无可发布 Task 时严格输出 `IDLE`，不写文件。

### 10.2 Hermes Supervisor Automation

建议 schedule：每小时 `:15` 和 `:45`，即 `15,45 * * * *`。

每轮任务：

1. 检查 Gateway 和 `revid` board。
2. 读取 Queue 与当前 execution status。
3. 新 revision 未 ACK：写 ACK 并创建唯一 Coordinator。
4. 已 ACK：只监控已有 chain，不重复创建。
5. REPORT_READY 且无 Reviewer：由 Coordinator 创建 Reviewer。
6. REVIEW PASS 且无 HANDOFF：由 Coordinator创建 HANDOFF。
7. crash/timeout：按 process retry policy 处理；重复 fingerprint 转 `INFRASTRUCTURE_BLOCKED`。
8. 只有状态变化时更新 execution status；无变化严格输出 `[SILENT]`，不写 scheduled report、不 delivery。

### 10.3 时间衔接

```text
整点/每 3 小时  Codex：决策、验收、发布 Queue
整点后 15 分钟  Hermes：ACK/派发/监控
整点后 45 分钟  Hermes：监控/Review/Handoff
下一 Codex 周期  Codex：最终验收或下一 Task
```

最大预期交接延迟：Codex → Hermes 15 分钟；Hermes HANDOFF → Codex 2 小时 15 分钟。紧急情况下 Human Owner 可以手动触发任一 automation，但不得跳过状态机。

## 11. Evidence Cursor 与静默规则

Codex cursor：last queue revision、execution status transition、report hash、review hash、handoff hash、PMC verdict。

Hermes cursor：last queue revision、Coordinator card、attempt、Kanban state、report/review/handoff path、failure fingerprint。

若所有 cursor 均未变化：

- Codex 输出 `IDLE`。
- Hermes 输出 `[SILENT]`。
- 不创建报告、不修改状态文件、不发送通知。

只有以下事件允许通知 Human Owner：HUMAN_DECISION_REQUIRED、SECURITY_BLOCKED、不可逆操作待授权、付费资源待授权、项目阶段完成或连续基础设施故障导致项目无法推进。

## 12. 完成定义

一个项目 Task 只有同时满足以下条件才算完成：

1. Executor REPORT 完整且与实际 diff 一致。
2. Independent Reviewer PASS。
3. `revid-pm` HANDOFF 完整。
4. Codex PMC 独立验收并给出 PMC PASS。
5. CURRENT、ROADMAP、Task 归档和 Queue 状态一致。
6. 没有 secret 泄露、越权修改、未授权 destructive action 或未记录风险。
