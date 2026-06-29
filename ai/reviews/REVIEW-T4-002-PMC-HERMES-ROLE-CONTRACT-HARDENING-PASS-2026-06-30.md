# PMC REVIEW — Hermes Role Contract Hardening

## Verdict

`PMC_PASS` for the runtime remediation only. This is not T4-002 business acceptance and does not reactivate revision `26r1`.

## Evidence

- Root-cause and runtime report: `ai/reports/REPORT-HERMES-ROLE-CONTRACT-HARDENING-2026-06-30.md`
- Plan/progress: `ai/runtime/PLAN-HERMES-ROLE-CONTRACT-HARDENING-2026-06-29.md`, `ai/runtime/PROGRESS-HERMES-ROLE-CONTRACT-HARDENING-2026-06-29.md`
- Contract verifier: `ai/runtime/verify-hermes-role-contracts.py`
- Runtime regressions: 105 affected Hermes tests passed; 11 project tests passed; all isolated positive/negative Action smokes passed.
- Gateway health: clean restart and running PID `21220`.

## Acceptance

- Queue `REVIEW_DISPATCH_ONLY` can no longer silently become a persisted `DISPATCH_ONLY` card through the project launcher.
- Missing, duplicate, unknown, and cross-role Actions fail before spawn for all five profiles.
- PM no longer owns initial Executor dispatch; Executors and Reviewer cannot create worker cards.
- Child Action/profile/revision/retry contracts are runtime-enforced, not prompt-only.
- Review dispatch below 180 seconds is rejected before card creation.
- Historical failure fingerprints and terminal cards remain intact.

## Remaining gate

`SECURITY_ROTATION_REQUIRED`: a profile credential appeared in private audit output. Do not publish revision `26r2` or resume Revid scheduled execution until Human Owner rotates it and a fresh `ROLE_CONTRACTS_OK` check passes. No credential value is stored in this review.

## PMC continuation condition

After rotation, PMC may publish one fresh `REVIEW_DISPATCH_ONLY` lifecycle revision with new card/idempotency keys, `revid-pm`, coordinator budget at least 180 seconds, `max_retries=2`, and the existing revision 26 REPORT as immutable evidence. Executor re-execution remains forbidden.
