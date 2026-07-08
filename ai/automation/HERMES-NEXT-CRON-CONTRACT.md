# Hermes Next Cron Contract

> Contract owner: Codex PMC
> Applicable revision: `phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r1`
> Contract status: `PMC_BLOCKED - RUNTIME POLICY REMEDIATION ONLY`

## Active Wave

| Field | Value |
|---|---|
| Queue Revision | `phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r1` |
| Task ID | `T4-002` |
| Task Path | `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV44.md` |
| Queue Action | `NONE — terminal evidence only` |
| Executor Profile | `revid-pm` |
| Review Profile | `revid-reviewer` |
| Stop After | `RUNTIME_POLICY_REMEDIATION_READY_REV44R1` |
| Expected Hermes Action | `ACK_TERMINAL_VERDICT_AND_STOP` |
| Previous Failure Fingerprint | `REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED` |
| Human Owner Decision | `STRICT_FLOW_CONFIRMED — do not bypass Independent REVIEW or HANDOFF` |
| PMC Review | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV44R1-2026-07-08.md` |
| Runtime Diagnostic Review | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV44R1-2026-07-08.md` |

## Objective

ACK the rev44r1 terminal STOP cursor and provide fresh least-privilege runtime policy remediation evidence for the `revid-pm` role boundary failure.

This Queue must not create an Executor, Reviewer, HANDOFF, replacement lifecycle coordinator, continuation revision, business modification, database action, project card operation, or secret output. Human Owner explicitly chose to keep the rigorous flow, so PMC must not bypass Independent REVIEW or canonical HANDOFF. Rev44 business evidence is already `REPORT_READY` at `ai/reports/REPORT-T4-002-UNIT-C3-REV44.md`, but final acceptance is blocked until a valid Independent REVIEW and HANDOFF exist in a future PMC-authorized continuation.

## Preconditions

- `ai/automation/HERMES-AUTO-QUEUE.md` top revision equals `phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r1` and status is `PMC_BLOCKED`.
- Task file exists at `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV44.md`.
- PMC runtime advisory exists at `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV44R1-2026-07-08.md`.
- Rev44 REPORT exists at `ai/reports/REPORT-T4-002-UNIT-C3-REV44.md`.
- Runtime diagnostic exists at `ai/reports/DIAGNOSTIC-T4-002-REV44R1-RUNTIME-HEALTH-2026-07-09.md`, SHA256 `050D2D9F3D1E7BDB997CE4CB4EA41C846511572E5E4D8D72BCBDF623FCC92F97`, with verdict `STILL_INFRA_BLOCKED`.
- Rev44 Dispatcher `t_04f179d0`, Executor `t_64a40afd`, and rev44r1 Coordinator `t_a2509036` are terminal evidence and must not be reused.
- No ready/running/review T4-002 worker exists for rev44, rev43, rev42, rev36 or earlier Unit C3 revisions.

## Exact Steps

1. Read Queue, this contract, rev44 Task, rev44 REPORT, PMC runtime advisory, CURRENT, ROADMAP, and Hermes-owned execution status.
2. Validate the Queue top revision, Task path, terminal Action, Expected Hermes Action, Stop After and failure fingerprint match this contract.
3. Update only Hermes-owned status fields so the same revision/fingerprint records `PMC Verdict Confirmation: ACK_TERMINAL_VERDICT_AND_STOP` in all terminal confirmation locations.
4. Remove or correct future-dated transition/due/generated cursor values; status ordering evidence must not be later than the actual write/read time and diagnostic due must not be treated as an active future SLA after `DIAGNOSTIC_READY`.
5. Preserve the diagnostic path/hash and verdict `STILL_INFRA_BLOCKED` as terminal evidence; do not convert it into `READY_FOR_CONTINUATION`.
6. Implement or prove a least-privilege policy path for `revid-pm / REVIEW_DISPATCH_ONLY` using bounded Kanban lifecycle capabilities, not unrestricted `terminal`.
7. Provide fresh evidence, preferably a non-destructive same-profile smoke, showing exactly one Reviewer child and one dependent `HANDOFF_ONLY` child can be created and terminalized without business writes, database access, secret output, or historical card reuse.
8. Return exactly `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED`, or `NEEDS_HUMAN_DECISION` with evidence path/hash.
9. Stop and return control to Codex PMC.

## Deterministic Branch Table

| Condition | Action |
|---|---|
| Queue revision/action/profile/Task mismatch | `STATE_CONFLICT`; do not create cards |
| Queue Expected Hermes Action is not `ACK_TERMINAL_VERDICT_AND_STOP` | `STATE_CONFLICT`; do not create cards |
| Task, REPORT or PMC runtime advisory missing | `STATE_CONFLICT`; do not create cards |
| Existing rev44r1 Coordinator is blocked with same fingerprint | Keep terminal; do not create duplicate cards |
| Status still uses non-STOP terminal confirmation or future-dated cursor fields | Canonicalize Hermes-owned status; do not create cards |
| Remediation proves role boundary fixed and same-profile lifecycle can safely proceed | `READY_FOR_CONTINUATION`; return evidence to PMC |
| Remediation cannot prove safe lifecycle continuation | `STILL_INFRA_BLOCKED`; keep Queue non-executable |
| Diagnostic requires product direction, paid resource, new secret, irreversible operation, or major contract change | `NEEDS_HUMAN_DECISION`; include exact reason |
| Secret would be printed, hashed, persisted or inferred | `SECURITY_BLOCKED` |
| Any database action would be required for diagnostic | `SECURITY_BLOCKED`; diagnostic must avoid database access |

## Forbidden Actions

- Do not create a `DISPATCH_ONLY`, `IMPLEMENT_AND_TEST_ONLY`, `INDEPENDENT_REVIEW_ONLY`, `HANDOFF_ONLY`, or replacement `REVIEW_DISPATCH_ONLY` stage.
- Do not modify `backend/settings/config.py`, `backend/tests/test_migration_tool.py`, migration code, frontend, schema, Queue history, CURRENT, ROADMAP, Task, REPORT, PMC REVIEW, Reviewer output or HANDOFF.
- Do not create, retry, claim, promote, unblock, reparent, archive or delete rev44r1, rev44, rev43, rev42, rev36 or other historical cards.
- Do not read any secret file.
- Do not print, hash, persist or infer credentials.
- Do not touch `revid_db` or any database.
- Do not clear inherited fingerprints.

## Completion Evidence

Hermes must record in `HERMES-EXECUTION-STATUS.md`:

- `PMC Verdict Confirmation: ACK_TERMINAL_VERDICT_AND_STOP` in all terminal confirmation fields.
- Runtime advisory revision/fingerprint/path/SHA256 matching `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV44R1-2026-07-08.md`.
- Runtime diagnostic path/hash/verdict matching the existing `STILL_INFRA_BLOCKED` diagnostic, with no active future SLA.
- Fresh remediation verdict `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED`, or `NEEDS_HUMAN_DECISION`.

## Stop Condition

Stop after status canonicalization and runtime policy remediation evidence are ready. Do not mark PMC PASS, archive the Task, select T4-003, publish another Queue, create project cards, or run review lifecycle without Codex PMC final acceptance or fresh continuation approval.
