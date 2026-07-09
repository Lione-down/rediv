# REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV45-2026-07-09

## Verdict

`PMC_BLOCKED - RUNTIME_OWNER_DIAGNOSTIC_REQUIRED`

This is a Hermes runtime/tool-policy incident in the rev45 Unit D dispatch stage. It is not a business REWORK, does not invalidate the Unit C3 PMC PASS evidence, and does not authorize another dispatch, Executor, Reviewer, HANDOFF, code change, database action, or secret access.

## Evidence Cursor

| Field | Value |
|---|---|
| Queue Revision Read | `phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45` |
| Execution State Read | `INFRASTRUCTURE_BLOCKED` |
| Execution Last Transition | `2026-07-09T03:18:34+08:00` |
| Coordinator Card | `t_d6f567bb` |
| Coordinator Run | `#201 blocked after 41s` |
| Executor Card | `NONE` |
| Executor Run | `NONE` |
| Unit D PLAN/PROGRESS/REPORT | Missing |
| Failure Fingerprint | `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION` |
| PMC Action Marker | `YES / RUNTIME_ADVISORY` |

## Blocking Facts

- Hermes ACKed rev45 and created Coordinator `t_d6f567bb` through the canonical launcher.
- Hermes status records that the Coordinator body was verified for `Action: DISPATCH_ONLY`, revision `phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45`, task `T4-002`, task path `ai/tasks/todo/TASK-T4-002-UNIT-D-REV45.md`, Executor profile `revid-backend`, Executor action `IMPLEMENT_AND_TEST_ONLY`, and stop-after `UNIT_D_CONSOLIDATED_REPORT_READY_REV45`.
- Gateway claimed run `#201`, then blocked after `41s` with `ROLE_BOUNDARY_VIOLATION: tool 'list_files' is not allowed for Kanban task t_d6f567bb`.
- No Executor child was created, and the allowed Unit D artifacts remain absent:
  - `ai/tasks/doing/TASK-T4-002-UNIT-D-REV45-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-D-REV45-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-D-REV45.md`
- Because no Unit D REPORT exists, PMC cannot evaluate readiness for Unit E Independent REVIEW/HANDOFF and cannot unlock T4-003.

## Forbidden Actions

- Do not redispatch rev45, create a duplicate Coordinator, create an Executor child, or create Reviewer/HANDOFF cards from the current Queue.
- Do not retry, claim, promote, unblock, reparent, archive, delete, or reuse Coordinator `t_d6f567bb` or any historical card.
- Do not create business REWORK, attempt 1, Unit E, T4-003, or any replacement Queue without a future PMC decision.
- Do not modify business code, tests, migrations, schema, frontend, runtime code, Task, REPORT, Independent REVIEW, HANDOFF, or `HERMES-EXECUTION-STATUS.md` outside Hermes-owned diagnostic/status fields.
- Do not run destructive tests, real database operations, migrations, browser tests, or broad suites.
- Do not read `.env`, print/hash/persist/infer secrets, or touch `revid_db`.

## Runtime Owner Diagnostics Required

Hermes runtime owner must collect fresh evidence for this exact revision/fingerprint:

- The actual worker/tool policy attached to `revid-dispatcher` for `DISPATCH_ONLY`.
- The exact allowlist decision that rejected `list_files` for Coordinator `t_d6f567bb`.
- Coordinator run `#201` exit code, stdout/stderr tail, worker stack, and Gateway/dispatcher logs around the role-boundary violation.
- The Dispatcher code path that requires or attempted `list_files`, including whether it should instead use an already-allowed bounded read/search capability or receive a least-privilege policy update.
- Current capacity, retry decision evidence, and why no duplicate card should be created.
- Whether the deployed profile policy and role contract verifier agree on `revid-dispatcher / DISPATCH_ONLY` required tools.

Optional non-destructive proof after remediation:

```powershell
python ai/runtime/verify-hermes-role-contracts.py
```

A same-profile smoke may be used only if it is non-destructive, uses fresh synthetic data or dry-run mode, does not touch project business files/databases/secrets, and proves `revid-dispatcher / DISPATCH_ONLY` can complete without `list_files` boundary failure. It must not create a real T4-002 Executor or mutate historical cards.

## Expected Runtime Owner Output

Return exactly one diagnostic report path and SHA256 with one of:

- `READY_FOR_CONTINUATION`: only if the same `revid-dispatcher / DISPATCH_ONLY` path can proceed under least privilege without the `list_files` boundary violation, without duplicating `t_d6f567bb`, and without touching business/database/secret surfaces.
- `STILL_INFRA_BLOCKED`: if the dispatcher policy or runtime remains broken, evidence is incomplete, or remediation cannot be proven safely.
- `NEEDS_HUMAN_DECISION`: only if repair requires paid resources, new secrets, irreversible operations, or a product/contract decision.

## PMC Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC
Runtime Diagnostic SLA: next Hermes checkpoint, no later than 60 minutes
Resume Condition: fresh runtime diagnostic proves revid-dispatcher DISPATCH_ONLY can complete least-privilege dispatch without list_files boundary violation, duplicate card creation, business writes, database access, secret access, or historical card reuse
```

## PMC Unblock Conditions

PMC will consider a future bounded continuation only after fresh runtime diagnostic evidence exists with a real SHA256, matching revision/fingerprint, and a `READY_FOR_CONTINUATION` verdict. Any future continuation must inherit `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION`; a new card ID or revision must not clear the fingerprint.

## Human Decision

`NO` - this is a Hermes runtime/profile ownership issue. It does not require product direction, paid resources, new secrets, irreversible operations, or a major schema/API contract change.
