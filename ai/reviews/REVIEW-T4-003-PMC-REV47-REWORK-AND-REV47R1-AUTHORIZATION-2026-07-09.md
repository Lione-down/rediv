# REVIEW-T4-003-PMC-REV47-REWORK-AND-REV47R1-AUTHORIZATION-2026-07-09

## Verdict

`PMC_REWORK - REV47_MYSQL_ENGINE_REFERENCE_AND_ACCEPTANCE_GATES_FAILED`

Fresh remediation revision authorized:

`phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`

## Evidence Read

- Queue revision: `phase4-wave2-t4-003-mysql-runtime-cutover-2026-07-09-47`
- Hermes state: `REPORT_READY`
- Coordinator: `t_2f055673`, run `#206`
- Executor: `t_cef284e1`, run `#207`
- Task: `ai/tasks/todo/TASK-T4-003.md`, SHA256 `104EC0710D889B57B030C0C1AA16806B8CA8B81C504C7272BDF24694B6376E67`
- PLAN: `ai/tasks/doing/TASK-T4-003-PLAN.md`, SHA256 `FC42B46D1BD05499E7498F3E2896B8F86493DE91BB4B89E893A7CD7AA42B7100`
- PROGRESS: `ai/tasks/doing/TASK-T4-003-PROGRESS.md`, SHA256 `DBE62330A786799F36A1EAE31F2D08BA3DF2EF4C1FDADF6A9E9A3847B34CAF68`
- REPORT: `ai/reports/REPORT-T4-003.md`, SHA256 `9CB9FE02FBE914C00EBDE8CB9419AC6012FEF0AA447F89F60FADA89D13E48D28`
- Scheduled evidence: `ai/reports/SCHEDULED-HERMES-EVENT-T4-003-REV47-REPORT-READY-2026-07-09.md`

## PMC Findings

1. Rev47 cannot enter Independent Review. The REPORT explicitly leaves required acceptance criteria pending: real MySQL server/Navicat visibility and restart persistence were not verified.
2. Required command `REVID_USE_SQLITE=false; python -c "import main"` fails before any real MySQL schema check because `database.py` imports `_engine` by value from `models.base`. After `init_mysql_engine()` mutates `models.base._engine`, `database._engine` remains `None`; `check_alembic_revision()` raises `RuntimeError: Database engine is not initialized`.
3. The new tests do not cover the failing MySQL startup path. The targeted suite passes under SQLite mode, but the required MySQL import smoke fails.
4. Full test discovery in the project venv ran 138 tests and failed on the existing real-MySQL migration suite because local root credentials are unavailable (`Access denied for user 'root'@'localhost' (using password: NO)`). PMC did not read `.env`, output secrets, or run destructive commands.
5. Scoped `git diff --check` on rev47 files passed with LF/CRLF warnings only.

## Verification Run By PMC

```text
backend/.venv/Scripts/python.exe -m unittest tests.test_mysql_runtime_cutover tests.test_health
Result: 8 passed

backend/.venv/Scripts/python.exe -m compileall main.py database.py api/health.py tests/test_mysql_runtime_cutover.py tests/test_health.py
Result: passed

REVID_USE_SQLITE=false; backend/.venv/Scripts/python.exe -c "import main"
Result: failed with RuntimeError: Database engine is not initialized

backend/.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"
Result: 137 passed / 1 error; error is missing local MySQL credential for existing test_migration_tool setup
```

## Decision

Rev47 is terminal for PMC review purposes and must not proceed to Reviewer/HANDOFF. This is a bounded implementation and evidence gap within the approved T4-003 scope, so PMC authorizes exactly one fresh remediation revision.

Rev47r1 may modify only the files listed in the Task's `PMC Revision 47r1 Remediation Contract`. It must fix the `_engine` reference bug, add a regression that fails on the rev47 implementation and passes after the fix, rerun the required checks, and either:

- produce real MySQL runtime, API/store-path, restart persistence and non-secret Navicat evidence; or
- produce a BLOCKED report if the required MySQL/Navicat capability is unavailable, without reading `.env`, inventing credentials, touching `revid_db` destructively, or claiming acceptance criteria as passed.

## Hermes Next Action

ACK only revision `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`, create exactly one fresh `revid-dispatcher / DISPATCH_ONLY` Coordinator and one `revid-backend / IMPLEMENT_AND_TEST_ONLY` Executor child for `ai/tasks/todo/TASK-T4-003.md`, and stop at `T4_003_MYSQL_RUNTIME_REMEDIATION_REPORT_READY_REV47R1`.

Do not reuse rev47 Coordinator `t_2f055673` or Executor `t_cef284e1`. Do not create Reviewer/HANDOFF, T4-004/T4-005, frontend/auth/Canvas work, destructive `revid_db` operations, `.env` reads, secret output, historical card reuse, or PMC PASS action.
