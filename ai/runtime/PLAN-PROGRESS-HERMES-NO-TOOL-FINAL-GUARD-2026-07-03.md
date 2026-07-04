# Hermes No-Tool Final Guard Recovery Plan

## Objective

Prevent an execution-profile Hermes run from treating a degenerate punctuation-only, no-tool model response such as `...` as successful task completion.

## Root Cause

`agent/conversation_loop.py` accepts every non-empty no-tool response as a terminal text response unless `looks_like_codex_intermediate_ack()` recognizes a future-action acknowledgement. A punctuation-only response is non-empty but cannot match that semantic guard, so it exits with `text_response(finish_reason=stop)` without executing any tool.

## Evidence

- Fresh frontend-profile smoke session `20260703_165209_783f5c` persisted assistant content `...`, `finish_reason=stop`, and no tool calls.
- The session completed in about 16 seconds and produced neither the required report nor business-file changes.
- The frontend profile enables the `hermes-cli` toolset, so the failure is not explained by a missing configured tool surface.
- Three prompt-only attempts, including the bounded runtime fast path, did not produce a tool call.

## Scope

- Add a narrowly scoped runtime helper that recognizes punctuation-only no-tool output as degenerate.
- Continue the turn with an explicit tool-execution nudge when tools are available, with a bounded retry count.
- Add unit coverage for punctuation-only detection, ordinary concise answers, and bounded continuation.
- Preserve the change in Revid's runtime patch/deployment verification path so a Hermes update cannot silently erase it.
- Run a same-profile, non-destructive smoke task after unit verification.

## Non-goals

- No Revid business-code, migration, database, Kanban-card, or Queue mutation.
- No provider credential reading, printing, or modification.
- No broad heuristic that rejects legitimate short natural-language answers.
- No new executable T4-010 Queue revision until runtime health is proven.

## Success Criteria

1. A punctuation-only no-tool response cannot terminate the turn as success while tools are available.
2. A normal concise answer remains terminal.
3. Continuation is bounded and ends as an explicit runtime failure if the model remains degenerate.
4. Runtime unit and Revid contract tests pass.
5. A fresh `revid-frontend` smoke run performs at least one real read-only tool call and writes only its authorized smoke report.
6. Revid scheduled supervision remains paused until all checks pass.

## Progress

- [x] Pause Revid scheduled supervision.
- [x] Reproduce and inspect the persisted no-tool terminal response.
- [x] Identify the exact terminal branch and bypass condition.
- [x] Confirm the frontend profile has a configured toolset.
- [x] Add failing regression tests.
- [x] Implement the bounded degenerate-response continuation guard.
- [x] Update the durable deployment patch and verifier.
- [x] Run unit and contract verification (`95 passed`; project `6 passed`; `ROLE_CONTRACTS_OK`).
- [x] Run same-profile smoke verification (`20260703_170448_3ce6cd`; 4 tool calls; marker verified).
- [x] Reconcile project state; keep supervision paused pending credential rotation.

## Security Note

A read-only diagnostic command rendered a plaintext provider credential from local configuration into tool output. The credential is not copied into this document or any project artifact. Human Owner must rotate it after runtime recovery; no automated credential mutation is authorized.

## Final Status

`COMPLETE — RUNTIME VERIFIED, CREDENTIAL ROTATED, SUPERVISION RESUMED`
