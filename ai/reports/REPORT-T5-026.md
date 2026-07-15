# REPORT-T5-026 - Undoable generation input ordering

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-025 `DONE - PASS`

## Delivered

- Added durable generation-edge `input_order` metadata with legacy graph-order fallback.
- Added a validated `reorder-generation-input` Canvas command and one atomic graph mutation.
- Kept prompt and media input groups independently ordered.
- Added accessible one-step up/down controls with boundary disabling, hover/focus disclosure, touch visibility, and readonly hiding.
- Updated T/R provenance, request preflight, prompt composition, image IDs, and video keyframes from the same resolver.
- Preserved exact order through autosave, reload, undo, and redo.

## Verification

- `npm run build`: PASS, 4,798 modules transformed.
- Focused command/resolver/browser scenarios: PASS, 7/7.
- Related command history, generation, provenance, preflight, and lineage: PASS, 29/29.
- Full Chromium: PASS, 195/195.
- Atomic persistence: each reorder sends one PATCH batch with the complete compatible-group metadata update.
- Reload, provider payload, undo, redo, invalid/boundary, and readonly checks: PASS.
- Visual review: PASS at 1440x900; R markers and inspector rows remain synchronized.
- Diff, file-size, UTF-8, scoped-worktree, and sensitive-path gates: PASS.

## Evidence

- `output/playwright/t5-026-input-order/reordered-inputs-1440x900.png`

## Deferred by design

- Drag sorting, cross-type ordering, automatic ranking, backend schema changes, and Canvas engine changes.
