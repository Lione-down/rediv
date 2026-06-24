# Revid — 当前项目状态

> 更新时间：2026-06-24
> 状态来源：Codex PMC 自动治理、Hermes scheduled reports 与 fresh source/diff audit

## Current Phase

`Phase 4 - Personal Integration Edition（执行中）`

## Current Task

- `T4-002`：Executor attempt 0 dispatched — Queue revision `phase4-wave2-recovery-dispatch-2026-06-24-07`。Coordinator `t_e23d9043` → Executor `t_748c116d` (attempt 0)。

## Latest PMC Verdicts

| Task | Verdict | Evidence |
|---|---|---|
| T4-001 | PASS，进入 done | MySQL 8.0.43；Alembic head；12/12 InnoDB + utf8mb4；12/12 table comments；90/90 column comments；97 tests |
| T4-006 | PMC PASS，进入 done | `ai/reviews/REVIEW-T4-006-PMC-2026-06-24.md` |
| T4-002 | PMC REDISPATCH — Human approved | `ai/reviews/REVIEW-T4-002-PMC-REDISPATCH-2026-06-24.md`；Queue revision `phase4-wave2-manual-rework-2026-06-24-05` |
| T4-002 | PMC CHECKPOINT — Executor running，尚不可验收 | `ai/reviews/REVIEW-T4-002-PMC-CHECKPOINT-2026-06-24.md`；Executor `t_68c68e4e` |
| T4-002 | PMC BLOCKED — Executor retries exhausted，partial implementation unverified | `ai/reviews/REVIEW-T4-002-PMC-EXECUTOR-BLOCKED-2026-06-24.md` |
| T4-002 | PMC RECOVERY DISPATCH — 新 revision 已批准 | `ai/reviews/REVIEW-T4-002-PMC-RECOVERY-DISPATCH-2026-06-24.md`；Queue revision `phase4-wave2-recovery-dispatch-2026-06-24-07` |

## Verified Baseline

- T4-002 安全复验：排除 destructive `DisposableMySQLTests` 后 29 tests passed；源码内存语法检查 passed。
- frontend：`npm run build` passed，4622 modules transformed。
- MySQL：8.0.43；`revid_db` revision `a1b2c3d4e5f6`；12 张 app table 均为 InnoDB/utf8mb4，表与字段备注完整。
- 系统 Python 缺少 `annotated_doc`；backend 验证必须使用项目 `.venv` 或先修复环境。
- 工作区存在大量未提交修改，Executor 必须先核对目标文件 diff，不得覆盖其他任务或用户工作。

## Ready / Running

- T4-002 已获准 recovery dispatch；Hermes 下一轮应基于 revision `-07` 创建全新 Coordinator 与 Executor。
- T4-010 — T4-006 dependency 已满足，但尚未进入 APPROVED Queue，不得执行。

## Blockers

- T4-003 继续依赖 T4-002 完成与 PMC 验收。
- T4-002 旧 Executor `t_68c68e4e` 的 run `#72`、`#73` 均因 `pid not alive` crash，旧 chain 已作废且禁止复用；该历史不再阻止 revision `-07` 创建新 chain。
- 当前 revision 只有 PLAN 和未完成 PROGRESS，没有 REPORT、Independent REVIEW 或 HANDOFF；allowed files 中的 substantial partial diff 未经归属与完成度证明。
- 旧 Coordinator `t_d626b42d` 与 Executor child `t_4a89bb5e` 已作废；禁止手工恢复、claim、promote、unblock 或复用。
- PMC 已基于 Gateway UP、无 active worker 与 Human User 明确推进指令接受一次 recovery dispatch 风险；不再等待额外 worker stability 证明。
- 禁止在用户现有数据库执行 downgrade/drop/truncate；destructive 验证只能在专用测试库并获得明确授权。
- T4-002 partial implementation 仍存在 test secret skip、cleanup exception swallowing、same-PK 覆盖成功断言和无真实失败的 rollback test；必须按最新 PMC BLOCKED review 继续返工。

## Next Review Gate

- T4-002：Executor `t_748c116d` (attempt 0) 已派发，正在执行四个 checkpoint。完成后生成 revision `-07` 新 REPORT，进入 Independent Review。
- T4-006：已完成并归档。依赖 T4-006 的 Task 仅视为该 dependency 已满足；是否执行仍由后续 Queue revision 决定。
