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
- Hermes terminal reconciliation 禁止依赖临时 LLM verifier 或每轮刷新 diagnostic due。必须运行 `ai/runtime/reconcile-hermes-execution-status.py` 原子校验 Queue/Task hash、terminal Action、Queue Status 与 diagnostic；`DIAGNOSTIC_READY` 的 due 是已满足历史 SLA，保留原值并标记 `SATISFIED`。
- Windows 下 project-owned verifier 读取源码必须显式使用 UTF-8；禁止依赖系统默认 GBK，否则包含 em dash 或中文的源码会在验证前解码失败。
- Executor profile 的 runtime smoke 必须有独立 `RUNTIME-SMOKE-` fast path；不得复用完整业务 preflight，否则 mandatory skills、CURRENT/ROADMAP 与源码审计会吞掉 bounded smoke budget。Fast path 只读精确 Task、最多 5 个 tool turns、只写唯一 evidence 并立即停止。
- `PMC Action Required = YES` 只代表 Codex PMC 要处理，不等于需要用户决策；只有 `Human Decision Candidate = YES` 且满足付费、secret、不可逆、重大产品/contract 或安全阻塞条件时，才通知 Human Owner。
- Codex PMC automation 必须把 PMC action marker 纳入 evidence cursor；即使 Queue、REPORT、REVIEW、HANDOFF hash 未变化，只要 marker 变为 YES 就不能输出 `IDLE`。
- Hermes 只因 PMC-only marker 变化时，应写共享状态文档并对 Human Owner 保持 `[SILENT]`，避免把项目内协作任务变成人肉转发。
- 修改项目内 prompt 后必须同步真实 Hermes Desktop cron，并验证 cron prompt 包含 `PMC Action Required` 与 `Human Decision Candidate`。

## 2026-06-28 Coordinator pre-dispatch timeout 决策

- 当 bounded work unit 已足够小，但 Coordinator 在创建 Executor 前 timeout，不能继续把业务 Scope 拆分当作默认修复；必须先定位 Queue parse、Task read、idempotency lookup、profile resolution 或 Executor creation 的实际 failure point。
- 单独提高 runtime budget 不是 root-cause fix。若同一阶段已经在更高 budget 下失败，新的 budget 必须由 fresh same-profile runtime health proof 支撑。
- Runtime incident 没有 PLAN、REPORT、Independent REVIEW 或 HANDOFF 时，不得创建 business REWORK；保持 infrastructure blocked，由 runtime owner 提交 diagnostic 后再决定 continuation。
- T4-002 revision `-17` 因此选择重评 Hermes execution route；Unit C1a/C1b 仅是收到 `READY_FOR_CONTINUATION` 后的条件设计，不是当前执行授权。

## 2026-06-28 Windows Kanban worker 退出分类

- Windows 上不能依赖 `os.waitpid` 或只保存 PID 来判断 detached worker 的退出原因；必须保留 Popen result 或由 watcher 记录 return code，否则 clean/nonzero/partial exit 会被错误归类为 `pid not alive`。
- dispatcher interval 恰好为 60 秒时，worker 在 5–30 秒内退出、下一 tick 才发现 dead PID，不等于 worker 存在 60 秒 health-check timeout；必须结合 worker log、agent log 与 source semantics 判断。
- Kanban worker 返回普通文本、invalid-tool partial 或 provider error，但未调用 `kanban_complete` / `kanban_block` 时，runtime 必须确定性写入 blocked/protocol outcome；禁止把退出当成功，也不能只等 liveness reconciliation。
- 旧 runtime policy tests/smoke 只能证明当时的 tool boundary，不能证明后续新识别的 worker-finalization 或 exit-code-capture 缺陷已修复；新 failure fingerprint 必须有 post-fix regression 和 fresh card/run evidence。
- 项目 prompt 模板、实际 profile SOUL 与实际 cron prompt 是三个独立部署面；只修改其中一个不会自动约束另外两个。语言规则验收必须覆盖实际 SOUL marker 与每个 profile 的 Human Owner 可见 sample output。
## 2026-06-28 — Windows worker finalization 不能只靠 PID/Popen 推断

- 现象：Kanban worker 返回 plain text 后 card 留在 `running`，下一 dispatcher tick 报 `pid not alive`。
- 误区：静态看到 `proc.poll()` fallback 后，直接推断 Windows `poll()` 对已退出进程返回 `None`。Fresh 同 flags probe 实际返回 `0`。
- 根因：dispatcher 使用 `chat -q` single-query 入口；该入口在 agent 返回后没有验证 terminal Kanban transition。
- 规则：生命周期 bug 必须沿真实 entry point 做 runtime probe；worker 进程应在退出前确定性 finalization，Popen waiter/exit registry 只作为 abnormal-exit fallback。
- 验证：新增 regression tests，并使用 isolated board 完成 3 次 positive dispatch 与 1 次 plain-text negative direct block。

## 2026-06-29 REPORT_READY 不是永久只读状态

- Queue 以 `Stop After: REPORT_READY` 分阶段执行时，Hermes 正常停止后，PMC 必须读取 REPORT 并作 queue decision。
- REPORT 已明确失败时，不需要等待未授权的 Independent REVIEW/HANDOFF 才能判定未通过；应收口为 `PMC_REWORK` 或 `PMC_BLOCKED`，再发布有界修复路径。
- REPORT 全部通过但 Reviewer/HANDOFF 未授权时，PMC 必须发布 lifecycle continuation，不能连续多轮输出 `IDLE`。
- `REPORT_READY` 不能直接产生 `PMC_PASS`；最终 PASS 仍需 Independent REVIEW、HANDOFF 和 PMC fresh verification。

## 2026-06-29 Bash 嵌套 PowerShell 与伪截断诊断

- Persisted card body 只有 `@Task.md` 不足以证明 CLI 截断；必须读取原始 tool call，确认调用方实际传入了什么。
- 在 MSYS Bash 中用 double quotes 包裹 `powershell -Command` 时，Bash 会先展开 `$hermesExe`、`$env`、`$body` 等 PowerShell variables，导致脚本到达 PowerShell 前已损坏。
- transport 失败后严禁降级成 `hermes kanban create --body "@Task.md"`；这会把调用方缺陷伪装成 CLI truncation，并永久占用 idempotency key。
- Coordinator body 由 project-owned Python launcher 从 scalar args 构造，再通过 subprocess argv list 传给 direct `hermes.exe`；create 前后都必须验证 standalone action marker 和 persisted body equality。
- Terminal incident card 必须保留为证据，不通过 delete/archive 清理故障历史；continuation 使用新 revision 和 fresh idempotency key。

## 2026-06-29 Dispatcher 角色拆分与 profile secret 审计

- 初始 Executor dispatch 与 Review/HANDOFF lifecycle 必须分离：`revid-dispatcher` 只读指定 Task、创建并校验一个 child 后立即退出，`revid-pm` 不再承担初始 dispatch。
- 单纯增加 Coordinator budget 不能修复 pre-dispatch role/context 膨胀；rev16 在 300s、rev24 在 120s 均耗尽后，应改为职责隔离和最小 runtime policy。
- Hermes profile `config.yaml` 可能包含明文 `api_key`；任何配置审计都必须只读取结构键、hash 或经过 redaction 的字段，禁止全量 dump。
- clone profile 会复制 `.env`、SOUL、skills 和 config；新角色部署后必须立即替换 SOUL、关闭 memory/delegation/curator，并把 action policy 收窄到所需工具。

## 2026-06-29 DISPATCH_ONLY 必须原子提交 parent/child

- `kanban_create` 与 `kanban_complete` 分成两个 transaction 时，wall-clock timeout 可在 child commit 后强杀 worker，留下 `parent=blocked`、`child=todo` 的永久依赖死锁；增加 timeout 不能消除该状态窗口。
- standalone `Action: DISPATCH_ONLY` 必须在一个 SQLite transaction 内完成 child create/link、parent run completion、failure-counter reset 与 child promotion；任一步失败必须整体 rollback。
- idempotency retry 只能接管字段和 parent link 完全一致的 child；contract mismatch、多个 children、错误 run 或额外 parent 必须 fail closed。
- parent 在 tool call 内完成后，agent loop 必须使用 durable run summary 直接结束，禁止再发 follow-up model call；否则 worker process 会脱离 `status='running'` timeout 监管。
- live smoke 必须同时验证 parent `done`、唯一 child `ready`、run metadata `atomic_dispatch=true`、follow-up model call skipped 和 worker process count 归零。

## 2026-06-30 Hermes Action/Profile Contract

- Queue Action、coordinator profile、persisted card Action、child role、runtime tool policy 与 output contract 必须来自同一个 canonical matrix；任何一层不得自行 hard-code 或转换 Action。
- 每个 execution profile 都必须配置 exact `kanban.worker_tool_policies`。缺失、重复、未知或 cross-role Action 必须在 worker spawn 前 fail-closed，不能回退到完整 `hermes-cli` tool surface。
- `revid-dispatcher` 独占 `DISPATCH_ONLY`；`revid-pm` 只拥有 `REVIEW_DISPATCH_ONLY` 与 `HANDOFF_ONLY`；Backend/Frontend 只实现；Reviewer 只验证，三者均不得创建 child card。
- `max_retries` 必须按 runtime 真实语义持久化：`2` 表示 initial attempt 加一次 retry，`1` 不等于“一次 retry”。Review dispatch 低于 180 秒应在创建前拒绝。
- Profile config 审计只允许读取并输出 policy key/tool list 或 hash，不得完整 dump。若 credential 进入任何工具输出，必须立即停止新 Queue 发布并要求轮换，且不得在报告中复制该值。
- 不得用带行号的通用文件输出检查 profile config 顶部；即使后续只关心 toolset，邻近 `api_key` 也会进入终端记录。必须先用结构化 parser/allowlist 提取安全字段，或在输出前逐值 redaction。

## 2026-07-02 双 Automation Runtime Advisory 闭环

- PMC 写出 runtime advisory 不等于完成交接；Hermes 必须按同 revision/fingerprint 写 owner ACK、实际 SHA256、60 分钟内 due、diagnostic path/hash/verdict 和 terminal verdict confirmation。
- Advisory 未 ACK、diagnostic 逾期或 reconciliation 未确认时，PMC 不得 `IDLE`，Hermes 不得 `[SILENT]`；连续两个 checkpoint 未完成必须转一次 `RUNTIME_OWNER_STALLED`，相同 fingerprint 不重复通知。
- `PMC Action Required = NO` 只表示没有新的 PMC 决策，不能隐藏 runtime owner 未完成工作；runtime handoff 使用独立 cursor。
- Windows 将完整 Hermes prompt 作为 CLI 参数可能超过 command-line limit；实际 cron 使用短 bootstrap，每轮完整读取项目 canonical prompt，避免模板与真实 cron 漂移。
- Status 写回必须保留结构化多行 Markdown、字段唯一、真实 hash 和带时区 deadline；单行折叠、`N/A` hash 或超期 due 属于 `STATE_CONFLICT`。
- Dispatcher tool-policy incident 优先修 action flow 使用 exact `kanban_*` capability；不得默认给 thin dispatcher 增加通用 `terminal` 权限。

## 2026-07-03 Dispatcher Child Contract 与 Advisory 两阶段 Reconcile

- Dispatcher parent body 必须显式携带 Executor child 的 action、idempotency、max runtime 和 Stop After；不能让 worker 从父卡的 120s、`:dispatch` key 或 Dispatcher Stop After 推导，否则会产生语义正确但 contract 错误的 child。
- Launcher 对 `DISPATCH_ONLY` 缺失 child contract、复用 parent idempotency 或非正 runtime 必须在 card create 前 fail-closed；dry-run、两套 tests、deploy verifier 和 Supervisor prompt 必须使用同一组参数。
- Runtime advisory reconciliation 是两阶段状态机：`ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC` 只表示 diagnostic 已生产且 terminal closure 仍 pending；只有后续 `ACK_TERMINAL_VERDICT_AND_STOP` 才能标记 reconciliation complete。
- Deterministic reconciler 必须区分 diagnostic-start 与 terminal-stop，校验各自 confirmation，并在 start 阶段只同步 hash/diagnostic 状态，禁止提前写 STOP complete。
- Windows verifier 的最终 marker 使用 ASCII；不能在默认 GBK stdout 打印 `✓`/`✗` 后把全部成功检查误报为进程失败。

## 2026-07-04 Execution Status 全文件 Canonical 校验

- 只校验 `## Active Queue` 等局部 section 会漏掉文件前部的 stale canonical block；后部 rev33 section 正确并不代表整个 status 合法。
- Reconciler 必须在任何 hash/action reconciliation 前全文件拒绝 `|||`/`||||`/`|||||` malformed rows，并拒绝跨 section 重复的 active Queue 与 PMC canonical fields。
- In-place field replacement不能清理历史污染；发现旧 status 同时承载 stale current-state table 与新 active section 时，应先重建单一 canonical document，再运行 deterministic read-back。
- Regression fixture 必须包含污染前缀与 duplicate field；只使用干净 fixture 会让结构回归长期 fail-open。
- 发布新 Queue 前必须同时满足：旧 revision canonical STOP closure、0 active cards、fresh idempotency keys、exact child-contract dry-run 与 active cron next-run 证明。

## 2026-07-04 Business Block Terminal Reconciliation

- PMC 将 REPORT 判为业务证据不足并要求 `ACK_TERMINAL_VERDICT_AND_STOP` 时，canonical Active Wave 必须同步改为 `Action = NONE — terminal evidence only`，不能保留执行期 `DISPATCH_ONLY`。
- Business evidence block 不等于 runtime incident。Terminal STOP 可以没有同 revision Runtime Advisory；只有 diagnostic-start 阶段必须强制 advisory、diagnostic path/hash 和 owner state。
- Queue publication 后必须在启动 Hermes cron 前运行 reconciler `--check`。exit `2` 是 contract/structure 缺陷，应由 PMC 修复；不得让 Hermes cron循环重试。
- Terminal ACK 不是只更新 Action、hash 和 reconciliation row。必须原子同步 Execution State、当前 failure fingerprint、PMC Action Required/Type/Reason，并移除与 verdict 冲突的历史成功叙述；否则 deterministic 局部检查可能通过，但 PMC 全局检查仍会正确判为 `STATE_CONFLICT`。

## 2026-07-06 Hermes Next Action 精确操作契约

- `Hermes Next Action` 只写“规范化 status”或“修复冲突”无法让 Hermes 唯一定位目标，也无法让 PMC 在下一轮确定性验收。
- 每条指令必须包含精确 Target、Observed Problem、Required Changes、Forbidden Actions、Verification、Completion Evidence 和 Done Condition。
- 用户可见摘要不能替代共享文档中的详细操作契约；Hermes 无法读取 Codex 私有 thread 或 automation memory，正式指令必须落在双方可读的 PMC REVIEW、Queue、Task、ADR 或 CURRENT。
- 字段修改必须给出当前值与目标值；验证必须给出命令或结构化 read-back 以及预期结果，禁止使用未定义的概括性动词。
