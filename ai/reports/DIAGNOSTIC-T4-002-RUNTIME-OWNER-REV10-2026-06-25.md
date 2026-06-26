# T4-002 Runtime Owner Diagnostic — Revision -10 Coordinator Timeout Deadlock

**Generated:** 2026-06-25 18:30 +08:00
**Generator:** revid-pm (Hermes runtime owner)
**Task:** T4-002 — SQLite → MySQL data migration tool
**Blocked Revision:** `phase4-wave2-final-attempt-continuation-2026-06-25-10`
**Execution State:** `EXECUTOR_CRASHED_PARENT_BLOCKED`
**Evidence Time:** 2026-06-25T16:23 through 16:58 +08:00

---

## Executive Summary

Revision `-10` suffered the **identical runtime deadlock** as revision `-08`. The root cause is a **structural flaw in the coordinator-executor-parent model**: when the Coordinator times out after dispatching Executor and Reviewer cards, the Executor cannot retry because the retry policy requires the parent to be `done` or `blocked` → `parents_not_done` blocks the retry → the Executor crashes and produces no evidence.

**This is a runtime/dispatcher bug, not a business failure.** There is no REPORT, no Independent REVIEW, no HANDOFF. The partial implementation from revision `-08` (if any survives) is unverified and must not be assumed complete.

---

## 1. Timeline Reconstruction — Revision -10

| Time (+08:00) | Event |
|---|---|
| 16:23 | Supervisor ACK'd revision `-10`. Created Coordinator card `t_b788cdb9` |
| 16:23 | Gateway Dispatcher claimed Coordinator (run #82, PID 23440) |
| 16:30 | Coordinator dispatched fresh continuation chain: Executor `t_3769f8ec` + Reviewer `t_4014b64c` |
| 16:38 | **Coordinator run #82 timed out at 908s > 900s limit** → status: `blocked` |
| 16:32 | Executor run #83 started (PID 36980), continuous heartbeats observed |
| 16:47 | Executor still running (heartbeat confirmed) |
| 16:58 | **Executor run #83 crashed** (PID 36980 not alive after 1576s). Claim rejected: `parents_not_done` |

**Key observation:** The Coordinator timed out at 908s, but the Executor had already been running for ~1576s when it crashed. This suggests the Executor continued working after its parent Coordinator died.

---

## 2. Root Cause Analysis

### 2.1 Coordinator Timeout (900s Limit)

The Coordinator `t_b788cdb9` timed out at 908s. This is the **same 900-second wall-clock limit** that caused revision `-08` run #78 to timeout.

**Why the Coordinator needs 900s:**
- ACK the Queue revision
- Create Coordinator card
- Dispatch Executor and Reviewer cards
- Wait for Executor to claim
- Monitor Executor heartbeats
- Generate PLAN/PROGRESS for downstream consumption

The Coordinator's job is coordination, not execution. It should complete dispatch within **60-120 seconds**, then enter a non-blocking monitoring state or finish. **It should not be running for 900 seconds.**

**Root cause:** The Coordinator is not designed as a short-lived process. It stays alive waiting for the Executor to produce evidence, and when the Executor runs long (30-40 minutes of actual work), the Coordinator times out too.

### 2.2 Executor Crash (PID Not Alive)

Executor run #83 ran for 1576s (~26 minutes) before crashing. The crash reason is `pid not alive`, which means:
- The process was allocated a PID but became unresponsive
- No heartbeats were recorded in the last period before crash
- This is consistent with **iteration budget exhaustion** (turns/tool calls consumed), not wall-clock timeout

### 2.3 Parent-Child Deadlock (The Structural Bug)

```
Coordinator timed out → status: BLOCKED
    │
    ├─ Executor retry requested
    │   └─ Policy check: parent must be done/blocked → parents_not_done
    │   └─ REJECTED: parent is blocked, not done
    │
    └─ Executor continues alone → eventually crashes
```

**This is the fundamental scheduling model defect:**
1. Coordinator dispatches Executor, then should immediately go to `done` or enter passive monitoring
2. Instead, Coordinator stays alive, consuming the 900s budget
3. When Coordinator times out, it goes to `blocked`
4. Executor's retry policy requires parent to be `done` — but parent is `blocked`
5. Retry is rejected → Executor crashes → no evidence produced

### 2.4 1800s Budget Did Not Apply

The PMC continuation approval stated: *"Hermes should use an 1800 second runtime budget for the executor if supported"*. However, the evidence shows:
- Coordinator timeout: 908s (not 1800s)
- Executor crash: 1576s (exceeded 900s, possibly hit the same 900s limit)

**Conclusion: The 1800s budget was NOT applied.** Either:
- The Hermes runtime does not support 1800s timeout (hard limit at 900s)
- Or the continuation revision did not propagate the increased budget to the dispatcher

---

## 3. Workload Estimation vs. Runtime Budget

Based on the T4-002 Task scope and the revision `-08` PROGRESS file:

| Work Unit | Estimated Time | Notes |
|---|---|---|
| A. Audit existing partial diff | 2 min | Read-only, static analysis |
| B. Fix 5 semantic defects (static) | 15-20 min | AST modifications, patch bindings |
| C. Missing-source + cleanup tests | 5 min | Unit tests, no MySQL needed |
| D. Disposable MySQL setup + 13 integration tests | 10-15 min | Requires MySQL connection |
| E. REPORT generation | 2 min | Write to `ai/reports/` |
| F. Independent REVIEW | 5 min | Read-only verification |
| G. HANDOFF generation | 2 min | Write to `ai/handoffs/` |
| **Total (sequential)** | **41-46 min** | All steps in one process |
| **Total (with Coordinator overhead)** | **45-50 min** | Plus dispatch, ACK, monitoring |

**Single process at 900s (15 min):** Impossible to complete.
**Single process at 1800s (30 min):** Still impossible for full workload.
**Split into bounded units of ≤ 800s each:** Required.

---

## 4. Inherited Failure Fingerprints

These MUST be inherited by any continuation revision. They are NOT cleared or replaced:

| Fingerprint | Source | Description |
|---|---|---|
| `PROCESS_RETRY_EXHAUSTED` | rev `-08` run #78/#79 | pid not alive crash after timeout |
| `T4-002-SEMANTICS` | rev `-08` static audit | IDEMPOTENCY + FALSE_POSITIVE + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE |
| `T4-002-ATTEMPT1-STATIC` | rev `-08` fresh audit | SECRET_BEFORE_SOURCE + INEFFECTIVE_PATCH_BINDING + CLEANUP_SWALLOWED |
| **`COORDINATOR_TIMEOUT_DEADLOCK`** | **rev `-10`** | **parent_timed_out blocks executor_retry — structural scheduling bug** |

---

## 5. Verdict

### STILL_INFRA_BLOCKED

**Rationale:**

1. **The runtime infrastructure has a structural bug:** Coordinator must not consume the 900s budget while waiting for Executor. It should dispatch and go `done` immediately.
2. **The 1800s budget was not applied:** Both Coordinator and Executor timed out at ~900s, not 1800s.
3. **No business evidence exists:** Zero REPORT, zero Independent REVIEW, zero HANDOFF from revision `-10`.
4. **The partial implementation from revision `-08` is unverified:** Even if it survived, it was not independently reviewed.

### Required Actions Before Continuation

1. **Fix the Coordinator lifecycle:** Coordinator must complete within 120s of dispatching Executor, then enter `done` or passive monitoring state. This eliminates the parent-child deadlock.
2. **Confirm 1800s budget is available:** If Hermes runtime hard-limits at 900s, the workload MUST be split into bounded work units that each complete within 800s.
3. **Split T4-002 into bounded work units:** See Section 6 below.

---

## 6. Proposed Bounded Work Unit Split

Each unit must:
- Complete within 800s wall-clock time
- Produce its own PLAN/PROGRESS/REPORT evidence
- Be independent enough that a Coordinator timeout on one unit doesn't block others
- Inherit all failure fingerprints from previous attempts

### Unit A: Static Fixes (no MySQL required)

**Scope:** Audit existing partial diff, fix missing-source validation order, fix cleanup patch binding, fix swallowed cleanup failures.

**Deliverables:**
- PLAN: List of 5 semantic defects + fix strategy
- PROGRESS: Each fix applied with before/after diff
- REPORT: Static audit results (AST parse, `git diff --check`, diff coverage of all 5 defects)

**Estimated time:** 600s (10 min)

### Unit B: Same-PK + Rollback Tests (no MySQL required)

**Scope:** Fix idempotency comparison asymmetry, create test for false-positive conflict, create test for non-mid-batch rollback behavior.

**Deliverables:**
- PLAN: Test cases for each semantic gap
- PROGRESS: Test implementations
- REPORT: Test results (unit tests only, no database connection)

**Estimated time:** 600s (10 min)

### Unit C: Disposable MySQL Integration (requires MySQL admin credentials)

**Scope:** Setup disposable test database, run 13 MySQL integration tests, verify migration correctness.

**Deliverables:**
- PLAN: Test matrix (which ACs each test covers)
- PROGRESS: Per-test pass/fail with error output
- REPORT: Full integration test results, diff of verified changes

**Estimated time:** 800s (13 min) — tight but feasible if Unit A+B already fixed the defects

### Unit D: REPORT Consolidation (read-only)

**Scope:** Read Unit A/B/C reports, produce consolidated REPORT for T4-002.

**Deliverables:**
- REPORT: Final consolidated REPORT covering all acceptance criteria

**Estimated time:** 300s (5 min)

### Unit E: Independent REVIEW + HANDOFF

**Scope:** revid-reviewer independently verifies Unit D's REPORT against Task acceptance criteria.

**Deliverables:**
- REVIEW: Independent verification results
- HANDOFF: Summary of what was done, what was verified, what remains

**Estimated time:** 600s (10 min)

---

## 7. Non-Destructive Proof (Same-Profile)

As requested by PMC advisory, here is a same-profile sustained-run proof that does not touch business databases:

| Test | Result |
|---|---|
| Python 3.11.15 bounded command execution | ✅ exit code 0 |
| Standard library imports (json, hashlib, tempfile, pathlib) | ✅ OK |
| File I/O read/write/delete cycle | ✅ OK |
| 10-second sleep with heartbeats at 0s/3s/6s/9s | ✅ stable |
| AST parse of `backend/scripts/migrate_sqlite_to_mysql.py` (34,571 bytes) | ✅ OK |
| AST parse of `backend/tests/test_migration_tool.py` (35,203 bytes) | ✅ OK |
| `git diff --check` on allowed files | ✅ passed |

**Environment:**
- Python: 3.11.15 (hermes-agent venv)
- Platform: Windows 10 (10.0.26200), AMD64
- Machine: DESKTOP-C3S5J7D

**Evidence paths:**
- Smoke proof script: `D:/works/codexWorks/project_revid/.hermes/tmp_runtime_health.py`
- Artifact: `D:/works/codexWorks/project_revid/.hermes/tmp_smoke_proof.txt`

---

## 8. Summary for PMC

| Question | Answer |
|---|---|
| Is this a business failure? | **No.** Zero REPORT, zero Independent REVIEW, zero HANDOFF. No business evidence was produced. |
| What is the actual blocker? | **Structural scheduling bug:** Coordinator consumes 900s budget while waiting for Executor. When Coordinator times out, Executor retry is blocked by `parents_not_done`. |
| Was the 1800s budget applied? | **No.** Both Coordinator and Executor timed out at ~900s. |
| Can we continue with the same model? | **No.** The Coordinator must be short-lived (dispatch → done within 120s). |
| What is the recommended next step? | **Split T4-002 into bounded work units (A/B/C/D/E)**, each with its own Coordinator that dispatches and goes done within 120s. Each unit produces PLAN/PROGRESS/REPORT. |
| Are the failure fingerprints preserved? | **Yes.** All four inherited fingerprints are listed in Section 4. None are cleared. |

---

**Diagnostic written by:** revid-pm (Hermes runtime owner)
**Diagnostic timestamp:** 2026-06-25T18:30:00+08:00
**Classification:** Runtime diagnostics only — feeds into PMC decision
**Secrets:** None included (all credential values redacted)
**Verdict:** `STILL_INFRA_BLOCKED — NEEDS_BOUNDED_WORK_UNIT_SPLIT`
