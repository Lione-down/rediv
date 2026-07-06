# PMC REVIEW — T4-010 Revision 41r1 revid-pm Policy Remediation

## Verdict

`PMC_RUNTIME_REMEDIATION_DEPLOYED — FRESH DIAGNOSTIC STILL REQUIRED`

Human Owner explicitly authorized the minimum `search_files` capability required by `revid-pm / REVIEW_DISPATCH_ONLY`. The canonical and deployed action policy omitted that tool, so runtime correctly blocked run #169 with `ROLE_BOUNDARY_VIOLATION`.

## Remediation

- Added `search_files` only to `revid-pm.REVIEW_DISPATCH_ONLY`.
- Kept `HANDOFF_ONLY` unchanged.
- Did not grant `write_file`, `terminal`, `process`, browser, web, memory, delegation or unrestricted fallback to review dispatch.
- Updated canonical/deployed SOUL wording to restrict search to card-bounded project evidence and prohibit secret, user-directory or project-external discovery.
- Restarted Gateway after deployment; active PID is `2308`.

## Verification

- RED regression before fix: `1 failed, 7 passed` at the missing `search_files` assertion.
- Targeted post-fix tests: `17 passed`.
- Full runtime suite: `34 passed`.
- Role verifier: `ROLE_CONTRACTS_OK`.
- Deployed resolver smoke: `REVID_PM_POLICY_SMOKE_OK`; `REVIEW_DISPATCH_ONLY` resolves 9 tools with exactly one `search_files`; `HANDOFF_ONLY` resolves 7 tools without it; missing Action remains fail-closed.
- `git diff --check`: passed.

## Runtime Boundary

No Kanban card was created, retried, claimed, promoted, unblocked or reused. Existing `t_08bb42c8` and runs #168/#169 remain terminal evidence. No business code, execution status, Independent REVIEW or HANDOFF was modified.

## Next Gate

Hermes runtime owner must now reconcile the existing rev41r1 advisory ACK and produce a fresh diagnostic for fingerprint `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`. A bounded fresh same-profile lifecycle smoke may be used by Hermes, but only outside the Revid business board. PMC will consider a new lifecycle continuation only after diagnostic verdict `READY_FOR_CONTINUATION` proves the complete Reviewer/HANDOFF child-creation contract.

## Human Decision

`NO` further decision required. The authorized capability has been deployed within least privilege.
