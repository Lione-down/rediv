# Revid — 当前项目状态

> 更新时间：2026-06-24
> 状态来源：Codex PMC 自动治理与 Human User 人工返工授权

## Current Phase

`Phase 4 - Personal Integration Edition（执行中）`

## Current Task

- `T4-002`：BLOCKED，Human User 的一次人工返工授权仍有效，但尚未进入 Executor attempt；当前治理 revision 为 `phase4-wave2-blocked-2026-06-24-02`。

## Latest PMC Verdicts

| Task | Verdict | Evidence |
|---|---|---|
| T4-001 | PASS，进入 done | MySQL 8.0.43；Alembic head；12/12 InnoDB + utf8mb4；12/12 table comments；90/90 column comments；97 tests |
| T4-006 | PMC PASS，进入 done | `ai/reviews/REVIEW-T4-006-PMC-2026-06-24.md` |
| T4-002 | PMC BLOCKED — not dispatched | `ai/reviews/REVIEW-T4-002-PMC-BLOCKED-2026-06-24.md`；Hermes runtime secret 缺失，旧 revision idempotency key 已被错误完成 |

## Verified Baseline

- T4-002 安全复验：排除 destructive `DisposableMySQLTests` 后 29 tests passed；源码内存语法检查 passed。
- frontend：`npm run build` passed，4622 modules transformed。
- MySQL：8.0.43；`revid_db` revision `a1b2c3d4e5f6`；12 张 app table 均为 InnoDB/utf8mb4，表与字段备注完整。
- 系统 Python 缺少 `annotated_doc`；backend 验证必须使用项目 `.venv` 或先修复环境。
- 工作区存在大量未提交修改，Executor 必须先核对目标文件 diff，不得覆盖其他任务或用户工作。

## Ready / Running

- 当前无可派发或运行中的 Task。
- T4-010 — T4-006 dependency 已满足，但尚未进入 APPROVED Queue，不得执行。

## Blockers

- T4-003 继续依赖 T4-002 完成与 PMC 验收。
- T4-002 的 Coordinator `t_64d6db92` 已错误完成且未派发 Executor；相同 idempotency key 不能复用。
- 禁止在用户现有数据库执行 downgrade/drop/truncate；destructive 验证只能在专用测试库并获得明确授权。
- 用户已授权 T4-002 创建/销毁唯一专用数据库 `revid_test_t4_002`；Hermes 调度报告确认运行时缺少 `REVID_TEST_MYSQL_ADMIN_URL`，因此保持 BLOCKED。
- T4-002 当前代码仍存在 credential fallback、手写 schema、identity/cleanup gate 缺失和无效 rollback test；必须按 2026-06-24 PMC review 返工。

## Next Review Gate

- T4-002：先由 Human User / Hermes runtime owner 注入专用 secret；Hermes 记录 readiness 证据后，Codex PMC 发布全新 APPROVED Queue revision。随后严格 secret gate、structured URL、database identity、Alembic setup、可靠 cleanup、same-PK conflict、真实 partial rollback 和 12-table consistency 全部完成后复审。
- T4-006：已完成并归档。依赖 T4-006 的 Task 仅视为该 dependency 已满足；是否执行仍由后续 Queue revision 决定。
