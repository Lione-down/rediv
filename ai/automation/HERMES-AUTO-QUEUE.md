# Hermes Automatic Queue

该文件是 Hermes scheduled mode 的任务授权白名单。只有 Human User 或 Codex Project Master Controller 明确批准的波次才能写为 `APPROVED`。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-recovery-dispatch-2026-06-24-07` |
| Status | `APPROVED` |
| Approved By | `Codex Project Master Controller` |
| Execution Mode | `scheduled` |
| Stop After | `T4-002 review handoff` |

## Tasks

| Task ID | Project Task File | Executor Profile | Parallel Group | Review Profile | Action |
|---|---|---|---|---|---|
| T4-002 | `ai/tasks/todo/TASK-T4-002.md` | `revid-backend` | `serial-t4-002-recovery-07` | `revid-reviewer` | RECOVERY DISPATCH：创建全新 chain，审计 partial diff，按 checkpoint 完成返工与验证 |

## Recovery Dispatch Decision

- Human User 明确要求 PMC 作出推进决策，避免 Codex PMC 与 Hermes 循环等待。
- Hermes 最新状态证明 Gateway UP 且无 active worker；PMC 接受一次 recovery dispatch 的 infrastructure 风险，不再要求派发前额外证明 worker stability。
- 正式决策见 `ai/reviews/REVIEW-T4-002-PMC-RECOVERY-DISPATCH-2026-06-24.md`。
- revision `-07` 必须创建全新的 Coordinator、Executor、PLAN、PROGRESS、REPORT、REVIEW、HANDOFF 和 revision-based idempotency key。
- 禁止复用 revision `-05`、`t_f53b3c08`、`t_68c68e4e` 或任何更早 card/evidence chain。

## Manual Rework Authorization

- Human User 对 T4-002 manual REWORK 的产品方向与 destructive boundary 仍有效；revision `-05` 已进入 Executor attempt，但因两次 infrastructure crash 未完成。
- 旧 revision、旧 card、旧 REPORT、旧 REVIEW 和旧 HANDOFF 不得作为本轮完成证据。
- 本文件已发布新的 APPROVED revision；Hermes 下一轮应创建全新执行链，不得继续返回 IDLE。
- 本 recovery revision 内允许基础设施自动 retry 一次；若新 chain 连续两次出现相同 `pid not alive`，则记录 BLOCKED，不得无限重试。
- 禁止手工 claim、promote、unblock 或复用 `t_d626b42d`、`t_4a89bb5e`、`t_f53b3c08`、`t_68c68e4e`。

## Recovery Checkpoints

- Executor 必须先审计并保留两个 allowed files 的现有 partial diff，不得无依据整文件覆盖。
- 使用 revision `-07` 专属 PLAN/PROGRESS；每完成一个 bounded checkpoint 立即落盘，不等待全部测试结束。
- checkpoint A：missing-secret failure 与 cleanup 可见性。
- checkpoint B：same-PK conflict 与真实 partial rollback。
- checkpoint C：Alembic、database identity 与 12-table integration verification。
- checkpoint D：生成 revision `-07` 的新 REPORT，随后进入 Independent Review。

## T4-002 Safety Gates

- Human User 与 Codex PMC 已明确授权创建和销毁唯一专用数据库 `revid_test_t4_002`；完整边界见 `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`。
- Hermes runtime 必须通过 secret/environment 注入 `REVID_TEST_MYSQL_ADMIN_URL`；Worker 不读取项目 `.env`，不得在卡片或报告中记录 secret。
- 测试代码只允许读取 `REVID_TEST_MYSQL_ADMIN_URL`；禁止回退 `REVID_MYSQL_URL`、`REVID_DB_*`、`MYSQL_ROOT_PASSWORD`、硬编码密码或其他 database。
- 允许 `CREATE DATABASE` / `DROP DATABASE` 的对象仅限精确名称 `revid_test_t4_002`。执行前必须读取 metadata 并断言目标名；禁止 wildcard、前缀匹配或 fallback database。
- target URL 必须使用 SQLAlchemy structured URL API 构造，禁止 regex 或字符串替换 credentials/database path。
- test schema 必须通过 Alembic `upgrade head` 创建，禁止 fixture 手写 12-table DDL。
- cleanup 失败必须形成失败或 BLOCKED 证据，不得静默吞异常。
- CLI 默认 dry-run，只有显式 `--execute` 才允许写入 MySQL。
- 禁止删除、覆盖或修改原始 `revid.db`；禁止 drop、truncate、reset 或清库。
- 在用户现有 MySQL 数据上执行写迁移前，必须先报告 dry-run 摘要；自动测试应使用隔离数据源/目标。
- 不得打印、复制或写入 credentials、完整 connection URL、token、raw profile。
- 迁移必须幂等；row count、主键、外键、关键 JSON 与 quota 校验失败时返回非零 exit code。
- integration tests 禁止硬编码绝对路径；必须使用专用 disposable MySQL test database，不得写用户现有 `revid_db`。
- 覆盖 execute、second-run、same-PK conflict、FK orphan、partial rollback、12-table consistency；missing-source test 不得因缺密码而 skip。
- rollback test 必须实际制造 batch 中途失败并验证未发生部分提交；test name 或成功路径不能代替 rollback 证据。
- 若 secret 缺失、权限不足或 database identity 无法证明，标记 BLOCKED；禁止回退到 `.env` 或 `revid_db`。

## Shared Authorization Rules

- 当前 APPROVED revision 只包含 T4-002，database migration 和 destructive verification 必须串行。
- 发现目标文件存在未知归属 diff 时标记 BLOCKED；无关用户文件只记录风险，不扩大 scope。
- 使用 queue revision + Task ID 作为 idempotency key，不重复创建 running/review card。
- 历史 scheduled 卡 `t_ae07d489` 已过时，应标记 cancelled/obsolete，不得复用。
- Reviewer PASS 后等待 Codex PMC 最终验收，不自动流转到 done，不自动启动 T4-003/T4-010。
- 需要 scope 变更、secret、destructive operation、外部服务或用户决策时停止并记录。

## Future Completion Gate

- T4-002 具备后续新 APPROVED revision 的最新 PLAN、PROGRESS、REPORT。
- 新 REPORT 必须使用新文件并明确 revision、attempt 与 failure fingerprint；不得覆盖现有旧 revision REPORT。
- T4-002 具有该 revision 的独立 Reviewer 结论；REWORK 必须完成后再复审。
- 测试、安全门、未验证项、风险和 rollback 行为证据已记录。
- 无 secret 泄露、越权修改或未确认的不可逆操作。

完成后生成新的 PMC handoff 并停止，不自动领取后续任务。

*最后更新：2026-06-24，recovery dispatch revision -07*
