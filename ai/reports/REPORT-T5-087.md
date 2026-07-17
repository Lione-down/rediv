# REPORT-T5-087 - Mock-first Workflow Templates and safe batch orchestration

- Decision: `DONE - PASS`
- Date: 2026-07-18
- Scope: clean-room Revid-owned versioned workflow template, deterministic Canvas-local preflight, quota-unit estimate, and explicit mock-only batch lifecycle.

## Outcome

Revid now offers a `canvas-generation-batch` v1 Workflow Template through the existing Slash Palette. It inspects only selected, unlocked image/video generation nodes in the active Canvas, derives a deterministic transitive dependency order, and estimates existing image/video quota units without reserving, charging, or authorizing payment.

Preflight is pure and fail closed for unavailable capability, invalid scope/generation context, duplicate selection, malformed or foreign graph endpoints, cycles, and insufficient quota. The only execution surface is labelled `mock`: it is session-local, requires explicit start/advance/cancel/resume actions, and recovers an interrupted mock run as paused. It never creates a provider request, task, result, asset, quota mutation, Canvas command, history entry, autosave write, durable run, or cross-Canvas edge.

## Implementation

- Added strict Revid-owned v1 template/preflight/mock-run contracts in `workflow-orchestration.ts`, with canonical scope/fingerprint checks and deterministic topological ordering.
- Added an explicit Palette action and a graphite/violet batch-inspection panel. The panel is an async overlay and mounts only after the user invokes the action, keeping the normal Canvas path free of its composable, storage, and watcher setup.
- Reused existing auth, project, Canvas, generation capability, selected-node, quota, Palette, responsive review-only, and component patterns. No database, backend, scheduler, provider, or graph-library change was introduced.
- Added contract/browser coverage for fail-closed preflight, mock-only lifecycle/recovery, no mutation/provider activity, scoped accessibility, and Palette eligibility.

## Verification

- RED then GREEN contract coverage passed; focused workflow, UI, registry, and Palette Chromium tests passed `14/14` after final async-overlay wiring.
- Related Canvas/generation regression passed `56/56` before the final wiring; the final current-code functional Chromium regression passed `466/466` in 8.6 minutes, including Canvas history/autosave/reload, typed ports, generation, Storyboard, keyboard, responsive, and accessibility titles.
- Production Vue/TypeScript/Vite build passed with `4,900` transformed modules.
- Desktop mock-only panel evidence was inspected at `output/playwright/t5-087-workflow-orchestration/workflow-preflight-1440x900.png`; scoped Axe has zero serious/critical findings. Existing 375px review-only and reduced-motion coverage remains in the full functional matrix.
- The separately guarded software-rendered 200-node/300-connection mock title remains transparent: it first passed `3/3` at 58.39 FPS / 16.8ms p95, then later missed unchanged limits at 53.97/54.56/54.46 FPS against 55 and at 33.30000000000018ms p95 against 33ms. Chromium reported SwiftShader with no hardware acceleration. No threshold changed. T5-087 does not alter Canvas renderer, pointer, edge, or minimap hot paths, and the final overlay is async-split from the ordinary Canvas bundle. The retained owned live baseline in `REPORT-T5-084.md` remains 59.87485 FPS / 16.7ms p95.
- Final hygiene passed `git diff --check`, strict UTF-8 decoding, zero BOM, and a scoped secret-signature scan with no findings in T5-087-owned text files. `CanvasWorkspace.vue` was already a 633-line coordinator at baseline; this Task keeps only 22 lines of async-overlay wiring there and places workflow behavior in new bounded contract/composable/overlay modules, without touching `CanvasStage.vue`.

## Acceptance classification

All T5-087 functional and safety acceptance criteria pass. The guarded mock performance title is retained as an environment-sensitive SwiftShader exception rather than hidden or weakened; it is not evidence of a T5-087 Canvas hot-path regression. A new owned live replacement remains gated on Human authorization to use supplied runtime configuration without reading or exposing `.env` values.

## Boundaries preserved

- No LibTV private source, prompt, schema, brand, icon, copy, or visual asset was copied.
- No real provider or paid call, real secret access, external account, database migration, destructive operation, second scheduler/store/Canvas engine, UI redesign, or cross-Canvas edge was introduced.
- Existing untracked `.codex/`, `.hermes/plans`, `output/`, and `TASK-T5-091.md` remain outside staging.
