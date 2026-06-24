# T4-002 PMC Review — Recovery Dispatch

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Previous governance revision：`phase4-wave2-executor-blocked-2026-06-24-06`
- Recovery revision：`phase4-wave2-recovery-dispatch-2026-06-24-07`
- Previous Executor：`t_68c68e4e`（blocked / gave_up，不得复用）
- Decision time：2026-06-24

## Verified Facts

1. revision `-05` 的 Executor run `#72`、`#73` 因 `pid not alive` crash，未生成本 attempt 的 REPORT、Independent REVIEW 或 HANDOFF。
2. Hermes 最新调度状态报告显示 Gateway 为 UP、当前无 active worker，Queue `-06` 是唯一阻止新派发的直接原因。
3. 现有 substantial partial diff 位于 T4-002 allowed files，必须保留并由新 Executor 先审计，不能当作完成证据或直接覆盖。
4. 已知未完成项仍是：missing secret 被 skip、cleanup exception swallowing、same-PK conflict 被覆盖、partial rollback 未制造真实失败。
5. Human User 明确要求 PMC 作出推进决策，不能继续在 Codex PMC 与 Hermes 之间循环等待。

## PMC Decision

**DISPATCH — RECOVERY ATTEMPT AUTHORIZED**

- 发布全新 APPROVED revision `phase4-wave2-recovery-dispatch-2026-06-24-07`。
- 本次授权基于 Gateway UP、无 active worker 和 Human User 的明确推进指令。PMC 接受一次 recovery dispatch 的 infrastructure 风险，撤销“派发前必须另行证明 worker stability”的等待条件。
- Hermes 必须为 revision `-07` 创建全新的 Coordinator、Executor 与 revision-based idempotency key；不得复用或恢复旧 card。
- 若新 chain 再次发生两次相同 infrastructure crash，则记录 BLOCKED；但不得以旧 `-05` crash 直接拒绝本次新授权。

## Recovery Execution Requirements

1. 新 Executor 开始后先审计 `backend/scripts/migrate_sqlite_to_mysql.py` 与 `backend/tests/test_migration_tool.py` 的现有 diff，保留可证明正确的部分，禁止整文件无依据重写。
2. 使用 revision-specific PLAN/PROGRESS，先记录 diff ownership、当前四个 Hard Gate 缺口和执行顺序，再修改代码。
3. 按短 checkpoint 推进：
   - checkpoint A：修复 missing-secret failure 与 cleanup 可见性；
   - checkpoint B：修复 same-PK conflict 与真实 partial rollback；
   - checkpoint C：完成 Alembic/identity/12-table integration verification；
   - checkpoint D：生成当前 revision 的新 REPORT。
4. 每个 checkpoint 完成后立即更新 PROGRESS；不得等全部测试结束后才首次落盘证据。
5. secret、权限或 database identity 任一 Hard Gate 失败时，立即生成明确 BLOCKED 证据；禁止 fallback、skip 或写入 `revid_db`。
6. Independent Reviewer 只能审查 revision `-07` 的新 REPORT 和实际 diff；旧 PASS 不得复用。Reviewer PASS 后仍需 Codex PMC 最终验收。

## Scope

- Allowed：`backend/scripts/migrate_sqlite_to_mysql.py`、`backend/tests/test_migration_tool.py`、revision `-07` 对应 PLAN/PROGRESS/REPORT。
- Forbidden：前端、业务 API、原始 `revid.db`、用户数据库 `revid_db`、credentials、旧 Hermes 证据文件。
- Non-goal：T4-003、T4-010 或其他 Phase 4 Task。

## Recommendation

`DISPATCH`
