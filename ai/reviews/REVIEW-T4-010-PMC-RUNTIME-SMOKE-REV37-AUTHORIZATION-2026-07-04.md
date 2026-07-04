# PMC Review: Rev35 Runtime Remediation and Rev37 Smoke Authorization

## Verdict

`RUNTIME_REMEDIATION_VERIFIED — BOUNDED SAME-PROFILE TERMINAL SMOKE AUTHORIZED`

## Root Cause

Rev35 worker log proves `tools/process_registry.py` decoded a Windows background-process pipe with strict UTF-8. Byte `0xB4` killed `subprocess._readerthread`; the agent then emitted `[Acknowledged]`, returned exit `0`, and never called `kanban_complete` or `kanban_block`. This caused the watcher fingerprint `REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`.

## Fresh Remediation Evidence

- Current Hermes baseline uses `encoding="utf-8", errors="replace"` at `ProcessRegistry.spawn_local()`.
- Direct invalid-byte smoke: process exit `0`, output contains `�`, no reader-thread crash.
- Project targeted runtime tests: `8 passed`.
- Full project runtime suite: `26 passed`.
- Role verifier: `ROLE_CONTRACTS_OK`.
- Revid verifier now fails closed if the installed decode guard is absent.
- Gateway PID `20128` started after current runtime deployment; board has zero active workers.

## Queue Decision

Human Owner explicitly prioritizes restoration and publication of T4-010 Unit B. T4-002 rev36 is still unacknowledged and has no cards/workers, so it is superseded before execution; its authorization, Task and fingerprints remain preserved for later re-publication.

Revision `runtime-rev35-frontend-terminal-smoke-2026-07-04-37` is authorized as the sole executable Queue. It is infrastructure-only and must stop after a fresh `revid-frontend` worker explicitly completes or blocks its own card.

## Unit B Gate

Unit B remains non-executable during Rev37. If Rev37 reaches explicit terminal PASS with canonical report/log/card evidence, PMC may publish one fresh Unit B continuation inheriting:

- `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`
- `REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS`
- `REV33_EXECUTOR_CHILD_CONTRACT_INVALID_120S_DISPATCH_PAYLOAD`
- `REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`

No Human decision is then required.
