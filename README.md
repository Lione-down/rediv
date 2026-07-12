# Revid

Revid 是面向 AI 视觉创作的项目工作台。V2 将项目组织、无限画布、素材、生成任务和结果历史收敛为一套可持续演进的创作流程。

## 当前状态

| 项目 | 状态 |
|---|---|
| Phase 4 初版 | 已完成并通过初版验收 |
| Product V2 / Phase 5 | 已启动 |
| V2 文档与架构基线 | `T5-001` 已通过 |
| 当前实现任务 | `T5-002` MySQL-only 与 credential 清理 |
| V2 整体交付 | 尚未完成 |

权威进度以 [`ai/state/CURRENT.md`](ai/state/CURRENT.md) 为准，任务顺序以 [`ai/state/ROADMAP.md`](ai/state/ROADMAP.md) 为准。

## V2 已锁定方向

- 数据库只使用 MySQL，旧 alternate-database runtime、依赖、测试路径和回滚叙述已全部退役。
- 一个项目可拥有多个相互独立的画布，素材、生成任务、生成历史和项目设置继续归项目所有。
- 第一验收里程碑是 Canvas，不等待全站 UI 完成。
- Canvas 使用 Leafer UI 持久 world group，目标是 200 nodes / 300 edges 下保持可用的桌面编辑体验。
- 视觉体系采用高级感暗紫主题，Canvas 是全屏工作区，工具和面板按上下文出现。
- 桌面 Chrome 是创作主端；移动端只承担浏览和审核。
- V2 首阶段不包含实时多人协作。

## 文档导航

### 产品与验收

- [Product V2 PRD](ai/requirements/REVID-V2-PRD.md)
- [Canvas 首轮验收规范](ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md)
- [V2 Roadmap](ai/state/ROADMAP.md)

### 架构与决策

- [V2 Canvas 架构](ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md)
- [ADR-004: MySQL-only runtime and tests](ai/decisions/ADR-004-mysql-only-runtime-and-tests.md)
- [ADR-005: Project multi-canvas](ai/decisions/ADR-005-project-multi-canvas.md)
- [ADR 索引](ai/decisions/README.md)

### UI 与 Canvas

- [V2 Design System](ui/REVID-V2-DESIGN-SYSTEM.md)
- [Canvas 验收矩阵](ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md)

### 交付状态

- [当前状态](ai/state/CURRENT.md)
- [任务规范](ai/tasks/README.md)
- [T5-002 Task](ai/tasks/todo/TASK-T5-002.md)
- [T5-002 Plan](ai/tasks/doing/TASK-T5-002-PLAN.md)
- [T5-002 Progress](ai/tasks/doing/TASK-T5-002-PROGRESS.md)

## 技术栈

| 层 | 技术 |
|---|---|
| Frontend | Vue 3, TypeScript, Vite, Pinia, Vue Router, Naive UI, Leafer UI, Anime.js, SCSS |
| Backend | FastAPI, Pydantic Settings, SQLAlchemy, Alembic, PyMySQL |
| Database | MySQL 8.x only |
| Verification | Python unittest, frontend build, Playwright browser QA, manual acceptance |

## 本地开发

详细启动和过渡状态见：

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

Backend runtime 与 database-backed tests 已统一使用 MySQL；当前任务状态和后续安全收尾以 `CURRENT` 为准。

## 安全与数据规则

- 不提交 `.env`、API key、token、证书、私钥或带凭据的 URL。
- 不在日志、报告、截图或测试输出中暴露 credential 值。
- MySQL schema 由 Alembic 管理；revision 不一致时 backend 必须 fail closed。
- 本地历史 `.db` 文件不是 V2 数据源。删除前必须完成备份和数据对照，并由 Human Owner 对精确路径授权。
- 真实 provider 调用、付费调用、credential rotation 和 destructive migration 均遵守 Human gate。
