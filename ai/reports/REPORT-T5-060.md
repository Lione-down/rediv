# REPORT-T5-060 - Two-origin video failure recovery

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-059 (`DONE - PASS`)

## Delivered

- Shared multi-origin graph builders now live in the resource-generation fixture, reducing the result-branch spec from 477 to 411 lines and avoiding duplicated scenario data.
- A focused browser scenario drives reordered two-origin video keyframes through one provider failure, readonly reload review, compact manual retry, and one success.
- The failed request preserves exact prompt and `asset-second-origin`, `asset-generated` order while producing a durable failed task and bounded Inspector alert.
- Failure does not decrement video quota, add an asset, add a result node, add a result edge, or claim success.
- Reload preserves the prompt, R/V identities, origin copy, failed run, and request-ready generation node.
- 375px readonly hides generation/reorder controls, stays within its stable drawer boundary, and emits no additional PATCH.
- One explicit 920px retry sends the exact same request, decrements quota exactly once, and materializes exactly one playable video result plus one canonical edge.
- No business-code correction was required; existing failure transaction and retry behavior satisfy the stronger contract.

## Verification

- Production build: PASS, 4,815 modules transformed.
- Focused chained lineage, result branch, and recovery suite: PASS, 13/13.
- Guarded backend Agnes provider, video generate, and video E2E: PASS, 15/15.
- Related Canvas identity, ordering, provenance, navigation, remix, failure, and lineage matrix: PASS, 53/53.
- Visual evidence inspected:
  - `output/playwright/t5-060-multi-origin-video-recovery/failed-no-charge-1440x900.png`
  - `output/playwright/t5-060-multi-origin-video-recovery/failed-readonly-375x812.png`
  - `output/playwright/t5-060-multi-origin-video-recovery/retry-success-compact-920x900.png`
- File sizes: shared fixture 467 lines, result-branch spec 410 lines, failure spec 111 lines.
- Diff, whitespace, sensitive-path, and staging-scope checks: PASS.

## Product result

Two-origin video workflows now have durable recovery evidence. A provider outage leaves the graph, order, prompt, quota, and lineage honest, while a later explicit retry resumes from the same intent and creates only one valid result.
