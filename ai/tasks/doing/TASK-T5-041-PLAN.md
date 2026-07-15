# TASK-T5-041 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- T5-040 fits a generation-owned trace, but Stage rejects a selected result even though `resolveResultLineage` already identifies its canonical origin and sibling family.
- Result selection already renders authoritative T/R inputs, G, V1..Vn, and one stronger exact output; only the context action eligibility and camera resolver are missing.
- Initial result-origin evidence showed the retained fixed-size toolbar covering a sibling video/result at fit zoom, so placement must account for surrounding node geometry.
- The existing compact post-drawer-leave handoff and inset-aware fit are reusable without new interaction or styling.

## Direction

- Interaction thesis: users may enter provenance from intent (generation) or evidence (result), with the same camera action and no selection handoff.
- Visual thesis: preserve the stronger selected-result edge and existing quiet header control.
- Resolver thesis: derive one canonical generation owner, then reuse generation context and result variant resolvers; do not fit arbitrary adjacent edges.

## Units

1. Generalize the Stage fit method from selected generation to selected generation-or-canonical-result.
2. Extend context action eligibility to canonical result lineage.
3. Choose the least-overlapping toolbar dock from top, bottom, left, and right while protecting generation composer space.
4. Add browser coverage for result types, selected emphasis, toolbar clearance, mutation, compact, readonly, and invalid lineage boundaries.
5. Build, inspect screenshots, synchronize state/report, review hygiene, commit, and push.

## Risks

- Selecting the origin generation as an implementation shortcut would violate result selection and inspector continuity.
- Following arbitrary incoming edges could include malformed or foreign graph data.
- Result nodes with inactive, untyped, missing, or ambiguous lineage must remain action-free.
- Toolbar estimates must remain conservative across capability-dependent button counts without introducing viewport mutation.
