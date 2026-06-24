# PMC REVIEW — Phase 4 Wave 2

> 日期：2026-06-23
> 队列：`phase4-wave2-2026-06-22-01`
> 审查者：Codex Project Master Controller

## 结论

| Task | PMC Verdict | 说明 |
|---|---|---|
| T4-002 | **REWORK** | unit test 与 compile 通过，但 MySQL integration tests 不能证明可执行；测试路径硬编码为 MSYS 路径，且未创建或隔离 disposable MySQL schema。原任务要求的 execute、幂等、冲突/FK、一致性仍未端到端验收。 |
| T4-006 | **REWORK** | build 与 provider 静态配置通过，但 Reviewer 没有实际触发 message/dialog/notification/loading。SmokeTest 中三个 `use*` composable 在 click handler 内调用，尚未证明 injection context 正常；router 与 smoke 页面也未计入原 scope 报告。 |

两项任务不得移入 `done`，不得解除下游依赖。

## 本轮独立证据

### T4-002

- `backend/.venv/Scripts/python.exe -m unittest backend.tests.test_migration_tool -v`：28 passed，3 skipped。
- `backend/.venv/Scripts/python.exe -m compileall -q ...`：exit 0。
- 当前 process 未设置 `REVID_DB_PASSWORD`；本地 `.env` 实际存在密码，但目标库不是 `revid_test`，因此不得在用户现有数据库上运行 integration test。
- integration test 将脚本路径硬编码为 `/d/works/codexWorks/project_revid/...`，不满足 Windows Python 可移植执行要求。
- integration test 未创建、迁移和清理专用 MySQL test database，不能作为 disposable-MySQL 证据。
- `test_missing_source_returns_nonzero` 不依赖 MySQL，却被 password gate 一并 skip。
- 原 Acceptance Criteria 要求冲突/FK 异常有明确失败证据；当前可执行测试未覆盖。

### T4-006

- `npm run build`：4622 modules，exit 0。
- `App.vue` 已静态包含 config/message/dialog/notification/loading providers。
- Reviewer 证据明确记录 provider containers 未触发 lazy-mount；因此没有验证 message/dialog/notification/loading 的真实交互。
- `frontend/src/router/index.ts` 新增 `/smoke`，`frontend/src/views/smoke/SmokeTest.vue` 为新文件，但 Review/Progress 声称只有 `App.vue` 发生 provider 修改，scope 记录不完整。
- `SmokeTest.vue` 的 `useMessage()`、`useDialog()`、`useNotification()` 在事件 handler 内调用；必须改为 setup 顶层获取 API，并用浏览器点击验证。
- 当前会话无法连接 in-app Browser，因此未把静态推断误报为浏览器实测结论。

## 返工要求

### T4-002

1. 使用 `Path(__file__)` 等方式解析脚本路径，禁止硬编码绝对路径或 MSYS drive path。
2. integration fixture 必须创建或显式连接专用 disposable MySQL test database，执行 Alembic schema setup，并在安全边界内清理；不得写用户现有 `revid_db`。
3. 将不依赖 MySQL 的 missing-source test 移出 password skip gate。
4. 实测 execute、second-run idempotency、same-PK conflicting value、FK orphan、partial failure rollback、12-table consistency 和 source immutability。
5. 明确 same-PK different-value 的产品语义；若 Acceptance Criteria 保持“冲突失败”，则不得静默 update。

### T4-006

1. 在 setup 顶层调用 `useMessage/useDialog/useNotification/useLoadingBar`，事件 handler 只使用已获取的 API。
2. 用真实浏览器在 1440×900 与 375px 点击触发全部四类 provider，记录可复核的 DOM/console/viewport 证据。
3. 明确 `/smoke` route 和 SmokeTest 页面是临时验收资产还是长期开发页面；同步 scope、PLAN、PROGRESS、REPORT。若为临时资产，后续清理需单独获批，不得擅自删除。
4. 重跑 `npm run build`，由独立 Reviewer 复核交互证据。

## 流转决定

- T4-003 继续 blocked on T4-002。
- 依赖 T4-006 的前端任务继续 blocked。
- 新返工队列 revision：`phase4-wave2-rework-2026-06-23-01`。
- 历史冗余 scheduled 卡 `t_ae07d489` 应由 Hermes 标记 cancelled/obsolete，不得复用为本轮 Reviewer 卡。

