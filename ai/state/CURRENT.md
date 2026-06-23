# Revid — 当前项目状态

> 更新时间：2026-06-23
> 状态来源：Codex PMC 对 Phase 4 Wave 2 handoff 的最终审查

## Current Phase

`Phase 4 - Personal Integration Edition（执行中）`

## Current Task

- `T4-002`：PMC 最终审查判定 REWORK；修复不可移植 integration tests，并在 disposable MySQL test database 完成端到端验收。
- `T4-006`：PMC 最终审查判定 REWORK；修复 SmokeTest composable 使用方式，并真实点击触发全部 providers。

## Latest PMC Verdicts

| Task | Verdict | Evidence |
|---|---|---|
| T4-001 | PASS，进入 done | MySQL 8.0.43；Alembic head；12/12 InnoDB + utf8mb4；12/12 table comments；90/90 column comments；97 tests |
| T4-006 | PMC REWORK | build 与静态 provider 链通过；真实 provider 交互未验证，scope 记录不完整 |
| T4-002 | PMC REWORK | 28 tests passed、3 skipped；integration tests 路径不可移植且未隔离 disposable MySQL |

## Verified Baseline

- T4-002 专项：`backend/.venv/Scripts/python.exe -m unittest backend.tests.test_migration_tool -v`，28 passed、3 skipped。
- T4-002 compile：`backend/.venv/Scripts/python.exe -m compileall -q backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py`，exit 0。
- frontend：`npm run build` passed，4622 modules transformed。
- MySQL：8.0.43；`revid_db` revision `a1b2c3d4e5f6`；12 张 app table 均为 InnoDB/utf8mb4，表与字段备注完整。
- 系统 Python 缺少 `annotated_doc`；backend 验证必须使用项目 `.venv` 或先修复环境。
- 工作区存在大量未提交修改，Executor 必须先核对目标文件 diff，不得覆盖其他任务或用户工作。

## Ready / Running

- T4-002 — SQLite → MySQL 数据迁移工具：REWORK，等待 Backend Executor。
- T4-006 — 暗色 design system 与 Naive UI provider：REWORK，等待 Frontend Executor。

## Blockers

- T4-003 继续依赖 T4-002 完成与 PMC 验收。
- T4-010 及其他依赖 T4-006 的前端任务继续 blocked，直到真实 provider 交互验收通过。
- 禁止在用户现有数据库执行 downgrade/drop/truncate；destructive 验证只能在专用测试库并获得明确授权。
- 用户已授权 T4-002 创建/销毁唯一专用数据库 `revid_test_t4_002`；Hermes 必须通过 `REVID_TEST_MYSQL_ADMIN_URL` secret 注入连接，缺失时保持 BLOCKED。

## Next Review Gate

- T4-002：修复 integration test 可移植性和 disposable database fixture；完成 execute、幂等、冲突/FK、rollback 与 12-table consistency 后复审。
- T4-006：修复 SmokeTest setup context；在 1440×900 与 375px 实际点击 message/dialog/notification/loading 后复审。
