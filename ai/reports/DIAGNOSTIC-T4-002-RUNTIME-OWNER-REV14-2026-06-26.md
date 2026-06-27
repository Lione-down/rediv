# T4-002 Runtime Owner Diagnostic — Revision -14 Unit B

## Verdict

`READY_FOR_BOUNDED_CONTINUATION_DECISION — GATEWAY_RESTORED_BUT_REV14_CHAIN_EXHAUSTED`

## Scope

- Task: `T4-002`
- Queue revision: `phase4-wave2-unit-b-unit-tests-2026-06-26-14`
- Unit: B — same-PK conflict and partial rollback unit-test semantics
- Business attempt: 1 continuation, not attempt 2
- Scope boundary: no MySQL, no secrets, no `.env`, no destructive operations, no Unit C

## Symptoms

1. Coordinator card `t_bbbf72bd` timed out once at 302s > 300s and exhausted retry `1/1`.
2. Executor card `t_7275328d` timed out twice at 847s and 848s > 800s, then gave up after two consecutive failures.
3. `ai/reports/REPORT-T4-002-UNIT-B.md` exists, but Executor card has no completed result.
4. Independent REVIEW and HANDOFF for Unit B are missing.
5. Initial checks showed `hermes status` Gateway Service `stopped` and `hermes gateway status` no gateway process detected.
6. Gateway was then restored with `hermes gateway start`; follow-up status shows Gateway running at PID `6692`.

## Evidence Collected

### Hermes card state

`hermes kanban runs t_bbbf72bd`

- run `#93`: `timed_out`, profile `revid-pm`, elapsed 302s > 300s.

`hermes kanban runs t_7275328d`

- run `#94`: `timed_out`, profile `revid-backend`, elapsed 847s > 800s.
- run `#95`: `timed_out`, profile `revid-backend`, elapsed 848s > 800s.

`hermes kanban show t_7275328d`

- Status: `blocked`
- Diagnostic: `Agent timeout x2`
- Reviewer card: missing
- Handoff card: missing

### Worker logs

Coordinator log shows it created the Executor body and card but did not complete before the 300s coordinator budget expired.

Executor log shows actual Unit B work was performed and artifacts were written, but the worker process did not complete the card before the 800s timeout. The log also contains repeated Windows subprocess reader errors:

```text
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xb4 in position 0: invalid start byte
```

The errors occurred while Hermes was reading command output from shell commands such as git diff / grep paths. They did not directly prove a business test failure, but they show the worker runtime/log reader had an encoding fault during the run.

### Local bounded repro

The Unit B test payload itself is not slow and does not need MySQL:

```text
python -m pytest backend/tests/test_migration_tool.py::TestUnitB -q
.......                                                                  [100%]
7 passed in 0.40s
```

Syntax checks also completed quickly:

```text
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py
python -m py_compile backend/tests/test_migration_tool.py
```

Both commands exited `0`.

### Gateway status

Initial `hermes status`

- Gateway Service: `stopped`
- Manager: `manual process`

Initial `hermes gateway status`

- Scheduled Task registered: `Hermes_Gateway`
- No gateway process detected

After queue hold was recorded, Gateway was restarted:

```text
hermes gateway start
Gateway started via direct spawn (PID 6692)
```

Follow-up checks:

```text
hermes gateway status
Gateway process running (PID: 6692)
```

The old revision `-14` cards remained blocked after Gateway restoration and were not retried or promoted.

## Root Cause

I believe the root cause is a Hermes runtime / dispatcher completion failure, not a Unit B business-test hang, because the exact Unit B test target completes locally in under one second while the Hermes Executor card timed out after two 800s runs with no completed result, repeated subprocess UTF-8 decode errors appeared in the worker log, and the Gateway service had stopped after the failed chain.

## Ruled Out

- Real MySQL access: Unit B target is mock-only, and local `TestUnitB` completed without MySQL.
- Secret or `.env` dependency: local Unit B run completed without admin URL or `.env` access.
- Long-running business test: targeted Unit B pytest completed in under one second.
- Completed Unit B acceptance chain: ruled out because Independent REVIEW and HANDOFF are missing and Executor card is blocked.

## Current State

`READY_FOR_BOUNDED_CONTINUATION_DECISION`

Gateway is running again, but revision `-14` must not be retried, promoted, unblocked, or reused. Its Executor report is useful as partial working-tree evidence only; it is not final completion evidence.

## Required Next Runtime Action

1. Keep the existing `-14` queue out of executable rotation.
2. If continuing Unit B, create a fresh bounded revision that:
   - preserves all inherited failure fingerprints;
   - does not create attempt 2;
   - runs only `python -m pytest backend/tests/test_migration_tool.py::TestUnitB -q` plus syntax/diff checks;
   - requires a completed Executor card, Independent REVIEW, HANDOFF, and PMC final acceptance.
3. Runtime owner should investigate the Windows subprocess output decoding path and ensure worker command output is decoded with a tolerant Windows-safe strategy or forced UTF-8 environment before redispatching.

## PMC Decision

Do not dispatch Unit C, T4-003, or T4-010 from the current evidence. Unit B remains blocked until a fresh Unit B continuation chain completes or PMC explicitly chooses a different recovery path.
