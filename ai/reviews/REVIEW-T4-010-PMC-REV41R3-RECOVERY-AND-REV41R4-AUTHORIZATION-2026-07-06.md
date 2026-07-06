# PMC REVIEW — T4-010 Revision 41r3 Recovery and Revision 41r4 Authorization

## Verdict

`PMC_CONTINUATION_APPROVED — REV41R3 TERMINAL / REV41R4 REVIEW_ONLY`

Human Owner explicitly directed PMC to resolve the Reviewer timeout, restore progress, and resume the Hermes cron. Revision 41r3 remains terminal immutable infrastructure evidence; PMC authorizes one fresh bounded review lifecycle continuation using revision 41r4.

## Root Cause and Fix Evidence

Reviewer run #173 did not fail a business Acceptance Criterion. It exhausted the old `1800s` runtime after 77 completed model API calls and 91 tool calls; completed API latency totaled 1620.9 seconds. The old runtime had no soft deadline, verification-call cap, provisional REVIEW checkpoint, or finalization-only tool narrowing.

The cause is fixed in installed Hermes:

- `INDEPENDENT_REVIEW_ONLY` receives a 600-second finalization reserve and 24-call verification cap;
- soft deadline or cap narrows tools to `write_file`, `kanban_block`, `kanban_complete`, and `kanban_comment`;
- Reviewer SOUL requires a provisional BLOCKED REVIEW before expensive checks and bounded batched verification;
- durable `blocked` and `done` transitions stop further provider calls.

Fresh verification on 2026-07-06:

- installed targeted tests: `5 passed`;
- project runtime tests: `37 passed`;
- role verifier: `ROLE_CONTRACTS_OK`;
- project-owned patch classifier: `HERMES_RUNTIME_PATCH_APPLIED`;
- canonical Reviewer SOUL SHA256: `0BA4A86E905F65384F5AB9C44322FACD39E7477BFC43C879BDD08DA6C14824AA`;
- Gateway PID `31496` healthy with active ticker;
- Kanban has no ready/running/review worker; rev41r3 Coordinator is done, Reviewer is blocked, and dependent HANDOFF is inert `todo` behind the blocked Reviewer.

## Revision 41r3 Closure

- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r3`
- Verdict: `PMC_BLOCKED — INFRASTRUCTURE_BLOCKED / TERMINAL`
- Failure fingerprint: `REV41R3_REVIEWER_TIMEOUT_WITHOUT_REVIEW`
- Old cards: Coordinator `t_7ab33875`, Reviewer `t_2c2f6842`, HANDOFF `t_588bd58e`

These cards, runs, sessions and idempotency keys are terminal/non-reusable. No retry, claim, promote, unblock, reparent, delete or mutation is authorized.

## Revision 41r4 Authorization

- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-06-41r4`
- Task: `ai/tasks/todo/TASK-T4-010-UNIT-B-REV41R4.md`
- Action: `REVIEW_DISPATCH_ONLY`
- Coordinator: `revid-pm`
- Reviewer: `revid-reviewer`
- Business writes/re-execution: forbidden
- Inherited fingerprints: rev41r1, rev41r2 and rev41r3
- Stop After: `T4_010_HANDOFF_READY_REV41R4`

This is a lifecycle continuation, not business attempt 2 and not PMC PASS. Final acceptance still requires Independent REVIEW, canonical HANDOFF and fresh PMC verification.

## Human Decision

`NO FURTHER DECISION REQUIRED`. The Human Owner has authorized recovery and cron resume. PMC may publish rev41r4 and activate the existing Revid Scheduled Supervisor job after Queue consistency verification.
