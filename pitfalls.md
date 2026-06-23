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
