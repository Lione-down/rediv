# Hermes Atomic DISPATCH_ONLY Runtime Fix Report

## Result

`PASS — parent completion and child promotion are now one atomic transaction`

## Root Cause

Run `#122` showed that child creation and parent completion were separate Kanban transactions separated by LLM round-trips. `enforce_max_runtime()` could kill the worker after the child commit but before `kanban_complete`, leaving `parent=blocked` and `child=todo` permanently.

The run spent almost all of its 120-second budget in provider calls, including an HTTP 500 retry and a 50.9-second response; Kanban/file tool execution was under two seconds. Increasing the timeout would reduce frequency but would not remove the split-commit state.

## Runtime Changes

Installed Hermes runtime: `C:/Users/mkd/AppData/Local/hermes/hermes-agent`.

- `hermes_cli/kanban_db.py`
  - Added an internal atomic dispatch option to `create_task()`.
  - Child insert/link, parent run completion, failure-counter reset and child promotion now commit in one SQLite transaction.
  - Existing matching idempotency child can reconcile a still-running parent without duplication.
  - Contract mismatch, wrong run, extra child or invalid state fails closed and rolls back.
- `tools/kanban_tools.py`
  - Automatically selects atomic dispatch only for a current worker whose card contains standalone `Action: DISPATCH_ONLY`.
  - Requires the current worker to be the child's only parent.
  - Normal `kanban_create` behavior is unchanged.
- `agent/conversation_loop.py`
  - Detects that the current Kanban task reached `done` during tool execution.
  - Uses the durable run summary as the final response and skips the follow-up provider call.
  - Prevents a completed Dispatcher from leaving an untracked worker process alive.

## TDD Evidence

Initial RED:

- Tool behavior returned child `todo` instead of `ready`.
- DB atomic parameters did not exist.
- Additional-parent case incorrectly produced a ready child.
- Agent-loop terminal helper did not exist.

Final GREEN:

| Verification | Result |
|---|---|
| Four new atomic/rollback/reconciliation/safety tests | `4 passed` |
| Full Kanban tool suite | `94 passed` |
| Single-query finalization + tool-executor context | `15 passed` |
| Python compile | PASS |
| Runtime repository `git diff --check` | PASS |

Expanded existing suites retained unrelated baseline failures:

- Tool + core: `258 passed, 1 skipped, 3 failed`; failures are profile-root leakage, gateway quarantine timing and stale-vs-crash classification.
- Kanban DB: `214 passed, 11 failed`; failures are existing Windows path rendering, executable resolution and POSIX zombie-reaper expectations.

None of those failures execute the new atomic dispatch path.

## Runtime Smokes

### Direct installed-runtime smoke

- Board: `revid-atomic-dispatch-smoke-1782713906`
- Parent: `t_f758882f` → `done`
- Child: `t_5fefcbb8` → `ready`
- Transaction duration: `0.0599s`

### Live Gateway same-profile smoke

- Gateway restarted cleanly; active PID: `40504`.
- Board: `revid-atomic-dispatch-live-1782714440`
- Dispatcher: `t_9f0ea8f5`, profile `revid-dispatcher` → `done`
- Child: `t_cff37a21`, intentionally non-spawnable `atomic-smoke-noop` → `ready`
- Run outcome: `completed`
- Run metadata: `atomic_dispatch=true`, exact child ID recorded
- Agent log: `Kanban task reached done during tool execution; skipping follow-up model call`
- Post-run process count for the Dispatcher task: `0`

An earlier live smoke proved the atomic state transition but exposed that the worker process continued after parent completion. That sibling risk was fixed before the final v3 smoke. An inert unassigned card created during `.cmd` multiline transport diagnosis remains only on the isolated smoke board and cannot execute.

## Safety

- Revid board cards `t_cc15e296` and `t_25ac2145` were read-only and remain unchanged.
- No Revid business code, migration, tests or database was modified.
- No `.env`, credential or secret value was read or printed.
- No revision `-26` or executable Queue was published.

