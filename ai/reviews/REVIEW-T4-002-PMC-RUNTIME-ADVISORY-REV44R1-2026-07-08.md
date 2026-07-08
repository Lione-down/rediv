# T4-002 PMC Runtime Advisory - Unit C3 Revision 44r1

## Verdict

`PMC_BLOCKED - RUNTIME_OWNER_DIAGNOSTIC_REQUIRED`

This is a Hermes runtime/profile boundary incident in the rev44 review lifecycle. It is not a business REWORK, does not invalidate the rev44 implementation REPORT, and does not authorize another Executor or any code modification.

## Evidence Cursor

| Field | Value |
|---|---|
| Queue Revision Read | `phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r1` |
| Execution State Read | `COORDINATOR_BLOCKED_ROLE_BOUNDARY` |
| Execution Last Transition | `2026-07-08T14:30:00+08:00` |
| Coordinator Card | `t_a2509036` |
| Coordinator Run | `#192 blocked` |
| Failure Fingerprint | `REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED` |
| REPORT | `ai/reports/REPORT-T4-002-UNIT-C3-REV44.md` |
| Independent REVIEW | Missing |
| HANDOFF | Missing |
| PMC Action Marker | `YES / QUEUE_DECISION` |

## Blocking Facts

- Hermes ACKed rev44r1 and adopted existing Coordinator `t_a2509036` by matching idempotency key.
- The Coordinator blocked before creating Reviewer/HANDOFF children with `ROLE_BOUNDARY_VIOLATION: terminal tool not allowed for revid-pm Kanban task`.
- Hermes status states the Coordinator card body was correct and contains the required lifecycle parameters.
- No `ai/reviews/REVIEW-T4-002-UNIT-C3-REV44.md` and no `ai/handoffs/HANDOFF-T4-002-UNIT-C3-REV44-POST-REVIEW.md` exist for PMC final acceptance.
- Because no Independent REVIEW or HANDOFF exists, PMC cannot run Step 4 final acceptance and cannot mark T4-002 Unit C3 complete.

## Forbidden Actions

- Do not create another Executor, business REWORK, continuation revision, Reviewer, HANDOFF, or replacement card from the current Queue.
- Do not retry, claim, promote, unblock, reparent, archive, delete, or reuse `t_a2509036`, rev44 Dispatcher `t_04f179d0`, rev44 Executor `t_64a40afd`, or older rev43/rev42 cards.
- Do not modify business code, tests, migrations, Queue history, CURRENT, ROADMAP, Task, REPORT, Reviewer output, HANDOFF, or `HERMES-EXECUTION-STATUS.md` outside Hermes-owned diagnostic/status fields.
- Do not read or output secret material. Do not touch `revid_db`.

## Required Runtime Owner Diagnostic

Hermes runtime owner must collect fresh evidence for this exact revision/fingerprint:

- actual worker/tool policy attached to `revid-pm` for `REVIEW_DISPATCH_ONLY` and `HANDOFF_ONLY`;
- stdout/stderr tail, exit code, worker stack or equivalent session evidence for run `#192`;
- Gateway/dispatcher logs showing why a `revid-pm` lifecycle card attempted or required the forbidden terminal tool;
- whether the profile policy, card action parser, or lifecycle implementation needs a bounded non-terminal helper for Reviewer/HANDOFF child creation;
- current capacity and retry decision evidence, including why no duplicate card should be created.

The diagnostic may include a non-destructive same-profile smoke that proves `revid-pm / REVIEW_DISPATCH_ONLY` can create exactly one Reviewer child and one dependent HANDOFF_ONLY child without business writes, database access, secret output, or historical card reuse. If that smoke cannot be run safely, the diagnostic must say so and return `STILL_INFRA_BLOCKED`.

## Expected Runtime Owner Output

Return exactly one of:

- `READY_FOR_CONTINUATION` with evidence that the role boundary defect is fixed and a fresh rev44r1 lifecycle continuation can safely create Reviewer/HANDOFF children.
- `STILL_INFRA_BLOCKED` with current root cause, owner, next action, and evidence path.
- `NEEDS_HUMAN_DECISION` only if a true Human Owner escalation gate is met.

## PMC Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r1
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC
Runtime Diagnostic SLA: next Hermes checkpoint, no later than 60 minutes
Resume Condition: fresh diagnostic verdict READY_FOR_CONTINUATION proving revid-pm REVIEW_DISPATCH_ONLY can create one Reviewer child and one dependent HANDOFF_ONLY child without terminal tool boundary violation, business writes, database access, secret output, or historical card reuse
```

## Human Decision

`NO` - this is a routine Hermes runtime/profile ownership issue. It does not require product direction, paid resources, new secrets, irreversible operations, or a major schema/API contract change.
