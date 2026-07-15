# TASK-T5-060 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Objective

Verify a two-origin video keyframe workflow through durable provider failure and explicit manual recovery: failure must preserve ordered inputs, avoid quota charge and ghost results, survive reload, then retry successfully into one playable canonical result.

## Scope and acceptance criteria

- Move the shared multi-origin graph builders out of the 477-line result-branch spec before adding a focused failure spec.
- Fail one reordered two-origin video request with bounded, visible Inspector feedback and a failed run-history entry.
- Preserve both R/V identities, origin navigation, prompt, input order, generation node, and edges.
- Do not decrement quota, create result assets/nodes/edges, or claim success.
- Reload the failed workflow and preserve its failed status plus request-ready inputs.
- Switch only the mock outcome, manually retry, and send the same prompt and ordered image IDs.
- Materialize exactly one playable canonical video result and decrement quota exactly once.
- Verify desktop failure, compact retry, and readonly failed review boundaries.

## Non-goals

- Automatic retry, provider backoff redesign, paid calls, schema changes, or new global error components.
- Hiding failure details or converting the generate CTA into a destructive-looking control.

## Direction

- Visual thesis: quiet graphite utility surface with bounded red feedback only where the failure is actionable.
- Content plan: retain sources, state what failed, preserve history, allow one explicit retry, show the recovered result.
- Interaction thesis: existing primary generation action, keyboard navigation, stable responsive drawer, and no automatic graph mutation after failure.

## Units

1. Extract the multi-origin graph builders into the shared resource fixture without behavior change.
2. Add RED failure, reload, retry, provider-order, quota, result, playback, and responsive assertions.
3. Fix only the failure/recovery behavior exposed by RED.
4. Run build, focused frontend, guarded backend, related regression, and visual review; close docs, review, commit, and push.

All units are complete. Shared fixtures remain within the file-size boundary, and the existing product behavior passed the complete failure-to-recovery contract without a business-code correction.

## Risks

- A failed run can decrement quota or materialize a stale result before the error is surfaced.
- Reload can discard the prompt or ordered keyframe metadata needed for manual retry.
- Retry can duplicate tasks/results or use a different image order from the failed request.
