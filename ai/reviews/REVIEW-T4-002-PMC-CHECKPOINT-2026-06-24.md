# T4-002 PMC Checkpoint Review — Executor Running

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Queue revision：`phase4-wave2-manual-rework-2026-06-24-05`
- Coordinator：`t_f53b3c08`（done）
- Executor：`t_68c68e4e`（attempt 0，running）
- Review time：2026-06-24 14:05 +08:00

## Verified Evidence

1. Hermes 已基于 revision `phase4-wave2-manual-rework-2026-06-24-05` 创建全新 Coordinator 与 Executor chain；未复用旧 blocked cards。
2. Executor run `#72` 自 13:34 启动并持续产生 heartbeat，但于 14:04 因 `pid not alive` crash；Hermes 随即按 card retry policy 启动 run `#73`，14:05 已有新 heartbeat。当前 card 仍为 running，尚未形成 repeated-failure diagnostic。
3. 本 revision 已生成 PLAN 与 PROGRESS，但尚无 REPORT、Independent REVIEW 或 HANDOFF，因此当前不能进入 PMC acceptance。
4. 当前业务 diff 仍处于实现中。`backend/scripts/migrate_sqlite_to_mysql.py` 已开始移除 credential fallback；`backend/tests/test_migration_tool.py` 在本 checkpoint 仍保留旧 handwritten DDL、credential fallback、silent cleanup 和无效 rollback test，不能作为完成证据。
5. PLAN 中“secret 缺失时 tests skip gracefully”的描述与 Queue/ADR-003 冲突。最终实现与证据必须改为明确 BLOCKED/失败，不得 skip。

## PMC Recommendation

**DISPATCH 已完成，继续当前 attempt；禁止重复派发。**

- Active Queue revision 保持不变，不创建新的 Coordinator/Executor chain。
- Executor 必须完成全部 Hard Gates 后再生成本 revision 的 REPORT。
- Independent Reviewer 必须核对真实 conflict、partial rollback、Alembic schema ownership、database identity 与 cleanup failure semantics。
- 在 REPORT、Independent REVIEW 与 HANDOFF 齐全前，T4-002 不得标为 PASS/done，T4-003 继续 blocked。

## Stop Conditions

- secret 缺失、权限不足或 database identity 无法证明；
- credential fallback、handwritten schema 或 silent cleanup 仍存在于完成版本；
- rollback/conflict 测试未制造真实失败；
- 重复旧 failure fingerprint；
- 当前 retry run `#73` 再次 crash 或 card 形成 repeated-failure diagnostic；
- Scope Drift 或未知归属目标文件修改。
