# PMC Review: T4-010 Revision 35 Runtime Owner Stalled

## Verdict

`PMC_BLOCKED — RUNTIME_OWNER_STALLED / DIAGNOSTIC_GATE_DEADLOCK`

Revision `phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35` remains terminal and non-executable. This is a Hermes reconciliation defect, not a Unit B business failure. Do not retry revision 35 or publish revision 36.

## Root Cause

`ai/runtime/reconcile-hermes-execution-status.py::validate_diagnostic()` unconditionally requires `Runtime Owner State = DIAGNOSTIC_READY` before the deterministic gate can succeed. At the same time, `ai/prompts/hermes-scheduled-supervisor.md` requires the gate to run before diagnostic/status writes and forbids those writes when the gate returns exit `2`.

The valid intermediate state `ACKNOWLEDGED + Runtime Diagnostic Path = NONE` therefore produces exit `2`, and exit `2` prevents Hermes from producing the diagnostic needed to reach `DIAGNOSTIC_READY`. The current regression named `test_diagnostic_start_phase_is_reconciled_without_premature_stop` only tests a fixture where the diagnostic already exists; it does not cover the pending ACK state.

## Evidence

- PMC read time: `2026-07-04T13:35:47+08:00`.
- Revision 35 owner state remains `ACKNOWLEDGED`; diagnostic path/hash/verdict remain `NONE`.
- `SCHEDULED-EVENT-REV35-GATE-EXIT2-2026-07-04.md` records repeated exit `2`: `terminal reconciliation requires DIAGNOSTIC_READY`.
- The status due value `2026-07-04T22:45:00+08:00` is not a valid 60-minute deadline relative to the first observed ACK checkpoint and is in the future relative to the project clock because the status timestamp is offset incorrectly.
- The same unresolved cursor was observed at the 09:02 and 12:03 PMC checkpoints; this satisfies the one-time stalled-event threshold.
- No Unit B PLAN, PROGRESS, REPORT, browser evidence, Independent REVIEW or HANDOFF exists.

## Bounded Remediation Contract

Runtime owner must implement `TASK-RUNTIME-REV35-DIAGNOSTIC-GATE.md`. The required behavior is:

1. treat `ACKNOWLEDGED + diagnostic NONE` as a valid diagnostic-start intermediate phase;
2. allow deterministic canonicalization of Task/Queue hashes and terminal Action without marking the diagnostic SLA `SATISFIED`;
3. return `STATUS_OK` after that intermediate phase is canonical, so Supervisor can enter diagnostics-only collection;
4. retain strict diagnostic path/hash/verdict validation once state becomes `DIAGNOSTIC_READY`;
5. add a regression that fails on the current code and proves both pending and produced phases.

Only after targeted tests, full reconciler tests, `ROLE_CONTRACTS_OK`, a fresh diagnostic and confirmation that no rev35 worker is active may PMC consider a continuation. A new revision must inherit all prior failure fingerprints.

## Human Decision

`NO`. This is a bounded runtime correctness repair with no product, schema, paid-resource, secret or destructive-operation decision.
