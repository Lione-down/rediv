# ADR-002: v3.1 重整技术栈

## 状态

Accepted，用户于 2026-06-21 批准，并确认保留账号密码登录范围。

## 背景

项目已有可构建、可测试的 Vue 3 + FastAPI 实现。本轮目标是 MySQL 接入、真实 API 联调和 UI 重构，不适合更换主框架。

## 决策

- 后端继续使用 FastAPI、Pydantic v2、SQLAlchemy 2.x、pydantic-settings。
- MySQL 使用 PyMySQL；schema revision 使用 Alembic。
- 第三方 HTTP 调用统一使用 httpx，逐步去除新增的 requests dependency。
- 前端继续使用 Vue 3 Composition API、TypeScript、Vite、Pinia、Vue Router。
- UI 使用 Naive UI；暗色主题由 `NConfigProvider` + `darkTheme` + `themeOverrides` 提供。
- Canvas 继续使用 Leafer UI；图标使用 lucide-vue-next；Anime.js 仅用于必要动效。
- 样式采用 SCSS design tokens 和 scoped styles，不新增 Tailwind 或另一套 UI library。

## 后果

- 优点：最大化复用现有实现，Executor 不需要重新决定技术路线。
- 代价：需要拆分当前超大 Vue SFC 和 `backend/controllers/store.py` 的长期职责。
- 风险：重构与功能联调并行时容易扩大 diff，因此拆分任务禁止跨范围清理。
