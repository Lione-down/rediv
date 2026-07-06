# PMC Review: T4-002 Unit C3 Revision 42 Publication

## Verdict

`APPROVED — DISPATCH_ONLY / ONE BOUNDED BUSINESS ATTEMPT`

Rev41r7 terminal reconciliation is complete and no active execution chain remains. Revision 36 was superseded before ACK and is immutable historical authorization evidence. PMC publishes fresh revision `phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-07-42` with fresh keys.

## Preconditions Verified

- Hermes status：rev41r7 `PMC_PASS — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`。
- Terminal confirmation：`ACK_TERMINAL_VERDICT_AND_STOP`；current fingerprint `NONE`。
- Active workers：`0 ready / 0 running / 0 review`；historical blocked/todo cards are not active chains。
- Human authorization：2026-07-04 bounded Unit C3 remediation authorization remains applicable。
- Fresh Task：`ai/tasks/todo/TASK-T4-002-UNIT-C3-REV42.md`，SHA256 `40E17B1D98E3F1342EAF1D6F7770B9583AA4FE8E05A55BFD9BBC62DAE837A87B`。
- Allowed business file baseline：`backend/tests/test_migration_tool.py` SHA256 `A3A439D6665958E8C452BB1D9B23DDE52B4EAEC4BD88E1F0E5597E4FF2B16907`，当前无 unknown ownership diff。
- Revision 27-30 cards/keys are terminal；revision 36 has no card and may not be ACKed or reused。
- Project launcher dry-run：exit `0`；persisted body preview contains exact rev42 Task path、`DISPATCH_ONLY`、`revid-backend`、Executor key、`1800s` and Stop After；no card created。
- `git diff --check`：exit `0`。

## Published Contract

- Action：`DISPATCH_ONLY`
- Dispatcher：`revid-dispatcher`，120s
- Executor：`revid-backend / IMPLEMENT_AND_TEST_ONLY`，1800s
- Attempt policy：one business attempt，initial run plus at most one process retry
- Allowed business file：only `backend/tests/test_migration_tool.py`
- Stop After：`UNIT_C3_FAILURE_LIFECYCLE_REPORT_READY_REV42`
- Reviewer/HANDOFF：not authorized
- Previous fingerprint：`REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`，with the complete rev27-rev30 chain preserved

## Safety and Acceptance Gate

Hermes must run the project-owned deploy, role-contract verifier and deterministic status gate before card creation. Real MySQL verification may use only runtime `REVID_TEST_MYSQL_ADMIN_URL` against identity-confirmed disposable database `revid_test_t4_002`; `.env`, `revid_db`, secret output, fallback credentials and wider destructive scope are forbidden. Any ownership, identity, permission, cleanup, skip or mock-substitution mismatch blocks before or during execution.

REPORT_READY is a PMC decision gate, not PASS. PMC will audit the three exact non-MySQL failure-lifecycle regressions, five ordered real-MySQL selectors, actual diff and REPORT semantics before authorizing any Independent Review continuation.

## Human Decision

`NO` — this is the already authorized bounded remediation and does not change product direction, schema/API contract, paid resources or destructive scope.
