# TASK-T5-077 - Truthful durable generation progress

- State: `DONE - PASS`
- Objective: add a backward-compatible durable generation progress contract and show real provider percentage when available plus honest indeterminate progress when it is not.

## Scope

- Add nullable `progress_percent` and `progress_stage` to generation tasks through one guarded MySQL migration with comments and exact check constraints.
- Serialize nullable progress through task APIs and frontend task types without breaking legacy rows or stale backends.
- Normalize progress updates so percentages remain finite, bounded, and monotonic; active stages are only `queued`, `provider`, and `persisting`.
- Keep image provider work indeterminate, capture usable video provider percentage when available, mark persistence explicitly, and set 100 only after durable success commit.
- Render a 3 px truthful determinate/indeterminate track in the existing generation lifecycle slot and expose matching DOM progress semantics in Inspector and Graph Access.
- Preserve zero-charge/zero-result failures, timeout behavior, task-only polling, zero runtime graph/history mutation, reduced motion, readonly review, and current result reconciliation.

## Non-goals

- No fabricated percentage, synthetic timer, paid provider call, real secret access, user/runtime migration, cancellation, new worker/runtime, WebSocket/SSE, graph persistence, pending result projection, or output placement change.
- No provider-specific assumption when an intermediate percentage is absent or invalid; the UI remains indeterminate.

## Acceptance criteria

- Migration tests prove both nullable fields, non-empty comments, allowed ranges/stages, upgrade, and disposable-schema downgrade from Alembic head `d0e1f2a3b4c5`.
- Task creation/update/API serialization covers null progress, provider progress, persisting, terminal success 100, failure preservation, invalid values, and monotonic regression rejection.
- Image generation exposes provider/persisting stages with null percentage until durable success; video accepts valid monotonic provider values and ignores missing, invalid, out-of-range, or regressing values.
- Card, Inspector, run history, and Graph Access agree on stage and percentage; indeterminate state never renders false `0%`.
- Runtime progress ticks cause zero Canvas PATCH/history mutation, quota change, asset/result creation, or duplicate provider request.
- Focused/backend/full browser/build/migration/hygiene gates pass without applying the revision to user/runtime data.

## Boundaries

- T5-078 exclusively owns non-persistent pending output reservation and exact result placement handoff.
- Real Agnes intermediate percentage availability remains an explicit unverified provider boundary; indeterminate fallback is the release behavior.
