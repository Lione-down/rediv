# 踩坑记录

## 2026-06-17 文档编码与认证方案

- 所有需求文档统一按 UTF-8 编码读取和保存，避免中文在 PowerShell 默认编码下显示乱码。
- 第一版认证不做 SMS、email、用户名密码注册，避免短信和邮件成本失控。
- 微信开放平台审核、域名和回调配置可能阻塞真实 OAuth，开发阶段必须保留 mock provider。
- 免费额度不能只做余额字段，必须有 quota ledger，方便排查发放、消耗、返还和管理员调整。

## 2026-06-17 Git 敏感文件规则

- 项目提交到 GitHub 前必须确认 `.gitignore` 覆盖 `.env`、`.env.*`、密钥、token、证书和构建缓存。
- 真实微信 `AppSecret`、Agnes API key、JWT secret、GitHub token 等只能通过环境变量或部署平台 secret 管理。
- 若新增或修改全局规则，必须同步记录到项目 `pitfalls.md` 和全局 `D:\works\codexWorks\pitfalls.md`。
  
- [2026-06-17] 补充群组选区外框与多线预览时，注意外框只是视觉壳，真正的连线起点仍然必须取自被选中的节点本体，否则会回到“从框本体发线”的旧交互。
- [2026-06-17] 锚点拖拽预览要直接挂到 connector 上，单靠节点边缘容易出现“线条悬空”的观感回退。
- [2026-06-17] 需求记录要拆成“已记录需求 / 未完成需求”两部分，避免只记实现不记待办，后续回看时难以判断优先级。

## 2026-06-19 表结构备注规则

- 所有涉及数据库表结构的设计与变更，必须为表本身补充备注。
- 所有涉及数据库表结构的设计与变更，必须为每个字段补充备注。
- 新增表、修改表、补字段时，备注属于必填项，不能遗漏到后补阶段。

## 2026-06-20 前端依赖核验

- 涉及第三方库接入的 TASK，在开始实现前必须先核实名、版本和导出 API 是否真实存在，尤其是 npm 包名与文档中的类名不能直接等同。
- 当任务文案指定的依赖包在 registry 中不存在，或指定 API 无法从官方包/本地类型中验证时，必须先产出 `BLOCKED` 报告，不能靠猜测替换成近似实现继续推进。

## 2026-06-21 项目 Agent 角色调整

- 项目级 Agent 身份由 Codex Executor 调整为 Project Master Controller（项目总控）。
- Project Master Controller 负责规划、需求分析、架构决策、任务拆分、成果审查、文档治理和项目流转。
- 编码执行默认交给 Executor；除非用户明确要求项目总控直接实施，否则项目总控不直接替代执行 Agent。
- Hermes 是用户的另一个智能体工具，不作为当前项目 Agent 的身份名称。
- 角色调整已同步写入项目 `AGENTS.md`，避免会话身份与项目治理规则冲突。

## 2026-06-22 Hermes 定时多 Profile 自动化

- Cron 只负责定时巡检、读取批准队列、创建幂等协调卡片和监控结果，长时间开发由 Kanban dispatcher 启动独立 Worker。
- scheduled mode 只能执行 `ai/automation/HERMES-AUTO-QUEUE.md` 中由 Human User 或 Codex PMC 批准的 Task ID，不能自行扩展 Roadmap。
- Executor、Reviewer 和 handoff 必须按依赖串联；Reviewer 自动返工最多一次，再次失败转为 `BLOCKED`，避免无限循环。
- Reviewer PASS 不是项目最终验收，任务仍需 Codex PMC 确认后才能进入 done 或解锁后续波次。
- 自动执行前必须检查未提交修改、secret、付费 API、DDL 权限和 destructive operation，任一条件不清楚时停止并报告。

## 2026-06-22 本地 `.env` 使用边界

- 本地 `.env` 未被 Git 跟踪时，Executor、Reviewer 和 PMC 可以直接读取其中的任务配置完成连接与验证。
- “不得泄露 secret”不等于“不得读取本地 secret”；禁止的是打印、复制到文档或其他文件、暂存和提交。
- Hermes Safety Gate 已同步更新，避免把本地凭据误报为必须由用户在聊天中提供的 blocker。

## 2026-06-23 集成测试与浏览器验收证据

- Windows Python integration test 不得硬编码 `/d/...` 等 MSYS 路径；脚本位置必须从 `__file__` 或项目根目录结构化解析。
- 数据迁移 integration test 必须创建或连接专用 disposable test database；仅检测到本地密码不代表获准写用户现有数据库。
- “provider 存在”与“provider 交互通过”是两种证据。lazy container 未挂载只能证明尚未触发，不能作为 message/dialog/notification/loading smoke PASS。
- Vue injection composable 应在 setup context 获取实例，事件 handler 复用实例；验收必须真实点击并检查 DOM 与 console，不能只凭 build 和静态模板判定。
- Hermes Worker 无法读取项目 `.env` 时，测试凭据必须由其 runtime secret/environment 注入；授权创建测试库不等于授权读取或复制现有数据库密码。

## 2026-06-24 Hermes Desktop 角色与文档通信

- Hermes Desktop 的运行时角色以本机总 SOUL 和四个 profile SOUL 为准；项目内不再维护重复的 `hermes-desktop-profiles.md`。
- Codex PMC 与 Hermes Desktop 只通过共享项目文档通信：Codex 侧提供 Queue、Task、ADR、CURRENT、ROADMAP；Hermes 侧返回 PLAN、PROGRESS、REPORT、REVIEW、HANDOFF。
- 聊天输出、automation memory、历史 Kanban 摘要和归档文档不能作为跨系统授权或当前项目事实源。
- Queue 只代表执行授权，不代表 Task 已 ready、running 或 done；Queue 与 CURRENT、ROADMAP、Task、ADR 冲突时必须停止并交 Codex PMC。
- Scheduled Supervisor 只创建 `revid-pm` 协调卡；`revid-pm` 负责创建 Executor、Reviewer、HANDOFF 依赖链，Reviewer 不创建返工卡。
- 每个 Task 最多一次自动 REWORK；相同 failure fingerprint 再次出现时直接 BLOCKED，不得通过新 card ID、文件名或 queue revision 清零。
- Reviewer 必须先检查 Authorization、ADR 和 Hard Gates，再检查测试语义；test name、test count、build success 或 Executor 报告不能覆盖 Hard Gate 失败。
- Task 或 ADR 指定专用 secret 时禁止 fallback；缺 secret、权限、database identity 或 destructive authorization 时只能 BLOCKED。
- Hermes Desktop 的 Scheduled Supervisor 模板保存在 `ai/prompts/hermes-scheduled-supervisor.md`，需要人工复制到 Desktop；修改模板不会自动改变真实定时任务。
- Codex PMC automation 是可写的 Project Master Controller：可以维护 PMC 自有的 Task、ADR、PMC REVIEW、CURRENT、ROADMAP 和 Queue，但不得修改业务代码、Hermes 证据文档或 Kanban。其模板保存在 `ai/prompts/revid-codex-pmc-advisor.md`，需要人工复制到 Codex Desktop automation。
- PMC Advisor 必须读取 `ai/handoffs/*` 并按 queue revision、Task ID、attempt、failure fingerprint 核对 REPORT、REVIEW、HANDOFF；automation thread 输出仅供用户查看，Hermes 不可见。
- Codex PMC 的正式决定必须在同一轮写入共享项目文档；只有 Queue、Task、ADR、PMC REVIEW、CURRENT、ROADMAP 中的内容才会被 Hermes 定时任务读取。
- Hermes Scheduled Supervisor 仍是四个 profiles 的唯一调度与监督入口；Codex PMC 不创建 Kanban card，也不直接控制 profile。

## 2026-06-24 Git ignore 清理边界

- 本地 database 文件、项目根目录一次性诊断脚本、backend 根目录 debug/verify 脚本和 Windows `nul` 产物不进入版本管理。
- 一次性脚本规则必须使用 anchored path；禁止使用宽泛的 `test_*.py`，避免误伤 `backend/tests/` 中的正式测试。
- `.gitignore` 只阻止未跟踪文件进入 Git；已经 tracked 的文件不能靠新增 ignore 规则自动移出版本管理。

## 2026-06-24 七角色与双 Automation 协同协议

- Revid 固定为 7 个角色：Human Owner、Codex PMC、Hermes Scheduled Supervisor、`revid-pm`、`revid-backend`、`revid-frontend`、`revid-reviewer`；每个项目动作只能有一个 Accountable 角色。
- Codex PMC 是唯一项目规划、Task/ADR 定义、Queue 发布和最终验收角色；Hermes 只消费批准 Queue、调度和监督执行，不做项目决策。
- `revid-pm` 只协调单个 execution chain；Backend/Frontend 只实现和自证；Reviewer 只独立验证。Reviewer PASS 必须经过 HANDOFF 和 Codex PMC 最终验收。
- 两个 automation 使用单写者文件避免冲突：Codex 独占 CURRENT、ROADMAP、Task、ADR、PMC REVIEW、Queue；Hermes 独占 `HERMES-EXECUTION-STATUS.md`。
- Queue revision 表示 Scope/AC/授权变化；attempt 表示同 revision 的实现/返工；process retry 表示同 card 的 crash/timeout。三者必须分开统计。
- 同一 Task 只能有一个 active revision 和一条 active execution chain；业务 REWORK 最多一次，process retry 最多一次，相同 failure fingerprint 第二次出现立即熔断。
- Codex 和 Hermes 都必须保存 evidence cursor。没有 Queue、execution state、REPORT、REVIEW、HANDOFF 或 fingerprint 变化时，Codex 输出 `IDLE`，Hermes 输出 `[SILENT]`，不得写重复报告或发送通知。
- Hermes 主体 cron 不应每 20 分钟向所有 channel 固定 delivery；推荐每小时 `:15/:45` 运行，只对真实状态事件 delivery，避免重复报告和 rate limit。
- 项目内 SOUL/prompt 是部署模板，不会自动修改 Hermes Desktop；外部 profile 配置必须按部署映射单独同步和验证。
- 新 execution status 协议上线时，若 matching revision chain 已由旧 Supervisor cycle 创建，新 Supervisor 必须按 idempotency key 接管并回填真实 card IDs，不能因 status 尚未 ACK 再建平行 chain。
- Windows PowerShell 5 把多行变量传给 `hermes cron edit --prompt` 时可能只保存首行；应折叠为语义等价的单行参数，并直接复查 `jobs.json` 的 prompt length、关键规则和 workdir。
- Agent 可能在“接管已有 chain”时构造看似合理的 card ID 或自创 State；execution status 必须要求 Kanban JSON + `show` 双证据、固定枚举，并同步到已验证的最深实际阶段。
- 修改 cron schedule/prompt 不会自动清理旧 `slash_worker`；部署时必须检查同一 job 的残留 Supervisor 会话，保证只有一个 status writer。协议迁移期若旧会话已写入伪状态，可基于结构化证据做一次性 bootstrap 修复并记录例外，随后恢复单写者约束。

## 2026-06-25 Hermes 输出语言规则

- Hermes Desktop 的系统 delivery 提示是英文，若项目 prompt 没有更高优先级的中文输出硬规则，scheduled supervisor 容易沿用英文写报告。
- `ai/prompts/hermes-scheduled-supervisor.md` 必须明确要求面向 Human Owner 的最终回复、scheduled event report 和 runtime readiness report 使用中文；技术枚举、card ID、路径和 fingerprint 可保留英文原文。
- `[SILENT]` 是互斥静默信号：无事件时只能输出精确 `[SILENT]`，不能先写任何英文/中文摘要再附加 `[SILENT]`。
- 修改项目内 Hermes prompt 模板不会自动更新 Hermes Desktop 已存在的 cron；必须按 `ai/prompts/HERMES-ROLE-DEPLOYMENT.md` 重新部署，并验证实际 cron prompt 包含 `语言与交付硬规则` 和中文事件模板。

## 2026-06-25 Hermes 到 Codex PMC 介入信号

- Hermes 需要 Codex PMC 介入时，不应直接反复提醒 Human Owner；应在 `HERMES-EXECUTION-STATUS.md` 写 `PMC Action Required` marker。
- `PMC Action Required = YES` 只代表 Codex PMC 要处理，不等于需要用户决策；只有 `Human Decision Candidate = YES` 且满足付费、secret、不可逆、重大产品/contract 或安全阻塞条件时，才通知 Human Owner。
- Codex PMC automation 必须把 PMC action marker 纳入 evidence cursor；即使 Queue、REPORT、REVIEW、HANDOFF hash 未变化，只要 marker 变为 YES 就不能输出 `IDLE`。
- Hermes 只因 PMC-only marker 变化时，应写共享状态文档并对 Human Owner 保持 `[SILENT]`，避免把项目内协作任务变成人肉转发。
- 修改项目内 prompt 后必须同步真实 Hermes Desktop cron，并验证 cron prompt 包含 `PMC Action Required` 与 `Human Decision Candidate`。
