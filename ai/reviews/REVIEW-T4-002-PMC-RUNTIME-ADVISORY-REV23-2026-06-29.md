# T4-002 PMC Runtime Review — Revision 23 Supervisor Body Transport

## Verdict

`PMC_RUNTIME_FIX_PASS — REV23 TERMINAL, REV24 READY_FOR_CONTINUATION`

## Incident

- Revision: `phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23`
- Coordinator: `t_1dea37a2`
- Run: `#120`
- Outcome: `gave_up`, `worker_pid=null`, process retry `1/1` exhausted
- Runtime fingerprint: `REV23_COORDINATOR_MISSING_ACTION_MARKER`
- Business Executor/PLAN/PROGRESS/REPORT: absent

Revision `-23` did not reach business execution. Its bounded AC3 remediation Scope remains valid.

## Root Cause

The reported symptom is real, but the proposed root cause "Windows CLI truncated a complete multiline body" is not supported.

Raw cron session `cron_72a21342a164_20260629_094502` shows the actual path:

1. Supervisor wrote a complete body file.
2. It invoked `powershell -Command "...$hermesExe...$env...$body..."` from an MSYS Bash terminal.
3. Bash expanded the PowerShell `$...` variables before PowerShell started, leaving invalid assignments and no executable path.
4. Supervisor then explicitly ran `hermes kanban create ... --body "@ai/tasks/todo/TASK-T4-002-UNIT-C2-REV23.md"`.
5. The persisted card exactly matches that explicit single-line argument; no complete multiline body reached the CLI.

Independent lower-layer checks confirm:

- `hermes_cli.kanban` argparse preserves a multiline `--body` argument.
- Direct PowerShell → Python argv preserves `Action: DISPATCH_ONLY` and the task reference.

Root cause: **shell-boundary variable expansion plus an unauthorized task-reference-only fallback**, not `hermes.exe` truncation.

## Fix

Added project-owned launcher `ai/runtime/create-hermes-coordinator.py`:

- constructs the canonical Coordinator body from scalar arguments;
- validates required standalone lines before create;
- invokes direct `hermes.exe` with a Python `subprocess` argv list, never shell multiline text;
- parses the returned JSON and requires persisted body equality;
- returns non-zero on executable, CLI, JSON or body-contract failure.

Updated `ai/prompts/hermes-scheduled-supervisor.md` to require the launcher and prohibit every `--body "@Task.md"` fallback. Launcher failure must become `SUPERVISOR_COORDINATOR_BODY_TRANSPORT_FAILED` without creating a card.

## Verification

| Check | Result |
|---|---|
| Launcher + prompt regression suite | `4 tests passed` |
| Launcher dry-run canonical body | PASS, 10 lines |
| `Action: DISPATCH_ONLY` standalone line | PASS |
| argv `--body` value equals complete body | PASS |
| Business-file diff | Empty |
| Kanban mutation by PMC | None |
| Secret/database access | None |

## Recurrence Blast

- Direct shell multiline body in Supervisor prompt: replaced.
- `hermes.cmd`/nested PowerShell transport: no longer used for Coordinator create.
- Task-reference-only fallback: explicitly forbidden and regression-checked.
- Existing terminal cards `t_1617a921` and `t_1dea37a2`: retained as evidence; never reused.

## Continuation Decision

Revision `-23` is terminal and must not be deleted, archived, unblocked, retried or reused. Deletion would destroy incident evidence and is unnecessary.

Revision `-24` may continue the unchanged rev23 business remediation with fresh Coordinator/Executor cards and idempotency keys. It inherits both `REV23_COORDINATOR_MISSING_ACTION_MARKER` and all earlier fingerprints.

## Human Decision

`NO` — no product, secret, paid resource, destructive production action or contract change is required.
