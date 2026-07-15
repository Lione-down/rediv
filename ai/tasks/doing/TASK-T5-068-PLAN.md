# TASK-T5-068 Plan

- State: `DONE - PASS`
- Objective: close the gap between comparison selection and actual panel-safe Canvas location.

## Design thesis

- Keep the graphite comparison tray as temporary review chrome.
- On selection, return attention to the persisted result node and its existing violet selection state.
- Reuse established camera behavior so comparison adds no new navigation language.

## Delivery sequence

1. Add a RED browser case whose target variant is outside the current viewport.
2. Route comparison selection through the existing responsive selection and reveal lifecycle.
3. Verify minimum translation, visible no-op, zoom stability, exact V lineage, compact/readonly handoff, and no graph PATCH.
4. Run related regression, build, screenshots, fresh diff review, documentation, commit, and push.

## Invariants

- Persisted connection order remains V order.
- Reveal changes viewport only when geometry requires it.
- Selection remains an inspection action and never changes graph history.
- Responsive overlay ownership completes before camera reveal.
