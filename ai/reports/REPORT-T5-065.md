# REPORT-T5-065 - Reference-first visual asset recipes

## Outcome

T5-065 is `DONE - PASS`.

One canonical image result can now directly create and execute either a `角色设定图` or `场景多视图` branch. Both flows use a versioned backend recipe, one authoritative reference, explicit `1024x768` output, and the existing durable generation transaction without asking the user for a prompt.

## Implementation

- Added an allow-listed backend recipe registry with preservation-oriented character and scene prompts.
- Enforced recipe/media/reference cardinality, prompt secrecy, and backward-compatible ordinary image/video validation.
- Added typed graph commands and metadata for one recipe node plus one ordered reference edge.
- Routed direct execution through the existing persistence flush, task, quota, reconciliation, result, reload, failure, and retry paths.
- Added recipe-specific Inspector review and retry while retaining generic image/video branching and readonly boundaries.
- Added and validated `.agents/skills/revid-visual-assets` as workflow guidance, explicitly excluding semantic vision or automatic scoring claims.

## Verification

- Backend recipe/provider/transaction regression: PASS, 36 tests plus 7 subtests.
- Frontend production build: PASS, 4,820 modules transformed.
- Focused recipe browser contract: PASS, 5/5.
- Related generation service, branch, provenance, lineage, resource, responsive, and run-result regression: PASS, 51/51.
- Skill validator: PASS, `Skill is valid!`.
- Visual evidence: running, success, failure at 1440x900; compact scene at 920x900; readonly review at 375x812.

Browser evidence proves persistence before request, an exact prompt-free client payload, one result and one charge on success, no result or charge on failure, same-node explicit retry, reload survival, compact bounds, and readonly action removal. All provider calls were mocked.

## Product boundary

The recipes are stable backend prompt templates, not a visual-analysis system. Multi-person detection, semantic role assignment, multi-reference fusion, automatic quality scoring, and automatic retry remain deferred. Users can retry explicitly or choose the ordinary editable image branch when creative changes are required.
