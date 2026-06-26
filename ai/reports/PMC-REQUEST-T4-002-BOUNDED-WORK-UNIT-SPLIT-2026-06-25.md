# T4-002 PMC Request — Bounded Work Unit Split Approval

**Date:** 2026-06-25
**From:** revid-pm (Hermes runtime owner)
**To:** Codex Project Master Controller
**Related:**
- `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV10-2026-06-25.md`
- `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-2026-06-25.md` (revision -08 diagnostic)
- `ai/reviews/REVIEW-T4-002-PMC-FINAL-ATTEMPT-BLOCKED-2026-06-25.md`
- `ai/reviews/REVIEW-T4-002-PMC-CONTINUATION-APPROVAL-2026-06-25.md`

---

## 1. Problem Statement

T4-002 has been blocked for ~15 hours across 4 revisions (-07, -08, -09, -10) due to a **structural scheduling defect** in the Hermes dispatcher:

- The Coordinator consumes the full 900s runtime budget while waiting for the Executor to produce evidence.
- When the Coordinator times out, it enters `blocked` state.
- The Executor's retry policy requires the parent to be `done` or `blocked` → but `blocked` triggers `parents_not_done` rejection.
- The Executor crashes without producing REPORT/REVIEW/HANDOFF.

**The 1800s budget requested by PMC in the continuation approval was NOT applied.** Both Coordinator and Executor timed out at ~900s.

**No business evidence has been produced.** Zero REPORT, zero Independent REVIEW, zero HANDOFF from any revision.

---

## 2. Runtime Diagnostics Summary

See `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV10-2026-06-25.md` for full diagnostics.

**Key findings:**
1. Coordinator must be short-lived: dispatch → done within 120s.
2. The 900s wall-clock limit is insufficient for the full T4-002 workload (estimated 45-50 min).
3. The 1800s budget was not propagated to the dispatcher.
4. Same-profile runtime health is confirmed: Python 3.11.15, file I/O, 10s sustained heartbeat, AST parse of both allowed files — all passed.

**Verdict:** `STILL_INFRA_BLOCKED — NEEDS_BOUNDED_WORK_UNIT_SPLIT`

---

## 3. Proposed Solution: Bounded Work Unit Split

Split T4-002 into 5 sequential units. Each unit:
- Has its own Coordinator (short-lived, ≤ 120s)
- Completes within 800s wall-clock time
- Produces PLAN/PROGRESS/REPORT evidence
- Inherits all inherited failure fingerprints
- Does NOT clear or replace any previous fingerprints

### Unit A: Static Fixes (proposed next step)

**Scope:** Fix the 5 semantic defects identified by the final blocked PMC review and the fresh static audit. No MySQL connection required.

**Defects to fix (from `REVIEW-T4-002-PMC-FINAL-ATTEMPT-BLOCKED-2026-06-25.md`):**

| # | Defect | File | Severity |
|---|--------|------|----------|
| 1 | `missing-source` validation gated behind MySQL secret setup | `migrate_sqlite_to_mysql.py` | P0 |
| 2 | AC12 cleanup failure patch targets `__main__` binding, not actual import binding | `test_migration_tool.py` | P0 |
| 3 | `_setup_test_db()` swallows `RuntimeError` / `ConnectionError` | `migrate_sqlite_to_mysql.py` | P1 |
| 4 | IDENTITY mismatch (same-PK different-value) not detected before silent overwrite | `migrate_sqlite_to_mysql.py` | P1 |
| 5 | Partial rollback not verified (mid-batch failure leaves partial commits) | `test_migration_tool.py` | P1 |

**Deliverables:**
- PLAN: `ai/tasks/doing/TASK-T4-002-UNIT-A-PLAN.md`
- PROGRESS: `ai/tasks/doing/TASK-T4-002-UNIT-A-PROGRESS.md` (before/after diff for each fix)
- REPORT: `ai/reports/REPORT-T4-002-UNIT-A.md` (AST parse, `git diff --check`, coverage of all 5 defects)

**Time estimate:** 600s (10 min) — well within 900s limit.

**Allowed files:** `backend/scripts/migrate_sqlite_to_mysql.py`, `backend/tests/test_migration_tool.py`

### Full Split Overview

| Unit | Scope | Time | MySQL Required | Depends On |
|------|-------|------|----------------|------------|
| **A** | Static fixes (5 defects) | 10 min | ❌ | None |
| **B** | Same-PK + Rollback unit tests | 10 min | ❌ | Unit A |
| **C** | Disposable MySQL integration tests | 13 min | ✅ | Unit B |
| **D** | REPORT consolidation | 5 min | ❌ | Unit C |
| **E** | Independent REVIEW + HANDOFF | 10 min | ❌ | Unit D |

---

## 4. Requested Actions

### 4.1 Approve the Bounded Work Unit Split

Please approve splitting T4-002 into Units A-E as described above. This replaces the single-attempt model that has failed 4 times.

### 4.2 Approve Unit A as the First Executable Revision

Request a new Queue revision for **Unit A only**. This revision:
- Is a **continuation of attempt 1** (not attempt 2)
- Covers only the static fixes in Unit A
- Does NOT require MySQL credentials
- Produces PLAN/PROGRESS/REPORT evidence
- Inherits all inherited failure fingerprints:
  - `PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout`
  - `T4-002-SEMANTICS: IDEMPOTENCY + FALSE_POSITIVE + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE`
  - `T4-002-ATTEMPT1-STATIC: SECRET_BEFORE_SOURCE + INEFFECTIVE_PATCH_BINDING + CLEANUP_SWALLOWED`
  - `COORDINATOR_TIMEOUT_DEADLOCK: parent_timed_out blocks executor_retry`

### 4.3 Confirm Coordinator Short-Lifecycle Policy

Please confirm that future Coordinators for T4-002 units should:
1. Complete dispatch within 120s
2. Immediately transition to `done` after dispatching Executor
3. NOT monitor Executor heartbeats (Executor is independent)
4. NOT consume the 900s budget while waiting for Executor

This is a **runtime dispatcher configuration change**, not a business decision.

---

## 5. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Unit A fixes are incomplete | Each unit produces its own REPORT; Unit B/C verify integration |
| Unit C fails (MySQL unavailable) | Unit C is explicitly gated on `REVID_TEST_MYSQL_ADMIN_URL`; if missing, Unit C is BLOCKED but A+B remain valid |
| Coordinator still times out | With 120s dispatch + 800s budget per unit, Coordinator has 900s total — sufficient for dispatch + Unit work |
| Fingerprints are lost | Explicitly listed in Section 4; Unit A PLAN must declare inheritance |

---

## 6. What This Does NOT Request

- ❌ No business scope change
- ❌ No attempt 2
- ❌ No new Task, Phase, or ADR
- ❌ No secret changes or database modifications
- ❌ No automatic task advancement (T4-003 still blocked until T4-002 HANDOFF)
- ❌ No modification of CURRENT.md, ROADMAP.md, or Queue

---

## 7. Summary

| Item | Status |
|------|--------|
| Problem | Structural scheduling defect: Coordinator timeout → Executor retry blocked |
| Evidence | `DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV10-2026-06-25.md` |
| Solution | Split T4-002 into 5 bounded work units (A/B/C/D/E) |
| Next step | Approve Unit A as first executable revision |
| Runtime config | Coordinator must be short-lived (≤ 120s), dispatch → done |
| Fingerprints | All 4 inherited fingerprints preserved |

**Classification:** PMC decision required on (1) bounded work unit split, (2) Unit A approval, (3) coordinator lifecycle policy.

---

**Prepared by:** revid-pm (Hermes runtime owner)
**Timestamp:** 2026-06-25T18:45:00+08:00
**Secrets:** None included
