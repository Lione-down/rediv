# TASK-T5-061 Plan

- State: `DONE`
- Updated: 2026-07-15

## Objective

Keep the Inspector's visible prompt and ordered inputs consistent with an in-flight generation request by locking mutable request controls until that request settles.

## Scope and acceptance criteria

- For a two-origin video request held by the mock generation gate, disable the prompt textarea and every input-order control immediately after submit.
- Keep source-result and origin-generation navigation available during the request.
- Prevent extra provider requests, graph PATCHes, prompt changes, or R-order changes while running.
- Keep the request preflight equal to the exact submitted provider snapshot.
- Re-enable prompt and valid order controls after both success and failure settle.
- Preserve existing readonly behavior and compact drawer bounds.
- Use native disabled semantics, existing tokens, focus behavior, and quiet opacity rather than a new overlay or modal.

## Non-goals

- Drafting the next request while the current request runs, cancellation, provider queue redesign, schema changes, or automatic retry.
- Blocking lineage navigation, closing the Inspector, or freezing the whole Canvas.

## Direction

- Visual thesis: quiet graphite utility surface with native disabled controls communicating a temporary request boundary.
- Content plan: inspect the submitted snapshot, monitor status, then resume editing after settlement.
- Interaction thesis: one submit, immutable request inputs while running, navigation remains available, controls recover without layout shift.

## Units

1. Add generation-gate RED coverage for running prompt/order lock, exact request count/snapshot, navigation, success/failure unlock, compact, and readonly.
2. Implement the smallest CanvasContextPanel disabled-state projection.
3. Run build, focused and related Chromium regression, plus desktop/compact/readonly visual review.
4. Close report/state/pitfalls, perform fresh diff review, commit, and push.

## Risks

- A disabled control can retain focus or lose accessible state if only CSS is used.
- Reorder emits can still fire through stale handlers unless native button disabling is authoritative.
- Failure can leave controls permanently disabled if the running flag does not settle in every path.
