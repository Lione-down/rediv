# Revid 前端项目开发文档

## 1. 目标

基于当前 `/ui` 下已经完成的静态原型，创建正式的 Web 前端项目，把现有首页、工作流页、个人空间页和交互细节迁移为可维护、可联调、可持续迭代的 Vue 工程。

前端第一版的目标不是重做一套新 UI，而是把已有 UI 原型产品化：

- 保留 `ui/index.html` 的首页入口思路。
- 保留 `ui/revid-prototype.html` 的无限画布、节点工作流、连线和生成入口。
- 保留 `ui/revid-space.html` 的个人空间、资产和历史入口。
- 接入后端已有 Auth、Admin、Assets、Quota 基础接口。
- 为后续接入 Agnes 三模型和真实任务队列留好接口边界。

---

## 2. 技术选型

### 2.1 核心栈

- 构建工具：Vite
- 前端框架：Vue 3
- 语言：TypeScript
- 路由：Vue Router
- 状态管理：Pinia
- 请求层：Axios
- 画布引擎：Leafer UI
- UI 组件库：Naive UI
- 动效：Anime.js
- 样式：SCSS + CSS variables

### 2.2 选型理由

- Vue 3 符合当前全局项目规范，学习和维护成本更低。
- Vite 启动快，适合当前 MVP 快速验证。
- Pinia 适合拆分用户、项目、资产、额度、画布状态。
- Leafer UI 已确认作为无限画布底座，避免从零自研画布引擎。
- Naive UI 适合 Admin 后台和表单、表格、弹层等基础控件。
- Anime.js 只用于轻量反馈动画，不作为核心状态和布局依赖。

### 2.3 暂不采用

- 不用 React Bits：当前前端选型是 Vue，React Bits 仅作为视觉参考，不作为依赖接入。
- 不用 Nuxt：当前不是内容站，SSR 对画布编辑器帮助不大。
- 不用微前端：用户端和 Admin 可以先在同一个 Vite 项目中按路由和模块隔离。
- 不用复杂 monorepo：当前后端和前端可以先保持 `backend/`、`frontend/` 两个目录。

---

## 3. 项目目录

正式前端工程建议放在 `frontend/`：

```text
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── api/
    │   ├── request.ts
    │   ├── auth.ts
    │   ├── assets.ts
    │   ├── admin.ts
    │   └── quota.ts
    ├── assets/
    │   └── styles/
    │       ├── variables.scss
    │       ├── global.scss
    │       └── motion.scss
    ├── components/
    │   ├── common/
    │   ├── layout/
    │   ├── canvas/
    │   ├── assets/
    │   └── admin/
    ├── composables/
    │   ├── useAnimeMotion.ts
    │   ├── useCanvasViewport.ts
    │   ├── useNodeConnection.ts
    │   └── useAuthGuard.ts
    ├── modules/
    │   ├── auth/
    │   ├── project/
    │   ├── canvas/
    │   ├── asset/
    │   ├── quota/
    │   └── admin/
    ├── router/
    │   └── index.ts
    ├── store/
    │   └── index.ts
    ├── types/
    │   ├── canvas.ts
    │   ├── asset.ts
    │   ├── auth.ts
    │   └── quota.ts
    ├── utils/
    │   ├── format.ts
    │   └── guards.ts
    ├── views/
    │   ├── app/
    │   │   ├── Home.vue
    │   │   ├── Workspace.vue
    │   │   └── Space.vue
    │   └── admin/
    │       ├── Dashboard.vue
    │       ├── Users.vue
    │       ├── Invitations.vue
    │       ├── Quotas.vue
    │       ├── Assets.vue
    │       └── Tasks.vue
    ├── App.vue
    └── main.ts
```

---

## 4. 路由设计

### 4.1 用户端

- `/`：首页，对应当前 `ui/index.html`。
- `/app/workspace`：无限画布工作流，对应当前 `ui/revid-prototype.html`。
- `/app/space`：个人空间，对应当前 `ui/revid-space.html`。
- `/auth/callback/wechat`：微信登录回调落地页。

### 4.2 Admin 端

- `/admin`：Admin Dashboard。
- `/admin/users`：用户管理。
- `/admin/invitations`：邀请码管理。
- `/admin/quotas`：额度管理。
- `/admin/assets`：资产管理。
- `/admin/tasks`：任务和模型调用监控。

### 4.3 权限规则

- 游客可访问 `/` 和受限的 `/app/workspace` 预览态。
- 正式用户可访问 `/app/*`。
- Admin 用户可访问 `/admin/*`。
- 非 Admin 访问 `/admin/*` 时跳转首页或显示无权限页。

---

## 5. 现有 UI 原型迁移计划

### 5.1 首页迁移

来源：`ui/index.html`

迁移为：

- `views/app/Home.vue`
- `components/layout/AppTopBar.vue`
- `components/common/PromptComposer.vue`
- `components/assets/RecentProjectShelf.vue`
- `components/common/UserMenu.vue`

保留：

- 首页不做营销 landing。
- 首屏主入口优先。
- 最近项目和内容灵感作为次级区域。
- 首页到工作流页的过渡动效。

### 5.2 工作流页迁移

来源：`ui/revid-prototype.html`

迁移为：

- `views/app/Workspace.vue`
- `components/canvas/CanvasStage.vue`
- `components/canvas/CanvasToolbar.vue`
- `components/canvas/CanvasNode.vue`
- `components/canvas/CanvasConnectionLayer.vue`
- `components/canvas/CanvasContextMenu.vue`
- `components/canvas/CanvasMiniMap.vue`
- `components/assets/AssetDrawer.vue`
- `components/common/PromptDock.vue`

保留：

- 节点左右中心 `+` 连接点。
- 节点拖拽连接到另一个节点完成连接。
- 选中节点时显示相关节点流。
- 默认连线静态，选中态叠加流动高亮。
- 框选、多选、汇聚节点。
- 画布缩放、平移、小地图基础联动。

### 5.3 个人空间迁移

来源：`ui/revid-space.html`

迁移为：

- `views/app/Space.vue`
- `components/assets/AssetGrid.vue`
- `components/assets/AssetFilterTabs.vue`
- `components/common/QuotaSummary.vue`
- `components/common/ProjectList.vue`

保留：

- 管理总览优先，不做说明型 hero。
- 资产、历史、结果、项目入口清晰分组。
- 移动端优先压缩次级说明。

---

## 6. 状态管理

### 6.1 authStore

职责：

- 当前用户。
- JWT token。
- 微信登录跳转状态。
- 游客 session。
- 是否 admin。

### 6.2 quotaStore

职责：

- text、image、video 额度余额。
- 额度消耗状态。
- 额度不足提示。

### 6.3 assetStore

职责：

- 当前用户资产列表。
- prompt、image、video 筛选。
- 上传中状态。
- 生成结果入库后的刷新。

### 6.4 canvasStore

职责：

- 当前项目。
- 节点列表。
- 连线列表。
- 选中节点。
- 多选集合。
- viewport：zoom、pan、minimap。
- 当前工具模式：select、hand、text、image、generate。

### 6.5 adminStore

职责：

- Dashboard 指标。
- 用户列表。
- 邀请码列表。
- 额度流水。
- 任务监控。

---

## 7. API 对接

### 7.1 已有后端接口

当前后端 MVP 已提供：

- `GET /health`
- `GET /auth/wechat/authorize`
- `POST /auth/wechat/mock`
- `POST /auth/wechat/callback`
- `POST /auth/guest`
- `GET /me`
- `POST /admin/dev-login`
- `GET /admin/dashboard`
- `GET /admin/users`
- `GET/PUT /admin/registration-settings`
- `GET/POST /admin/invitation-codes`
- `GET /admin/quota-ledger`
- `GET /assets`
- `POST /assets/upload`

### 7.2 前端请求规则

- 所有请求从 `src/api/request.ts` 发出。
- JWT 统一放入 `Authorization: Bearer <token>`。
- 401 时清空登录状态并回到首页。
- 403 时显示无权限或额度受限提示。
- 生成任务失败时，不在前端直接扣额度，以后端流水为准。

---

## 8. Leafer UI 集成

### 8.1 集成位置

Leafer UI 只在 `CanvasStage.vue` 内初始化，其他组件通过 composable 或 store 调用画布能力。

### 8.2 画布对象边界

- Leafer 实例不直接暴露给全局。
- 节点数据以 Vue/Pinia 中的结构为主。
- Leafer 负责渲染、命中、拖拽、缩放和平移。
- 业务数据以 `canvasStore.nodes` 和 `canvasStore.connections` 为准。

### 8.3 节点类型

```ts
type CanvasNodeType =
  | "text"
  | "image"
  | "video"
  | "model"
  | "result"
  | "refine"
  | "composite";
```

### 8.4 连线规则

- 普通节点可连接到已有节点。
- 多选节点只能从右侧汇聚到下游节点。
- 复合节点拖动生成时，只允许合成生成。
- 含视频素材的复合节点，输出只允许 text 或 video。
- 阻止反向连接造成闭环。

---

## 9. Anime.js 使用规则

Anime.js 只用于小范围反馈，不参与核心布局和业务状态。

允许使用：

- 首页进入工作流的转场。
- 节点创建淡入。
- 节点选中边缘高亮。
- 连线预览的轻量流动效果。
- 工具按钮状态切换反馈。
- 生成任务进入 loading / success / warning 的短反馈。

禁止使用：

- 不为交互服务的大面积装饰动画。
- 长时间循环背景动画。
- 影响布局尺寸的动画属性。
- 在画布大量节点上同时运行复杂动画。

性能规则：

- 优先动画 `transform` 和 `opacity`。
- 默认动画时长 120ms 到 240ms。
- 遵守 `prefers-reduced-motion`。
- 页面卸载时必须清理动画实例。

---

## 10. Naive UI 使用规则

Naive UI 主要用于 Admin 后台和通用表单控件。

适合使用：

- Admin 表格。
- Admin 表单。
- Modal / Drawer。
- Tabs。
- Select。
- Switch。
- Tooltip。
- Empty state。

用户端画布核心区域尽量自定义组件，避免组件库风格压过画布。

---

## 11. 开发顺序

### Phase 1：前端工程骨架

- 创建 `frontend/`。
- 安装 Vue 3、Vite、TypeScript、Pinia、Vue Router、Axios、Leafer UI、Naive UI、Anime.js、SCSS。
- 建立全局样式 token。
- 建立路由和基础 layout。

### Phase 2：静态原型迁移

- 迁移首页。
- 迁移工作流页基础布局。
- 迁移个人空间页。
- 保持与现有 `/ui` 原型视觉一致。

### Phase 3：画布真实化

- 接入 Leafer UI。
- 实现节点渲染。
- 实现节点选中、拖拽、连接。
- 实现缩放、平移、小地图。

### Phase 4：后端联调

- 接微信 mock 登录。
- 接 `/me`。
- 接资产列表。
- 接额度展示。
- 接 Admin 基础接口。

### Phase 5：生成任务接入

- 接 Agnes 文本生成。
- 接 Agnes 图片生成。
- 接 Agnes 视频任务。
- 接任务状态、失败提示、额度提示。

---

## 12. 验收标准

- 首页、工作流页、个人空间页与现有 `/ui` 原型保持同一视觉方向。
- 375px 宽度下不出现横向溢出和关键操作遮挡。
- 画布是工作流页第一视觉中心。
- 节点创建、选择、连接、拖动、缩放、平移可以稳定执行。
- 资产库能展示后端返回的用户资产。
- 登录状态、游客状态、Admin 状态有明确路由保护。
- 额度不足、生成失败、权限不足都有明确反馈。
- Anime.js 动画不影响画布性能。
- Admin 后台可以管理注册开关、邀请码、用户和额度。

---

## 13. 当前结论

前端正式选型为：

```text
Vue 3 + TypeScript + Vite
Pinia
Vue Router
Axios
Leafer UI
Naive UI
Anime.js
SCSS + CSS variables
```

React Bits 暂不接入代码，只作为视觉和动效参考。当前最重要的不是换技术栈，而是把已经成型的 `/ui` 原型稳定迁移成可联调的 Vue 工程。
