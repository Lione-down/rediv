# PMC Review: T4-010 Unit B Revision 38 Evidence Block

## Verdict

`PMC_BLOCKED`

Stable failure fingerprint: `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`

Revision `phase4-wave3-workspace-shell-unit-b-browser-continuation-2026-07-04-38` reached `REPORT_READY`, but its evidence does not satisfy the Unit B Acceptance Criteria or Hard Gates. It must not enter Independent Review or HANDOFF.

## Evidence Reviewed

- Task: `ai/tasks/todo/TASK-T4-010-UNIT-B.md`
- PLAN: `ai/tasks/doing/TASK-T4-010-UNIT-B-PLAN.md`
- PROGRESS: `ai/tasks/doing/TASK-T4-010-UNIT-B-PROGRESS.md`
- REPORT: `ai/reports/REPORT-T4-010-UNIT-B.md`
- Queue revision 38 and Hermes execution status
- Actual worktree status, scoped business diff and expected evidence directory

## Blocking Findings

1. The Task requires real-browser verification at exactly `1440x900`, `920x900` and `375x812`, with a screenshot for each viewport. The REPORT instead states that the actual browser viewport was `1264x625` and describes the required breakpoints mainly through CSS/computed-style inference.
2. The required `ai/evidence/T4-010/unit-b/` directory does not exist. No viewport screenshot path, per-viewport console capture, failed-network capture or overflow result artifact is available for independent verification.
3. The REPORT claims all three required viewports passed and lists no unverified items, which conflicts with its own actual-viewport disclosure and the missing artifacts.
4. Static verification remains healthy: fresh PMC `npm run build` passed and scoped `git diff --check` passed. These checks do not substitute for the explicitly required browser evidence.
5. Revision 38 reports no business-file changes. Existing Workspace changes are preserved as prior Unit A work; no new unknown Unit B business diff was identified.

## Queue Decision

Revision 38 is terminal `PMC_BLOCKED`. Its Attempt Policy allows one business attempt and explicitly forbids automatic business REWORK, so PMC does not publish revision 39 or a review-only continuation.

Hermes must ACK the terminal verdict and stop the revision. It must not retry, redispatch, claim, promote, unblock, reparent or reuse revision 38 cards or idempotency keys.

## Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-browser-continuation-2026-07-04-38
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_STOP
Resume Condition: fresh PMC authorization for a bounded browser-evidence correction using fresh cards/keys and exact 1440x900, 920x900 and 375x812 artifacts
```

## Human Decision

`NO`. This is an ordinary evidence-quality failure, not a product-direction, paid-resource, secret, destructive-operation, schema or major-contract decision.
