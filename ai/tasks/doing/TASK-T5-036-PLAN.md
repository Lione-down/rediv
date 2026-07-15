# TASK-T5-036 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- The registry currently treats every canonical definition as creatable, so typed compatibility correctly resolves `generation.out -> result.in` and `result.out -> generation.media`.
- T5-035 projected that raw compatibility directly into a foreground selected-node action. This exposes a blank-result creation affordance on generation nodes and duplicates the dedicated result branching workflow.
- Compatibility and foreground authoring intent are separate contracts. The former must stay unchanged; the latter needs an explicit registry-owned capability.

## Direction

- Visual thesis: graphite-black graph workspace with contextual chrome only where it represents a complete user action.
- Content plan: scripts and assets initiate work; generation nodes execute it; result nodes use their dedicated branch controls; passive nodes remain quiet.
- Interaction thesis: select an authoring source, reveal one restrained continuation action, choose a typed generation, and preserve all drag-based graph construction.
- CSS strategy: no new styling; reuse the existing scoped SCSS and V2 tokens while removing misleading states.

## Units

1. Add a canonical registry capability for selected-node continuation authoring.
2. Gate the contextual trigger with that capability without changing typed compatibility resolution.
3. Extend focused browser coverage across the full canonical node matrix and dedicated result branching.
4. Build, run related regressions, and inspect desktop/compact visual evidence.
5. Review diff and hygiene, synchronize state, write REPORT, commit, and push.

## Risks

- Filtering `getCreatableNodeDefinitions` would accidentally break port-drag continuation and edge insertion.
- A UI-local type list would drift from the registry and recreate the parallel eligibility problem.
- Suppressing all result actions would regress the explicit provider-valid image-result branch workflow.
