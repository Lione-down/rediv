# PMC Review — Hermes Frontend No-Tool Runtime Fix

## Verdict

`RUNTIME_GATE_PASS — READY_FOR_CONTINUATION_RUNTIME_ONLY`

## Root Cause

`agent/conversation_loop.py` accepted every non-empty no-tool response as terminal text unless the future-action intent-ack detector matched it. The provider response `...` was non-empty but carried no action semantics, so it exited with `finish_reason=stop` and no tool call.

## Runtime Change

- Detect only known punctuation placeholders (`...`, Unicode ellipsis, and repeated `_`/`-`/`~`).
- When tools are available, continue with an explicit tool-execution nudge, capped at two retries.
- If all continuations remain degenerate, return `completed=False` with `degenerate_no_tool_response_exhausted`.
- Preserve the change in `ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64` and verify installed markers.

## Verification

- Hermes targeted/full affected regression: `95 passed`.
- Revid deployment/verifier regression: `6 passed`.
- Role contracts: `ROLE_CONTRACTS_OK`.
- Fresh profile/session: `revid-frontend / 20260703_170448_3ce6cd`.
- Real tool calls: `read_file`, `terminal`, `write_file`, `read_file`.
- Evidence: `ai/reports/SMOKE-RUNTIME-FRONTEND-ARTIFACT-ROOT-2026-07-03.md`.
- Evidence SHA256: `7EF5919F4BB0A11BBA3A57444323E405E4319A4EF5F1195BDF4B92FEDDF03B9F`.
- Final marker: `FRONTEND_PROFILE_ARTIFACT_ROOT_SMOKE_READY`.
- Business diff SHA256 before/after unchanged: `BC30FF84C71C46F75C2D45157CE1A6C2DFF43D0AF852CD360FDB9501222DA0A9`.
- Residual smoke processes: `0`.

## Governance Decision

The frontend runtime gate is satisfied. Historical revision 31/32 chains remain terminal and must not be reused. T4-010 Unit A may proceed only through one fresh PMC Queue revision 33 carrying the prior failure fingerprints. No card or executable Queue is created by this runtime repair review.

## Security Follow-up

A plaintext provider credential was rendered during a local diagnostic command. It is not reproduced in project artifacts. Human Owner must rotate that credential before treating it as safe for continued external use.

Human Owner confirmed credential replacement and restarted Hermes. A fresh provider probe returned `ROTATION_PROBE_OK`; Gateway PID `12912` is healthy, `STATUS_OK` and `ROLE_CONTRACTS_OK` both pass, and Revid Supervisor cron `72a21342a164` resumed for the 17:45 checkpoint. The security pause is closed.
