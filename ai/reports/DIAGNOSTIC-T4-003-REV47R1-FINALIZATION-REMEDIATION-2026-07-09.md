# T4-003 Rev47r1 Hermes Finalization Remediation Diagnostic

Diagnostic owner: Codex PMC runtime remediation

Diagnostic time: 2026-07-09T23:58:00+08:00

Related revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`

Failure fingerprint: `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`

Verdict: `READY_FOR_CONTINUATION`

## Blocking Fact

Rev47r1 Executor `t_dfaef3d8` run `#209` exited without `kanban_complete` or `kanban_block` and did not write `ai/reports/REPORT-T4-003-REV47R1.md`. Fresh diagnostic evidence identified the agent turn exit reason as `fallback_prior_turn_content`, but the Hermes Kanban finalization path did not preserve that abnormal finalizer state in the deterministic worker block reason.

## Root Cause

`C:\Users\mkd\AppData\Local\hermes\hermes-agent\cli.py::_finalize_kanban_worker_result()` treated a returned response body as a generic worker exit when no terminal Kanban transition was present. It did not inspect `result["turn_exit_reason"]`, so `fallback_prior_turn_content` looked like a normal text response and collapsed into the generic `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` reason. That made the runtime owner diagnostic loop unable to distinguish a normal text-return violation from the specific finalization/output-capture branch.

## Remediation Applied

Updated installed Hermes runtime file:

- `C:\Users\mkd\AppData\Local\hermes\hermes-agent\cli.py`

The worker finalization path now preserves abnormal non-`text_response` turn exit reasons in the deterministic `block_task` reason, including:

- `turn_exit_reason`
- `api_calls`
- `response_previewed`

Added regression coverage:

- `C:\Users\mkd\AppData\Local\hermes\hermes-agent\tests\cli\test_single_query_session_finalize.py`

The new regression asserts that a Kanban worker result with `turn_exit_reason = fallback_prior_turn_content`, no explicit error and no terminal transition blocks with a reason containing the exact turn exit reason plus output-capture context.

## Verification

All commands below were non-secret and non-destructive.

```text
C:\Users\mkd\AppData\Local\hermes\hermes-agent\.venv\Scripts\python.exe -m pytest tests\cli\test_single_query_session_finalize.py -q
11 passed in 0.92s
```

```text
C:\Users\mkd\AppData\Local\hermes\hermes-agent\.venv\Scripts\python.exe -m py_compile cli.py tests\cli\test_single_query_session_finalize.py
PASS
```

```text
D:\works\codexWorks\project_revid\backend\.venv\Scripts\python.exe ai\runtime\verify-hermes-role-contracts.py
ROLE_CONTRACTS_OK
```

```text
D:\works\codexWorks\project_revid\backend\.venv\Scripts\python.exe ai\runtime\reconcile-hermes-execution-status.py --check
STATUS_OK
```

```text
git diff --check -- cli.py tests\cli\test_single_query_session_finalize.py
PASS
```

## Changed Runtime Evidence Hashes

- `C:\Users\mkd\AppData\Local\hermes\hermes-agent\cli.py` SHA256 `BB2C2CA0F4179982D394038FB97E05311EBDCBCCCC72F3B05510405A688DDCD8`
- `C:\Users\mkd\AppData\Local\hermes\hermes-agent\tests\cli\test_single_query_session_finalize.py` SHA256 `05324946F281F9B0500162C2DE53B6DAE3D4087706360F2E5FDAC58B0CDF7F98`

## Safety Boundaries

No Revid business code, migrations, tests, frontend files, database data, `.env`, secrets, Executor artifacts, Independent REVIEW, HANDOFF, Hermes execution status or Kanban cards were modified by this remediation.

Historical cards remain terminal evidence and must not be reused:

- rev47r1 Coordinator `t_50707802`
- rev47r1 Executor `t_dfaef3d8`
- rev47 Coordinator `t_2f055673`
- rev47 Executor `t_cef284e1`

## Continuation Signal

The runtime finalization/output-capture defect has a scoped fix and regression test. A fresh bounded continuation is safe only as a new revision that inherits both the original business failure fingerprint and the rev47r1 runtime failure fingerprint. The old rev47r1 cards remain terminal and non-reusable.
