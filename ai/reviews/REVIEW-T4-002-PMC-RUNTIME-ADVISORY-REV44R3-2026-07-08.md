# REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV44R3-2026-07-08

## Verdict

`PMC_BLOCKED - RUNTIME_OWNER_DIAGNOSTIC_REQUIRED`

## Blocking Facts

- Queue revision: `phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r3`.
- Task: `T4-002`, task file `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV44.md`.
- Coordinator: `t_65bf10da`, run `#196`, completed in `116s`.
- Reviewer: `t_4a67b642`, run `#197`, blocked after `483s`.
- HANDOFF: `t_387d4c1b`, still `todo`; canonical T4-002 rev44 HANDOFF is missing.
- Failure fingerprint: `REV44R3_PYDANTIC_CORE_EXTENSION_BROKEN`.
- Reviewer artifact: `ai/reviews/REVIEW-T4-002-UNIT-C3-REV44.md`, SHA256 `D42DB269A14D5DDB0C50F94F7312DBA12C64E79E49CD4F38AB2BAD6CCA694C86`, verdict `BLOCKED`, reviewer fingerprint `REV44_REAL_MYSQL_SELECTORS_UNVERIFIED_VENV_PYDANTIC_BROKEN`.
- Rev44 REPORT remains `ai/reports/REPORT-T4-002-UNIT-C3-REV44.md`, SHA256 `0ECE8FE82EDF48E1101DAB3DB87A84341C6FF4B9721C9541EA44F6C623F7966B`.

The Reviewer completed static checks but could not independently run the settings regression or the five real-MySQL selectors because the backend virtualenv import path failed with `ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'`. This is a verification infrastructure blocker, not a business REWORK and not final acceptance.

## Forbidden Actions

- Do not create another Executor, Reviewer, HANDOFF, continuation revision or business REWORK.
- Do not reuse, retry, claim, promote, unblock, reparent, archive or delete rev44r3 cards `t_65bf10da`, `t_4a67b642`, `t_387d4c1b` or any historical card.
- Do not modify business code, tests, migrations, Task, REPORT, Independent REVIEW, HANDOFF, Queue history or PMC reviews outside this advisory closure.
- Do not run destructive database tests, touch `revid_db`, read `.env`, print/hash/persist/infer secrets, or use fallback credentials.
- Do not mark PMC PASS or unlock T4-003.

## Runtime Owner Diagnostics Required

Hermes runtime owner must collect fresh evidence for the exact rev44r3 reviewer environment:

- The interpreter path and `sys.path` used by Reviewer card `t_4a67b642`.
- `pip show pydantic pydantic-core pydantic-settings` for that exact environment, without secrets.
- Import proof for `pydantic_core` and `pydantic_core._pydantic_core`, including exit code and stderr tail.
- Evidence whether `backend/.venv` is contaminated by another Hermes or agent virtualenv path.
- Reviewer run stdout/stderr tail and stack trace around the import failure.
- Any environment repair performed, with exact files/packages changed and verification command output.

Optional non-destructive proof after repair:

```powershell
backend\.venv\Scripts\python.exe -c "import pydantic_core, pydantic_settings; import pydantic_core._pydantic_core; print('PYDANTIC_CORE_IMPORT_OK')"
backend\.venv\Scripts\python.exe -m py_compile backend\settings\config.py backend\tests\test_migration_tool.py
```

Do not touch business databases or secret files while collecting this proof.

## Expected Runtime Owner Output

Return exactly one diagnostic report path and SHA256 with one of:

- `READY_FOR_CONTINUATION`: only if the same rev44r3 Reviewer environment can import pydantic/pydantic_core correctly and the blocked Reviewer checks can be safely rerun without changing business code or secrets.
- `STILL_INFRA_BLOCKED`: if the environment remains broken or cannot be repaired under least privilege.
- `NEEDS_HUMAN_DECISION`: only if repair requires paid resources, secret access, irreversible operations, or a product/contract decision.

## PMC Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r3
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV44R3_PYDANTIC_CORE_EXTENSION_BROKEN
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC
Runtime Diagnostic SLA: next Hermes checkpoint, no later than 60 minutes
Resume Condition: fresh runtime diagnostic proves pydantic_core imports in the exact rev44r3 Reviewer environment and explains whether rev44 runtime verification can continue without business code changes, database misuse, secret access, or historical card reuse
```

## PMC Unblock Conditions

PMC will consider a future bounded continuation only after fresh runtime diagnostic evidence exists with a real SHA256, matching revision/fingerprint, and a `READY_FOR_CONTINUATION` verdict. A new Queue revision must inherit `REV44R3_PYDANTIC_CORE_EXTENSION_BROKEN`; it must not clear the fingerprint by changing card IDs.
