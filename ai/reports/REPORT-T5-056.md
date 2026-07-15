# REPORT-T5-056 - Chained generation input lineage bridge

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-055 (`DONE - PASS`)

## Delivered

- A canonical generated result used by a later generation now retains both visible roles: downstream request `Rn` and upstream variant `Vn`.
- Canvas provenance renders one compact `Rn · Vn` pill only while the downstream generation or its result lineage is selected.
- The downstream generation inspector states `来自 <upstream generation> · Vn` and navigates to the exact source result.
- Downstream request identity comes only from `resolveGenerationContext`; upstream identity comes only from `resolveResultLineage`.
- Ordinary uploads remain R-only; invalid, inactive, ambiguous, task-mismatched, missing, duplicate, and excluded sources do not claim upstream lineage.
- No graph, provider, schema, history, branch-command, or recursive ancestry behavior changed.

## Verification

- Production build: PASS, 4,815 modules transformed.
- Focused bridge and result branching: PASS, 6/6.
- Related context/order, edge identity, provenance, result lineage, navigation, remix, and selection output matrix: PASS, 50/50.
- G1 V2 to G2 R1 video request: PASS with exact `asset-generated` image input and prompt.
- G1 V1 to G2 R1 image request: PASS with exact `asset-generated` image input and prompt.
- Reload identity and exact upstream V2 navigation: PASS.
- Desktop, compact, and readonly visual evidence inspected:
  - `output/playwright/t5-056-generation-input-lineage/chained-v2-to-r1-1440x900.png`
  - `output/playwright/t5-056-generation-input-lineage/compact-v1-to-r1-920x900.png`
  - `output/playwright/t5-056-generation-input-lineage/readonly-v2-to-r1-375x812.png`
- Diff, whitespace, file-size, sensitive-path, and staging-scope checks: PASS.

## Product result

Chained generations no longer flatten a generated source into an anonymous reference. The current downstream workflow now communicates both how that source is being used and exactly where it came from without expanding the whole ancestry graph.
