# PMC REVIEW — T4-010 Revision 41r5 HANDOFF Policy and Revision 41r6 Authorization

## Verdict

`PMC_CONTINUATION_APPROVED — REV41R5 REVIEW PASS / REV41R6 HANDOFF CLOSURE`

Rev41r5 Reviewer `t_26fc11ff` run #177 completed PASS in 524s. Consolidated REVIEW independently verifies the missing 920x900、375x812、zero-request and NButton console evidence, while freshness-checking rev41r4 static/build/hash results.

Dependent HANDOFF `t_b4e90e51` run #178 failed closed in 38s with `ROLE_BOUNDARY_VIOLATION: terminal`. Root cause: the HANDOFF contract required real SHA256, but `HANDOFF_ONLY` had no hash capability and correctly prohibited general terminal access.

## Least-Privilege Fix

Installed Hermes now provides `file_sha256(path)`:

- read-only SHA256 for regular files;
- path must remain inside the task workspace;
- existing protected-file read guard applies;
- only `revid-pm / HANDOFF_ONLY` receives the tool;
- terminal/process/browser/network/arbitrary-code remain forbidden.

Verification: file hash regressions `2 passed`; combined installed targeted `8 passed`; project runtime `37 passed`; `ROLE_CONTRACTS_OK`; patch classifier `APPLIED`; durable patch SHA256 `18D8A6B46BB5065C2B8C1D25301C9ACA21E6A692E09A1B1584BC16C66292F1B2`; Gateway PID `24184`; cron active.

## Revision 41r6 Authorization

One fresh lifecycle continuation is authorized. The Reviewer only re-attests the existing consolidated PASS and must not rerun browser/build or overwrite REVIEW. The dependent HANDOFF must use `file_sha256` for REPORT/REVIEW hashes and write the canonical HANDOFF. No business execution or code change is authorized.

## Human Decision

`NO FURTHER DECISION REQUIRED`. This closes the runtime/tool-policy defect under the Human Owner's explicit recovery instruction.
