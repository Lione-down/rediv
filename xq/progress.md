# 开发进度记录

## 2026-06-17 微信登录注册方案

### 已完成

- 新增产品需求总览，重新定义当前 MVP 范围、核心模块和第一版不做事项。
- 新增技术设计文档，统一认证、Admin、额度、资产和安全规则。
- 新增前端项目开发文档，明确 Vue 3 + TypeScript + Vite + Pinia + Leafer UI + Naive UI + Anime.js 的正式选型，以及现有 `/ui` 原型迁移到 Vue 工程的路径。
- 初始化 `frontend/` Vue 3 + Vite + TypeScript 前端工程。
- 安装 Pinia、Vue Router、Axios、Leafer UI、Naive UI、Anime.js、SCSS、Lucide 图标依赖。
- 完成前端基础骨架：路由、Pinia stores、API 请求层、全局 design tokens、首页、工作流页、个人空间页和 Admin 占位页。
- 固定前端开发端口为 `9099`，与项目端口约定保持一致。
- 完成 `npm run build` 验证，前端工程可正常构建。
- 将用户系统从 email/password 注册调整为微信 OAuth 自动注册。
- 明确第一版不做 SMS、email、用户名密码注册和找回密码。
- 补充游客模式边界：可体验画布，不可保存个人资产、导出视频或领取正式额度。
- 新增微信登录、邀请码与额度系统开发计划。
- 扩展 Admin 后台为内部平台控制台，加入注册控制、邀请码、额度派发、任务监控和服务器状态。
- 扩展资产系统，明确用户个人资产库、生成结果入库、来源任务追踪和 Admin 隐藏能力。
- 创建 FastAPI 后端 MVP 骨架，包含微信 mock 登录、游客 session、Admin dev 登录、注册配置、邀请码、额度派发、额度流水和资产接口。
- 增加后端运行说明和 `.gitignore`，避免提交 `.env` 与 Python 缓存文件。
- 完成后端冒烟测试：health、Admin dev 登录、邀请码创建、微信 mock 登录、默认额度发放、GET /me、资产写入。
- 扩展 `.gitignore`，禁止提交 `.env`、密钥、token、证书和构建缓存。

### 待开发

- 实现微信开放平台 OAuth 回调。
- 将内存存储替换为数据库模型和持久化迁移（✅ T1-001 已完成）
- 实现真实 Agnes 生成任务、额度扣减、失败返还。
- 实现 Admin 后台前端页面。
- 按 `xq/11_frontend_project_development.md` 继续把现有 `/ui` 高保真交互细节迁移到 `frontend/`。
- 实现游客草稿转正式账号资产绑定。

## 2026-06-19 Agnes API 集成基础设施

### 已完成

- 研读 Agnes AI 官方文档（https://agnes-ai.com/doc）
- 确认三个核心模型：`agnes-2.0-flash`（文本）、`agnes-image-2.1-flash`（图片）、`agnes-video-v2.0`（视频）
- 规范化 `.env` 文件格式，添加数据库、Agnes API、存储等配置项
- 创建 `.env.example` 模板文件（不含真实密钥）
- 更新 `backend/settings/config.py`，新增 Agnes 配置字段和数据库/存储配置
- 创建 `backend/core/agnes_provider.py` — Agnes AI 多模态模型统一入口
  - `chat()` — 文本生成/图片理解/工具调用
  - `chat_stream()` — 流式文本生成
  - `generate_image()` — 文生图/图生图
  - `generate_video()` — 视频任务创建（异步）
  - `poll_video_result()` — 视频结果查询
- 更新 `backend/main.py`，创建 AgnesProvider 全局单例
- 创建 `backend/AGNES_INTEGRATION.md` 集成说明文档

### 待开发

- 实现 `api/routers/text.py` — 文本生成接口
- 实现 `api/routers/image.py` — 图片生成接口
- 实现 `api/routers/video.py` — 视频生成接口
- 实现额度预扣和返还逻辑
- 实现 Mock Provider 降级（开发阶段）
- 实现视频任务轮询中间件

### 当前状态

Agnes Provider 基础设施已完成，后端配置已规范化。接下来需要实现具体的 API Router 来对接画布节点的 AI 生成功能。

## 2026-06-17 UI 基调设定

### 已完成

- 新增 `ui/design-direction.md`，将现有开发级 wireframe 扩展为可执行的 UI 基调方案。
- 明确 Revid 第一版采用“安静的创作工作台”方向，避免泛 AI 产品常见的紫蓝渐变、玻璃拟态和营销式首页。
- 补充同类产品参考、视觉 thesis、OKLCH 色彩 tokens、字体栈、布局尺寸、组件风格、动效规则和响应式行为。
- 明确后续前端实现建议：CSS variables + CSS Modules，优先构建 Canvas Editor app shell。

### 待开发

- 按 UI 基调方案实现 Vue 前端基础框架。
- 使用真实浏览器验证桌面端和 375px 移动端布局。

### 当前状态

UI 基调已落成文档，当前尚未创建前端实现代码。

## 2026-06-17 UI 原型初版

### 已完成

- 新增 `xq/10_ui_prototype_plan.md`，明确本次 UI 原型的目标、范围、约束、交付物和验收标准。
- 新增 `ui/revid-prototype.html`，实现 Revid Canvas Editor 的静态首屏原型。
- 原型页覆盖 top bar、左侧工具栏、主画布、右侧资产与属性面板四层结构。
- 按现有 UI 基调使用暖白背景、低噪点网格、Geist 风格字体栈和绿色生成主按钮。
- 完成桌面端与 375px 宽度的真实渲染检查，并修正了移动端节点重叠和底部遮挡问题。

### 待开发

- 若补充 Figma 链接或设计稿，可继续对齐像素级细节、字体切换和组件半径。
- 可继续将该原型拆分为 Vue 页面或与真实画布引擎接轨。

### 当前状态

已具备一版可评审的 UI 初版原型，后续可直接在此基础上继续做 Figma 对齐或前端实现。

## 2026-06-17 UI 原型增强

### 已完成

- 为 `ui/revid-prototype.html` 增加可交互的 `Tabs` 切换，支持 `Assets`、`Templates`、`Properties` 的面板切换。
- 增加画布右下角 `Minimap`，帮助确认节点与视口关系。
- 增加底部状态带，展示 autosave、canvas 尺寸和当前 selection。
- 增加模板库卡片，使右侧面板更接近完整编辑器信息结构。
- 重新验证桌面端与 375px 宽度的渲染效果，并针对移动端简化了底部状态区，避免干扰主画布。

### 当前状态

原型已从“线框感首屏”推进到“可评审的编辑器原型”，可继续接 Vue 页面拆分或更细粒度的视觉打磨。

## 2026-06-19 后端数据库持久化迁移

### 已完成

- 新增 `backend/models/` SQLAlchemy 模型层，覆盖 user、identity、guest、asset、quota、invitation、admin_log 和存储配置。
- 新增 `backend/database.py`，统一引擎初始化、建表和会话获取。
- 在 `backend/controllers/store.py` 新增 `DatabaseStore`，保留 `InMemoryStore`，并通过 `StoreProxy` 保持现有 router 的字典式访问兼容。
- 更新 `backend/settings/config.py`，增加 `use_sqlite` 与 `db_path` 配置项。
- 更新 `backend/main.py`，在 SQLite 模式下启动时自动建库并切换到 `DatabaseStore`。
- 更新 `backend/requirements.txt`，补充 `sqlalchemy` 与 `aiosqlite`。
- 新增 `backend/.env.example` 数据库配置示例。
- 新增 `backend/tests/test_database_store.py`，覆盖用户、身份、游客、邀请码、额度、资产和重载持久化测试。
- 完成 `python -m compileall .`、`python -m unittest discover -s tests -p 'test_database_store.py'` 和 `python -c "import main"` 启动建库检查。
- **Hermes 审查通过（2026-06-20）**，任务标记为已完成。

### 待开发

- 后续若要彻底去掉 router 对 `store` 内部字典的直接耦合，可在独立任务中收口到 service 接口。
- 当前未实现数据库 migration 工具链，后续 schema 变更仍需 Hermes 规划。

### 当前状态

后端已具备 SQLite 持久化能力，现有 API 入口保持不变。

## 2026-06-21 后端 .gitignore 完善 + README 完善

### 已完成

- 新增 `backend/.gitignore`，覆盖数据库文件（`*.db`、`*.sqlite`、`*.sqlite3`、`revid.db`）、Python 缓存（`__pycache__/`、`*.py[cod]`）、环境变量（`.env`、`.env.*`）、IDE 配置（`.vscode/`、`.idea/`）、日志（`*.log`）和存储目录（`storage/`）。
- 重写 `backend/README.md`，包含项目简介、技术栈、目录结构、当前能力、环境准备、启动方式、数据库配置（含预留说明）、常用环境变量、开发检查与测试命令、开发示例 curl 命令。
- **Hermes 审查通过（2026-06-21）**，任务标记为已完成。

### 当前状态

后端文档和忽略规则已完善，Phase 1.10 已完成。

## 2026-06-22 后端邀请码注册控制

### 已完成

- 修复 `store.py` 中 `use_invitation_code` 的过期时间判断，改为 `datetime` 对象比较（新增 `is_expired()` 辅助函数）。
- 新增 `backend/tests/test_invitation_code.py`，覆盖 `open`/`invite_only`/`closed` 三种注册模式及过期、用尽、缺失、无效等边界场景。
- **Hermes 审查通过（2026-06-22）**，任务标记为已完成。

### 当前状态

邀请码注册控制逻辑已完善，Phase 1.2 已完成。

## 2026-06-23 额度系统完善 — 用户额度流水查询 + 端到端测试

### 已完成

- 新增 `GET /admin/users/{user_id}/quotas/ledger` 接口，支持按用户查询额度流水（按创建时间倒序），仅 Admin 可访问，缺失用户返回 404。
- 新建 `backend/tests/test_quota_flow.py`，覆盖默认额度发放、Admin 手动派发、流水查询排序、多次派发累加、多用户 ledger 隔离、非 Admin 权限拒绝（403）、缺失用户 404 共 7 个用例。
- `python -m compileall .` 通过。
- `python tests/test_quota_flow.py` — 7 tests, OK。
- **Hermes 审查通过（2026-06-23）**，任务标记为已完成。

### 当前状态

Phase 1.3 额度系统完善已完成，下一步为 1.4 资产上传 + 列表功能。

## 2026-06-24 资产上传 + 列表功能完善（T1-005）

### 已完成

- Project Master Controller 审查了 T1-005 完成报告，确认 PASS（评分 4/5）
- 补齐资产列表筛选/分页、JSON 与 multipart 双通道上传、生成入库、详情/软删除、Admin 隐藏能力
- 13 个资产专项测试全部通过
- 更新 CURRENT.md 和 ROADMAP.md

### 当前状态

T1-005 已完成。Next Task: T1-006 — 项目 CRUD。

## 2026-06-24 Project Master Controller 自动化审查流程

### 已完成

- 建立了 PMC 自动化审查流程：检查 REPORT → 对照 AC → 生成 REVIEW → 更新状态
- 本次审查：T1-005 PASS（评分 4/5）、T1-006 PASS（评分 5/5）
- 生成了 T1-006 任务文件到 `ai/tasks/todo/`
- 审查并通过了 T1-006 完成报告
- 更新了 CURRENT.md 和 ROADMAP.md

### 当前状态

PMC 流程运行正常。T1-007 待生成。

## 2026-06-24 项目 CRUD 完成（T1-006）

### 已完成

- Project Master Controller 审查了 T1-006 完成报告，确认 PASS（评分 5/5）
- 新增了 Project 模型、schema、路由、store 方法和 8 个专项测试
- 代码风格与现有模块高度一致（MappedColumn、ForeignKey、utc_now 工具函数）
- 更新 CURRENT.md 和 ROADMAP.md

### 当前状态

T1-006 已完成。Next Task: T1-007 — 画布节点 CRUD。

## 2026-06-24 T1-007 画布节点 CRUD 任务生成

### 已完成

- Project Master Controller 扫描到 todo/ 和 doing/ 均为空，且无待审查 REPORT
- 根据 ROADMAP.md Phase 1.6 生成 T1-007 任务文件到 `ai/tasks/todo/TASK-T1-007.md`
- 更新 CURRENT.md：Current Task 设为"待分配"，Next Task 指向 T1-007
- 任务范围：纯后端，新建 CanvasNode 模型/schema/路由，增强 store.py，挂载路由，专项测试
- 验收标准：5 个 CRUD 端点 + SQLite 持久化 + 权限校验 + 测试通过

### 当前状态

T1-007 已就绪，等待 Codex Executor 领取执行。

## 2026-06-24 T1-008 模板系统任务生成

### 已完成

- Project Master Controller 扫描到 todo/ 和 doing/ 均为空，且所有 REPORT 已审查通过
- 根据 ROADMAP.md Phase 1.7 模板系统生成 T1-008 任务文件到 `ai/tasks/todo/TASK-T1-008.md`
- 更新 CURRENT.md：Current Task 指向 T1-008
- 任务范围：纯后端，新建 Template 模型/schema/路由，增强 store.py，挂载路由，专项测试
- 验收标准：5 个端点（保存模板/列表/详情/删除/use）+ SQLite 持久化 + 权限校验 + 测试通过

### 当前状态

T1-008 已就绪，等待 Codex Executor 领取执行。

## 2026-06-19 T2-002 工作流页基础布局迁移

### 已完成

- 创建 `ai/tasks/doing/TASK-T2-002-PLAN.md` 与 `ai/tasks/doing/TASK-T2-002-PROGRESS.md`，明确本轮前端布局迁移范围、步骤与验收标准。
- 重构 `frontend/src/views/app/Workspace.vue`，建立符合 `ui/design-direction.md` 的 app shell：52px 顶栏、56px 左工具栏、中央画布区、320px 右侧面板。
- 将 5 个主工具按钮（`select` / `hand` / `text` / `image` / `generate`）统一放回 `Workspace.vue`，补齐 active 状态、120ms 过渡与 `scale(0.96)` 按下反馈。
- 补齐右侧面板 Tabs（`Assets` / `Templates` / `Properties`）、节点属性摘要、资产卡片和额度区。
- 完成移动端 `<=920px` 布局：左侧工具栏底部化，右侧面板折叠为底部抽屉，并提供面板开关按钮。
- 微调 `frontend/src/components/canvas/CanvasStage.vue`，去掉工具栏耦合，保留画布点阵背景、节点层、连线层与 minimap，并让画布持续占满剩余空间。
- 执行 `cd frontend && npm run build`，构建通过。

### 风险与说明

- 自动浏览器访问 `http://127.0.0.1:4173` 时被企业策略拦截，因此本轮未完成自动截图校验；已通过构建验证确认代码可编译。

### 当前状态

T2-002 已完成开发与构建验证，任务保留在 `ai/tasks/doing/`，等待 Hermes 审查。

## 2026-06-26 T2-003 个人空间页迁移任务生成

### 已完成

- Project Master Controller 扫描到 todo/ 和 doing/ 均为空，且所有 REPORT 已审查通过
- 根据 ROADMAP.md Phase 2.5 生成 T2-003 任务文件到 `ai/tasks/todo/TASK-T2-003.md`
- 更新 CURRENT.md：Current Task 设为"待分配"，Next Task 指向 T2-003
- 任务范围：纯前端，重构 Space.vue，对齐 `ui/revid-space.html` 原型结构与 `ui/design-direction.md` 设计规范
- 验收标准：hero 区域 + 统计卡片 + 内容入口导航 + Tab 切换 + 子页面骨架 + 浅色主题 + 构建通过 + 响应式验证

### 当前状态

T2-003 已就绪，等待 Codex Executor 领取执行。

## 2026-06-26 T2-002 工作流页基础布局迁移 — 审查通过

### 已完成

- Project Master Controller 审查了 T2-002 完成报告，确认 PASS
- Workspace.vue 实现了完整的 app shell 布局：52px 顶栏、56px 左工具栏（5 个工具）、320px 右侧面板、中央画布
- CanvasStage.vue 职责清晰分离，仅保留画布渲染（节点、连线、minimap、点阵背景）
- 移动端 ≤920px 布局：底部工具栏 + 抽屉式面板，过渡动画 160ms
- 按钮动效全部符合规范（hover 120ms, active scale(0.96)）
- OKLCH 色彩系统与 design-direction.md 完全对齐
- 已更新 CURRENT.md、ROADMAP.md，T2-002 移入 done/
- Next Task: T2-003 — 个人空间页迁移（Space.vue）

## 2026-06-26 T2-003 个人空间页迁移 — 审查通过

### 已完成

- Project Master Controller 审查了 T2-003 完成报告，确认 PASS（评分 5/5）
- Space.vue 实现了完整的个人空间页：hero 区域、额度统计卡片、内容入口导航、section-switcher tab 切换、四个子页面骨架
- 浅色 OKLCH 主题与 design-direction.md 完全对齐，使用 lucide-vue-next 图标替代原型中的 Chinese 单字
- 响应式验证：桌面端正常，≤760px 移动端布局合理（hero 纵向排列、grid 单列、section-switcher 横向滚动）
- `npm run build` 构建通过
- 已更新 CURRENT.md、ROADMAP.md，T2-003 移入 done/
- Next Task: T2-004 — Admin 后台页面迁移

### 当前状态

T2-003 审查通过，已移入 done/。下一步生成 T2-004 任务。

## 2026-06-27 T2-004 Admin 后台页面迁移 — 审查通过

### 已完成

- Project Master Controller 审查了 T2-004 完成报告（代码直接验证），确认 PASS（评分 5/5）
- AdminLayout.vue 实现了完整的侧边导航栏：OKLCH tokens、hover/active 动效、响应式 ≤760px 横向滚动
- Dashboard.vue 接入 useAuthStore + useAssetStore，展示 4 个指标卡片 + 快速信号区
- Users/Invitations/Quotas/Assets/Tasks 五个子页面均具有与 Dashboard 一致的视觉风格和数据骨架
- 所有页面使用 page-enter 淡入动画（420ms），prefers-reduced-motion 全面覆盖
- `npm run build` 构建通过（524ms）
- 已更新 CURRENT.md、ROADMAP.md，T2-004 移入 done/
- 生成 T2-005 任务文件到 ai/tasks/todo/
- Next Task: T2-005 — 前端基础联调（登录 → 用户信息 → 资产列表 → 额度展示）

### 当前状态

T2-004 审查通过，已移入 done/。Phase 2 剩余任务：2.7 前端基础联调、2.8 响应式验证。

## 2026-06-30 T3-004 Agnes 文本生成接入 — 审查通过

### 已完成

- Project Master Controller 审查了 T3-004 完成报告，确认 PASS（评分 5/5）
- 新增 `backend/api/text_generate.py`：POST `/api/text-generate` 接口，支持项目/节点归属校验、`agnes-2.0-flash` 文本生成、`text` 额度扣减、失败返还与 prompt 资产自动入库
- 修改 `backend/api/router.py`：注册 text_generate 路由
- 新增 `backend/tests/test_text_generate.py`：4 个专项测试全部通过（成功路径、Agnes 失败不扣额度、asset 失败返还、额度不足拒绝）
- 已更新 CURRENT.md、ROADMAP.md，T3-004 移入 done/
- 生成 T3-005 任务文件到 ai/tasks/todo/
- Next Task: T3-005 — Agnes 图片生成接入（文生图/图生图）

### 当前状态

T3-004 审查通过，已移入 done/。Phase 3 进度：3.1~3.4 全部完成。下一步为 3.5 Agnes 图片生成接入。

## 2026-06-30 T3-006 Agnes 视频任务接入 — 审查通过

### 已完成

- Project Master Controller 审查了 T3-006 完成报告，确认 PASS（评分 5/5）
- 新增 `backend/api/video_generate.py`：POST `/api/video-generate` 接口
  - 支持 Agnes 视频任务创建（agnes-video-v2.0）
  - 5秒间隔轮询，最多120次（10分钟超时）
  - 额度扣减/失败返还逻辑完备
  - 生成结果保存为 video 类型 asset
- 修改 `backend/api/router.py`：注册 video_generate 路由
- 新增 `backend/tests/test_video_generate.py`：7 个专项测试全部通过
- 任务文件从 doing/ 移入 done/
- 更新 CURRENT.md（Completed Tasks 表格新增 T3-006）
- 更新 ROADMAP.md（3.6 标记为完成）
- 生成 T3-007 任务文件到 ai/tasks/todo/
- Next Task: T3-007 — 任务状态 + 失败提示 + 额度提示

## 2026-06-20 T3-007 任务状态 + 失败提示 + 额度提示

### 已完成

- 接管 doing 中断任务，补齐 `ai/tasks/doing/TASK-T3-007-PLAN.md` 与 `TASK-T3-007-PROGRESS.md`。
- 重构 `frontend/src/store/canvas.ts`，补充 `setNodeStatus`、`setNodeContent` 和稳定的节点更新逻辑，确保状态切换可触发视图更新。
- 重构 `frontend/src/components/canvas/CanvasStage.vue`，补充 `running / success / warning` 三种节点状态的边框高亮、状态徽标、spinner 和 pulse 动效。
- 重构 `frontend/src/views/app/Workspace.vue`，补充生成按钮 loading、失败提示区域、额度不足标签、节点状态流转和最小生成调用闭环。
- 额外修改 `frontend/src/App.vue`，挂载 `NMessageProvider` 以支持 Naive UI `Message` 提示。
- 完成 `npm run build` 验证，前端构建通过。

### 风险与说明

- 当前工作流页缺少真实 `project_id` 上下文，因此文本节点暂未直连 `/api/text-generate`，本次保持最小改动，没有扩展到项目上下文接入。
- 已尝试做本地浏览器响应式验证，但企业策略阻止 Browser Use 访问本地 `127.0.0.1:4173`，本轮仅完成构建验证与样式逻辑自检。

### 当前状态

T3-007 已完成开发与构建验证，保留在 `ai/tasks/doing/`，等待 Hermes 审查。

## 2026-07-02 T3-010 Agnes 图片/视频端到端测试 — 审查通过

### 已完成

- Project Master Controller 审查了 T3-010 完成报告，确认 PASS（评分 4/5）
- 新增 `backend/tests/test_image_e2e.py`（220 行）：覆盖文生图成功、图生图成功、生成失败不扣额、落库失败 refund、额度不足拒绝、资产双重持久化校验
- 新增 `backend/tests/test_video_e2e.py`（233 行）：覆盖创建+轮询成功、轮询失败不扣额、超时不扣额、落库失败 refund、额度不足拒绝、资产双重持久化校验
- 测试全部使用 TemporaryDirectory + SQLite 隔离，Agnes API 全 mock
- 报告中诚实记录了"视频额度预扣+返还"文案与实际实现不一致的问题，测试按真实实现编写
- 任务文件从 doing/ 移入 done/
- **Phase 3 全部完成（T3-001 ~ T3-010 共 10 个子任务全部通过审查）**
- 更新 CURRENT.md、ROADMAP.md

### 当前状态

Phase 3 全部完成。等待 Hermes 规划下一阶段（Phase 4）。
