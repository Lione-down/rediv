# TASK-T5-075 Plan

- State: `DONE - PASS`
- Objective: deliver one coherent parameter-control vertical slice from backend capability normalization through Canvas persistence, provider mapping, durable task diagnostics, and browser verification.

## Delivery sequence

1. Lock the verified `c9d0e1f2a3b4` Alembic baseline and add RED pure backend tests for capability values, defaults, duration mappings, valid/invalid reference combinations, recipe locking, and unknown values.
2. Add RED provider/API tests proving exact image ratio/size, video frame/FPS mapping, top-level image, ordered keyframes, and zero mutation on validation failure.
3. Add RED MySQL migration/serialization tests for nullable legacy rows, non-empty comment, JSON round-trip, and mandatory new-task snapshots.
4. Implement `generation_parameter_contract.py`, the authenticated capability endpoint, strict request schema validation, additive migration/model/schema/serializer support, and transaction-start snapshots.
5. Pass only normalized provider values through image/video routes while preserving recipe, quota, failure, timeout, placement, and result persistence contracts.
6. Add RED frontend coverage for capability parsing, legacy defaults, unresolved multi-reference state, primary-reference validation, keyframe minimums, exact summaries, persistence, undo/redo, and one PATCH per command.
7. Implement the typed generation-parameter action and one parameter-aware request resolver shared by Inspector, preflight, request payload, provenance, and diagnostics.
8. Add accessible Inspector controls and readonly summaries without changing generation-card geometry or duplicating generate/retry ownership.
9. Initialize explicit intent in blank, result-branch, and selection-composition creation paths; require visible confirmation for two-plus-reference video intent.
10. Extend bounded run/result diagnostics, verify in-flight locking and honest offline/stale/disconnected behavior, then run focused and broader gates.
11. Perform fresh diff, migration, UTF-8, file-size, sensitive-path, and untracked ownership audits before REPORT, state reconciliation, exact staging, commit, and push.

## Backend contract

- Contract version `1`; one constant/normalization owner.
- Ordinary image default `4:3`, internal size tier `1K`; recipe output remains exact `1024x768` and rejects user ratio.
- Video modes: `text-to-video` with zero images, `image-to-video` with exactly one image, and `keyframes` with two-to-eight ordered images.
- Durations: `3 -> 81/24`, `5 -> 121/24`, `10 -> 241/24`, `18 -> 441/24`; fixed provider dimensions remain backend-owned.
- `request_parameters` is nullable for legacy rows, versioned, sanitized, and immutable per run.

## Frontend contract

- Node preferences use `generation_parameters.schema_version = 1` with media-specific fields.
- Missing image preferences resolve to `4:3`; zero/one-reference video resolves to the corresponding obvious mode; two-plus-reference video remains unresolved until chosen.
- `image-to-video` with multiple connected references requires one valid R-labelled primary; excluded references remain visible with reasons.
- `keyframes` consumes every valid R image in persisted request order.
- All controls live in `CanvasContextPanel.vue`; readonly mode renders review text only.

## Verification

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_generation_parameter_contract.py backend\tests\test_generation_task_request_parameters_migration.py backend\tests\test_agnes_provider.py backend\tests\test_generation_provider_validation.py backend\tests\test_canvas_generation_transactions.py -q
cd frontend
npx playwright test tests/e2e/canvas-generation-parameters.spec.ts tests/e2e/canvas-generation-preflight.spec.ts tests/e2e/canvas-generation-input-order.spec.ts tests/e2e/canvas-selection-generation.spec.ts tests/e2e/canvas-result-branch-generation.spec.ts
npm run build
```

Then run relevant generation/history/lineage regressions, disposable-MySQL migration checks, keyboard/ARIA and 1440/920/375 visual evidence, `git diff --check`, strict UTF-8, file-size, sensitive-path, and exact staged-scope audits.

## Stop rules

- Stop on migration-head drift, overlapping active Canvas ownership, provider contract ambiguity that changes the product modes, or any need for real secrets, paid calls, or user/runtime migration.
- Do not silently normalize invalid saved preferences or substitute a disconnected primary reference.
