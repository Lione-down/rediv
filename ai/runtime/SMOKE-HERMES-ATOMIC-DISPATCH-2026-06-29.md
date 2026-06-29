# Hermes Atomic Dispatch Live Smoke

## Action

`DISPATCH_ONLY`

## Required Child

- Create exactly one child with the current Dispatcher card as its only parent.
- Assignee: `atomic-smoke-noop` (intentionally non-spawnable).
- Title: `Atomic dispatch noop child`.
- Body: `Atomic dispatch smoke evidence only. Do not execute.`
- Idempotency key: `revid-atomic-dispatch-live-smoke-20260629:child`.
- Workspace: `dir:D:/works/codexWorks/project_revid`.
- Max runtime: `60s`.

## Stop

Stop immediately after `kanban_create`. The runtime must atomically complete the Dispatcher parent and promote the child. Do not call `kanban_link`, `kanban_complete`, tests, terminal, database or business tools.

