# 开发进度记录

## 2026-06-17 微信登录注册方案

### 已完成

- 新增产品需求总览，重新定义当前 MVP 范围、核心模块和第一版不做事项。
- 新增技术设计文档，统一认证、Admin、额度、资产和安全规则。
- 新增前端项目开发文档，明确 Vue 3 + TypeScript + Vite + Pinia + Leafer UI + Naive UI + Anime.js 的正式选型，以及现有 `/ui` 原型迁移到 Vue 工程的路径。
- 初始化 `frontend/` Vue 3 + Vite + TypeScript 前端工程。
- 安装 Pinia、Vue Router、Axios、Leafer UI、Naive UI、Anime.js、SCSS、Lucide 图标依赖。
- 完成前端基础骨架：路由、Pinia stores、API 请求层、全局 design tokens、首页、工作流页、个人空间页和 Admin 占位页。
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
- 将内存存储替换为数据库模型和持久化迁移。
- 实现真实 Agnes 生成任务、额度扣减、失败返还。
- 实现 Admin 后台前端页面。
- 按 `xq/11_frontend_project_development.md` 继续把现有 `/ui` 高保真交互细节迁移到 `frontend/`。
- 实现游客草稿转正式账号资产绑定。

### 当前状态

当前已存在可运行的后端 MVP 骨架，真实微信开放平台接入和数据库持久化仍待开发。

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
