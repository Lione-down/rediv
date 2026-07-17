# REPORT-T5-085 - Versioned image-operation branches and fail-closed capability contracts

- Decision: `DONE - PASS`
- Date: 2026-07-18
- Scope: clean-room Revid-owned image-operation branches and strict capability/request contracts for expand, inpaint, erase, cutout, upscale, normalized region marking, and ordered fusion.

## Outcome

Revid now exposes seven explicit professional image operations through the existing Slash Palette while preserving its graphite-black/violet UI, Leafer infinite Canvas, typed media edges, downstream result branches, history, autosave, retry, and Storyboard projection baselines. Every action starts from current project-owned canonical image results and makes one new downstream branch; source nodes, assets, prior results, and Canvas boundaries remain unchanged.

The backend capability document is now version 2 with a strict nested version-1 image-operation section. Production truthfully advertises local `region` only and no provider-executable operations. Crafted provider operation requests, including `region`, fail before task, quota, asset, or provider mutation. Browser mock capabilities advertise the six provider operations only for offline contract and lifecycle verification; no real provider or paid call occurred.

## Implementation

- Added strict Revid-owned v1 operation and capability contracts for normalized regions, masks, expansion margins, upscale factors, source count, prompt rules, and exact request/task snapshots.
- Added backend capability v2 and request validation while keeping existing task request-parameter snapshots at version 1 and adding neither database fields nor migrations.
- Added focused frontend registry, ownership resolver, atomic branch wrapper, operation composable, and Inspector controls instead of expanding CanvasStage or adding a graph/UI library.
- Integrated eligible image operations into the existing professional Palette, with a local region marker that persists but never creates a generation request.
- Retained existing project asset ownership, typed ordered edges, branch placement, persistence, undo/redo, reload, result reconciliation, quota, and explicit retry paths. Persisted branches fail closed when refreshed capability removes their provider execution.
- Added direct Canvas-duplication coverage for nested operation contracts; duplication preserves the exact JSON contract while remapping only graph identity.

## Verification

- Focused backend contract/provider gate passed `18 passed, 30 subtests passed`.
- Focused image-operation Chromium matrix passed `15/15`, covering capability parsing, ownership/eligibility, 1/2/8-source ordering, atomic mutation, region edit/undo/redo/reload, all provider payload modes, no-prompt operations, immutable task snapshots, success, zero-charge failure, retry, and capability drift.
- Canvas duplication regression passed `7/7`, including exact preservation of `generation_parameters.image.operation`.
- Production frontend build passed TypeScript and Vite with `4,892` transformed modules.
- Final product backend regression passed `479 tests, 112 subtests` in 381.67 seconds.
- Final functional Chromium completed `458/459` in 9.5 minutes. All function, responsive, keyboard, Storyboard, autosave, generation, and accessibility titles passed. The only non-passing title was the previously classified software-rendered mock 200-node/300-connection threshold: 56.91 FPS / 33.2ms p95 in the all-in run and 49.80 FPS / 33.4ms p95 in isolation. The 55 FPS and 33ms thresholds were not changed. The environment was Chromium SwiftShader with no hardware acceleration; T5-085 does not touch Canvas render, pointer, edge, or minimap hot paths. The last guarded owned live baseline in `REPORT-T5-084.md` remains 59.87485 FPS / 16.7ms p95.
- Manual review of `output/playwright/t5-085/image-operation-upscale-1440x900.png` confirms the existing visual language, bounded right Inspector, clear no-prompt copy, visible 4× control, typed Canvas lineage, and no UI redesign. The same Inspector test has zero serious/critical axe violations; existing full regression preserves 920px editing, 375px review-only, Slash ownership, Escape/focus return, and reduced motion.
- Hygiene passed `git diff --check`, strict UTF-8 decoding, zero BOM, and zero suspicious secret signatures in every owned text file.

## Acceptance classification

All T5-085 functional and safety acceptance criteria pass. The fresh non-authoritative mock FPS measurement is retained as an environment-sensitive exception rather than hidden or weakened; it is not evidence of a T5-085 hot-path regression. A fresh live replacement remains gated on a Human-authorized owned harness that may consume pre-supplied runtime configuration without exposing `.env` values.

## Boundaries preserved

- No LibTV private source, prompt, schema, brand, icon, copy, or visual asset was copied.
- No real provider, paid call, external account, provider prompt invention, database field, migration, cross-canvas relation, destructive source edit, second Canvas engine/store, or UI redesign was introduced.
- No `.env` was opened and no real secret value was read or printed.
- Existing untracked `.codex/`, `.hermes/plans`, and `output/` remain outside staging.
