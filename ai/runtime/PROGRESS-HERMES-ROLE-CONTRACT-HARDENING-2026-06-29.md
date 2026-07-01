# Hermes Role Contract Hardening Progress

- [x] Reproduced revision 26r1 persisted action mismatch.
- [x] Compared failed run 126 with successful review-dispatch run 110.
- [x] Audited Supervisor prompt, launcher, installed runtime and five profile policies.
- [x] Identified missing Executor/Reviewer runtime policies and `max_retries` propagation gap.
- [x] Add RED regression matrix.
- [x] Implement canonical role registry and action-aware launcher.
- [x] Implement Supervisor routing and documentation alignment.
- [x] Implement runtime child-contract enforcement and retry persistence.
- [x] Deploy and verify five profile boundaries.
- [x] Run targeted/full tests and isolated smokes.
- [x] Write runtime REPORT and PMC verdict.
- [x] Restore and verify Chinese Human Owner delivery rules after the English-only SOUL regression.
- [x] Resolve the updater stash conflict and package a repeatable post-update runtime deployment.
- [x] Reload Gateway and rerun fresh Action/profile smokes after durability closure.

Current state: `COMPLETE — READY_FOR_CONTINUATION (runtime)`; executable Queue remains withheld only by `SECURITY_ROTATION_REQUIRED`.
