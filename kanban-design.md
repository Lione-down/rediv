# Revid — Kanban 自动化设计方案

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
│  │ (PM)     │  │frontend   │  │backend    │  │reviewer  │ │
│  │          │  │(Worker)   │  │(Worker)   │  │(QA)      │ │
│  └──────────┘  └───────────┘  └───────────┘  └──────────┘ │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Kanban Board: revid                     │    │
│  │                                                      │    │
│  │  Triage → Todo → Ready → Running → Review → Done     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Profile 配置

### 2.1 revid-pm (Project Master Controller)

**位置**: `~/.hermes/profiles/revid-pm/`

**职责**:
- 理解产品需求（xq/*）和技术设计
- 维护项目状态（ai/state/CURRENT.md, ROADMAP.md）
- 将 Phase 拆解为独立的垂直切片任务
- 将任务发布到 Kanban Board
- 分配任务给 Frontend / Backend Worker
- 维护架构一致性和技术设计文档

**约束**:
- ❌ 不写业务代码
- ❌ 不跳过审查流程
- ✅ 每个任务完成后必须经 Reviewer 验收

### 2.2 revid-frontend (Frontend Worker)

**位置**: `~/.hermes/profiles/revid-frontend/`

**职责**:
- 执行 PM 分配的 Frontend 任务
- 修改 frontend/ 下的业务代码
- 保持与 ui/ 原型和设计文档的一致性
- 自测：`npm run build` 必须通过

**约束**:
- ✅ 只修改 frontend/ 下的文件
- ✅ 构建失败 = 任务未完成

### 2.3 revid-backend (Backend Worker)

**位置**: `~/.hermes/profiles/revid-backend/`

**职责**:
- 执行 PM 分配的 Backend 任务
- 修改 backend/ 下的业务代码
- 保持与技术设计文档的一致性
- 自测：后端冒烟测试必须通过

**约束**:
- ✅ 只修改 backend/ 下的文件
- ✅ 冒烟测试失败 = 任务未完成

### 2.4 revid-reviewer (QA Reviewer)

**位置**: `~/.hermes/profiles/revid-reviewer/`

**职责**:
- 独立审查 Executor 的工作成果
- 对照 acceptance criteria 逐项验证
- 输出审查结论：✅ 通过 / ❌ 打回

**约束**:
- ✅ 审查必须独立
- ❌ 不修改业务代码

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
                   ┌────────┐  ┌──────────┐  ┌──────────┐
                   │  Done  │  │ Blocked  │  │ Re-work  │
                   └────────┘  └────┬─────┘  └────┬─────┘
                                    │ fix          │ re-claim
                                    └──────────────┘
```

### 3.1 状态说明

| 状态 | 负责人 | 操作 |
|------|--------|------|
| **Triage** | PM | 评估任务，分类（bug/enhancement），确定优先级 |
| **Todo** | PM | 撰写详细任务规格（title + body + AC + scope） |
| **Ready** | Dispatcher | 任务已就绪，等待 Worker 认领 |
| **Running** | Worker (Frontend/Backend) | 执行任务，完成后提交报告 |
| **Review** | Reviewer | 独立审查，评分 1-5 |
| **Done** | — | 任务完成，归档 |
| **Blocked** | PM | 审查不通过或阻塞，需修复 |
| **Re-work** | Worker | 根据审查意见修改后重新提交 |

### 3.2 流转规则

1. **Triage → Todo**: PM 完成需求分析后撰写详细规格
2. **Todo → Ready**: PM 确认规格完整，promote 到 Ready
3. **Ready → Running**: Dispatcher 自动将 Ready 任务分配给合适的 Worker
4. **Running → Review**: Worker 完成自测后提交报告，状态转为 Review
5. **Review → Done**: Reviewer 评分 ≥ 4，任务完成
6. **Review → Blocked**: Reviewer 评分 < 4，打回并说明问题
7. **Blocked → Re-work**: Worker 根据审查意见修改
8. **Re-work → Review**: 修改后重新提交审查

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

### 5.1 Dispatcher 自动分发

Gateway 的内置 dispatcher 每 60 秒自动扫描 Ready 任务：

```yaml
# config.yaml kanban 配置
kanban:
  dispatch_in_gateway: true
  dispatch_interval_seconds: 60
  failure_limit: 2
```

### 5.2 任务认领流程

1. Dispatcher 找到 Ready 状态的任务
2. 根据 `assigned_to` 字段匹配 Profile
3. 原子性 claim 任务（防止竞态）
4. Worker 开始执行，状态变为 Running
5. Worker 完成后提交报告，状态变为 Review

### 5.3 审查流程

1. Dispatcher 将 Review 状态的任务分配给 revid-reviewer
2. Reviewer 独立执行 4 阶段审查
3. 评分 ≥ 4 → 标记 Done
4. 评分 < 4 → 标记 Blocked，附审查意见

### 5.4 失败重试

- 连续 2 次失败 → 任务自动 Block
- PM 介入审查失败原因
- 修复后重新 Promote 到 Ready

---

## 6. 任务来源映射

所有任务来源于 `xq/*` 和 `ai/state/ROADMAP.md`：

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
│   │   ├── hermes_system_prompt.md    # PM 角色定义
│   │   ├── codex_executor_prompt.md   # Executor 执行规范
│   │   └── review_prompt.md           # 审查规范
│   ├── reports/                       # 任务完成报告
│   ├── state/
│   │   ├── CURRENT.md                 # 当前项目状态
│   │   └── ROADMAP.md                 # 开发路线图
│   └── tasks/
│       ├── todo/                      # PM 创建的待办任务
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
├── frontend/                          # Vue 3 前端
│   └── src/                           # 待迁移
├── ui/                                # 原型和设计文档
│   ├── design-direction.md            # UI 基调方案
│   ├── revid-prototype.html           # 画布原型
│   └── revid-space.html               # 空间原型
├── xq/                                # 产品需求文档
│   ├── 00_product_requirements.md      # 产品需求总览
│   ├── 01_user_system.md              # 用户系统
│   ├── 02_project_system.md           # 项目系统
│   ├── 03_canvas_node_system.md       # 画布节点
│   ├── 04_canvas_frontend.md          # 画布前端
│   ├── 05_asset_system.md             # 资产系统
│   ├── 06_template_system.md          # 模板系统
│   ├── 07_admin_system.md             # 管理员系统
│   ├── 08_wechat_auth_quota_plan.md   # 微信登录与额度
│   ├── 09_technical_design.md         # 技术设计
│   ├── 10_ui_prototype_plan.md        # UI 原型计划
│   ├── 11_frontend_project_development.md # 前端开发文档
│   └── progress.md                    # 开发进度记录
└── kanban-design.md                   # 本文档
```

---

## 8. Profile 配置摘要

| Profile | 角色 | 工作区 | 技能 |
|---------|------|--------|------|
| `revid-pm` | 项目管理 + 架构 | `D:/works/codexWorks/project_revid` | to-prd, to-issues, triage, grill, domain-modeling, codebase-design |
| `revid-frontend` | 前端开发 | `D:/works/codexWorks/project_revid` | implement, tdd, prototype |
| `revid-backend` | 后端开发 | `D:/works/codexWorks/project_revid` | implement, tdd, spike |
| `revid-reviewer` | 质量审查 | `D:/works/codexWorks/project_revid` | diagnosing-bugs, codebase-design |

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

# 3. PM 创建第一批任务
hermes kanban create --title "T1-001: 数据库持久化迁移" --assignee revid-backend --priority P0 ...
```

### 9.2 日常流程

```
1. PM 在 Kanban 创建任务 → Todo
2. PM 完善规格 → Ready
3. Dispatcher 自动分配 → Running
4. Worker 执行 + 自测 → Review
5. Reviewer 审查 → Done / Blocked
6. PM 根据审查结果决定下一步
```

---

## 10. 安全规则

- ✅ `.env` 已在 `.gitignore` 中排除
- ✅ API Key 通过环境变量注入
- ✅ Admin 路由仅限 admin 角色访问
- ✅ 用户只能访问自己的资产
- ✅ 审查结论独立记录，不可被 Executor 修改

---

*创建日期: 2026-06-19*
*最后更新: 2026-06-19*
