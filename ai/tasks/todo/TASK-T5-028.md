# TASK-T5-028 - Verified run result navigation

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-027 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Close the generation-history loop by letting a completed run select its real Canvas result only when durable task identity and canonical graph lineage agree.

## Scope

- Resolve each visible succeeded run to a canonical result node through an active typed generation-to-result edge.
- Require the result lineage task ID to exactly match the history task ID.
- Expose one quiet `检查结果` action for a unique verified match.
- Explain missing or ambiguous succeeded results without inventing an action.
- Keep queued, running, failed, and timed-out rows status-only.
- Support desktop, compact drawer, and 375px readonly review without document mutation.

## Non-goals

- Canvas camera centering, retry, cancellation, deletion, result repair, pagination, provider polling, backend schema changes, or ranking.

## Acceptance criteria

- A succeeded run gets an action only for one active canonical result whose resolved generation node and task ID match.
- Missing, mismatched, inactive, malformed, or ambiguous result relationships never expose a result action.
- Activating the action selects the verified result and reveals its existing lineage detail.
- Readonly review may inspect a result but cannot mutate the document.
- Multi-run and multi-result histories remain deterministic and bounded to the existing latest-five contract.
- Focused/relevant/full Chromium, build, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
