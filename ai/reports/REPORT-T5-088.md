# REPORT-T5-088 - Video edit preflight and fail-closed export contract decision

- Decision: `DONE - PASS`
- Date: 2026-07-18
- Scope: clean-room Revid-owned video trim/concat preflight, native source/sequence preview, and an explicit FFmpeg/backend export boundary.

## Outcome

Revid now exposes `video-edit-preflight` v1 through the existing Slash Palette. It inspects selected project-owned video asset/result nodes in the active Canvas, preserves explicit user selection order for concat, validates finite trim bounds, previews existing native sources only, and states that backend export is unavailable. It never claims a rendered clip or composite.

The local machine has FFmpeg/FFprobe 8.1.1, but Revid has no FFmpeg invocation, edit worker, output staging/storage, export API, cancel/resume endpoint, edit task schema, or output-lineage contract. Existing provider video generation is not reused: its provider task lifecycle would misrepresent editing/export semantics. The approved v1 therefore remains frontend-only and fail closed for durable export.

## Implementation

- Added exact versioned preflight contracts for templates, trim/concat operation, ordered sources, project/user/asset/URL scope, preview intent, fingerprint, and explicit `backend_export_unavailable` export boundary.
- Added a narrow async graphite/violet video-edit panel with trim fields, native source preview, sequence order, visible export block, deterministic close-control focus, and Escape close. It mounts only after explicit Palette invocation and remains absent in 375px review-only mode.
- Reused existing Canvas selection, asset ownership, Palette, native video playback, responsive, reduced-motion, and accessibility patterns. The panel dispatches no Canvas command and writes no history/autosave state.
- Added pure contract, Palette eligibility, and browser tests covering invalid/foreign/duplicate/time-boundary input, zero mutation, export fail-closed, accessibility, and review-only behavior.

## Verification

- RED then GREEN pure contract tests passed `2/2`; the final contract/Palette/browser focused suite passed `11/11`, including initial dialog focus and Escape close.
- Related Canvas video playback, keyframe/frame capture, Palette/action, command-history, generation-service, and runtime-feedback regression passed `54/54`.
- Production Vue/TypeScript/Vite build passed with `4,907` transformed modules.
- Final functional Chromium passed `471/471` in 8.7 minutes, including Canvas history/autosave/reload, typed ports, video playback, result branches, Storyboard, keyboard, responsive, and accessibility titles.
- Manual review of `output/playwright/t5-088-video-edit-preflight/video-edit-preflight-1440x900.png` confirms the existing graphite/violet visual language, clear trim/concat controls, bounded native source preview, ordered sequence, and explicit export block. Scoped Axe has zero serious/critical findings.
- The separately guarded software-rendered 200-node/300-connection mock title measured 50.72477779708455 FPS / 33.400000000001455ms p95 against unchanged 55 FPS/33ms limits; stable render was 419ms, pointer p95 12.3ms, longest interaction task 70ms, and minimap updates 9.73/s. Its other two tests passed. Chromium reported SwiftShader Vulkan with `hardwareAcceleration: false`. No threshold changed. T5-088 adds only async preflight overlay/Palette code and no Canvas renderer, pointer, edge, or minimap hot-path change. The retained owned live baseline in `REPORT-T5-084.md` remains 59.87485 FPS / 16.7ms p95.
- Final hygiene passed `git diff --check`, strict UTF-8 decoding, zero BOM, and a scoped secret-signature scan with no findings in T5-088-owned text files.

## Acceptance classification

All T5-088 functional and safety acceptance criteria pass for the approved frontend-only contract scope. Durable FFmpeg/export behavior is explicitly unavailable rather than fabricated; a real implementation requires Human Owner authorization plus a separate backend contract for safe input paths, limits, worker lifecycle, cancellation, idempotency, progress, staging/storage, output asset lineage, original preservation, and cleanup. The guarded SwiftShader mock performance result is retained as an environment-sensitive exception, not hidden or weakened, and is not evidence of a T5-088 Canvas hot-path regression.

## Boundaries preserved

- No LibTV private source, schema, brand, icon, copy, or visual asset was copied.
- No FFmpeg installation or invocation over media, real provider/paid call, secret access, external account, database migration, destructive media operation, second engine/store, UI redesign, or cross-Canvas edge was introduced.
- Existing untracked `.codex/`, `.hermes/plans`, `output/`, and `TASK-T5-091.md` remain outside staging.
