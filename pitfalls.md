# 踩坑记录

## 2026-07-15 Generation output variant identity

- Collision-safe expanded result nodes preserve interaction geometry but need generation-selected V identity to read as one output family. Do not physically overlap persisted nodes just to imitate a visual stack.
- Variant order belongs to active typed generation-to-result connection order. Position, title, task timestamp, and resource recency are not lineage order.
- Compact node detail drawers intentionally own the pointer layer. Browser tests must close the drawer through its real control before selecting another node, never force-click through the mask.

## 2026-07-15 Multi-selection input role preview

- Aggregate compose counts do not explain which selected source will become each provider input. Pre-creation UI should project roles and order from the exact preview command, not classify node types again.
- Prompt and reference sequences own independent order domains. Canvas markers, persisted connection metadata, generation provenance, preflight, and provider payload must all retain the same `T1..Tn` and `R1..Rn` mapping.
- Pre-creation intent is ephemeral and mutation-free. After insertion, remove it and let persisted generation provenance own the graph rather than layering two competing explanations.

## 2026-07-15 Continuation compatibility and authoring intent

- Typed port compatibility describes which persisted edges are valid; it does not prove that every compatible target should be advertised as a foreground creation action.
- Provider-materialized result nodes may remain registry-creatable for drag and command compatibility, while selected-node chrome uses a separate registry-owned capability to avoid offering blank result creation.
- Dedicated result branching owns provider-valid image reuse. A generic result continuation action would duplicate that workflow and weaken its asset, subtype, readonly, and lock gates.

## 2026-07-15 Generation run history scope

- Project generation task 列表跨 Canvas 与 node，共享 resource recency 不能替代 node history；inspector 必须先按 durable `canvas_node_id` 过滤，再按 `created_at` 排序。
- Equal timestamp 需要稳定 tie behavior，避免 refresh 后 run 顺序跳动；可用原列表顺序作为次级证据，但不得按 task ID 猜测时间。
- History 展开本身是只读动作，但 terminal task reconciliation 可能同时产生预期 node PATCH；测试应先等待 background reconciliation，再以 baseline 证明展开没有新增 mutation。

## 2026-07-15 Generation input order persistence

- 前端 connection array order 不是可靠持久化字段，document PATCH 以 entity ID 为边界；需要可控顺序时应写入 connection metadata，并为旧图保留现有 array-order fallback。
- Prompt 与 media 是两个独立 provider input group，必须各自维护连续 order；跨组 comparator 若混用 fallback index，可能不满足传递性并产生不稳定排序。
- 一次 reorder 应在一个 `mutateGraph` 中更新同组完整 metadata，才能保证 autosave、history、undo/redo 和失败边界不会出现半完成顺序。

## 2026-07-15 Multi-input generation request preflight

- 生成前预览不能重新拼接 prompt 或重新计算 image order，必须直接渲染构造 provider payload 的 authoritative resolver output，否则 UI 与实际请求会发生顺序漂移。
- Video 的一张图和多张图语义不同：单图是 img2vid reference，多图是 ordered keyframes；标签可以按 media type 和 included count 推导，但不能改变 request body。
- 展开 preflight 是只读检查行为，必须验证不会触发 prompt autosave、document PATCH、provider request 或 selection change。

## 2026-07-15 Canvas 同源结果比较边界

- 同源结果比较应复用 canonical node media presentation 和 persisted connection order，避免 gallery 自行猜测媒体状态或重新排序 V1..Vn。
- Compact 模式从详情 drawer 打开 Canvas overlay 时，只关闭 drawer state，不能调用会清空 node selection 的通用 close handler。
- 比较属于只读审阅：打开、滚动、播放 video、Escape 和切换 sibling selection 都不得产生 document PATCH 或 provider 请求。

## 2026-07-13 自动化授权与推送边界

- Human Owner 为 `project_revid` 的 scheduled delivery 提供项目内的 standing authorization：完成并验证通过的 scoped commit 必须在 secret hygiene 与 staged diff review 后推送至 `origin`，禁止 WIP 或空提交/推送。
- 授权严格限于本仓库；不允许读取或暴露 secrets、打开 `.env`、调用付费 API、创建外部账户、修改项目外内容，或对用户/生产数据执行 destructive operation。
- 保留 exact-name guarded `revid_test_*` disposable schema 和 `SELECT DATABASE()` identity guard；`revid_db`、非测试数据库以及 ignored local `.db` artifacts 不在本次 standing authorization 范围。

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

## 2026-07-09 Reviewer runtime 卡住最终只读验收

- 当最终 Review 阶段只剩 SHA256 与 `git diff --check` 这类确定性只读校验，且 Reviewer 因 runtime deadline/pending approval 未执行命令而 BLOCKED，不能无限重派同一个 Hermes Reviewer。
- PMC 可以在 Human Owner 明确要求快速收口时执行 emergency direct final acceptance，但必须记录为流程例外：不把 Reviewer BLOCKED 改写成 PASS，不伪造 HANDOFF，不修改 Reviewer/HANDOFF 文件。
- 例外成立条件必须严格：不涉及业务代码、数据库、migration、secret、`.env`、destructive operation、产品方向或 schema contract；所有缺失证据必须可由 PMC 只读复验。
- Queue 必须同步改成 terminal ACK-only，明确禁止 Hermes retry Reviewer、写 HANDOFF、复用历史 card 或自动发布下一 Task；下一 Task 仍由 PMC 单独发布。

## 2026-07-10 Codex 直执行模式

- Human Owner 终止 PMC / Hermes / Executor / Reviewer 多 Agent 交付，Codex 改为唯一 Project Lead Engineer。
- Codex 直接负责规划、实现、测试、browser QA、fresh self-review、REPORT 与状态流转。
- 付费调用、真实 secret、destructive/irreversible 操作和重大产品或 contract 决策仍由 Human Owner 授权。
- CURRENT 改为精简 rolling snapshot；旧时间线进入 archive，避免每轮重复加载历史。
- 每个 active PROGRESS 必须记录 Completed、Remaining、Exact Next Action、Files Changed、验证结果与 blocker。
- automation memory 仅作 cursor，项目文档、源码、diff 和测试才是事实源。
- 旧 PMC automation 保持 PAUSED；新 `revid-codex-direct-delivery-controller` 每三小时持续推进唯一 active Task。

- 定时/自动化执行完成后，除了原有结构化 delivery event，还要追加面向 Human Owner 的中文“本轮总结”和“下一轮计划”；两者不能互相替代。
Evidence:

- `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`
- `ai/automation/REVID-CODEX-DIRECT-OPERATING-MODEL.md`

## 2026-07-11 Real MySQL 浏览器验收前置门

- MySQL 端口可达不等于 backend 可验收；真实浏览器矩阵前必须先证明 `alembic_version` 与当前 migration head 一致。
- 当前直执行规则覆盖早期 Hermes `.env` 约定：未经 Human Owner 明确授权，不打开 `.env`；runtime 只消费已注入的 process environment，证据不得输出 credential。
- 若 backend 因 schema revision mismatch 拒绝启动，不能用 SQLite、mock 或跳过 revision check 冒充 real-service PASS。
- Active Task 明确禁止 database/migration 变更时，不得顺手执行 `alembic upgrade`；应记录 current/head、影响和 release condition，由 Human Owner 授权 migration 或提供已就绪 runtime。

## 2026-07-11 Browser QA artifact tracking

- `frontend/.playwright-cli/` 与 `output/playwright/` 是本地 browser QA/tool-state 证据，不属于产品交付；root `.gitignore` 必须持续排除这两个精确目录。
- 发现 artifact 已被误提交时，先证明 path 集合与来源 commit 完全一致，再用 `git rm --cached` 停止 tracking；本地截图、harness 和诊断文件必须保留，不能用 `git clean`、移动目录或历史重写代替。
- cleanup commit 前必须复核 tracked count、local missing count、ignore 命中、staged path 集合和脱敏 credential-pattern scan；是否 push 或清理远端历史仍是独立 Human gate。

## 2026-07-11 Space Real-Data Acceptance

- MySQL `DATETIME` 可让同一秒创建的多条资产拥有相同 `created_at`；只按该字段排序且无稳定 secondary key 时，不能把 insertion order 当成分页 oracle。验收 fixture 应显式错开时间；backend 后续应使用 `created_at` 加稳定 ID tie-breaker。
- `DatabaseStore.list_assets()` 每次查询数据库，但 `get_asset()` 会优先读取进程内 cache。直接 SQL 改 fixture 状态后，列表可立即变化而详情仍旧；正常产品操作应走 backend route 同步 cache，必须做 out-of-band SQL 时要重启 owned backend 后再验收详情。
- `playwright-cli` 会在当前 working directory 生成 `.playwright-cli/` snapshot。Revid browser QA 必须从 `output/playwright/<task-unit>/` 或已忽略的 `frontend/` 目录启动；若误在仓库根生成 untracked artifact，未获删除/移动授权时保留并排除 staging，不能用 `git clean` 收口。

## 2026-07-12 Agnes real-smoke credential gate

- `Settings(env_file=".env")` 会让直接读取 `settings.agnes_api_key` 的 smoke helper 隐式消费本地文件 credential；这不等价于 process-provided secret，会绕过 Unit B 的 credential source contract。
- 付费 real-smoke entrypoint 必须直接从 `os.environ` 读取 `REVID_AGNES_API_KEY`，process variable 缺失时在任何网络调用前 fail closed；本地 `.env` 只能用于普通应用配置，不能作为授权 smoke 的 secret 来源。
- 回归测试应在临时 cwd 放置 fake `.env` 和 loopback base URL，证明缺少 process key 时仍返回 blocked，避免测试触发外部 API。

## 2026-07-12 Agnes provider smoke 与 persistence 证据边界

- standalone `smoke_agnes.py` 只验证 provider contract，不会写入 `generation_tasks` 或 `assets`；它成功不能替代业务路由的 persistence 验收。
- 真实 provider smoke 与 runtime MySQL 关系验收应分层记录：前者保留 media/model/request ID（若 provider 提供）/耗时，后者通过业务路由证明 task status、quota、asset 与外键关系。
- provider 未返回 request ID 时必须保留 `null` 并明确记录限制，禁止用 asset URL、内部 ID 或猜测值冒充 provider request ID。
- 受控 failure persistence 可以替换进程内 provider 为确定性失败 stub，证明失败 task 与额度语义且不产生额外付费调用；完成后必须恢复原 provider。

## 2026-07-12 Product V2 数据与 Canvas 边界

- V2 数据库只有 MySQL。dialect 错误、连接失败或 Alembic current/head 不一致时必须 fail closed，禁止回退 SQLite 或 in-memory store 冒充可用。
- ignored `.db` 文件是历史本地 artifact，不是 V2 数据源；不得自动删除，必须先完成备份和数据对照，再由 Human Owner 对精确路径授权。
- Canvas node、edge、viewport、edit revision 和 checkpoint 归 Canvas；asset、generation task、generated history 和 project setting 归 Project，API、schema 和 store 不得混淆这两个边界。
- 删除源码中的 hard-coded credential assignment 只完成 source cleanup，不等于 credential rotation；真实或复用 credential 必须由 Human Owner 在外部系统单独轮换。
- Canvas pan/zoom 应只变换持久 world group；不得在 viewport 变化时 clear 并全量重建 node/edge，pointer 高频事件应通过 requestAnimationFrame 合并。

## 2026-07-13 Canvas durable recovery 与 restart 证据

- local recovery 必须分别保存原 mutation 的 exact base/post-state、原 payload 和最新 desired graph。响应丢失后先用原 ID/原 fingerprint 取回幂等结果，再用新 mutation 保存期间新增的编辑；不能把最新 desired 直接当成原批次已确认状态。
- 恢复 parser 必须在写入 live graph 前校验 identity、revision、范围、operation set、父子和 endpoint 关系。无效副本 fail closed、保留原始 localStorage；旧 version-1 payload 快照缺少 batch state 时，可从当前服务器 graph 与原 payload 确定性重建 post-state。
- recovery/conflict UI 的条件渲染会移除当前按钮；成功、丢弃和失败转 conflict 后都要在 `nextTick` 后把焦点放回 dialog，关闭时实际 opener 失效或 disabled 才回退固定 trigger。
- backend restart 测试不能只换 store 对象。必须 dispose/recreate engine 与 session factory，重新执行 database identity 和 Alembic gate，并覆盖 production FastAPI lifespan；任一 gate 失败都要再次 dispose 后 re-raise。

## 2026-07-13 MySQL 资源归属与删除锁

- MySQL 8 禁止 `CHECK` 引用带 `ON DELETE SET NULL` referential action 的列；asset node link 要同时实现自动清空和保留 `origin_canvas_id` 时，不能伪造冗余 CHECK。应保留真实 node FK `SET NULL`、project/origin composite FK，并在统一 writer 中校验 node scope。
- Resource create 与 semantic node delete 必须锁定同一边界。创建按 `Project -> Canvas -> CanvasNode` 执行 `FOR UPDATE` 并在最终锁后重验 active/scope；删除对排序后的 node IDs 加锁，再在同一 transaction 清 asset/task link，避免并发重新挂回 deleted node。
- 任何会绕过 process cache 的 document mutation 后，asset/task 详情必须以数据库为 authoritative source；不能从旧 cache 返回已清除的 `canvas_node_id`。
- Project 仍有关联 asset/task 时，当前安全语义是 `409 Project has linked resources`。禁止在没有明确产品决策和 destructive authorization 时自动级联删除或抹掉资源归属。

## 2026-07-13 Template graph 幂等与原子实例化

- Template remap ID 不能用分隔符拼接多个未经约束的 identity 字段；不同字段组合可能生成同一字符串。应对结构化字段列表做 canonical serialization，再生成 UUIDv5。
- Deterministic ID 只保证重试稳定，不代表可以覆盖已有 row。目标 Canvas 锁定后必须先检查 node/connection ID 是否已占用，并以 create-only collision 拒绝异常预占。
- Exact retry 不能依赖 source Template 仍存在。首轮成功应把 request fingerprint、ID maps 和创建计数写入同一 Canvas revision；重试先按 Canvas 与 mutation ID 读取 revision，完全一致才回放，变更请求返回 `409`。
- Legacy template-to-project 兼容路由必须把 Project、first Canvas、完整 graph 和 revision 放在同一 transaction。复用 canonical document mutation 时应允许 caller-owned session，并明确只有最外层 orchestration commit。
- Backend restart evidence 必须重建 engine/session 并进入 production FastAPI lifespan；测试即使断言失败也要在 `finally` 恢复 owned runtime，避免污染后续 schema case。

## 2026-07-14 Generation transaction、reservation 与 quota revision

- Provider await 不能持有数据库 transaction。请求开始阶段应先用 `Quota FOR UPDATE` 与 active task reservation 原子占位，provider 完成后再用独立 transaction 锁定 quota 与 task；reservation lease 必须长于受控 provider/polling 上限，并同时支持 startup 与 request-time stale reconciliation。
- Generation completion 必须是受限 state machine：同一 task 的 duplicate completion 返回同一 asset，terminal state 不允许被 late failure 覆盖，asset、task、quota debit 与 ledger 必须在一个 transaction 中提交。跨资源 writer 的 lock order 需要与 semantic delete 对齐，避免 `Asset <-> GenerationTask` 锁环。
- Quota balance 与 revision 必须来自同一数据库 snapshot，并与 ledger 在同一 transaction 内更新。前端只接受 backend response，按 auth session 单调应用 revision；logout/login 必须重置 revision，不能用跨 session 的 module-level cache。
- Provider content、HTTPS URL、request ID 与 input asset IDs 必须在 completion/debit 前做结构化、长度和 ownership 校验。任何 malformed result、cancel、timeout、provider failure 或 persistence failure都应 durable terminalize task，且不得创建 success asset 或消耗 quota。
- 需要以时间排序的高频 MySQL ledger 不能依赖秒级 `DATETIME`；使用 `DATETIME(6)` 并保留稳定 secondary key，避免同秒 grant/debit 的展示顺序不确定。

## 2026-07-14 Upload reservation、cancellation 与媒体验证边界

- 不可信 request body 期间不能持有全局 advisory lock。应先用 user -> global 的固定锁序创建 provisional central marker，占用 per-user/global active slot；历史文件扫描只持有 user lock，完成后重取 global lock复核 free space 与 pending reservation。
- byte quota 不能替代 inode、task、socket 和 FD 上界。上传必须同时限制 global/per-user active reservations、central sidecar scan entries 与 user filesystem entries；orphan `.part` 也必须计入 user quota，active stage 只补记 `reserved - staged`，避免漏计或双计。
- async task cancellation 不会自动停止 threadpool I/O。open、write、seek、close、atomic commit 和 cleanup 都必须等待 late worker result 后再传播 cancellation；stage 与 marker cleanup 应分别 best-effort 并保留失败路径，不能因第一个 unlink 失败而跳过后者。
- 文件扩展名、MIME 和浅层 container magic 不是媒体有效性。正例必须是独立工具可解码的真实 fixture；BMFF/WebM/Ogg/PNG 等 validator 要验证 codec/sample linkage，并同时设置 container element、pixel、decoded byte、process concurrency 和 aggregate sample budget。
- streaming parser 仍需要 dependency floor 与独立 guard。`python-multipart` 下界必须覆盖当前安全修复，part header bytes/count、完整 terminal boundary 和 constructor error mapping 由应用自身测试锁定。
- 固定命名的 disposable MySQL test schema 不能跨 pytest 进程并行运行；一个进程 teardown 会让另一个进程出现 `Unknown database` 或旧 schema 列错误。最终 evidence 应串行执行，或在 T5-008 harness 中为每个进程生成唯一 `revid_test_*` schema。

## 2026-07-15 Playwright preview 与 Canvas pointer 验证

- 本项目 Playwright 使用 `vite preview`，它只读取最近一次成功生成的 `frontend/dist`。修改源码后必须先完成成功 build，再把 browser 结果视为当前证据；build 失败后的 browser 运行可能仍在验证旧 bundle。
- Canvas port 同时承担点击选中与拖拽连线时，不能在 pointerdown 立即触发 selection side effect。应使用小幅移动阈值区分 click 与 drag，click 在 pointerup 选中，真实 drag 保持舞台几何和 inspector 状态稳定。
- pointercancel、释放到 Canvas 外、Escape 和外部点击必须走无 mutation 的统一取消路径；只有兼容 direct drop 或用户明确选择 continuation 后才能进入 command/autosave history。
- input port 的手势方向与持久化 edge 方向相反。draft 可以记录 gesture origin，但 direct drop、compatibility overlay、preview path 和 continuation command 最终都必须归一化成 output source -> input target；否则视觉可用但 generation context 与 graph persistence 会反向。
- 细 SVG edge 的可选中性应由独立透明 hit path 提供，visible path 继续 `pointer-events: none`。pointer 点击带 `tabindex` 的 SVG path 时 Chromium 可能绘制整个 path bounding box 的 focus outline；pointer selection 后应 blur，keyboard selection 则保留明确的 accent focus stroke。
- 在既有 edge 中插入节点必须同时验证 source output -> candidate input 与 candidate output -> target input。只验证单侧会把无法恢复原目标语义的节点暴露给用户。
- 原 edge ID 应留给上游 segment，并通过一次 node upsert 加两次 connection upsert 原子提交；先删旧 edge 再分步创建会破坏 autosave、undo/redo 与外部引用连续性。已选 edge 的 midpoint action 会占据路径中心，自动化若需再次选择该 edge，应使用其 keyboard selection contract，避免把按钮的正常命中误判为连线失效。
- 多输入生成的 panel、graph spotlight 与 provider payload 不能各自计算顺序。应由一个 resolver 同时产出 connection identity、kind order、included request order 与 exclusion state，避免用户看到的 R2 实际成为 request R1。
- provenance 是当前 intent，不是永久 graph chrome。只有单选 generation node 时显示，badge 保持固定 screen size，edge 不使用循环动画；duplicate、missing、unsupported、limit 必须可见但不能使用 active treatment，也不能进入 request order。
- result lineage 不能按位置、标题或最近 task 猜测。只接受唯一 active typed canonical generation -> result edge；variant 顺序来自 persisted connection order，result 自身的 `source_task_id`/`source_model` 保持 authoritative，ambiguous 或 task mismatch 时宁可不显示谱系。
- Media presentation object 会随 selection 重算，但 URL 并未变化。若 watch 整个 object 并重置 loading，缓存资源不会再次触发 load/error，broken media 会卡在 loading；应只监听实际 media identity（kind + URL），让 ready/error 跨 selection 保持稳定。

## 2026-07-15 Generation history result navigation

- A succeeded generation task does not by itself prove that a usable result exists on the current Canvas. Result actions must require one canonical result with one active typed generation-to-result edge, matching generation identity, and exact durable task identity.
- Zero verified matches should be described as not written to the current Canvas; multiple verified matches are ambiguous and must not navigate arbitrarily.
- Readonly Canvas review may change ephemeral selection to inspect an existing result, but the test must hold the document PATCH baseline unchanged.

## 2026-07-15 Multi-selection generation composition

- Port compatibility is not enough to advertise bulk generation. Build the candidate fragment first, resolve it through the same generation-context code used by preflight/provider requests, and expose the action only when every selected source is included.
- Prompt and media order are independent sequences. Persist `input_order` per target port; do not make cross-kind edge-array interleaving part of the contract.
- A primary selected node can still exist inside a multi-selection. Inspector and compact drawer ownership must require exactly one selected node, otherwise a drawer mask can block the multi-selection toolbar.

## 2026-07-15 Selection composition output validation

- A shared generation fixture must derive task media type, model, asset type, URL, quota bucket, and failure identity from the actual request route and dynamic Canvas node. Returning image-shaped identity for video can make UI tests pass while proving the wrong lifecycle.
- Composition labels should be projections of the already validated command, not a second input classifier. Zero, one, and multiple included images map to text-to-video, img2vid, and ordered keyframes only after every selected source is request-ready.
- Run history and result lineage have different disclosure contracts: history summarizes status/model/timing, while exact task identity belongs to verified lineage. Tests should assert each fact at its owning surface.

## 2026-07-15 Generation result placement and reveal

- Repeated generation materialization cannot reuse one fixed result coordinate. Choose the first deterministic unoccupied slot from current persisted graph bounds so variants remain individually selectable before and after media metadata changes.
- Foreground camera intent must not live inside shared reconciliation. Emit reveal only after the initiating request materializes its exact result; polling, reload, and Canvas-switch reconciliation must remain quiet.
- Desktop side panels already resize the Canvas stage, while compact drawers overlay it. Applying the same panel inset to both double-counts desktop space and under-counts compact obstruction.
- Browser viewport evidence should use the final request body, not mutable fixture state that concurrent older responses can overwrite. Rendered media visibility must use canonical aspect-ratio geometry rather than persisted default card height.

## 2026-07-15 Result branching and Playwright process lifetime

- Result reuse must be gated by provider-valid reference identity, not port compatibility alone. The current generation request accepts image asset IDs, so video, text, missing-asset, grouped, locked, readonly, and unsupported results must remain action-free even if a registry port looks connectable.
- Branching should create graph intent only: one generation node plus one ordered typed edge in one command. Automatic execution would bypass prompt, preflight, quota review, and the user's explicit provider action.
- Collision-aware placement must inspect persisted graph bounds and keep deterministic slot order so undo, redo, reload, minimap, and selection agree.
- A shell/tool timeout that kills Playwright before its own final exit is infrastructure interruption, not a failed product assertion. Long regression commands need a process window that covers preview startup and the full suite, and only Playwright's final exit code/count is test evidence.

## 2026-07-15 Multi-result remix and graph placement

- Generated image results and ordinary image assets can share the same provider media port but should not share one UI source label. Derive source counts from the already validated command connections, then classify the exact source nodes; never run a parallel eligibility classifier that can disagree with preflight.
- Prompt and media connection order remain independent groups. Backend persistence may return the groups in a different global array order, so tests must assert T and R ordering within their owning port instead of inventing a cross-group order contract.
- Collision scanning bounded by `occupied node count + 1` is not safe when one node is much taller than the generated node. Derive the terminal candidate from the highest occupied bottom so the final slot is guaranteed to clear every persisted bound.
- Compact Canvas marquee gestures must start outside identity chrome and overlay panels. A pointer initiated under fixed chrome never reaches the stage, and forcing the click would hide a real interaction constraint rather than validate selection.

## 2026-07-15 Foreground workflow reveal

- Foreground camera intent belongs at the user-action adapter, not in command storage or graph reconciliation; otherwise undo, redo, reload, and background completion can unexpectedly move the viewport.
- Reveal only after the local command commit and the next Vue reconciliation tick, so node geometry exists before minimum panel-safe translation is calculated.
- An autosave failure after local commit is not a command failure. Keep the recoverable node selected and visible while explicitly showing unsaved state.
- Desktop side panels resize the stage, but compact drawers overlay it; only the compact path needs the drawer-safe right inset.
- Readonly mobile can persist its initial fit viewport during mount. Camera-neutral assertions should record a settled baseline, then verify no additional mutation from unavailable actions.

## 2026-07-15 Contextual node continuation

- Reference implementations are best treated as interaction evidence, not a component library. Reuse the discoverability principle, but route eligibility, commands, placement, history, and reveal through the product's existing canonical contracts.
- A fixed-origin continuation button cannot reuse a user-chosen drag-drop position blindly. Run its draft through collision-aware graph placement before committing, especially when an existing result already occupies the natural right-side slot.
- Fixed screen-space overlay controls should attach to world geometry after viewport projection; scaling the control with world zoom makes it unusable at 10% and oversized at 800%.
- Compact context drawers own a modal mask and focus trap. A Canvas control behind that mask is not reachable even when visible in DOM; place the action in the drawer, preserve selection, close it, then open the Canvas chooser after the drawer leave event.
- Keep pointer-drag continuation semantics separate from explicit foreground actions. Only the explicit action should auto-select and reveal its result; background, history, and user-positioned drag flows remain camera-neutral.
