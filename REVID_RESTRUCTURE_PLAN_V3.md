# Revid 项目重整计划 v3

> 创建日期: 2026-06-20
> 状态: 待审批
> 约束: **仅输出计划，不修改任何代码**

---

## 0. 文档重整说明

### 0.1 已归档的过时文档

以下文档已被备份至 `_archive/overseen_docs/2026-06-20/`，原始文件已从项目根目录移除：

| 原始路径 | 说明 |
|---------|------|
| `ui/design-direction.md` | 浅色主题设计 → 已被暗色/libtv 重整计划取代 |
| `ui/revid-ui-design-plan.md` | 旧 UI 设计计划 |
| `ui/impeccable-ui-audit-and-polish-plan.md` | UI 审计计划（已完成/过时） |
| `ui/revid-user-flow-draft.md` | 用户流程草稿 |
| `ui/revid-requirements-status.md` | 需求状态追踪 |
| `xq/00_product_requirements.md` | 产品需求 v1 → 将被 v2 取代 |
| `xq/08_wechat_auth_quota_plan.md` | 微信认证方案 → 新增账号密码登录 |
| `xq/09_technical_design.md` | 技术设计 → 需更新 |
| `xq/10_ui_prototype_plan.md` | UI 原型计划 → 已被取代 |
| `xq/11_frontend_project_development.md` | 前端开发文档 → 已被取代 |
| `ai/state/CURRENT.md` | Phase 3 状态 → 需重置 |
| `ai/state/ROADMAP.md` | 路线图 v1 → 需更新 |

备份索引文件: `_archive/overseen_docs/2026-06-20/_INDEX.md`

### 0.2 保留不变的文档

以下文档内容有效，**不在本次清理范围**内：

- `Agents.md` — Codex Executor 行为规范
- `kanban-design.md` — Kanban 自动化设计（Phase 映射需后续更新）
- `pitfalls.md` — 踩坑记录（需追加新发现）
- `xq/01_user_system.md` ~ `07_admin_system.md` — 各系统需求（需补充账号密码登录）
- `xq/progress.md` — 进度记录
- `ai/decisions/*` — 架构决策记录
- `ai/prompts/*` — Agent prompts
- `ai/reports/*`, `ai/reviews/*`, `ai/tasks/*` — 任务历史（保留）
- `backend/AGNES_INTEGRATION.md` — Agnes 集成说明
- `backend/README.md` — 后端文档

---

## 1. 产品需求最高原则

1. **暗色主题**，参考 libtv 工作流编辑器风格
2. **品牌主色**: `#6347C2` (Purple-600)
3. **画布定位**: 节点工作流编辑器（对标 libtv），无限画布，支持连线、框选、双击添加
4. **布局**: 去左右侧固定工具栏，改为左侧半透明浮窗工具栏（76px）+ 底部 Prompt Dock + 右侧面板（320px）
5. **用户系统**: 主入口改为账号密码登录；保留微信登录入口但关闭注册；Admin 预设（初始密码 123456），Admin 不限制生成次数；游客模式保留但受限
6. **数据库**: 从 SQLite 迁移至 MySQL（本地 `revid_db`，无表结构）

---

## 2. 当前代码状态快照

### 2.1 前端

| 文件 | 状态 | 问题 |
|------|------|------|
| `frontend/src/style.css` | **Vite 默认模板**，完全未改 | 需重写 |
| `frontend/src/assets/styles/variables.scss` | 定义了浅色 oklch 主题变量 | 需改为暗色 + `#6347C2` 品牌色 |
| `frontend/src/assets/styles/global.scss` | 引用 variables.scss，定义了 `.app-shell` 浅色渐变背景 | 需暗色化 |
| `frontend/src/components/layout/AppTopBar.vue` | 使用浅色半透明背景 `oklch(100% 0.004 92 / 0.82)` | 需暗色化 |
| `frontend/src/components/common/PromptComposer.vue` | 使用深色渐变但 oklch 值与 libtv 风格不一致 | 需调整 |
| `frontend/src/views/app/Home.vue` | 营销着陆页（含 quickStarts、quota cards） | 需改为项目/资产概览页 |
| `frontend/src/views/app/Workspace.vue` | 固定左侧工具栏 56px + 右侧面板 320px | 左侧需改为 76px 半透明浮窗 |
| `frontend/src/components/canvas/CanvasStage.vue` | Leafer UI 集成，有拖拽/缩放/平移/锚点 | 连线未绑定、无双击添加、无框选、无右键菜单、Minimap 未渲染 |
| `frontend/src/store/auth.ts` | 仅有微信登录/Mock/游客 | **缺少账号密码登录** |
| `frontend/src/api/auth.ts` | 仅有微信 API | **缺少登录/注册 API** |
| `frontend/src/router/index.ts` | 路由 `/login` `/register` **不存在** | 需新增 |
| `frontend/src/views/auth/` | **目录不存在** | 需新建 LoginView.vue / RegisterView.vue |
| `frontend/package.json` | 依赖完整（Vue3+Vite+TS+Pinia+Router+NaiveUI+Leafer） | ✅ |
| `frontend/vite.config.ts` | 端口 9099 | ⚠️ CORS 配置中还有 5173 |
| `frontend/index.html` | title 为 `"frontend"` | 应改为 `"Revid - AI 创作工作台"` |
| `frontend/src/main.ts` | 挂载 Pinia/Router | ⚠️ 未配置 Naive UI 暗色主题 |

### 2.2 后端

| 文件 | 状态 | 问题 |
|------|------|------|
| `backend/main.py` | **严重 Bug**: `use_sqlite=false` 时配置 `InMemoryStore` 而非 `DatabaseStore` | MySQL 模式不工作 |
| `backend/models/base.py` | 只有 `build_sqlite_url()`，**无 MySQL 引擎构建** | 需新增 |
| `backend/models/user.py` | **无 `password_hash` 字段** | 账号密码登录无法实现 |
| `backend/api/auth.py` | 仅有微信登录/Mock/游客 | **缺少密码登录/注册 API** |
| `backend/settings/config.py` | `use_sqlite: bool = True` 默认 SQLite | 迁移后需改为 `False` |
| `backend/requirements.txt` | 缺 `pymysql`、`passlib[bcrypt]` | 需新增 |
| `backend/controllers/store.py` | `InMemoryStore` 和 `DatabaseStore` 双实现 | `DatabaseStore` 依赖 `init_engine()` 已初始化 |
| `backend/core/security.py` | JWT 创建/验证，`expires_in=86400` 硬编码 | 无 refresh token 机制 |
| `backend/api/image_generate.py` | 图片生成 API 完整 | ✅ |
| `backend/api/text_generate.py` | 文本生成 API 完整 | ✅ |
| `backend/api/video_generate.py` | 视频生成（同步阻塞轮询，最长 10 分钟） | 无异步任务队列 |
| `backend/api/admin.py` | Admin 接口完整，含 `dev-login` | ⚠️ `dev-login` 用字符串比较，不安全 |
| `revid.db` | SQLite，1 个 Admin 用户，3 条 quota ledger 记录 | 需迁移至 MySQL |

### 2.3 数据库

| 项目 | 状态 |
|------|------|
| SQLite (`revid.db`) | 12 张表，1 个 Admin 用户，quota 9999/9999/9999 |
| MySQL (`revid_db` on localhost:3306) | **空库，无表结构** |
| `.env` | MySQL 配置已填写（密码已脱敏） |
| `.env.example` | 模板完整 |

---

## 3. 执行阶段

### Phase 0 — 文档权威化

**目标**: 建立新的权威文档体系，取代已归档的过时文档。

#### 0.1 创建 `xq/00_product_requirements_v2.md`
- 整合现有 `xq/01_user_system.md` ~ `07_admin_system.md` 的需求
- 新增账号密码登录需求
- 更新用户系统：关闭注册、微信登录仅用于老用户登录、Admin 预设
- 更新画布定位：节点工作流编辑器、libtv 对标
- 更新布局规范：76px 浮窗工具栏 + 底部 Dock + 320px 右侧面板
- 更新视觉规范：暗色主题、`#6347C2` 品牌色

#### 0.2 创建 `xq/00_technical_design_v2.md`
- 更新数据库架构：MySQL DDL（12 张表 + 索引）
- 新增账号密码认证流程（bcrypt + JWT）
- 新增 `POST /auth/register`、`POST /auth/login`、`POST /auth/logout` API
- 新增 `POST /auth/forgot-password`、`POST /auth/reset-password` API
- 更新 `main.py` 的 `use_sqlite` 分支逻辑
- 新增 MySQL 引擎初始化流程
- 更新 Canvas API 端点（连线、框选等）

#### 0.3 创建 `ui/design-system.md`
- 暗色主题设计规范
- CSS 变量完整定义（`--brand-primary: #6347C2` 等）
- 组件规范（按钮、面板、节点卡片等）
- 间距/字体/阴影系统
- Libtv 对标截图引用

#### 0.4 更新 `kanban-design.md`
- 更新 Phase 映射（Phase 4+ 的新任务）
- 更新任务来源文档路径

#### 0.5 更新 `pitfalls.md`
- 追加本次审计发现的技术陷阱

#### 0.6 重置 `ai/state/CURRENT.md`
- Phase 重置为 Phase 4 开始
- 清空已完成任务列表（或标记为 Phase 1-3 已完成的历史记录）

#### 0.7 更新 `ai/state/ROADMAP.md`
- 反映重整后的 Phase 划分

---

### Phase 1 — 数据库迁移（SQLite → MySQL）

**目标**: 将 `revid.db` 的数据和结构迁移至 MySQL `revid_db`。

#### 1.1 新增 MySQL 引擎支持

**文件**: `backend/models/base.py`
- 新增 `build_mysql_url(host, port, name, user, password) -> str`
- 新增 `init_mysql_engine(host, port, name, user, password) -> Engine`
- 修改 `init_engine()` 使其能根据配置自动选择 SQLite/MySQL

**文件**: `backend/settings/config.py`
- `use_sqlite` 默认值保持 `True`（迁移完成后改为 `False`）
- MySQL 配置已存在，无需改动

**文件**: `backend/requirements.txt`
- 新增 `pymysql>=1.1.0`
- 新增 `passlib[bcrypt]>=1.7.4`

#### 1.2 编写迁移脚本

**文件**: `scripts/migrate_sqlite_to_mysql.py`（新建）
- 步骤 1: 从 `revid.db` 读取 schema（`sqlite_master`）
- 步骤 2: 转换为 MySQL 兼容 DDL
  - `VARCHAR(36)` → `CHAR(36)`
  - `FLOAT` → `DOUBLE`
  - `JSON` → `JSON`（MySQL 原生）
  - `DATETIME`（无时区）→ `DATETIME`（保持一致）
  - 重建所有索引
  - 重建所有外键约束
- 步骤 3: 连接到 MySQL `revid_db`
- 步骤 4: 执行 DDL 创建表
- 步骤 5: 从 SQLite 导出数据，按批次 INSERT 到 MySQL
- 步骤 6: 验证 row count 和外键完整性

#### 1.3 执行迁移

```bash
python scripts/migrate_sqlite_to_mysql.py
```

#### 1.4 修复 `main.py` 的 use_sqlite Bug

**文件**: `backend/main.py`
```python
# 修改前:
if settings.use_sqlite:
    init_db(settings.db_path)
    configure_store(DatabaseStore())
else:
    configure_store(InMemoryStore())  # ← Bug!

# 修改后:
if settings.use_sqlite:
    init_db(settings.db_path)
    configure_store(DatabaseStore())
else:
    init_mysql_engine(
        settings.db_host, settings.db_port, settings.db_name,
        settings.db_user, settings.db_password
    )
    configure_store(DatabaseStore())  # ← 修复
```

#### 1.5 更新 User 模型（新增 password_hash）

**文件**: `backend/models/user.py`
```python
class User(Base):
    # ... 现有字段 ...
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)  # 新增
```

#### 1.6 运行 `create_tables()` 在 MySQL 上

迁移脚本创建表后，启动服务时 `DatabaseStore.__init__()` 会调用 `create_tables()`，确保所有表存在。

#### 1.7 创建 Admin 初始账号（含密码）

**文件**: `scripts/seed_admin.py`（新建）
```python
import bcrypt
# 1. 检查 MySQL 中是否存在 role='admin' 的用户
# 2. 不存在则创建:
#    - nickname: "Admin"
#    - password_hash: bcrypt.hashpw(b"123456", bcrypt.gensalt())
#    - role: "admin"
#    - status: "active"
#    - generation_status: "enabled"
# 3. 授予 9999 额度 (text/image/video)
# 4. 记录到 quota_ledger
```

#### 1.8 更新 registration_settings

- `registration_mode`: `"closed"`（关闭注册）
- `wechat_login_enabled`: `true`（保留微信登录入口）
- `default_quotas`: 保持 `{text: 100, image: 20, video: 3}`

---

### Phase 2 — 后端账号密码认证

**目标**: 实现完整的账号密码登录/注册系统。

#### 2.1 新增 Auth API 端点

**文件**: `backend/api/auth.py`（扩展）
- `POST /auth/register` — 注册（username/email + password + 可选 invitation_code）
- `POST /auth/login` — 账号密码登录
- `POST /auth/logout` — 登出（前端清 token，服务端暂不维护黑名单）
- `POST /auth/forgot-password` — 忘记密码（预留，当前返回 501）
- `POST /auth/reset-password` — 重置密码（预留，当前返回 501）

#### 2.2 密码验证逻辑

**文件**: `backend/api/auth.py`
```python
import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
```

#### 2.3 注册流程

1. 校验 password 强度（≥ 8 字符）
2. 检查 username/email 是否已存在
3. 如果 `registration_mode == "invite_only"`，校验邀请码
4. 如果 `registration_mode == "closed"`，拒绝注册（返回 403）
5. 创建 User（含 password_hash）
6. 创建 Quota 记录
7. 调用 `grant_default_quotas()`
8. 返回 token

#### 2.4 登录流程

1. 查找 username/email
2. 验证 password_hash（bcrypt）
3. 检查 status（banned → 403）
4. 检查 generation_status（frozen → 403 但允许登录）
5. 调用 `touch_login()`
6. 返回 token + user + quotas

#### 2.5 Admin 特殊逻辑

- Admin 用户的 quota 检查**跳过**（`generation_status` 不受 quota 限制）
- 在 `image_generate.py` / `text_generate.py` / `video_generate.py` 中：
  ```python
  if user["role"] != "admin":
      # 检查 quota
  ```

---

### Phase 3 — 前端视觉重构（暗色 + 品牌色）

**目标**: 将所有前端样式从浅色 Vite 默认模板改为暗色 libtv 风格。

#### 3.1 重写 `variables.scss`

**文件**: `frontend/src/assets/styles/variables.scss`

新增/修改的关键变量：
```scss
// 品牌色
--brand-primary: #6347C2;
--brand-primary-hover: #7B5FDB;
--brand-primary-active: #5235A5;
--brand-primary-glow: rgba(99, 71, 194, 0.25);

// 暗色背景
--bg-app: oklch(12% 0.015 270);       // 应用背景
--bg-canvas: oklch(10% 0.012 270);    // 画布背景
--bg-panel: oklch(16% 0.018 270);     // 面板背景
--bg-panel-subtle: oklch(20% 0.015 270); // 子面板

// 暗色文字
--text-primary: oklch(92% 0.01 270);
--text-secondary: oklch(72% 0.012 270);
--text-muted: oklch(55% 0.01 270);

// 边框
--border-subtle: oklch(28% 0.015 270);
--border-strong: oklch(36% 0.02 270);

// 状态色（暗色适配）
--warning: oklch(70% 0.15 85);
--danger: oklch(60% 0.18 25);
--success: oklch(65% 0.13 155);
```

#### 3.2 重写 `style.css`

从 Vite 默认模板替换为全局暗色重置 + CSS 变量导入。

#### 3.3 配置 Naive UI 暗色主题

**文件**: `frontend/src/main.ts`
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { NConfigProvider, darkTheme } from 'naive-ui'
import App from './App.vue'
import { router } from './router'
import './assets/styles/global.scss'

createApp(App)
  .use(createPinia())
  .use(router)
  .use(NConfigProvider, { theme: darkTheme })  // 新增
  .mount('#app')
```

#### 3.4 更新 `AppTopBar.vue`

- 背景改为暗色半透明: `oklch(15% 0.02 270 / 0.85)` + `backdrop-filter: blur(14px)`
- 品牌 Mark 渐变改为 `#6347C2` 系

#### 3.5 更新 `PromptComposer.vue`

- 渐变背景调整为暗色基调

#### 3.6 更新 `.app-shell` 背景

**文件**: `frontend/src/assets/styles/global.scss`
- 从浅色径向渐变改为暗色渐变

---

### Phase 4 — 前端页面重构

**目标**: 重构 Home/Workspace 页面布局和交互。

#### 4.1 新建 `LoginView.vue`

**文件**: `frontend/src/views/auth/LoginView.vue`（新建）
- 账号输入框
- 密码输入框（`type="password"`）
- 登录按钮
- 分割线 "或"
- 微信登录按钮（保留入口）
- 游客模式入口
- 注册链接（当 `registration_mode != "closed"` 时显示）

#### 4.2 新建 `RegisterView.vue`

**文件**: `frontend/src/views/auth/RegisterView.vue`（新建）
- 用户名/邮箱输入
- 密码输入 + 确认密码
- 邀请码（可选，取决于 `registration_mode`）
- 注册按钮

#### 4.3 更新路由

**文件**: `frontend/src/router/index.ts`
```typescript
// 新增路由
{ path: '/login', name: 'login', component: () => import('../views/auth/LoginView.vue') },
{ path: '/register', name: 'register', component: () => import('../views/auth/RegisterView.vue') },

// 新增守卫: requiresAuth
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // ... 现有逻辑
})
```

#### 4.4 更新 `auth store`

**文件**: `frontend/src/store/auth.ts`
- 新增 `loginWithPassword(username, password)` 方法
- 新增 `register(username, password, invitationCode?)` 方法
- 新增 `logout()` 方法
- 新增 `isLoading` 状态

#### 4.5 更新 `auth API`

**文件**: `frontend/src/api/auth.ts`
- 新增 `loginWithEmailAndPassword(username, password)`
- 新增 `registerUser(username, password, invitationCode?)`
- 新增 `logout()`

#### 4.6 重构 `Home.vue`

从营销着陆页改为项目/资产概览页：
- 展示用户的项目列表（调用 `/api/projects`）
- 展示最近资产
- 展示额度余额
- 快速操作：新建项目、进入工作流
- 暗色主题适配

#### 4.7 重构 `Workspace.vue` 布局

**文件**: `frontend/src/views/app/Workspace.vue`

- 左侧工具栏从固定 56px 改为**半透明浮窗 76px**
  - `position: absolute; left: 12px; top: 50%; transform: translateY(-50%)`
  - `backdrop-filter: blur(12px)`
  - `background: oklch(16% 0.018 270 / 0.8)`
  - `border-radius: 16px`
  - 移除 `border-right`
- `.workspace-shell` grid 调整为单列（左侧工具栏不再占 grid 轨道）
- 右侧面板保持 320px
- 底部 Prompt Dock 保持
- 暗色主题适配

---

### Phase 5 — Canvas 交互补全

**目标**: 实现 libtv 级别的画布交互能力。

#### 5.1 连线交互

**文件**: `frontend/src/components/canvas/CanvasStage.vue`
- 绑定锚点的 `pointer.down` → 开始绘制连线草稿
- `pointer.move` → 更新草稿连线终点
- `pointer.up` → 检测目标锚点，建立连接
- 更新 `canvasStore.connections` 并持久化到后端

#### 5.2 双击添加节点

- 监听 canvas 表面的 `dblclick` 事件
- 根据 `canvasStore.mode` 创建对应类型的节点
- 调用后端 `POST /api/canvas-nodes`

#### 5.3 框选（Box Selection）

- `pointer.down` 在空白区域 → 开始框选
- `pointer.move` → 绘制选择矩形
- `pointer.up` → 计算矩形内节点，多选

#### 5.4 右键菜单

**文件**: `frontend/src/components/canvas/CanvasContextMenu.vue`（新建）
- 节点右键：删除、复制、设为起始/终止、属性
- 空白区域右键：添加节点快捷菜单

#### 5.5 最小地图

**文件**: `frontend/src/components/canvas/Minimap.vue`（新建）
- 嵌入 `CanvasStage.vue` 右下角
- 显示视口区域高亮
- 点击拖动平移

#### 5.6 CanvasStore 数据持久化

**文件**: `frontend/src/store/canvas.ts`
- 新增 `saveNodes()` / `loadNodes()` 方法
- 对接后端 `GET/POST/PUT/DELETE /api/canvas-nodes`
- 新增 `saveConnections()` / `loadConnections()`
- 新增 `saveProject()` / `loadProject()`

#### 5.7 前后端类型对齐

- 前端 `CanvasNode` 类型增加 `project_id`, `node_type` 字段
- 后端 `CanvasNode` API 返回格式与前端一致

---

### Phase 6 — 基础设施完善

**目标**: 补齐缺失的基础设施能力。

#### 6.1 文件上传 API

**文件**: `backend/api/assets.py`（扩展）
- 新增 `POST /assets/upload` 支持 `multipart/form-data`
- 保存到 `storage_local_root` 或 S3
- 返回 `url` 写入 Asset 记录

#### 6.2 视频生成异步化

**方案 A（短期）**: 后台线程 + 轮询
- `video_generate` 端点启动后台线程
- 返回 `task_id` 给前端
- 前端轮询 `GET /api/tasks/:task_id/status`
- 完成后推送结果

**方案 B（长期）**: Celery/RQ
- 引入消息队列
- 视频生成为后台任务
- WebSocket/SSE 推送进度

#### 6.3 CORS 端口统一

**文件**: `backend/settings/config.py`
- `cors_origins` 默认值改为 `["http://localhost:9099"]`（移除 5173）

#### 6.4 前端 index.html 更新

**文件**: `frontend/index.html`
- `<title>` 改为 `"Revid - AI 创作工作台"`

#### 6.5 错误边界

**文件**: `frontend/src/App.vue`
- 包裹 Vue ErrorBoundary
- 崩溃时显示友好错误页

---

## 4. 执行顺序与依赖

```
Phase 0 (文档) ──────────────────────────▶ 可独立执行，无依赖
    │
    ▼
Phase 1 (DB 迁移) ◀── 依赖 Phase 0 的技术设计文档
    │
    ├── Phase 2 (后端认证) ◀── 依赖 Phase 1 (User 模型 + MySQL)
    │       │
    │       ▼
    │   Phase 4 (前端页面) ◀── 依赖 Phase 2 (API) + Phase 3 (样式)
    │       │
    │       ▼
    │   Phase 5 (Canvas 补全) ◀── 依赖 Phase 4 (布局) + Phase 2 (API)
    │
    ▼
Phase 3 (视觉重构) ◀── 可与 Phase 1-2 并行
    │
    ▼
Phase 6 (基础设施) ◀── 可在任意阶段穿插
```

**推荐执行顺序**:
1. Phase 0（文档）— 1 小时
2. Phase 1（DB 迁移）— 2 小时
3. Phase 2（后端认证）— 2 小时
4. Phase 3（视觉重构）— 2 小时（可与 Phase 2 并行）
5. Phase 4（前端页面）— 3 小时
6. Phase 5（Canvas 补全）— 4 小时
7. Phase 6（基础设施）— 穿插进行

---

## 5. 关键文件变更清单

### 新建文件
| 文件 | 说明 |
|------|------|
| `xq/00_product_requirements_v2.md` | 新产品需求 |
| `xq/00_technical_design_v2.md` | 新技术设计 |
| `ui/design-system.md` | 设计系统规范 |
| `scripts/migrate_sqlite_to_mysql.py` | DB 迁移脚本 |
| `scripts/seed_admin.py` | Admin 种子脚本 |
| `frontend/src/views/auth/LoginView.vue` | 登录页 |
| `frontend/src/views/auth/RegisterView.vue` | 注册页 |
| `frontend/src/components/canvas/CanvasContextMenu.vue` | 右键菜单 |
| `frontend/src/components/canvas/Minimap.vue` | 最小地图 |

### 修改文件
| 文件 | 主要变更 |
|------|---------|
| `backend/models/base.py` | 新增 MySQL 引擎构建 |
| `backend/models/user.py` | 新增 `password_hash` 字段 |
| `backend/api/auth.py` | 新增密码登录/注册 API |
| `backend/main.py` | 修复 `use_sqlite` Bug |
| `backend/requirements.txt` | 新增 `pymysql`, `passlib[bcrypt]` |
| `backend/api/image_generate.py` | Admin 跳过 quota 检查 |
| `backend/api/text_generate.py` | Admin 跳过 quota 检查 |
| `backend/api/video_generate.py` | Admin 跳过 quota 检查 |
| `backend/controllers/store.py` | 注册模式更新 |
| `frontend/src/style.css` | 重写 |
| `frontend/src/assets/styles/variables.scss` | 暗色主题 + 品牌色 |
| `frontend/src/assets/styles/global.scss` | 暗色背景 |
| `frontend/src/main.ts` | Naive UI 暗色主题配置 |
| `frontend/src/router/index.ts` | 新增登录/注册路由 + 守卫 |
| `frontend/src/store/auth.ts` | 新增密码登录方法 |
| `frontend/src/api/auth.ts` | 新增密码登录 API |
| `frontend/src/views/app/Home.vue` | 从营销页改为项目概览 |
| `frontend/src/views/app/Workspace.vue` | 左侧工具栏改为浮窗 |
| `frontend/src/components/layout/AppTopBar.vue` | 暗色化 |
| `frontend/src/components/canvas/CanvasStage.vue` | 连线/双击/框选/右键 |
| `frontend/index.html` | 更新 title |
| `ai/state/CURRENT.md` | 重置为 Phase 4 |
| `ai/state/ROADMAP.md` | 更新路线图 |
| `kanban-design.md` | 更新 Phase 映射 |
| `pitfalls.md` | 追加新踩坑 |

---

## 6. 已知风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| MySQL 连接池配置 | 后端启动失败 | 使用 SQLAlchemy 默认配置，后续优化 |
| 视频生成阻塞 HTTP 连接 | 用户体验差 | 短期用后台线程，中期引入 Celery |
| 前端 CanvasStore 数据量 | 大项目性能下降 | 分页加载 + 虚拟滚动 |
| JWT 无刷新机制 | 24 小时后需重新登录 | 中期引入 refresh token |
| `dev-admin-key` 硬编码 | 安全风险 | 迁移后替换为正式 Admin 登录 |
| 微信登录关闭注册后老用户 | 老用户仍可登录 | `_login_or_register_wechat` 中已处理：有 identity 则直接登录 |

---

*计划 v3 创建日期: 2026-06-20*
*基于代码审计发现 12 个缺失项，覆盖 Auth、DB、Canvas、Visual、Infrastructure 五大领域*
