# REVIEW — T4-002 Unit C3 Revision 43 Runtime Advisory

## Verdict

`PMC_BLOCKED — INFRASTRUCTURE / RUNTIME OWNER DIAGNOSTIC REQUIRED`

## Revision

`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`

## Evidence Cursor

| Field | Value |
|---|---|
| Read time | `2026-07-07T15:56:39+08:00` |
| Execution state read | `INFRASTRUCTURE_BLOCKED` |
| Last transition | `2026-07-07T15:13:00+08:00` |
| Coordinator card | `t_fb444a42` |
| Coordinator run | `#188`, completed in `92s` |
| Executor card | `t_af88d96e` |
| Executor run | `#189`, blocked after `991s` |
| Runtime failure | `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` |
| Task SHA256 after PMC status update | `BFB3AB46754EE43923B4C3ABFB916BEEE70D524C49AE9139D71B546675A33F3F` |
| Queue SHA256 before advisory | `32B0E7044327145B29ED112D46B016EEBEA98BB0119D400CE610733DDC0B1911` |
| Execution status SHA256 | `22A97B785D958A5E09B6161F745494952D12227869802E4E17F09489AB3FDBB6` |
| Rev43 PLAN SHA256 | `D3DD6297915DA367B153B5364220456627B090F7568872B48B8093120A5FC35B` |
| Rev43 REPORT | `MISSING` |
| Allowed business file SHA256 observed | `backend/tests/test_migration_tool.py` = `72AA36F26AD70EB840265A87A41AF08FC7BF3937180E7BA6A97D34A6487E45AC` |

## Finding

Rev43 reached a runtime/process terminal blocker before an Executor REPORT was written. The Dispatcher completed and created the intended Executor child, but the Executor run ended without a durable `kanban_complete` or `kanban_block` terminal transition. This is a Hermes runtime incident, not a Unit C3 business-verdict gate.

`backend/tests/test_migration_tool.py` has changed and a rev43 PLAN exists, but without a rev43 REPORT, verified command results, Independent REVIEW or HANDOFF, PMC cannot evaluate business Acceptance Criteria or authorize Review lifecycle.

The current Hermes-owned status also preserves the inherited business fingerprint as the current failure fingerprint while describing a runtime fault. That is not enough for continuation. Runtime owner must ACK this PMC terminal verdict and provide fresh diagnostics under the runtime fingerprint below.

## Runtime Failure Fingerprint

`REV43_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`

Inherited business fingerprint remains:

`REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`

The inherited business fingerprint is not cleared and must remain associated with the rev43 business scope. It must not be used to mask the distinct runtime failure.

## Prohibited Actions

- Do not redispatch rev43.
- Do not reuse, claim, promote, unblock, reparent, archive, delete or retry `t_fb444a42`, `t_af88d96e`, rev42, or any historical card/key.
- Do not create Reviewer or HANDOFF.
- Do not modify business code, migration files, tests, Executor PLAN/PROGRESS/REPORT, Independent REVIEW, HANDOFF, Hermes Kanban card content, or `HERMES-EXECUTION-STATUS.md` from the PMC side.
- Do not run destructive database tests, access `.env`, read or print secrets, or touch `revid_db`.
- Do not publish a continuation revision until fresh runtime health evidence exists.

## Required Hermes Runtime Diagnostics

Hermes runtime owner must collect fresh evidence for the same revision/card/run:

- Worker process exit code and whether the provider loop returned normally or was killed.
- Tail of stdout/stderr and worker session log for `20260707_145513_ac2eee`.
- Worker stack/finalizer evidence explaining why neither `kanban_complete` nor `kanban_block` persisted.
- Gateway and dispatcher logs around run `#189`.
- Tool-call transcript summary showing whether terminal tools were offered, called, rejected, or failed.
- Runtime budget, retry and termination decision basis for the `991s` blocked run.
- Whether partial Executor artifacts were written, especially `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV43-PROGRESS.md` and `ai/reports/REPORT-T4-002-UNIT-C3-REV43.md`.

Optional non-destructive evidence:

- Same-profile sustained-run or smoke proof that a `revid-backend / IMPLEMENT_AND_TEST_ONLY` worker can write a terminal transition after a bounded no-secret task.
- This smoke must not touch project databases, `.env`, secrets, business code, or historical cards.

## Expected Runtime Owner Output

One of:

- `READY_FOR_CONTINUATION` with evidence path/hash proving rev43 can be safely continued or freshly retried without losing the inherited business fingerprint.
- `STILL_INFRA_BLOCKED` with evidence path/hash, owner, and the next runtime fix or diagnostic action.
- `NEEDS_HUMAN_DECISION` only if the evidence satisfies Human Owner escalation rules.

## PMC Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV43_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC
Runtime Diagnostic SLA: next Hermes checkpoint, no later than 2026-07-07T16:56:39+08:00
Resume Condition: fresh runtime diagnostic with READY_FOR_CONTINUATION, credible card/run evidence, and no historical card reuse
```

Hermes execution status must ACK with matching revision/fingerprint, a real SHA256 for this advisory, `Runtime Owner State`, `Runtime Diagnostic Due`, diagnostic path/hash when ready, and `PMC Verdict Confirmation: ACK_TERMINAL_VERDICT_AND_STOP`.

## Human Decision

`NO`

This is a runtime/process incident. It does not require product direction, paid resources, secrets, destructive action, or a schema/API contract change.
