# T4-002 PMC Unit C1 Bounded Continuation Approval

## Verdict

`PMC_CONTINUATION_APPROVED — UNIT_C1_REV17`

这不是 business REWORK，也不是 attempt 2。它是 revision `-16` runtime failure 后的更小 bounded continuation。

## Evidence and Authorization

- Human Owner 于 2026-06-27 指示 PMC 发布新的 bounded continuation revision，并要求 Coordinator dispatch 控制在 120s 内。
- Revision `-16` Coordinator `t_aeaefef4` 在 dispatch Executor 前 300s timeout，process retry `1/1` exhausted。
- Revision `-16` 没有 Executor、PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。
- 旧 idempotency key 不可复用；`t_aeaefef4` 与所有历史 card 均不得 claim、promote、unblock、retry 或复用。
- 现有 allowed business files 没有 Git diff；本 continuation 不覆盖用户工作。

## Split Decision

Unit C 按真实 MySQL 行为拆为顺序子单元：

1. Unit C1（本 revision）：fixture、structured URL、database identity、Alembic 12-table schema、cleanup preflight。
2. Unit C2（planned only）：dry-run、full migration、second-run idempotency、source immutability。
3. Unit C3（planned only）：conflict、FK orphan、partial rollback、consistency、cleanup failure visibility。

只有 Unit C1 经 Independent REVIEW 和 PMC PASS 后，PMC 才能批准 Unit C2。C2/C3 当前不可执行。

## Dispatch Body Reduction

- Queue 只指向精简文件 `ai/tasks/todo/TASK-T4-002-UNIT-C1-REV17.md`，不再把完整 T4-002 历史作为 execution body。
- Unit C1 业务文件 read-only，只运行两个现有 test selectors 和 compile/diff checks。
- Coordinator 只创建一个 Executor 和一个 Reviewer；目标 dispatch budget 为 120s。
- Executor runtime 只承担一次 fixture lifecycle，不运行完整 `TestMigrationTool`。

## Fingerprint Inheritance

Revision `-17` 继承 `TASK-T4-002.md` 与 revision `-16` Queue 中记录的全部 fingerprints，包括历史 process crash/timeout、T4-002 semantic defects、Unit A/B evidence defects、rev14 timeout，以及：

- `REV16_COORDINATOR_TIMEOUT: t_aeaefef4 timed out at 300s before Executor dispatch`
- `REV16_COORDINATOR_RETRY_EXHAUSTED: process retry 1/1 exhausted`

Revision 变化不清零这些 fingerprints。若 rev17 Coordinator 再次在 120s 内无法 dispatch，转 `INFRASTRUCTURE_BLOCKED`，不得自动发布 rev18。

## Safety and Scope

- ADR-003 仍是唯一 destructive authorization。
- 仅允许创建/删除 `revid_test_t4_002`；禁止触碰 `revid_db` 或任何其他数据库。
- 不读取 `.env`，不记录 secret，不使用 fallback credential。
- 本 revision 禁止业务代码、tests、migration 修改。
- 不修改 `HERMES-EXECUTION-STATUS.md` 或 Hermes Kanban state。

## Required Evidence

- Executor PLAN/PROGRESS/REPORT：revision `-17` / Unit C1 / attempt 1 continuation。
- Independent Reviewer fresh rerun 两个指定 MySQL tests，明确 passed、skipped、blocked 与 cleanup outcome。
- HANDOFF 状态必须为 `UNIT_C1_HANDOFF_READY_REV17`，随后停止等待 PMC。

## Human Decision

`NO`。Human Owner 已给出 continuation 方向；本次拆分不改变产品、schema contract 或 ADR-003 授权边界。
