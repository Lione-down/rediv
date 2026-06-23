# Revid: Kanban 自动化设计方案

> 本文档描述 Revid 项目的多 Agent 协作架构、Kanban 任务流、Profile 配置和工作机制。
> 
> **原则：只创建管理层配置，不修改业务代码。**

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                    Hermes Gateway (Dispatcher)               │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │  revid-pm │  │revid-     │  │revid-     │  │revid-    │ │
│  │(Coordinator)│ │frontend   │  │backend    │  │reviewer  │ │
│  │          │  │(Worker)   │  │(Worker)   │  │(QA)      │ │
│  └──────────┘  └───────────┘  └───────────┘  └──────────┘ │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Kanban Board: revid                     │    │
│  │                                                      │    │
│  │ Ready → Running → Review → PMC Review → Done          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Profile 配置

### 2.1 revid-pm (Execution Coordinator)

**位置**: `~/.hermes/profiles/revid-pm/`

**职责**:
- 读取 CURRENT、ROADMAP 和已批准的 Ready task
- 检查依赖、Scope、Worker 类型和工作区冲突
- 只派发用户或 Codex Project Master Controller 指定的 Task ID
- 收集 Worker REPORT 和 Reviewer REVIEW
- Reviewer PASS 后生成 PMC handoff

**约束**:
- 不写业务代码
- 不创建或修改 Task、ADR、CURRENT、ROADMAP
- 不替代 Codex Project Master Controller 做产品、架构和最终验收决策
- 不跳过 Reviewer，也不把 PASS 直接标记为 done

### 2.2 revid-frontend (Frontend Worker)

**位置**: `~/.hermes/profiles/revid-frontend/`

**职责**:
- 执行 PM 分配的 Frontend 任务
- 只修改 task Scope 点名的 frontend、UI docs、tests 和报告文件
- 保持与 `ui/design-system.md` 和 ADR 一致
- 运行 `npm run build` 和 task 指定的真实浏览器验证

**约束**:
- 不修改 backend 或 API contract，除非 task 明确允许
- 不引入第二套 UI、Canvas 或状态管理 framework
- build 或浏览器验证失败时任务未完成

### 2.3 revid-backend (Backend Worker)

**位置**: `~/.hermes/profiles/revid-backend/`

**职责**:
- 执行 PM 分配的 Backend 任务
- 只修改 task Scope 点名的 backend、scripts、migrations、tests 和报告文件
- 保持与 ADR、Alembic chain 和 API contract 一致
- 运行专项测试、全量测试和 task 指定的 MySQL/Navicat 验证

**约束**:
- 不修改 frontend，除非 task 明确允许
- 不删除 SQLite 数据，不把 MySQL 失败降级成 InMemoryStore
- 专项或全量测试失败时任务未完成

### 2.4 revid-reviewer (QA Reviewer)

**位置**: `~/.hermes/profiles/revid-reviewer/`

**职责**:
- 独立审查 Executor 的工作成果
- 对照 acceptance criteria 逐项验证
- 输出 PASS、REWORK 或 BLOCKED
- 将 PASS 交回 Codex Project Master Controller 做最终验收

**约束**:
- 审查必须独立复跑可执行验证
- 不修改业务代码，不替 Worker 修复
- 不修改 CURRENT、ROADMAP、ADR，不直接把任务移入 done

---

## 3. 任务流（State Machine）

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Triage  │────▶│  Todo   │────▶│  Ready  │
└─────────┘     └─────────┘     └────┬────┘
                                     │ dispatcher
                                     ▼
                              ┌─────────────┐
                              │  Running     │◀── worker claims
                              └──────┬──────┘
                                     │ self-test
                                     ▼
                              ┌─────────────┐
                              │  Review      │── reviewer assesses
                              └──────┬──────┘
                                     │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                 ┌────────────┐ ┌──────────┐  ┌──────────┐
                 │ PMC Review │ │ Blocked  │  │ Re-work  │
                 └─────┬──────┘ └────┬─────┘  └────┬─────┘
                       │ accept      │ fix          │ re-claim
                       ▼             └──────────────┘
                 ┌────────┐
                 │  Done  │
                 └────────┘
```

### 3.1 状态说明

| 状态 | 负责人 | 操作 |
|------|--------|------|
| **Triage** | Codex Project Master Controller | 评估任务、确定优先级和方向 |
| **Todo** | Codex Project Master Controller | 撰写详细任务规格和验收标准 |
| **Ready** | Codex Project Master Controller | 任务已批准，可由 Coordinator 派发 |
| **Running** | Worker (Frontend/Backend) | 执行任务，完成后提交报告 |
| **Review** | Reviewer | 独立审查，输出 PASS/REWORK/BLOCKED |
| **PMC Review** | Codex Project Master Controller | 最终验收、事实源更新和流转决策 |
| **Done** | Codex Project Master Controller | 任务完成，归档 |
| **Blocked** | Codex Project Master Controller | 决定等待、返工或调整计划 |
| **Re-work** | Worker | 根据审查意见修改后重新提交 |

### 3.2 流转规则

1. **Triage → Todo**: Codex Project Master Controller 完成需求分析并撰写任务
2. **Todo → Ready**: Codex Project Master Controller 审批任务规格
3. **Ready → Running**: 用户或 Codex PMC 指定 Task ID 后，由 Coordinator 派发
4. **Running → Review**: Worker 完成自测后提交报告，状态转为 Review
5. **Review → PMC Review**: Reviewer 给出 PASS，并提交可追溯证据
6. **PMC Review → Done**: Codex Project Master Controller 最终验收并更新事实源
7. **Review → Blocked**: Reviewer 给出 BLOCKED，并说明环境、权限或决策阻塞
8. **Review → Re-work**: Reviewer 给出 REWORK，并写明复现步骤和预期结果
9. **Blocked/Re-work → Review**: Worker 处理后重新提交审查

---

## 4. Kanban Board 配置

### 4.1 Board 初始化

```bash
hermes kanban init
hermes kanban boards create revid
hermes kanban boards switch revid
```

### 4.2 Board 路径

- DB: `~/.hermes/kanban/boards/revid/kanban.db`
- 工作区: `~/.hermes/kanban/workspaces/revid/`

### 4.3 任务模板

每个任务必须包含以下字段：

```markdown
# Task: [编号] — [标题]

## Category
enhancement | bug

## Description
[垂直切片描述，end-to-end 行为]

## Acceptance Criteria
- [ ] 标准 1
- [ ] 标准 2
- [ ] 标准 3

## Scope
- ✅ 包含：[文件/模块范围]
- ❌ 不包含：[明确排除的内容]

## Blocked By
- [父任务编号，如有]

## Assigned To
revid-frontend | revid-backend

## Priority
P0 (critical) | P1 (high) | P2 (medium) | P3 (low)
```

---

## 5. 自动化机制

### 5.1 受控派发

Revid 禁用无条件自动认领。用户或 Codex Project Master Controller 指定 Task ID 后，Execution Coordinator 才能派发：

```yaml
# config.yaml kanban 配置
kanban:
  dispatch_in_gateway: false
  dispatch_interval_seconds: 60
  failure_limit: 2
```

### 5.2 任务认领流程

1. 用户或 Codex Project Master Controller 指定 Ready Task ID
2. Execution Coordinator 检查依赖、Scope、Git 状态和文件冲突
3. 根据 `assigned_to` 字段匹配 Profile，并原子性 claim 任务
4. Worker 开始执行，状态变为 Running
5. Worker 完成后提交报告，状态变为 Review

### 5.3 审查流程

1. Execution Coordinator 将 Review 状态的任务分配给 `revid-reviewer`
2. Reviewer 独立复跑可执行验证，输出 PASS、REWORK 或 BLOCKED
3. PASS 进入 PMC Review，等待 Codex Project Master Controller 最终验收
4. REWORK 退回 Worker，BLOCKED 记录具体环境、权限或决策阻塞

### 5.4 失败重试

- 连续 2 次失败 → 任务自动 Block
- Codex Project Master Controller 审查失败原因
- 修复后重新 Promote 到 Ready

---

## 6. 任务来源映射

历史任务来源于 `xq/*` 和旧 ROADMAP。Phase 4 只使用已批准的 v3.1、当前 ROADMAP、ADR 和 T4 task：

### Phase 1 — 后端核心 API

| 编号 | 任务 | 来源文档 | 分配 |
|------|------|---------|------|
| T1-001 | 数据库持久化迁移 | 09_technical_design | Backend |
| T1-002 | 微信真实 OAuth 登录 | 01_user_system, 08_wechat_auth_quota_plan | Backend |
| T1-003 | 邀请码注册控制 | 08_wechat_auth_quota_plan | Backend |
| T1-004 | 额度系统完整实现 | 08_wechat_auth_quota_plan | Backend |
| T1-005 | 项目 CRUD | 02_project_system | Backend |
| T1-006 | 画布节点 CRUD | 03_canvas_node_system | Backend |
| T1-007 | 模板系统 | 06_template_system | Backend |
| T1-008 | Admin 后台完整接口 | 07_admin_system | Backend |
| T1-009 | Agnes 文本生成接入 | AGNES_INTEGRATION.md | Backend |
| T1-010 | Agnes 图片生成接入 | AGNES_INTEGRATION.md | Backend |
| T1-011 | Agnes 视频生成接入 | AGNES_INTEGRATION.md | Backend |

### Phase 2 — 前端工程化迁移

| 编号 | 任务 | 来源文档 | 分配 |
|------|------|---------|------|
| T2-001 | 前端工程骨架搭建 | 11_frontend_project_development | Frontend |
| T2-002 | 首页迁移 | 11_frontend_project_development, ui/ | Frontend |
| T2-003 | 工作流页基础布局迁移 | 11_frontend_project_development, ui/ | Frontend |
| T2-004 | 个人空间页迁移 | 11_frontend_project_development, ui/ | Frontend |
| T2-005 | Admin 后台页面迁移 | 11_frontend_project_development, ui/ | Frontend |
| T2-006 | 全局 Design Tokens 对齐 | ui/design-direction.md | Frontend |
| T2-007 | 响应式验证（桌面端 + 375px） | ui/design-direction.md | Frontend |

### Phase 3 — 画布真实化 + 后端联调

| 编号 | 任务 | 来源文档 | 分配 |
|------|------|---------|------|
| T3-001 | Leafer UI 集成 | 11_frontend_project_development | Frontend |
| T3-002 | 节点渲染 + 选中 + 拖拽 + 连接 | 11_frontend_project_development | Frontend |
| T3-003 | 缩放 + 平移 + 小地图 | 11_frontend_project_development | Frontend |
| T3-004 | 微信登录联调 | 01_user_system | Frontend |
| T3-005 | 资产列表联调 | 05_asset_system | Frontend |
| T3-006 | 额度展示联调 | 08_wechat_auth_quota_plan | Frontend |
| T3-007 | 任务状态 + 失败提示 | 11_frontend_project_development | Frontend |

### Phase 4 — Personal Integration Edition

Phase 4 的唯一权威来源为 `REVID_RESTRUCTURE_PLAN_V3_1.md`、`ai/state/ROADMAP.md` 和对应 `ai/tasks/todo/TASK-T4-*.md`。Executor 不得再从已归档的 v1 需求推导新范围。

| 编号 | 任务 | 来源文档 | 分配 |
|------|------|---------|------|
| T4-001 | MySQL 8 引擎、模型备注与 Alembic baseline | ADR-001, v3.1 | Backend |
| T4-002 | SQLite → MySQL 数据迁移工具 | ADR-001, v3.1 | Backend |
| T4-003 | MySQL runtime 切换与 Navicat 验收 | ADR-001, v3.1 | Backend |
| T4-004 | 内部账号密码认证与 Admin bootstrap | ADR-002, v3.1 | Backend |
| T4-005 | 真实 Agnes API 联调与诊断信息 | AGNES_INTEGRATION.md, v3.1 | Backend |
| T4-006 | 暗色 design system 与 Naive UI provider | v3, ADR-002 | Frontend |
| T4-007 | 登录/注册入口与路由鉴权 | T4-004, T4-006 | Frontend |
| T4-008 | Home 项目/资产概览页重构 | T4-003, T4-006 | Frontend |
| T4-009 | Space 个人资产页重构 | T4-003, T4-006 | Frontend |
| T4-010 | Workspace 组件拆分与目标布局 | T4-006 | Frontend |
| T4-011 | Canvas connection 后端持久化 | T4-003 | Backend |
| T4-012 | Canvas 交互与前后端持久化联调 | T4-010, T4-011 | Frontend |
| T4-013 | 完整 E2E、视觉 QA 与文档收口 | Phase 4 prior reports | Reviewer |

---

## 7. 目录结构

```
D:/works/codexWorks/project_revid/
├── AGENTS.md                          # Codex Executor 行为规范
├── .gitignore                         # 敏感文件排除
├── .env                               # 环境变量（密钥，已排除 git）
├── .env.example                       # 环境变量模板
├── ai/
│   ├── decisions/                     # 架构决策记录
│   ├── prompts/
│   │   ├── hermes_system_prompt.md    # Hermes 项目级约束
│   │   ├── hermes-desktop-profiles.md # 四个 Hermes profile
│   │   ├── codex_executor_prompt.md   # Executor 执行规范
│   │   └── review_prompt.md           # 审查规范
│   ├── reports/                       # 任务完成报告
│   ├── state/
│   │   ├── CURRENT.md                 # 当前项目状态
│   │   └── ROADMAP.md                 # 开发路线图
│   └── tasks/
│       ├── todo/                      # Codex PMC 创建的待办任务
│       ├── doing/                     # 正在执行的任务
│       └── done/                      # 已完成的任务
├── backend/                           # FastAPI 后端
│   ├── main.py
│   ├── settings/
│   │   └── config.py                  # 配置（含 Agnes）
│   ├── core/
│   │   └── agnes_provider.py          # Agnes Provider
│   ├── api/
│   │   └── router.py                  # 路由挂载
│   └── AGNES_INTEGRATION.md           # Agnes 集成说明
├── frontend/                          # Vue 3 当前前端源码
├── ui/                                # 当前 UI 资产与 design system
├── xq/                                # 当前模块需求和进度记录
├── REVID_RESTRUCTURE_PLAN_V3_1.md     # Phase 4 已批准计划
├── _archive/                          # 过时文档，只用于追溯
└── kanban-design.md                   # 本文档
```

---

## 8. Profile 配置摘要

| Profile | 角色 | 工作区 | 技能 |
|---------|------|--------|------|
| `revid-pm` | 执行协调，不做项目决策 | `D:/works/codexWorks/project_revid` | dependency-check, scope-check, dispatch, handoff |
| `revid-frontend` | 前端、UI、Canvas 执行 | `D:/works/codexWorks/project_revid` | Vue, browser-verification, build |
| `revid-backend` | Backend、MySQL、API 执行 | `D:/works/codexWorks/project_revid` | FastAPI, SQLAlchemy, Alembic, tests |
| `revid-reviewer` | 独立验证，不做最终流转 | `D:/works/codexWorks/project_revid` | diff-review, test-rerun, evidence-audit |

---

## 9. 启动流程

### 9.1 首次启动

```bash
# 1. 初始化 Kanban Board
hermes kanban init
hermes kanban boards create revid
hermes kanban boards switch revid

# 2. 启动 Gateway（含 Dispatcher）
hermes gateway start

# 3. 查看 Codex PMC 已批准的 Ready tasks
# 当前为 T4-001 和 T4-006，不在 Hermes 中创建新任务
```

### 9.2 日常流程

```
1. 用户或 Codex PMC 指定 Ready Task ID
2. Execution Coordinator 检查后派发到 Running
3. Worker 执行、自测并提交 REPORT，进入 Review
4. Reviewer 独立验证，输出 PASS/REWORK/BLOCKED
5. PASS 进入 PMC Review
6. Codex PMC 最终验收，决定 Done、返工或阻塞
```

---

## 10. 安全规则

- `.env` 必须在 `.gitignore` 中排除，真实 secret 不进入 Git、日志和报告。
- API key、password、token 和证书只通过环境变量或本地未跟踪文件提供。
- 数据库 drop、truncate、覆盖、删除和 reset 必须获得用户明确确认。
- 真实 Agnes 调用只有在 task 明确允许并使用显式 execute flag 时执行。
- 审查结论独立记录，Executor 不得修改 REVIEW。

---

*创建日期: 2026-06-19*
*最后更新: 2026-06-21*
