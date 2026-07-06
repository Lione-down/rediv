# PMC REVIEW — T4-010 Revision 41r4 Browser Cap and Revision 41r5 Authorization

## Verdict

`PMC_CONTINUATION_APPROVED — REV41R4 TERMINAL / REV41R5 BROWSER_REVIEW_ONLY`

## Revision 41r4 Result

Revision 41r4 proved the no-verdict timeout remediation works:

- Reviewer `t_eb522d66` run #175 wrote provisional REVIEW before expensive verification;
- it terminalized `BLOCKED` in `397s`, not `timed_out`;
- final REVIEW exists with fingerprint `REV41R4_MISSING_VIEWPORT_920X900_AND_375X812_BROWSER_VERIFICATION`;
- static analysis、build、diff scope、protected hashes、source audit、REPORT evidence consistency and 1440x900 browser verification passed;
- missing scope is exactly 920x900、375x812、missing-project zero-request and cross-viewport NButton console evidence.

Revision 41r4 Coordinator `t_f2f5ea0d`, Reviewer `t_eb522d66`, HANDOFF `t_eab42144`, runs and keys are terminal/non-reusable.

## Runtime Calibration

The `24`-call cap was calibrated against a simple smoke and is insufficient for the real three-viewport review. PMC raises only the Reviewer verification cap to `48`; the independent 1200-second soft deadline and 600-second finalization reserve remain unchanged, so hard-timeout/no-verdict protection is preserved.

Fresh verification:

- installed targeted tests: `6 passed`;
- project runtime tests: `37 passed`;
- `ROLE_CONTRACTS_OK`;
- patch classifier: `HERMES_RUNTIME_PATCH_APPLIED`;
- durable patch SHA256: `782B33CA43D71F155F1EB076E33743DEDD7C73A53F2296B9178492AE2C614C6A`;
- canonical/deployed Reviewer SOUL SHA256: `4E3CB816663533AA50EB126265A8F9459873871C279DBB1C6E8BDCA67A68DADA`;
- Gateway clean restart PID `27328`;
- Revid cron remains active at `15,45 * * * *`.

## Revision 41r5 Authorization

PMC authorizes one fresh browser-review-only continuation:

- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-browser-review-closure-2026-07-06-41r5`
- Task: `ai/tasks/todo/TASK-T4-010-UNIT-B-REV41R5.md`
- Action/Profile: `REVIEW_DISPATCH_ONLY / revid-pm`, then one `revid-reviewer`
- Scope: freshness guard plus only the missing 920x900、375x812、zero-request and NButton console checks
- Business writes/re-execution: forbidden
- Stop After: `T4_010_HANDOFF_READY_REV41R5`

This is lifecycle evidence closure, not business attempt 2 and not PMC PASS. Final acceptance still requires consolidated Reviewer PASS, canonical HANDOFF and PMC verification.

## Human Decision

`NO FURTHER DECISION REQUIRED`. This bounded correction is within the Human Owner's explicit direction to resolve the timeout and restore normal Hermes progress.
