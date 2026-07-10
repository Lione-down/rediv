# Task: MySQL runtime 切换与 Navicat 验收

## Task ID
T4-003

## Phase
Phase 4A — MySQL 主数据库

## Category
Backend / Integration

## Priority
P0

## Assigned To
Backend Executor

## Objective
让 FastAPI 在 `REVID_USE_SQLITE=false` 时使用 MySQL `DatabaseStore` 正常启动、读写和重启恢复，并完成 Navicat 验收。

## Chosen Technology
FastAPI lifespan/startup + SQLAlchemy engine/session + existing `DatabaseStore`。

## Scope
- 允许修改：`backend/main.py`、`backend/database.py`、`backend/models/base.py`、`backend/controllers/store.py` 中仅与 engine/session 适配直接相关的代码、`backend/api/health.py`、配置说明和专项测试。
- 禁止修改：前端、Auth 产品逻辑、Canvas 交互、原始 SQLite 数据。

## Dependencies
T4-002 已审查通过且迁移一致性报告通过。

## Implementation Requirements
1. 修复 false 分支使用 `InMemoryStore` 的错误；MySQL 和 SQLite 都使用 `DatabaseStore`。
2. startup 只检查 schema revision，不用 `create_all()` 静默修改生产 schema。
3. 增加数据库 health 结果：dialect、连接状态、Alembic revision；不得返回 host password 或完整 URL。
4. MySQL integration tests 使用独立测试数据库或 transaction rollback，不污染用户正式数据。
5. 保持 `REVID_USE_SQLITE=true` 的现有测试路径。
6. 更新 README：启动、Alembic、迁移、切换和回滚命令。

## Acceptance Criteria
- [ ] MySQL 模式服务启动成功，`/health` 显示数据库 ready。
- [ ] API 创建用户/项目/节点/资产后可在 Navicat 查看。
- [ ] 重启 backend 后上述数据仍可通过 API 读取。
- [ ] SQLite 全量 tests 和 MySQL integration tests 均通过。
- [ ] 改回 `REVID_USE_SQLITE=true` 可回滚运行。
- [ ] MySQL 连接失败时启动错误包含可操作信息且不回退到内存存储。

## Verification Commands
```powershell
cd backend
python -m unittest discover -s tests -p "test_*.py"
$env:REVID_USE_SQLITE='false'
python -c "import main"
```

## Manual Acceptance
在 Navicat 中新增/刷新/重启验证数据；报告记录数据库名、revision、表数和测试记录 ID，不记录密码。

## Deliverables
- Runtime 适配、health、tests、README。
- `ai/tasks/doing/TASK-T4-003-PLAN.md`
- `ai/tasks/doing/TASK-T4-003-PROGRESS.md`
- `ai/reports/REPORT-T4-003.md`

## Codex Prompt
只完成 MySQL runtime cutover 和验证。任何 schema 差异必须新增 Alembic revision，不得在 startup 中 create_all 修补。编码前维护 PLAN/PROGRESS，完成 Navicat 和重启持久化验收后写 REPORT。

## PMC Revision 47 Execution Contract

Queue revision: `phase4-wave2-t4-003-mysql-runtime-cutover-2026-07-09-47`

Allowed files:
- `backend/main.py`
- `backend/database.py`
- `backend/models/base.py`
- `backend/controllers/store.py`
- `backend/api/health.py`
- `backend/README.md`
- `backend/.env.example`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_health.py`
- `ai/tasks/doing/TASK-T4-003-PLAN.md`
- `ai/tasks/doing/TASK-T4-003-PROGRESS.md`
- `ai/reports/REPORT-T4-003.md`
- `backend/migrations/versions/*t4_003*.py` only if a real schema revision gap is discovered and the migration includes required table and field comments.

Hard gates:
- Do not read, print, copy, or infer secrets. Do not read `.env` or `.env.*`.
- Runtime credentials must come from environment variables already available to the process.
- MySQL runtime validation may create non-destructive test records through the public API/store path and must report record IDs; it must not run `DROP`, `TRUNCATE`, `DELETE`, downgrade, reset, or destructive cleanup against `revid_db`.
- Disposable integration tests may use only a clearly named test database such as `revid_test_t4_003`; if the required test credential is missing, insufficient, or the target database name cannot be proven, return BLOCKED instead of falling back to `.env` or `revid_db`.
- Startup must not call `create_all()` in MySQL runtime mode; schema readiness must be checked through Alembic/current revision evidence.
- Health output must never expose password, full URL, token, or host credential material.
- Keep `REVID_USE_SQLITE=true` behavior and existing tests intact.

Stop condition: write `REPORT-T4-003.md` and stop at `T4_003_MYSQL_RUNTIME_REPORT_READY_REV47`. Independent Review and HANDOFF are not authorized in this revision.

## PMC Revision 47r1 Remediation Contract

Queue revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`

PMC verdict source: `ai/reviews/REVIEW-T4-003-PMC-REV47-REWORK-AND-REV47R1-AUTHORIZATION-2026-07-09.md`

Previous failure fingerprint: `REV47_MYSQL_ENGINE_REFERENCE_AND_ACCEPTANCE_GATES_FAILED`

Allowed files:
- `backend/main.py`
- `backend/database.py`
- `backend/models/base.py`
- `backend/controllers/store.py`
- `backend/api/health.py`
- `backend/README.md`
- `backend/.env.example`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_health.py`
- `ai/tasks/doing/TASK-T4-003-REV47R1-PLAN.md`
- `ai/tasks/doing/TASK-T4-003-REV47R1-PROGRESS.md`
- `ai/reports/REPORT-T4-003-REV47R1.md`
- `backend/migrations/versions/*t4_003*.py` only if a real schema revision gap is discovered and the migration includes required table and field comments.

Required remediation:
- Fix the stale `_engine` reference in `backend/database.py`; `check_alembic_revision()` must inspect the current engine from `models.base` after `init_mysql_engine()` has run.
- Add or update tests so the rev47 bug is covered. A test must fail on the rev47 implementation where `init_mysql_engine()` sets `models.base._engine` but `check_alembic_revision()` still sees `None`.
- Preserve SQLite behavior and keep MySQL startup free of `create_all()`.
- Validate health output remains free of password, full URL, token, host credential material, or secret-derived values.
- Complete real MySQL runtime verification only when safe environment variables are already available to the process. Do not read `.env` or `.env.*`.
- If real MySQL/Navicat/restart persistence evidence is unavailable, write `ai/reports/REPORT-T4-003-REV47R1.md` with `BLOCKED`, exact missing capability, and all passing/failing checks. Do not mark pending acceptance criteria as passed.

Required verification:
```powershell
cd backend
..\.venv\Scripts\python.exe -m unittest tests.test_mysql_runtime_cutover tests.test_health
..\.venv\Scripts\python.exe -m compileall main.py database.py api\health.py tests\test_mysql_runtime_cutover.py tests\test_health.py
$env:REVID_USE_SQLITE='false'
..\.venv\Scripts\python.exe -c "import main"
```

If safe MySQL credentials for a clearly non-production target such as `revid_test_t4_003` are available, also verify API/store-path create/read/restart persistence and record non-secret database name, Alembic revision, table count and test record IDs for Navicat inspection.

Hard gates:
- Do not read, print, copy, or infer secrets. Do not read `.env` or `.env.*`.
- Runtime credentials must come only from environment variables already available to the process.
- Do not run `DROP`, `TRUNCATE`, `DELETE`, downgrade, reset, or destructive cleanup against `revid_db`.
- Startup must not call `create_all()` in MySQL runtime mode.
- Reviewer and HANDOFF are not authorized in rev47r1.

Stop condition: write `REPORT-T4-003-REV47R1.md` and stop at `T4_003_MYSQL_RUNTIME_REMEDIATION_REPORT_READY_REV47R1`.

## PMC Revision 47r1 Runtime Advisory

PMC verdict: `PMC_BLOCKED - RUNTIME_OWNER_DIAGNOSTIC_REQUIRED`

Formal advisory: `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R1-2026-07-09.md`

Failure fingerprint: `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`

Executor `t_dfaef3d8` run `#209` blocked after `1153s` with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` before writing `ai/reports/REPORT-T4-003-REV47R1.md`. The rev47r1 Queue is now terminal/non-executable. Hermes runtime owner must ACK the terminal verdict and return fresh diagnostics for the same revision/fingerprint before PMC considers any continuation.

No redispatch, retry, Reviewer/HANDOFF, T4-004/T4-005, frontend/auth/Canvas work, destructive `revid_db` operation, `.env` read, secret output, business-code action or PMC PASS is authorized by this advisory.

## PMC Revision 47r1 Runtime Diagnostic Review

PMC verdict: `PMC_BLOCKED - RUNTIME_REMEDIATION_REQUIRED`

Diagnostic reviewed: `ai/reports/DIAGNOSTIC-T4-003-REV47R1-EXECUTOR-WORKER-EXIT-2026-07-09.md`

Diagnostic SHA256: `C0A5744B17F43FE502DE3C3CCB683EC049F8CE0DB1E2D8B4184104917EFCFC1F`

Formal PMC review: `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R1-2026-07-09.md`

PMC review SHA256: `0DBD1FFA6E9A13A6EAE7BE9ED147817FA0CE4E773915B9B95DECE23C77305F1D`

The diagnostic verdict is `STILL_INFRA_BLOCKED`. It confirms Coordinator `t_50707802` completed atomic dispatch and Executor `t_dfaef3d8` blocked after `1153s`, but it lacks stdout/stderr tail, worker stack, session transcript/log file, exact process exit code and finalization trace. `ai/reports/REPORT-T4-003-REV47R1.md` remains missing and PROGRESS is partial.

No continuation, redispatch, retry, Reviewer/HANDOFF, T4-004/T4-005, frontend/auth/Canvas work, destructive `revid_db` operation, `.env` read, secret output, business-code action or PMC PASS is authorized until Hermes returns fresh runtime evidence with `READY_FOR_CONTINUATION` or a new explicit terminal diagnostic outcome.

## PMC Revision 47r1 Fresh Runtime Diagnostic Review

PMC verdict: `PMC_BLOCKED - RUNTIME_FINALIZATION_REMEDIATION_REQUIRED`

Fresh diagnostic reviewed: `ai/reports/DIAGNOSTIC-T4-003-REV47R1-EXECUTOR-WORKER-EXIT-FRESH-EVIDENCE-2026-07-09.md`

Fresh diagnostic SHA256: `F3A47D7AB7B8EB1F36F9DED1399E019BB9F5BF72EDFAC8E0559165BFE2189142`

Formal PMC review: `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-FRESH-REV47R1-2026-07-09.md`

PMC review SHA256: `30A08D29EBA41882717F158FAB1C6B8794F85A6D1179709F634B226D4A79BB23`

The fresh diagnostic verdict is still `STILL_INFRA_BLOCKED`. It corrects the actual Executor session to `20260709_220509_df101b` and identifies `fallback_prior_turn_content` after empty follow-up, but it still does not prove deterministic terminal finalization or complete output capture. `ai/reports/REPORT-T4-003-REV47R1.md` remains missing.

No continuation, redispatch, retry, Reviewer/HANDOFF, T4-004/T4-005, frontend/auth/Canvas work, destructive `revid_db` operation, `.env` read, secret output, business-code action or PMC PASS is authorized until Hermes runtime owner returns fresh evidence that finalization/output capture can produce deterministic terminal evidence.

## PMC Revision 47r2 Continuation Contract

Queue revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2`

PMC authorization source: `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-FINALIZATION-REMEDIATION-REV47R1-2026-07-09.md`

Runtime remediation diagnostic: `ai/reports/DIAGNOSTIC-T4-003-REV47R1-FINALIZATION-REMEDIATION-2026-07-09.md`

Inherited failure fingerprints:

- `REV47_MYSQL_ENGINE_REFERENCE_AND_ACCEPTANCE_GATES_FAILED`
- `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`

Status: approved fresh continuation after Hermes finalization/output-capture remediation. Rev47r1 cards `t_50707802` and `t_dfaef3d8` remain terminal evidence and must not be reused.

Allowed files:

- `backend/main.py`
- `backend/database.py`
- `backend/models/base.py`
- `backend/controllers/store.py`
- `backend/api/health.py`
- `backend/README.md`
- `backend/.env.example`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_health.py`
- `ai/tasks/doing/TASK-T4-003-REV47R2-PLAN.md`
- `ai/tasks/doing/TASK-T4-003-REV47R2-PROGRESS.md`
- `ai/reports/REPORT-T4-003-REV47R2.md`
- `backend/migrations/versions/*t4_003*.py` only if a real schema revision gap is discovered and the migration includes required table and field comments.

Required remediation:

- Resume from the existing rev47/rev47r1 implementation state; do not restart from scratch or revert unrelated user changes.
- Fix the stale `_engine` reference in `backend/database.py`; `check_alembic_revision()` must inspect the current engine from `models.base` after `init_mysql_engine()` has run.
- Add or update tests so the rev47 bug is covered. A test must fail on the rev47 implementation where `init_mysql_engine()` sets `models.base._engine` but `check_alembic_revision()` still sees `None`.
- Preserve SQLite behavior and keep MySQL startup free of `create_all()`.
- Validate health output remains free of password, full URL, token, host credential material, or secret-derived values.
- Complete real MySQL runtime verification only when safe environment variables are already available to the process. Do not read `.env` or `.env.*`.
- If real MySQL/Navicat/restart persistence evidence is unavailable, write `ai/reports/REPORT-T4-003-REV47R2.md` with `BLOCKED`, exact missing capability, and all passing/failing checks. Do not mark pending acceptance criteria as passed.

Required verification:

```powershell
cd backend
..\.venv\Scripts\python.exe -m unittest tests.test_mysql_runtime_cutover tests.test_health
..\.venv\Scripts\python.exe -m compileall main.py database.py api\health.py tests\test_mysql_runtime_cutover.py tests\test_health.py
$env:REVID_USE_SQLITE='false'
..\.venv\Scripts\python.exe -c "import main"
```

If safe MySQL credentials for a clearly non-production target such as `revid_test_t4_003` are available, also verify API/store-path create/read/restart persistence and record non-secret database name, Alembic revision, table count and test record IDs for Navicat inspection.

Hard gates:

- Do not read, print, copy, or infer secrets. Do not read `.env` or `.env.*`.
- Runtime credentials must come only from environment variables already available to the process.
- Do not run `DROP`, `TRUNCATE`, `DELETE`, downgrade, reset, or destructive cleanup against `revid_db`.
- Startup must not call `create_all()` in MySQL runtime mode.
- Reviewer and HANDOFF are not authorized in rev47r2.

Stop condition: write `REPORT-T4-003-REV47R2.md` and stop at `T4_003_MYSQL_RUNTIME_REMEDIATION_REPORT_READY_REV47R2`.

## PMC Revision 47r2 Runtime Advisory

PMC verdict: `PMC_BLOCKED - RUNTIME_OWNER_DIAGNOSTIC_REQUIRED`

Formal advisory: `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R2-2026-07-10.md`

PMC advisory SHA256: `C21260B304C1DB12BCE3B44C2601992D5E4DA4B6B6E58B6BA9229918FBD27E30`

Failure fingerprint: `REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED`

Hermes ACKed rev47r2 and created Coordinator `t_41e1a294`; the Coordinator completed run `#210` and created Executor child `t_4a0c6348`. Executor run `#211` blocked after `13s` with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` before writing `ai/reports/REPORT-T4-003-REV47R2.md`.

Scheduled evidence says the persisted Executor card body contained standalone `Action: IMPLEMENT_AND_TEST_ONLY`, but the `revid-backend` SOUL did not receive or detect that action marker before fail-closed blocking. This is a Hermes runtime/action-injection incident, not business REWORK.

Rev47r2 is terminal/non-executable from the PMC side. Hermes runtime owner must ACK the terminal verdict and return fresh diagnostics for the same revision/fingerprint before PMC considers any continuation.

Expected diagnostic path: `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-2026-07-10.md`

No redispatch, retry, claim, promote, unblock, reparent, card reuse, Reviewer/HANDOFF, T4-004/T4-005, frontend/auth/Canvas work, destructive `revid_db` operation, `.env` read, secret output, business-code action or PMC PASS is authorized by this advisory.

## PMC Revision 47r2 Runtime Diagnostic Review

PMC verdict: `PMC_BLOCKED - RUNTIME_ACTION_INJECTION_REMEDIATION_REQUIRED`

Runtime diagnostic reviewed: `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-2026-07-10.md`

Runtime diagnostic SHA256: `B54D120B5680083CE1797290FA0ECF4E20669870BEBA80C5795C52E38DD83271`

Formal PMC review: `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R2-2026-07-10.md`

PMC review SHA256: `D8B5034156A8F0CBE2C2C4884D630EEDEDA33F652ED5A2EED896DC0F2DA70A6F`

The diagnostic verdict is `STILL_INFRA_BLOCKED`. It proves the persisted Executor card body had standalone `Action: IMPLEMENT_AND_TEST_ONLY`, but the worker-visible initial instruction was only `work kanban task t_4a0c6348`. The `revid-backend` SOUL correctly failed closed before Task read, PLAN/PROGRESS/REPORT creation, business code changes, database action, `.env` reads or secret output.

No continuation, redispatch, retry, Reviewer/HANDOFF, T4-004/T4-005, frontend/auth/Canvas work, destructive `revid_db` operation, `.env` read, secret output, business-code action or PMC PASS is authorized until Hermes runtime owner returns fresh remediation evidence proving worker-visible Action injection for the Executor path.

Expected fresh diagnostic path: `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-REMEDIATION-2026-07-10.md`
