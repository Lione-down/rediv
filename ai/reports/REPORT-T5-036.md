# REPORT-T5-036 - Intent-safe continuation affordance

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `1260de3ed2fb8287a4973c219f30be4e24d69d6e`

## Outcome

The selected-node continuation action now represents only complete user-authored intent. Canonical scripts and assets retain the quiet contextual `+`; generation and result nodes no longer advertise blank-result creation or duplicate the dedicated result branch workflow.

## Implementation

- Added `canContinueFromSelection` to registry capabilities, defaulting to false and enabled only for canonical script and asset definitions.
- Applied the capability in the selected-node trigger projection before resolving downstream options.
- Left `getCreatableNodeDefinitions`, typed port compatibility, drag continuation, command creation, provider materialization, and result branching unchanged.
- Added matrix coverage for image/video assets, image/video generations, image/video results, note, group, unsupported, locked, readonly, and multi-selection states.

## Verification

- Frontend build: PASS, 4,806 modules transformed.
- Focused continuation and result branching Chromium: PASS, 8/8.
- Related Canvas command, drag continuation, selected continuation, result branching, and reveal Chromium: PASS, 32/32.
- Resolver contract: PASS, generation-to-result and result-to-generation typed options remain available.
- Visual inspection: PASS at 1440x900 and 920x900.
- Hygiene: PASS, scoped diff, file-size, `git diff --check`, and sensitive-path boundaries.

## Visual evidence

- `output/playwright/t5-036-intent-safe-continuation/foreground-continuation-1440x900.png`
- `output/playwright/t5-036-intent-safe-continuation/continuation-drawer-handoff-920x900.png`

## Deferred boundaries

Paid provider calls, secrets, backend behavior, mobile editing, new node types, and reference-code copying remain outside scope.
