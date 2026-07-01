# REPORT — Hermes Role Contract Hardening

> 2026-06-30 22:xx update: runtime readiness is temporarily superseded by `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-BLOCKED-2026-06-30.md`. Hermes auto-update preserved the local patch in `stash@{0}` but did not restore it because an obsolete Desktop bundle conflicts with new upstream. Do not use the earlier `READY_FOR_CONTINUATION` result until the durability gate is closed.

> Resolution: update durability now passes under `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-PASS-2026-06-30.md`. The runtime delta is a repeatable project-owned patch and a mandatory pre-Queue deploy/verifier gate. The remaining blocker is credential rotation only.

## Result

`READY_FOR_CONTINUATION` from the Hermes runtime perspective. Revision `26r1`, card `t_f46c8d6e`, and run `#126` remain terminal evidence and were not retried, reused, unblocked, reparented, or modified.

## Root cause

The failure was not proven to be “revid-pm SOUL complexity”. The Queue authorized `REVIEW_DISPATCH_ONLY`, while the Supervisor/launcher path persisted `DISPATCH_ONLY`. Hermes had no single machine-enforced contract connecting Queue Action, coordinator profile, persisted body, child roles, runtime policy, retry semantics, and outputs. The 120-second budget was marginal, but it was secondary to the wrong action contract.

## Remediation

- `create-hermes-coordinator.py` now requires an explicit supported Action, routes it to the exact coordinator profile, builds action-specific bodies, rejects missing/forbidden fields, rejects review budgets below 180 seconds, and uses `max_retries=2` for one process retry.
- Scheduled Supervisor and Operating Model use one canonical Action/profile matrix and forbid Action conversion.
- Installed SOULs and `kanban.worker_tool_policies` now cover Dispatcher, PM, Backend, Frontend, and Reviewer. `revid-pm` no longer owns `DISPATCH_ONLY`.
- Runtime rejects missing, duplicate, unknown, or cross-role Actions before worker spawn.
- `kanban_create` persists `max_retries`; Dispatcher child profile/action/revision and review-dispatch Reviewer/Handoff topology are validated before creation.
- `verify-hermes-role-contracts.py` checks templates, deployed SOULs, exact tool policies, launcher/supervisor markers, and installed runtime markers without printing unrelated config or credential values.

## Verification

- Project launcher/verifier: `11 passed`.
- Hermes worker spawn + Kanban tool suites: `105 passed`.
- Earlier focused runtime regression: `7 passed`; full Kanban tool suite: `99 passed`.
- Isolated launcher smoke: DISPATCH positive, REVIEW positive, cross-role negative all passed.
- Installed policy smoke: five profiles accepted only their configured Action; five wrong-Action probes failed closed.
- `ROLE_CONTRACTS_OK`.
- Python compilation passed for project launcher/verifier and installed runtime files.
- `git diff --check` passed in both repositories.
- Gateway drained cleanly and restarted with PID `21220`; subsequent status reported running.

## Security note

One profile credential appeared in private tool output during the audit. Its value is intentionally omitted. Rotate that credential before publishing or consuming a new executable Queue revision. This security gate is independent of the runtime verdict.

## Expected next runtime output

After credential rotation: `READY_FOR_CONTINUATION`, referencing this report and a fresh verifier run. Before rotation: do not consume a replacement Queue.
