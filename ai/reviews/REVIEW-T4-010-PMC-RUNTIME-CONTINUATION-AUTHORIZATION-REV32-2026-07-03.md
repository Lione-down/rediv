# REVIEW-T4-010-PMC-RUNTIME-CONTINUATION-AUTHORIZATION-REV32-2026-07-03

## Verdict

`PMC_RUNTIME_READY — FRESH CONTINUATION AUTHORIZED`

Revision `phase4-wave3-workspace-shell-2026-07-02-31` remains terminal `PMC_BLOCKED`; card `t_2e03b521`, run `#141` and its idempotency key remain immutable evidence. The stable inherited fingerprint remains:

`REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`

Fresh runtime evidence now satisfies the bounded resume condition, so PMC authorizes one replacement execution chain as revision `phase4-wave3-workspace-shell-continuation-2026-07-03-32`. This is infrastructure continuation of T4-010 initial business attempt `0`, not business REWORK and not PMC acceptance of the Workspace implementation.

## Fresh PMC Verification

- `hermes kanban show t_0f9c7dac`: real `revid-dispatcher` parent, `Action: DISPATCH_ONLY`, run `#144`, completed in 74 seconds with exactly one child and `atomic_dispatch: true`.
- `hermes kanban log t_0f9c7dac`: dispatcher used `kanban_show`, `read_file`, `kanban_create` and `kanban_complete`; no `terminal` invocation appears.
- `hermes kanban show t_413f6846`: one linked `revid-backend` child, `Action: IMPLEMENT_AND_TEST_ONLY`, matching synthetic revision, completed cleanly in run `#145`.
- `hermes kanban show t_2e03b521`: old revision 31 card remains blocked with the original role-boundary failure and no child.
- `PYTHONUTF8=1 backend/.venv/Scripts/python.exe ai/runtime/deploy-verify-launcher-fix.py --check-only`: exit `0`, all four checks passed.
- `backend/.venv/Scripts/python.exe -m pytest backend/tests/test_create_hermes_coordinator.py -q`: `19 passed`, exit `0`.
- `git diff --check`: exit `0`.
- No current worktree modification touches T4-010 frontend Allowed Files.

## Scope and Constraints

- Old card `t_2e03b521` must not be deleted, retried, claimed, promoted, unblocked or reused.
- Revision 32 must use fresh Coordinator and Executor idempotency keys and inherit the revision 31 failure fingerprint.
- Before ACK, Hermes must normalize its owned execution status to canonical fields and preserve the stable fingerprint without `→ FIXED`.
- Before card creation, Supervisor must run project-owned runtime deploy and `ROLE_CONTRACTS_OK` verification.
- The new Dispatcher must directly use `kanban_create`; `terminal` remains forbidden for `revid-dispatcher / DISPATCH_ONLY`.
- Only the Task's existing frontend Allowed Files and revision 32 PLAN/PROGRESS/REPORT/evidence paths are authorized.
- Stop at revision 32 `REPORT_READY`; no Reviewer or HANDOFF is authorized in this lifecycle.

## Reconciliation

```text
PMC Reconciliation Required: YES — UNTIL REV32 ACK
PMC Verdict Revision: phase4-wave3-workspace-shell-continuation-2026-07-03-32
PMC Verdict: PMC_RUNTIME_READY / CONTINUATION_AUTHORIZED
Failure Fingerprint: REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED
Expected Hermes Action: NORMALIZE_STATUS_AND_ACK_REV32
Resume Condition: ACK exact rev32 Queue, create one fresh dispatcher chain, and stop at REPORT_READY
```

## Human Decision

`Human Decision Required = NO`

This is a least-privilege runtime continuation within the already approved T4-010 product scope.
