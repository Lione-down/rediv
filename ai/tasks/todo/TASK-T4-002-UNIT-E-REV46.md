# TASK-T4-002-UNIT-E-REV46 - Final Independent Review and Handoff

## Status

`TERMINAL - PMC_EMERGENCY_ACCEPTED`

PMC final acceptance was completed in `ai/reviews/REVIEW-T4-002-PMC-EMERGENCY-FINAL-ACCEPTANCE-2026-07-09.md`.

The rev46 Reviewer artifact exists at `ai/reviews/REVIEW-T4-002-UNIT-E-REV46.md` with verdict `BLOCKED`, not PASS. PMC does not reinterpret it as PASS. The blocker was limited to missing deterministic read-only checks, so PMC completed those checks directly under Human Owner acceleration instruction and waived the missing HANDOFF for this final closure only.

Hermes must not retry, claim, promote, unblock, reparent, delete, archive or reuse the rev46 Coordinator/Reviewer/HANDOFF cards. Hermes next action is only `ACK_TERMINAL_VERDICT_AND_STOP` for the PMC verdict.

## Queue Revision

`phase4-wave2-unit-e-final-review-handoff-2026-07-09-46`

## Objective

Perform the final Independent REVIEW and HANDOFF for T4-002 using the completed Unit D consolidated report.

Unit E must independently verify that `ai/reports/REPORT-T4-002-UNIT-D-REV45.md` maps every original T4-002 acceptance criterion to accepted Unit A/B/C evidence and that the evidence chain is consistent enough for PMC final acceptance.

## Scope

Reviewer must read:

- `ai/tasks/todo/TASK-T4-002.md`
- `ai/tasks/todo/TASK-T4-002-UNIT-D-REV45.md`
- `ai/reports/REPORT-T4-002-UNIT-D-REV45.md`
- Unit A/B/C final REPORT/REVIEW/HANDOFF/PMC PASS artifacts listed in the Unit D report
- `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`
- `ai/reviews/REVIEW-T4-002-PMC-BOUNDED-SPLIT-APPROVAL-2026-06-25.md`

Reviewer must verify:

1. Every original T4-002 acceptance criterion is mapped to concrete accepted evidence.
2. REPORT, REVIEW, HANDOFF and PMC PASS hashes in Unit D are real and match file contents.
3. Real MySQL evidence is distinguished from mock/unit/static/dummy checks.
4. ADR-003 safety boundaries are preserved: only `revid_test_t4_002`, no `revid_db`, no `.env`, no secret output.
5. Historical failure fingerprints are retained as audit context, not silently cleared.
6. Unit D does not claim final PMC PASS, Unit E completion, runtime switch readiness or T4-003 unlock.

## Non-Goals

- Do not modify business code, tests, migrations, schema, frontend, backend runtime, Hermes runtime, Queue, CURRENT, ROADMAP, Task files or existing reports.
- Do not run real MySQL selectors, migrations, destructive tests, browser tests or broad suites.
- Do not read `.env` or secret files.
- Do not create T4-003, runtime switch artifacts or any next Queue.
- Do not mark T4-002 complete; only Codex PMC can final-accept after HANDOFF_READY.

## Allowed Outputs

Reviewer may create only:

- `ai/reviews/REVIEW-T4-002-UNIT-E-REV46.md`

HANDOFF stage may create only:

- `ai/handoffs/HANDOFF-T4-002-UNIT-E-REV46-POST-REVIEW.md`

## Required Verification

Reviewer must use read-only verification only:

```powershell
Get-FileHash -Algorithm SHA256 <all Unit D listed evidence files>
git diff --check -- ai/reports/REPORT-T4-002-UNIT-D-REV45.md
```

Reviewer may run additional read-only text/source checks, but must not execute database, migration, browser, destructive or secret-dependent commands.

## Verdict Contract

Independent REVIEW must return exactly one of:

- `PASS`: all Unit D mappings, hashes, evidence classes and safety boundaries are verified.
- `REWORK`: Unit D report has a fixable evidence mapping/hash/wording defect inside its existing scope.
- `BLOCKED`: required evidence is missing, inconsistent, unsafe, or cannot be verified read-only.

HANDOFF may be written only after Reviewer `PASS`.

## Stop Condition

Terminalized by PMC emergency final acceptance. Stop at `ACK_TERMINAL_VERDICT_AND_STOP`; do not retry Reviewer, write HANDOFF, unlock T4-003 automatically, or create any new Hermes card.
