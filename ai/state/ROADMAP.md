# Revid — Phase 4 路线图

> 版本：v3.1 Personal Integration Edition
> 状态：已批准，2026-06-21

## Phase 4A — MySQL 主数据库

| Task | 标题 | 状态 | 依赖 |
|---|---|---|---|
| T4-001 | MySQL 8 引擎、模型备注与 Alembic baseline | done | 无 |
| T4-002 | SQLite → MySQL 数据迁移工具 | ready（recovery dispatch revision -07 APPROVED） | T4-001 ✅ |
| T4-003 | MySQL runtime 切换与 Navicat 验收 | blocked | T4-002 |

## Phase 4B — 认证与真实 API

| Task | 标题 | 状态 | 依赖 |
|---|---|---|---|
| T4-004 | 内部账号密码认证与 Admin bootstrap | blocked | T4-003 |
| T4-005 | 真实 Agnes API 联调与诊断信息 | blocked | T4-003 |

## Phase 4C — 前端视觉与页面

| Task | 标题 | 状态 | 依赖 |
|---|---|---|---|
| T4-006 | 暗色 design system 与 Naive UI provider | done ✅ | 无 |
| T4-007 | 登录/注册入口与路由鉴权 | blocked | T4-004、T4-006 |
| T4-008 | Home 项目/资产概览页重构 | blocked | T4-003、T4-006 |
| T4-009 | Space 个人资产页重构 | blocked | T4-003、T4-006 |
| T4-010 | Workspace 组件拆分与目标布局 | ready（待批准） | T4-006 ✅ |

## Phase 4D — Canvas 与最终联调

| Task | 标题 | 状态 | 依赖 |
|---|---|---|---|
| T4-011 | Canvas connection 后端持久化 | blocked | T4-003 |
| T4-012 | Canvas 交互与前后端持久化联调 | blocked | T4-010、T4-011 |
| T4-013 | 完整 E2E、视觉 QA 与文档收口 | blocked | T4-005、T4-007、T4-008、T4-009、T4-012 |

## Phase Complete Definition

通过账号进入项目，创建并连接 Canvas 节点，调用真实 Agnes，资产和任务数据写入 MySQL；刷新页面后数据恢复；用户可通过 Navicat 查看带备注的完整数据；目标暗色 UI 和全链路测试通过。
