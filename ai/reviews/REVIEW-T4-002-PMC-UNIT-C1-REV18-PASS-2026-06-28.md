# T4-002 PMC Unit C1 Rev18 Final Acceptance

## Verdict

`PMC_PASS`

## Scope

- Task: `T4-002`
- Unit: `C1` — disposable MySQL fixture identity and Alembic schema preflight
- Business revision: `phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18`
- Lifecycle continuation: `phase4-wave2-unit-c1-rev18-review-dispatch-2026-06-28-18r1`
- Attempt: `1 continuation`

## Evidence Read

- Task: `ai/tasks/todo/TASK-T4-002-UNIT-C1-REV18.md`
- ADR: `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`
- PLAN: `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV18-PLAN.md`
- PROGRESS: `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV18-PROGRESS.md`
- REPORT: `ai/reports/REPORT-T4-002-UNIT-C1-REV18.md`
- Independent REVIEW: `ai/reviews/REVIEW-T4-002-UNIT-C1-REV18.md`
- Canonical HANDOFF: `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18-POST-REVIEW.md`
- Hermes status and direct read-only Kanban `show` results for `t_3bfbe611`, `t_b3cfb6ce`, `t_bd6172b7`, `t_8f3b60ff`, `t_b918a49e`

## Authorization and Lifecycle

- Business Coordinator `t_3bfbe611` completed `DISPATCH_ONLY` and created exactly one Executor child `t_b3cfb6ce`.
- Executor `t_b3cfb6ce` is terminal `blocked/review-required`; its run `#109` reports 2/2 tests passed in 1.41s.
- Review-dispatch Coordinator `t_bd6172b7` completed and created Reviewer `t_8f3b60ff` plus dependent HANDOFF stage `t_b918a49e`.
- Reviewer `t_8f3b60ff` completed with `PASS` after an independent real-MySQL rerun: 2/2 passed in 1.16s.
- HANDOFF stage `t_b918a49e` completed only after Reviewer PASS and wrote the canonical post-review HANDOFF.
- `HERMES-EXECUTION-STATUS.md` 的 superseded-chain 表将 Executor 写为 `done`，与实际 card 的 `blocked/review-required` 不一致；直接 Kanban 证据和该文件其他字段均证明真实终态为 review-required。该表格误写不改变业务验收结果，后续由 Hermes owner 自行纠正，PMC 不修改其文件。

## Fresh PMC Read-only Verification

- 两个 Python source 文件使用内存 `compile()`：PASS。
- `git diff --check`：PASS。
- `git diff -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py`：empty。
- Source audit 证明 `TEST_DB_NAME = revid_test_t4_002`、`TABLE_ORDER` 为 12 表、URL 使用 SQLAlchemy structured API、`SELECT DATABASE()` identity gate、Alembic `upgrade head` 与 cleanup failure re-raise 均存在。
- REPORT/REVIEW/HANDOFF credential-value pattern scan：无 URL、password、token 或 secret 值泄露。
- PMC runtime 未注入 `REVID_TEST_MYSQL_ADMIN_URL`，因此没有重复执行会 CREATE/DROP test database 的 destructive tests；采用 Executor 与 Independent Reviewer 两次已授权真实运行作为行为证据。

## Acceptance Criteria Mapping

- `test_ac8_structured_url_and_identity`：Executor 与 Reviewer 均实际执行并通过；无 mock 或 skip。
- `test_ac9_alembic_creates_schema`：Executor 与 Reviewer均实际执行并通过；验证 12 张 application tables。
- database identity 与 cleanup：REPORT、Independent REVIEW、HANDOFF 和 source semantics 一致。
- Scope：allowed business file diff 为空；没有 migration、test 或业务代码修改。
- Safety：仅使用 ADR-003 的 disposable database；未发现用户数据库写入或 secret 泄露证据。

## Scope Exception Recorded

Executor 曾提前创建 `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18.md`，超出 Executor Allowed Files，且发生在 Independent Review 前。该文件已被 revision `-18r1` 明确隔离为 non-canonical historical evidence；最终验收只使用 post-review HANDOFF。该事件不影响业务文件或数据库边界，但不得在后续 Unit 重复。

## Decision

Unit C1 revision `-18` 满足本 bounded unit 的全部验收标准，最终通过。

下一步仅批准 Unit C2：dry-run、full migration、second-run idempotency、source immutability。Unit C3 与 Unit D/E 仍不可执行。

