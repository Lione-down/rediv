# PMC REVIEW — T4-010 Revision 41r1 Queue Action Correction

## Verdict

`PMC_STATE_CONFLICT_CORRECTED — TERMINAL QUEUE REMAINS NON-EXECUTABLE`

The rev41r1 Active Wave used the non-canonical action `NONE — terminal runtime evidence only`. The deterministic reconciler accepts the project-wide terminal action `NONE — terminal evidence only`; the extra word caused `expected_contract()` to fail with exit `2` before Hermes could reconcile its owned execution status or start the required runtime diagnostic.

## Decision

1. Canonicalize only the Active Wave `Action` to `NONE — terminal evidence only`.
2. Preserve revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1`, verdict `PMC_BLOCKED`, fingerprint `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`, the expired diagnostic SLA, and the one-time `RUNTIME_OWNER_STALLED` event.
3. Do not publish a continuation revision and do not broaden `revid-pm` tool policy from PMC governance files. The runtime owner must first provide a same-revision/same-fingerprint ACK and fresh diagnostic proving a bounded least-privilege remediation.
4. Do not refresh the expired due time. Hermes must record the missed SLA accurately and produce the diagnostic under the existing terminal reconciliation signal.

## Scope and Non-goals

- Writable PMC facts: this review, `ai/state/CURRENT.md`, and `ai/automation/HERMES-AUTO-QUEUE.md`.
- No changes to `HERMES-EXECUTION-STATUS.md`, Kanban, cards, runtime implementation/policies, business code, Executor artifacts, Independent REVIEW or HANDOFF.
- No retry, redispatch, claim, promote, unblock or reuse of `t_08bb42c8` or runs `#168/#169`.

## Success Criteria

- Active Wave contains exactly `Action = NONE — terminal evidence only`.
- Active Wave remains `PMC_BLOCKED — NOT EXECUTABLE / RUNTIME_OWNER_STALLED` with the inherited fingerprint and a unique reconciliation signal.
- `git diff --check` passes.
- The deterministic reconciler no longer fails solely because of the Queue Action string. Hermes remains responsible for applying and validating its owned status transition and producing the fresh diagnostic.

## Hermes Next Action

Run the deterministic reconciler against the corrected Queue, atomically ACK the exact rev41r1 terminal verdict/fingerprint, record the existing advisory path and SHA256, and produce a fresh diagnostic with verdict `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED` or `NEEDS_HUMAN_DECISION`. No card creation is authorized.

## Verification

- Active Wave read-back contains the canonical terminal action exactly once and the rev41r1 `PMC Verdict Revision` exactly once.
- The first Queue reconciliation block now targets the same rev41r1 revision and fingerprint as Active Wave.
- `python ai/runtime/reconcile-hermes-execution-status.py --check` no longer reports the Action mismatch or reconciliation-revision mismatch. It advances to the Hermes-owned status boundary and reports `expected one runtime advisory for ...41r1, found 0`.
- This remaining exit `2` is not authority for PMC to edit `HERMES-EXECUTION-STATUS.md` or bypass the diagnostic with a terminal STOP. Hermes runtime owner must add/reconcile the required rev41r1 advisory ACK fields through its owned workflow, or provide a bounded runtime remediation if its gate cannot represent the initial ACK state.
- `git diff --check` passes.

## Human Decision

`NO`. This correction does not change product scope, contracts, paid resources, secrets or irreversible operations.
