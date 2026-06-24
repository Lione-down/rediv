# Revid 项目重整计划 v3.1 — Personal Integration Edition

> 创建日期：2026-06-21  
> 状态：已批准，2026-06-21；允许按任务依赖进入执行  
> 基线：保留 `REVID_RESTRUCTURE_PLAN_V3.md` 作为原始方向与审计记录

## 1. 目标

本轮重整服务于个人本地使用，不以公网发布、商业化或高并发为目标。

1. Revid 使用本机 MySQL 8.0 `revid_db` 作为主数据库，可通过 Navicat 直接查看表结构、字段备注和业务数据。
2. 文本、图片、视频生成接口可使用真实 Agnes 配置完成调用，并将项目、节点、任务、额度和资产结果写入 MySQL。
3. 前端按 v3 方向重构为暗色、`#6347C2` 品牌色、libtv 风格节点工作台。
4. 所有工作拆成可独立派发、测试、审查和回滚的 Executor 任务。

## 2. 非目标

- 不做公网高并发、集群部署、付费充值和多人协作。
- 不在本轮引入 Celery、RQ、Redis、WebSocket 或第二套前端 UI framework。
- 不重写已经通过测试的业务 API，不为了迁移顺手重构无关模块。
- 不将真实 `.env`、数据库密码、Agnes key、微信 secret 或 Admin bootstrap secret 写入 Git。
- 不执行自动删除 SQLite 数据库；`revid.db` 在 MySQL 验收完成前保留为只读回滚源。

## 3. 已确认约束

- MySQL 8.0 已在 `localhost:3306` 运行，本轮必须接入。
- 需要使用 Navicat 直观检查真实数据，因此数据库命名、备注、时间和 JSON 字段必须可读。
- 前端视觉以 v3 的暗色工作流方案为准：76px 左侧浮动工具栏、底部 Prompt Dock、320px 右侧面板。
- 项目继续使用当前 Vue 3、FastAPI 和 SQLAlchemy，不更换主框架。

## 4. 推荐技术栈

### 4.1 后端与数据库

| 层级 | 选择 | 使用约束 |
|---|---|---|
| API | FastAPI + Pydantic v2 | 延续现有 router/schema 结构；生成接口保持 async |
| ORM | SQLAlchemy 2.x ORM | 模型是 schema 事实源；不解析或拼接 `sqlite_master` DDL |
| MySQL Driver | PyMySQL | URL 使用 `mysql+pymysql://`；凭据只来自 `REVID_*` 环境变量 |
| Schema Migration | Alembic | migration 必须可 upgrade/downgrade；autogenerate 后人工审查 |
| 数据迁移 | 独立 Python ETL script + SQLAlchemy Session | 分批迁移、幂等、row count/checksum、失败回滚 |
| HTTP Client | httpx | 项目已使用 `httpx.AsyncClient`；不继续并存 `requests` |
| 配置 | pydantic-settings | development/test/mysql profile 通过 env 控制 |
| 测试 | 现有 unittest + FastAPI TestClient | 保留当前风格；MySQL 增加独立 integration tests |

MySQL 表统一使用 InnoDB、`utf8mb4`。所有表与字段通过 SQLAlchemy `comment=` 写入备注。时间统一以 UTC 写入，Navicat 显示规则写入技术设计。

### 4.2 前端

| 层级 | 选择 | 使用约束 |
|---|---|---|
| Framework | Vue 3 Composition API + TypeScript | 保留 `<script setup lang="ts">`，业务类型明确 |
| Build | Vite | 继续使用现有配置和 9099 端口 |
| State | Pinia | Auth、Canvas、Project/Asset 分域，不把请求状态散落到页面 |
| Router | Vue Router | 路由守卫统一处理正式用户、游客和 Admin |
| UI | Naive UI | `NConfigProvider` 包裹应用；使用 `darkTheme` + `themeOverrides` |
| Canvas | Leafer UI | 负责画布渲染、坐标转换和 pointer 交互；不引入第二画布引擎 |
| Icons | lucide-vue-next | 不使用 emoji 或中文单字充当功能图标 |
| Motion | CSS transition；必要时 Anime.js | 只用于可解释的状态变化，支持 `prefers-reduced-motion` |
| Request | 现有 Axios `request.ts` | API 类型统一放在 `types/` 或业务 module 中 |
| Styles | SCSS tokens + scoped styles | 先建立 design tokens，再重构页面；禁止页面自行发明颜色 |

推荐 Naive UI 组件：`NForm/NInput/NButton` 用于认证表单，`NDrawer` 用于窄屏右侧面板，`NDropdown` 用于 Canvas 右键菜单，`NModal/NDialogProvider` 用于确认操作，`NMessageProvider` 用于短反馈，`NSpin/NProgress` 用于生成状态。

## 5. 目标架构

```text
Vue 3 / Pinia / Leafer UI
            |
            v
FastAPI routers + schemas
       |             |
       v             v
SQLAlchemy 2.x     httpx / Agnes API
       |
       v
MySQL 8.0 revid_db  <---- Navicat 人工检查
```

## 6. 任务拆分与依赖

| Task | 标题 | 依赖 | 可并行 |
|---|---|---|---|
| T4-001 | MySQL 8 引擎、模型备注与 Alembic baseline | 无 | 与 T4-006 |
| T4-002 | SQLite → MySQL 数据迁移工具 | T4-001 | 否 |
| T4-003 | MySQL runtime 切换与 Navicat 验收 | T4-002 | 否 |
| T4-004 | 内部账号密码认证与 Admin bootstrap | T4-003 | 与 T4-005 |
| T4-005 | 真实 Agnes API 联调与诊断信息 | T4-003 | 与 T4-004 |
| T4-006 | 暗色 design system 与 Naive UI provider | 无 | 与 T4-001 |
| T4-007 | 登录/注册入口与路由鉴权 | T4-004、T4-006 | 否 |
| T4-008 | Home 项目/资产概览页重构 | T4-003、T4-006 | 与 T4-009 |
| T4-009 | Space 个人资产页重构 | T4-003、T4-006 | 与 T4-008、T4-010 |
| T4-010 | Workspace 组件拆分与目标布局 | T4-006 | 与 T4-008、T4-009、T4-011 |
| T4-011 | Canvas connection 后端持久化 | T4-003 | 与 T4-010 |
| T4-012 | Canvas 交互与前后端持久化联调 | T4-010、T4-011 | 否 |
| T4-013 | 完整 E2E、视觉 QA 与文档收口 | T4-005、T4-007、T4-008、T4-009、T4-012 | 否 |

每个任务都必须由 Executor 在编码前创建对应 `PLAN` 和 `PROGRESS`，完成后创建 `ai/reports/REPORT-{TaskID}.md`，由 Project Master Controller 审查后才能流转。

## 7. 阶段验收闸门

### Gate A — MySQL 可观测

- Navicat 可看到 12 张现有业务表及新增表。
- 每张表、每个字段都有中文或清晰英文备注。
- SQLite 与 MySQL row count、主键集合及关键业务值一致。
- backend 全量 97 个现有测试继续通过，MySQL integration tests 通过。
- 重启服务后新建项目和资产仍存在于 MySQL。

### Gate B — 真实 API 闭环

- 文本、图片、视频分别完成一次真实调用。
- 失败、超时和额度不足均返回可定位错误。
- 生成结果、来源模型、所属项目/节点、耗时和状态可在 Navicat 中定位。
- 日志和报告不包含完整 API key、token 或数据库密码。

### Gate C — UI 目标状态

- 1440×900 下 Workspace 符合 v3 布局与颜色规范。
- 76px 左浮动工具栏、底部 Prompt Dock、320px 右面板均可操作。
- `CanvasStage.vue`、`Workspace.vue`、`Home.vue`、`Space.vue` 不再维持 900+ 行单文件结构。
- 生成中、成功、失败、空状态、loading 和窄屏状态都有明确表现。

### Gate D — 完整工作流

账号登录 → 创建项目 → 创建/连接节点 → 调用 Agnes → 生成资产 → 刷新页面 → 恢复项目与资产，全链路通过。

## 8. 数据迁移与回滚

1. 迁移前复制 `revid.db` 到时间戳备份文件；不得覆盖原文件。
2. Alembic 在空 MySQL 数据库创建 schema；ETL 只负责数据，不负责拼接 DDL。
3. ETL 使用 migration marker，支持重复执行而不重复插入。
4. 校验失败时不切换 `REVID_USE_SQLITE`；清理由用户确认后单独执行。
5. runtime 切换失败时恢复 SQLite 配置即可回滚，不修改 SQLite 源数据。

## 9. 外部 dependency 与 secret

| 项目 | 当前状态 | Executor 要求 |
|---|---|---|
| MySQL `localhost:3306` | 已确认端口可达 | 使用本地 `.env`，不得输出密码 |
| PyMySQL | 当前 Python 环境已安装 | 写入 `backend/requirements.txt` 并锁定兼容版本 |
| Alembic | 当前未安装 | T4-001 安装并初始化 |
| Agnes endpoint | 已确认可达 | key 只从 `REVID_AGNES_API_KEY` 读取 |
| 微信 OAuth | credentials 是否完整未验证 | 仅 T4-004/T4-007 范围内验证，不阻塞 Agnes 主链 |

## 10. 被拒绝方案

- 拒绝直接转换 `sqlite_master` 字符串：不可靠，无法稳定处理约束、索引、类型和备注。
- 拒绝把 MySQL、Auth、Canvas、视觉全部交给一个 Agent：范围过大，无法独立审查和回滚。
- 拒绝同时引入 Tailwind、Element Plus、Fabric/Konva：会形成重复技术体系。
- 拒绝现在引入 Celery/Redis：个人本地联调阶段维护成本高于收益。

## 11. 最脆弱假设

本计划假设本机 MySQL 8.0 数据库允许当前 `.env` 用户创建/修改表、索引和备注。如果该用户只有读写数据权限，T4-001 会阻塞；解决方式是为 migration 使用单独的本地 DDL 账号，而不是把 root 密码写入仓库。
