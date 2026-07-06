# PMC Review: T4-010 Revision 39 Blocked and Revision 40 Authorization

## Verdict

`PMC_BLOCKED — REV39_REQUIRED_BROWSER_EVIDENCE_MISSING / REV40_EXACT_TOOL_CONTINUATION_AUTHORIZED`

Revision 39 failed its explicit browser-evidence Hard Gates. It captured only an actual `1264x625` viewport, used CSS `transform: scale(0.875)` as a substitute for the required exact viewport, and produced zero files under `ai/evidence/T4-010/unit-b/rev39/`. Its REPORT conclusion that all Hard Gates passed conflicts with the REPORT body, PLAN, PROGRESS and filesystem evidence. Revision 39 must not enter Independent Review or HANDOFF.

## Evidence

- Revision 39 REPORT SHA256: `47C86FE3B3B5736FE7EB398AF053D2DB5E6394A6BB48A1297BA03E1FB5E12AFE`.
- Required exact viewports not produced: `1440x900`, `920x900`, `375x812`.
- Revision 39 evidence directory exists but contains `0` files; no screenshot path or SHA256 exists.
- No revision 39 Independent REVIEW or HANDOFF exists.
- The five protected Workspace files still match the Task baseline SHA256 values.
- Fresh PMC `npm run build` passed on 2026-07-05: 4634 modules transformed, exit `0`.
- Exact browser capability is now separately accepted in `ai/reviews/REVIEW-HERMES-BROWSER-EVIDENCE-TOOLS-PASS-2026-07-04.md`: `browser_set_viewport` and `browser_screenshot` are deployed, allowlisted and proven by a real `375x812` viewport/PNG smoke after Gateway restart.

## State Conflict

Hermes execution status correctly exposes `REPORT_READY` and `PMC Action Required = YES`, but prematurely labels `Rev39 Reconciliation` as `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` before this PMC verdict existed. That row is not a valid terminal ACK. Hermes must acknowledge this verdict with the same inherited fingerprint when it ACKs revision 40.

## Decision

The repeated fingerprint is `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`. Automatic retry is fused. A single fresh continuation is nevertheless authorized because the Human Owner explicitly authorized the exact-tool remediation, the capability was deployed only after the revision 39 worker became terminal, and the capability review explicitly requires a fresh revision for valid evidence. This is not authorization for another simulated attempt or business-code change.

Revision 40 must use the first-class `browser_set_viewport` and `browser_screenshot` tools. JavaScript viewport overrides, CSS transform, zoom, static inference and non-target viewport substitution are forbidden. A five-minute preflight must prove one exact viewport read-back and one real PNG before the full matrix proceeds. Any tool absence or mismatch stops as infrastructure/evidence blocked without fallback.

## Human Decision

`NO`. Existing Human authorization covers the exact-tool remediation and fresh evidence revision; no product, schema, secret, paid-resource, destructive-operation or architecture decision is involved.
