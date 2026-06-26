# REVIEW-T4-002 PMC — Unit A Correction Final Acceptance

## Verdict

`PMC_BLOCKED`

## Task

- Task ID: `T4-002`
- Queue Revision: `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`
- Execution State Read: `HANDOFF_READY`
- Executor Card: `t_3edc9fc9`
- Reviewer Card: `t_c1f5c0b8`
- Handoff Card: `NONE`
- Evidence paths:
  - `ai/reports/REPORT-T4-002-UNIT-A.md`
  - `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md`
  - `ai/handoffs/HANDOFF-T4-002-UNIT-A.md`

## Authorization

Revision `-13` is authorized only for the narrow Unit A correction:

1. missing-source must be visible before the secret gate;
2. AC12 cleanup patch must hit the actual callable binding;
3. Unit A evidence mismatch must be corrected.

The revision remains business attempt `1` continuation. Attempt `2` is prohibited. Unit B, MySQL, secrets, `.env`, CREATE/DROP/TRUNCATE/DELETE and migration writes are still out of scope.

## Fresh Verification

PMC ran fresh read-only/static verification:

| Check | Result |
|---|---|
| `python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py` | PASS |
| `python backend/scripts/migrate_sqlite_to_mysql.py --dry-run --source __missing__.db` | PASS: returned non-zero with `Source SQLite database not found` before secret gate |
| `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py` | PASS, CRLF warning only |
| Scope audit | PASS: current business diff is limited to the two Unit A allowed files |
| Secret/destructive audit | PASS for this verification: no MySQL connection, no `.env`, no destructive operation |

PMC accepts that the two code-level correction defects appear fixed in the current diff.

## Blocking Findings

### P0 — REPORT and HANDOFF do not belong to revision `-13`

`ai/reports/REPORT-T4-002-UNIT-A.md` still declares:

```text
Queue Revision
phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12
```

`ai/handoffs/HANDOFF-T4-002-UNIT-A.md` also still declares revision `-12`.

This violates the final acceptance requirement that REPORT, Independent REVIEW and HANDOFF belong to the same revision and attempt. It also violates the Queue future completion gate requiring Unit A correction REPORT to use new revision `-13` evidence and not overwrite or reuse revision `-12` evidence as the correction handoff.

### P0 — Handoff chain is incomplete

`HERMES-EXECUTION-STATUS.md` reports:

```text
Handoff Card | NONE (Coordinator did not create HANDOFF card)
Handoff File | ai/handoffs/HANDOFF-T4-002-UNIT-A.md (exists, references revision -12)
```

PMC cannot treat a revision `-12` handoff file plus no revision `-13` handoff card as final acceptance evidence for revision `-13`.

### P1 — Reviewer downgraded a hard gate to non-blocking

`ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md` correctly observes that required evidence files still reference revision `-12`, but marks this as non-blocking. For PMC final acceptance this is blocking because the operating model requires artifact revision/attempt consistency before PASS.

### P2 — Execution timestamp anomaly

`HERMES-EXECUTION-STATUS.md` reports `Last Updated | 2026-06-27 09:58:00 UTC`, while this PMC automation run is on 2026-06-26. This is not the primary blocker, but Hermes runtime owner should explain or correct the timestamp source in the next evidence update.

## PMC Decision

`PMC_BLOCKED`, not `PMC_PASS`.

Reason: Unit A correction code appears fixed, but the formal evidence chain is not revision-consistent. Passing this would allow Unit B dispatch from a stale revision `-12` handoff, which breaks the project state machine and evidence ownership rules.

## Required Next Action

Hermes/revid-pm must provide fresh revision `-13` evidence without creating business attempt `2` and without touching business code unless Codex PMC explicitly authorizes it.

Required evidence:

1. A revision `-13` REPORT or explicit correction report that names `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`, business attempt `1` continuation, and both allowed files.
2. A revision `-13` HANDOFF or explicit correction handoff that names the same revision/attempt and does not claim Unit B is authorized before PMC PASS.
3. Execution status or handoff metadata that explains whether `Handoff Card | NONE` is expected, and if not, provides the correct revision `-13` handoff card/result.
4. Timestamp source correction or explanation for the `2026-06-27 09:58:00 UTC` status value.

## Prohibitions

- Do not dispatch Unit B.
- Do not create attempt `2`.
- Do not use a new Queue revision to clear the inherited failure fingerprint.
- Do not modify MySQL, secrets, `.env`, migration state, or run destructive tests.
- Do not reuse revision `-12` HANDOFF as revision `-13` PASS evidence.

## Unblock Condition

PMC can resume final acceptance only after revision `-13` REPORT/REVIEW/HANDOFF evidence is internally consistent and points to the same revision and attempt.
