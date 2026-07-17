# REPORT-T5-083 - Strict shot schema and atomic script-to-storyboard graph

- Decision: `DONE - PASS`
- Date: 2026-07-17
- Scope: clean-room mock-first script breakdown, strict shot schema v1, atomic prompt/generation/Storyboard planning graph, exact Storyboard v2 compatibility, and integrated backend/browser/live verification.

## Outcome

Revid can now turn one exact canonical script into a deterministic ordered shot plan through an authenticated project/canvas-scoped local mock endpoint. The response is independently validated by strict backend and frontend contracts, and one explicit Slash Palette action creates the complete prompt, image-generation, typed-edge, and Storyboard plan through one existing `insert-graph` command.

The source script is never overwritten. No image generation is automatically submitted, no result or asset is fabricated, and no provider, task, quota, database, migration, external account, secret, or paid path is used. The complete two-shot browser case creates exactly five nodes and four typed edges through one document PATCH, then survives Storyboard projection, undo, redo, autosave, and reload.

## Implementation

- Added strict `extra=forbid` request/response models and a deterministic local mock controller that preserves punctuated and unpunctuated line boundaries, supports 2-25 shots, and returns only `provider: mock` / `model: revid-shot-mock-v1`.
- Added one authenticated endpoint that verifies current project/canvas ownership before mock work and imports no generation-provider, quota, task, or asset service.
- Added an independent exact-key frontend parser and scoped service that reject future versions, wrong provider/model/scope, missing/extra fields, duplicates, non-contiguous identities, invalid counts, and out-of-bound content.
- Added a focused graph builder and coordinator outside the large Canvas components. They preserve the exact source snapshot, fail closed on whitespace or metadata drift, place one collision-aware block, and dispatch once.
- Added one `script.create-shot-graph` professional action using the existing Palette, graphite/violet tokens, Lucide vocabulary, keyboard ownership, reduced-motion behavior, and responsive boundaries.
- Added Storyboard shot-plan schema v2 while retaining image Storyboard v1. Shot ID/index remain stable across Storyboard reorder, while ordered child IDs independently control presentation order; exact duplication remaps supported internal IDs and preserves malformed/future content unchanged.
- Kept `CanvasWorkspace.vue` integration narrow. New backend/frontend modules remain well below 500 lines; no new UI, graph, or provider library was introduced.
- Corrected one stale 920px regression expectation from the persisted 220px generation height to the existing canonical 128px visible authoring-card height (`y: 84`); production geometry was not changed.

## TDD and verification

- RED fingerprints covered missing backend/frontend modules, strict parser failures, Storyboard v2 being downgraded to v1, unremapped duplicate child IDs, absent Palette action, unavailable end-to-end workflow, unpunctuated lines being merged, source whitespace/metadata drift, and reorder invalidating the v2 group.
- Final focused matrix passed backend 15 tests plus 15 subtests and frontend 29/29, including exact 25-shot topology, provider/malformed/context failure, 920px behavior, 375px review-only, stable reorder, projection, and duplication.
- Final backend regression passed 474 tests plus 93 subtests in 9 minutes.
- Final functional Chromium regression passed 428/428 in 8.9 minutes, excluding only the separately classified software-rendered mock FPS title.
- Production Vue/TypeScript/Vite build passed with 4,884 transformed modules.
- Visual review of `output/playwright/t5-083/script-shot-graph-1440x900.png` confirms the existing graphite/violet Canvas, typed lines, grouped generation cards, and no UI redesign.
- Guarded owned live run `t5008-28648-985a035f36a0dca6` passed 200 nodes / 300 connections at 59.89 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 205 ms stable render, and zero long tasks. Owned schema, runtime, backend, preview, and ports were cleaned; a normal non-live build was restored afterward.
- Final hygiene passed: 32 owned text files, zero invalid UTF-8, zero BOM, zero suspicious secret signatures, zero sensitive paths, clean `git diff --check`, and zero listeners on 8765/9765/9099.

## Acceptance classification

All T5-083 acceptance criteria pass. Contracts are strict and versioned; mock output is deterministic and offline-only; eligibility and execution fail closed; the source remains exact; node/edge counts, typed input order, Storyboard projection/order, one-command atomicity, zero-mutation failures, history/persistence/reload, duplication, responsive accessibility, build, full regression, and guarded live performance are verified without threshold weakening.

## Boundaries preserved

- No LibTV private source, prompt, schema, brand, icon, copy, or asset was copied.
- No real provider, paid call, external account, automatic generation, quota reservation, task, asset, database field, migration, cross-canvas reference, or destructive operation was added.
- No `.env` was opened and no real secret value was read or printed.
- Existing untracked `.hermes/plans` and ignored/untracked `output/` remain outside staging.
