# TASK-T5-057 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Objective

Make a downstream generation that consumes canonical results from two different upstream generations preserve and expose both identities independently: downstream request role `Rn`, upstream variant `Vn`, source result navigation, and direct origin-generation navigation.

## Scope and acceptance criteria

- Resolve two distinct authoritative generation-input lineage bridges without title, asset-ID, or metadata guessing.
- Show exact `Rn · Vn` markers for both included result inputs while ordinary uploads remain R-only.
- Keep the source result as the primary inspector target and add a separate keyboard-accessible origin-generation target per bridged row.
- Preserve exact provider reference order through input reorder and reload.
- Preserve compact drawer handoff, 375px readonly navigation, and zero inspection mutation.
- Pass production build, focused browser coverage, related regression, and retained 1440px, 920px, and 375px visual review.

## Non-goals

- Recursive ancestry expansion or a full lineage graph.
- Provider, schema, generation API, or global design-system changes.
- Automatic Canvas movement or mutation during inspection.

## Direction

- Keep the graphite-black quiet Canvas and existing violet interaction language.
- Treat the result source as primary identity and origin generation as a restrained secondary identity.
- Reuse existing `locateNode` behavior, tokens, typography, and responsive panel contracts.

## Units

1. Add RED coverage for two-origin resolution, exact roles, direct navigation, reorder, reload, compact, readonly, and no mutation.
2. Implement the smallest inspector projection needed for independent origin navigation.
3. Run build, focused and related Chromium regression, then three-viewport visual review.
4. Close report/state/pitfalls, perform fresh diff review, commit, and push.

All units are complete. The authoritative multi-bridge resolver now has two-origin proof, and the inspector exposes a separate responsive origin-generation navigation target for every valid bridge.

## Risks

- A secondary action can make dense input rows visually noisy or create nested interactive controls.
- Reorder can accidentally change upstream V identity instead of only downstream R identity.
- Compact navigation can leave a drawer mask open if it bypasses the existing locate handoff.
