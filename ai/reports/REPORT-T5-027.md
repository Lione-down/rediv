# REPORT-T5-027 - Generation node run history

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-026 `DONE - PASS`

## Delivered

- Added a pure node-scoped generation-run history resolver using durable `canvas_node_id`.
- Sorts newest-first with stable equal-time behavior, exposes total count, and caps visible history to five runs.
- Added a compact inspector film log for queued, running, succeeded, failed, and timed-out states.
- Shows run sequence, model/provider, duration or timestamp, and bounded failure detail.
- Preserves the existing current-status surface as primary and supports desktop, compact, and readonly review.

## Verification

- `npm run build`: PASS, 4,799 modules transformed.
- Focused resolver/browser history scenarios: PASS, 3/3.
- Related resource, generation, preflight, ordering, and lineage regression: PASS, 30/30.
- Full Chromium: PASS, 198/198.
- Mixed five-status, six-run cap/total, stable tie order, foreign-node filtering, long error, empty history, readonly, and no-action-mutation checks: PASS.
- Visual review: PASS at 1440x900.
- Diff, file-size, UTF-8, scoped-worktree, and sensitive-path gates: PASS.

## Evidence

- `output/playwright/t5-027-run-history/mixed-run-history-1440x900.png`

## Deferred by design

- Retry, cancellation, deletion, pagination, polling changes, backend changes, and Canvas engine changes.
