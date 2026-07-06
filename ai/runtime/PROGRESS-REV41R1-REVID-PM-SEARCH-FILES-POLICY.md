# Rev41r1 revid-pm search_files Policy Remediation Progress

## Status

`COMPLETE`

## Completed

- Confirmed run #169 failed because `search_files` was denied for `revid-pm / REVIEW_DISPATCH_ONLY`.
- Confirmed canonical verifier and deployed profile policy both omit `search_files` while `ROLE_CONTRACTS_OK` passes, proving the omission is desired-state drift rather than a failed deployment.
- Defined least-privilege scope and regression criteria in the plan.
- Added RED regression: initial result `1 failed, 7 passed`, proving canonical `REVIEW_DISPATCH_ONLY` lacked `search_files`.
- Added `search_files` only to canonical and deployed `REVIEW_DISPATCH_ONLY`; `HANDOFF_ONLY` remains unchanged.
- Updated the project and deployed `revid-pm` SOUL to constrain search to bounded card evidence and forbid project-external/secret discovery.
- Targeted tests: `17 passed`.
- Full `ai/runtime/tests`: `34 passed`.
- Role verifier: `ROLE_CONTRACTS_OK`.
- Gateway restart: clean drain/start, PID `2308`.
- Direct deployed resolver smoke: `REVID_PM_POLICY_SMOKE_OK`; review tool count `9`, handoff tool count `7`; missing Action still fail-closed.
- `git diff --check`: passed.

## Remaining Governance Gate

Existing rev41r1 cards/runs remain terminal and immutable. Hermes must produce the same-revision/same-fingerprint ACK and fresh runtime diagnostic before PMC can authorize a fresh lifecycle continuation.
