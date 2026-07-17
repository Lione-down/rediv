# REPORT-T5-082 - Professional actions, Slash Palette, and image grid split

- Decision: `DONE - PASS`
- Date: 2026-07-17
- Scope: clean-room professional action registry, Canvas-owned Slash Palette, exact 4/9/16/25 project-image split, atomic graph insertion, integrated browser/build/live verification, and durable closure.

## Outcome

Revid now exposes a compact searchable professional action surface without copying LibTV source, brand, icons, copy, prompts, or assets. Plain Slash opens only when the editable Canvas owns the keystroke; existing editable, IME, dialog, drawer, Graph Access, active-gesture, readonly, and mobile-review boundaries remain authoritative.

One canonical project-uploaded image can be split into exact 2x2, 3x3, 4x4, or 5x5 row-major crops. Every crop is uploaded through the existing authenticated project asset API, then all canonical image nodes are inserted through one collision-aware `insert-graph` command. The original asset and node remain intact, no cross-canvas edge or source-node reference is created, and failed or stale work stops before graph mutation.

## Implementation

- Added pure stable action definitions, deterministic search, typed intents, strict eligibility, and immediate execution-time revalidation.
- Added an accessible graphite/violet Palette using current Canvas tokens and Lucide icons, with arrow/Home/End/Enter/Escape behavior, focus restoration, WCAG contrast, and reduced-motion support.
- Extended the existing Canvas keyboard owner with plain-Slash routing while preserving Shift+Slash Graph Access and every excluded input/overlay/gesture surface.
- Added exact integer crop bounds and a bounded one-source/one-output-at-a-time browser session with decode fallback and prompt resource release.
- Added sequential project uploads with project/canvas/user/type/source/status checks before one final atomic graph command.
- Persisted only versioned crop count/index/row/column/source bounds/crop bounds/source asset ID in existing node content JSON. No database, endpoint, migration, provider, quota, or library changed.

## TDD and verification

- RED began with missing registry, geometry, command, Palette, and workflow modules or actions. Each unit reached focused GREEN before broader work.
- Final focused matrix: 21/21 passed, including 54 successful crop uploads across 4/9/16/25, exact PNG dimensions and ownership, one PATCH per split, undo/redo/reload, upload-3 failure, and in-flight selection drift.
- Palette/open-state accessibility, keyboard ownership, reduced motion, 920px bounds, 375px review-only, and zero-mutation cases passed with zero serious/critical axe findings.
- Visual evidence confirms the existing graphite/violet vocabulary at 1440 and 920 and a source-preserving 5x5 Canvas layout under fit-all.
- Production build passed with 4,880 transformed modules.
- Full functional Chromium passed 412/412 in 9.0 minutes, excluding only the separately classified software-rendered mock FPS title.
- The mock 200/300 measurement remained below its unchanged 55 FPS threshold at 52.32 FPS in the all-in run and 51.86 FPS in isolation. This is recorded as a non-passing environment-sensitive result, not weakened or hidden.
- The guarded owned live run `t5008-32088-ac42de57cd4d9a21` passed the applicable 200-node/300-connection restart boundary at 59.89 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 218 ms stable render, and zero long tasks. Owned services, ports, runtime, and schema were cleaned afterward.

## Acceptance classification

All Task acceptance criteria pass. Registry and execution fail closed; Palette inspection is mutation-free and keyboard complete; crop geometry is exact; project ownership and source preservation hold; successful insertion is one atomic command/history/autosave boundary; failure and context drift create no split graph mutation; undo/redo/reload and responsive review boundaries hold; accessibility/build/functional regression pass; and the guarded live performance boundary passes without threshold weakening.

## Boundaries preserved

- No LibTV proprietary material, new UI/graph/image library, UI redesign, second Canvas engine/store, cross-canvas edge, or mobile editing was added.
- No database field, migration, backend endpoint, provider contract, quota behavior, generation task, recipe, or paid call changed.
- No `.env` was opened, no real secret was accessed, and no destructive user or production-data operation occurred.
- Pre-existing untracked `.hermes/plans` and ignored/untracked `output/` evidence remain outside staging.
