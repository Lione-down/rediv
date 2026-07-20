# Revid

Revid 是面向 AI 视觉创作的项目工作台，围绕项目、多 Canvas、素材、生成任务、结果历史与专业创作工作流提供一套可持续演进的产品能力。

## 当前状态

| 项目 | State | Verification |
|---|---|---|
| Phase 4 initial version | `DONE` | `PASS` |
| Product V2 / Phase 5 | `DONE` | `PASS` |
| Product V3 / Phase 6 | `DOING` | `PENDING` |
| 当前 implementation Task | `T6-002` | Unit 7 active |

权威进度以 [CURRENT](ai/state/CURRENT.md) 为准，完整顺序以 [ROADMAP](ai/state/ROADMAP.md) 为准。Task 目录名不代表状态。

## 已锁定架构

- Backend 使用 FastAPI、SQLAlchemy、Alembic 与 MySQL 8；没有 production in-memory 或 alternate-database fallback。
- 一个 project 可拥有多个相互独立的 Canvas；graph/history/viewport 属于 Canvas，assets/generation 属于 project。
- Frontend 使用 Vue 3、TypeScript、Pinia、Naive UI、Leafer UI、Anime.js 与 SCSS。
- Canvas 以 desktop Chrome 创作为主，mobile 保持 browse/review-only，并保留 200 nodes / 300 connections 性能门禁。
- Provider/model 由用户选择；真实或付费 provider 调用始终需要 action-time Human authorization。

## 文档导航

### 产品、架构与验收

- [Product V2 PRD](ai/requirements/REVID-V2-PRD.md)
- [Canvas acceptance](ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md)
- [V2 Canvas architecture](ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md)
- [V2 Design System](ui/REVID-V2-DESIGN-SYSTEM.md)
- [ADR index](ai/decisions/README.md)

### 当前交付

- [Task management contract](ai/tasks/README.md)
- [T6-002 Task](ai/tasks/todo/TASK-T6-002.md)
- [T6-002 Plan](ai/tasks/doing/TASK-T6-002-PLAN.md)
- [T6-002 Progress](ai/tasks/doing/TASK-T6-002-PROGRESS.md)
- [Last completed report: T6-001](ai/reports/REPORT-T6-001.md)

## 本地开发与验证

- Backend 安装、MySQL runtime 与测试入口见 [Backend README](backend/README.md)。
- Frontend 启动与构建见 [Frontend README](frontend/README.md)。
- CI contract：`python scripts/validate-ci-contract.py`。
- Project-state contract：`python scripts/validate-project-state.py`。
- Frontend production build：在 `frontend/` 运行 `npm run build`。
- Deterministic browser suite：在 `frontend/` 运行 `npm run test:e2e:ci`。
- Headed hardware performance gate：在 `frontend/` 运行 `npm run test:e2e:performance:headed`。

## 安全与数据边界

- 不提交或输出 `.env`、API key、token、证书、私钥或 credential-bearing URL。
- MySQL revision 不一致、runtime security 不满足或 provider endpoint 不受信任时必须 fail closed。
- Tests 只允许创建/删除 exact-name guarded `revid_test_*` disposable schemas。
- 本地历史 `.db` 文件不是 runtime authority；删除需要精确路径、备份/对照证据与 Human authorization。
- 真实 secrets、真实/付费 provider、user data、destructive migration 与不可逆操作保持 Human gate。
