# REPORT-T5-055 - Arrange authoritative generation lineage

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-054 (`DONE - PASS`)

## Delivered

- One selected generation or canonical result now exposes an explicit `整理完整生成链路` action when its complete authoritative family is safely movable.
- The action resolves included T/R inputs through generation context and V outputs through canonical result lineage.
- T/R nodes form one ordered, right-aligned input column; G remains fixed; V nodes form one ordered, left-aligned result column.
- Real node heights and 48-unit row gaps prevent mixed portrait, landscape, video, unavailable, and broken result overlap.
- One existing `arrange-nodes` command owns persistence and exact undo/redo.
- Excluded inputs, unrelated nodes, selection, inspector, viewport, input metadata, and provider request order remain unchanged.
- Locked, grouped, unsupported, incomplete, no-op, and readonly families expose no misleading mutating action.
- Desktop executes in place; compact closes its drawer before dispatch; readonly remains inspection-only.

## Verification

- Production build: PASS, 4,814 modules transformed.
- Focused provenance and arrangement: PASS, 21/21.
- Related command, persistence, generation order/context, lineage, selection composition, remix, keyboard ownership, and responsive matrix: PASS, 66/66.
- Exact image provider references after arrange: PASS, `asset-reference`, then `asset-character`.
- One document PATCH plus exact undo/redo coordinates: PASS.
- Visual evidence inspected:
  - `output/playwright/t5-055-lineage-arrange/arranged-generation-lineage-1440x900.png`
  - `output/playwright/t5-055-lineage-arrange/arranged-result-lineage-920x760.png`
  - `output/playwright/t5-055-lineage-arrange/readonly-lineage-375x812.png`
- Diff, whitespace, file-size, sensitive-path, and staging-scope checks: PASS.

## Product result

Multi-node generation is no longer only semantically traceable. A creator can explicitly convert one irregular authoritative family into a readable, reversible T/R-to-G-to-V graph without manually reconstructing the family selection.
