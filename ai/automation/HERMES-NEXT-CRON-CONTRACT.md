# Hermes Next Cron Contract

> Contract owner: Codex PMC
> Applicable revision: `phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-07-42`
> Contract status: `ACTIVE — TERMINAL VERDICT RECONCILIATION ONLY`

## 1. Authority Snapshot

Revision 42 reached REPORT_READY and is now terminal `PMC_BLOCKED`. The unique `## Active Wave` table in `ai/automation/HERMES-AUTO-QUEUE.md` is non-executable. Historical Queue prose, revision 36, revisions 27-30, and all old cards/keys are evidence only.

| Field | Required Value |
|---|---|
| Queue Revision | `phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-07-42` |
| Task ID | `T4-002` |
| Task Path | `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV42.md` |
| Queue Action | `NONE — terminal evidence only` |
| PMC Verdict | `PMC_BLOCKED` |
| Failure Fingerprint | `REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID` |
| Expected Hermes Action | `ACK_TERMINAL_VERDICT_AND_STOP` |

## 2. Objective

Confirm rev42 has no active worker, canonicalize Hermes-owned status, ACK the exact terminal PMC verdict/fingerprint, and stop. Do not create, retry, or modify any card.

## 3. Observed Problem

`HERMES-EXECUTION-STATUS.md` still describes rev42 as `REPORT_READY` with an executable/approved Queue and the inherited rev30 fingerprint. Its rev42, Board Summary, Reconciliation Status, and PMC Attention tables use invalid double-leading-pipe rows. Its `Last updated` value `2026-07-07T12:22:00+08:00` is future-dated relative to the PMC read at `2026-07-07T02:26:49+08:00` and must be replaced with the actual write time. Fresh deterministic check exits `2` with `expected one section starting with '## Active Queue', found 2` because archived rev41r7 is still labeled as a second Active Queue. The canonical project facts now require one rev42 Active Queue section in terminal `PMC_BLOCKED` state and one historical rev41r7 section.

## 4. Exact Steps

1. Read the current Queue, rev42 Task, PMC blocked review, REPORT, and current status.
2. Verify Coordinator `t_89269e14` and Executor `t_adc87aa2` are terminal and that there is no ready/running/review rev42 worker. Preserve the existing REPORT path and card/run evidence.
3. In `ai/automation/HERMES-EXECUTION-STATUS.md`, convert malformed rev42/status table rows to canonical single-leading-pipe Markdown rows and make canonical fields unique.
4. Rename `## Active Queue — Revision 41r7` to `## Historical Queue — Revision 41r7 (Terminal, PMC PASS)` without changing its archived evidence. Exactly one section may start with `## Active Queue`.
5. Replace the future-dated `Last updated` value with the actual status write time and keep `Last Transition` tied to a verified event; do not invent future timestamps.
6. Set the rev42 current fields exactly:
   - `State = PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`
   - `Current Failure Fingerprint = REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`
   - `Failure Fingerprint = REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`
   - `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`
   - `Rev42 Reconciliation = ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`
   - `Queue Status = PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`
   - `PMC Action Required = NO`
   - `PMC Action Type = NONE`
   - `PMC Action Reason = terminal rev42 verdict acknowledged; no further action authorized`
   - `Human Decision Candidate = NO`
   - `Human Escalation Reason = NONE`
7. Recompute and persist the actual current Task SHA256 and Queue SHA256; placeholders such as `AUTO-GENERATED`, `N/A`, or stale hashes are invalid.
8. Run the project-owned deterministic status check:

```powershell
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe ai/runtime/reconcile-hermes-execution-status.py --check
```

If the check reports only deterministic Hermes-owned status mismatches and supports this business terminal verdict, apply once and check again. If it rejects the new PMC business verdict or the status structure cannot be canonicalized safely, do not touch cards or Queue; persist `PMC Action Required = YES / STATE_CONFLICT` with the exact error and evidence path for PMC.

## 5. Forbidden Actions

- Do not create, retry, claim, promote, unblock, reparent, delete, archive, or reuse any card/run/key.
- Do not create Reviewer/HANDOFF, a replacement revision, or business REWORK.
- Do not modify Queue, CURRENT, ROADMAP, Task, PMC REVIEW, REPORT, PLAN/PROGRESS, business code, tests, runtime code, database, or secrets.
- Do not read `.env`, print/infer credentials, touch `revid_db`, or run destructive MySQL tests.
- Do not replace the rev42 fingerprint with the inherited rev30 fingerprint.

## 6. Verification

- Exactly one Active Wave and it is terminal/non-executable.
- Zero ready/running/review rev42 workers.
- Exactly one current rev42 `PMC Verdict Confirmation` and one rev42 reconciliation row.
- All canonical status tables use one leading `|`; canonical fields are unique.
- Task/Queue hashes match actual SHA256 values.
- Deterministic check returns `STATUS_OK`, or status records a precise `STATE_CONFLICT` without any card/business action.
- `git diff --check -- ai/automation/HERMES-EXECUTION-STATUS.md` exits `0`.

## 7. Completion Evidence and Stop Condition

Persist the fresh timestamp, exact hashes, verified card states, deterministic check result, and terminal ACK in Hermes-owned status. Stop immediately after reconciliation. There is no executable Queue and no authorized next Task.
