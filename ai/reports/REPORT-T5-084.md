# REPORT-T5-084 - Professional Storyboard recipe registry and presets

- Decision: `DONE - PASS`
- Date: 2026-07-17
- Scope: clean-room Revid-owned Storyboard presets composed from the existing strict shot-plan, professional action, visual recipe, project asset, atomic graph, and Storyboard projection contracts.

## Outcome

Revid now exposes six explicit professional Storyboard presets through the existing Canvas Slash Palette. Four script presets create exact 4, 9, 16, or 25-shot planning graphs; character turnaround and scene multi-view presets enter the existing backend-owned visual recipe lifecycle. The implementation preserves Revid's graphite-black/violet visual system and Leafer Canvas behavior and adds no second graph engine, UI library, database field, provider prompt, or cross-canvas relation.

Script presets preserve the source and reuse the authenticated local T5-083 mock contract. Each success creates one ordinary strict shot schema v1 / Storyboard shot-plan v2 graph with exact `2N+1` nodes, `2N` typed edges, 2/3/4/5 columns, one group, one history entry, and one document PATCH. They never create a generation task, result, asset, quota reservation, or provider request.

Visual presets accept only one canonical image result whose active asset, URL, project, and user ownership all agree. They map only to existing `character-sheet` and `scene-multiview` recipe IDs and versions, preserving persistence-before-request, capability/preflight, quota, task, result, failure, reload, and explicit retry behavior. Client requests expose no internal recipe prompt, and all browser verification used mock transport.

## Implementation

- Added one strict version-1 registry for `plot-board-4`, `shot-board-9`, `shot-board-16`, `shot-board-25`, `character-turnaround`, and `scene-reference-views`, including source kind, search metadata, exact count or existing recipe mapping, and unknown/future fail-closed resolution.
- Added registry-driven professional Palette actions and category presentation without a new modal, icon set, graph library, or visual language.
- Extended the focused T5-083 coordinator with its already-supported optional requested count; exact source/project/canvas context is revalidated before the single graph command.
- Added a 62-line recipe coordinator that composes the existing shot and visual recipe paths. Existing direct visual recipe execution was moved into it, keeping `CanvasWorkspace.vue` at its original 672 lines.
- Made busy eligibility dynamic across upload and generation. This closes a discovered race where a visual preset could otherwise branch while another generation was in flight.
- Added deterministic test fixtures for exact large topology, project asset ownership, mock visual lifecycle, Storyboard projection, reload, failure/retry, responsive ownership, focus, reduced motion, axe, and zero unintended mutation.

## TDD and verification

- RED fingerprints covered the absent registry, absent actions, missing Palette intent, zero script requests, zero visual generation requests, and visual actions remaining available during an in-flight generation. Each was followed by the minimum GREEN implementation.
- Focused evidence passed registry 4/4, script presets 8/8, visual presets 2/2, complete preset acceptance 13/13, and the final accessibility/visual case 1/1.
- Existing plus new visual recipe coverage passed 20/20. The related professional action, shot schema/graph, Storyboard group/projection/workflow, and visual recipe matrix passed 67/67; the final busy-state matrix passed 23/23.
- Final functional Chromium regression passed 443/443 in 8.2 minutes, excluding only the separately guarded live 200/300 performance title.
- Product backend regression passed 474 tests plus 93 subtests in 418.90 seconds.
- Repository-root pytest passed 510 tests plus 93 subtests and reported one external-machine historical Hermes runtime failure: `HERMES_RUNTIME_PATCH_BASE_INCOMPATIBLE`. That check reads `C:\Users\mkd\AppData\Local\hermes\hermes-agent`; Hermes is retired by AGENTS and the path is outside the Revid workspace. No Revid product backend test failed, and no external files were modified.
- Production Vue/TypeScript/Vite build passed with 4,886 transformed modules.
- Manual review of `output/playwright/t5-084-storyboard-recipes/script-recipes-palette-920x900.png` confirms the existing graphite/violet hierarchy, bounded Palette, legible actions, visible keyboard focus, and no redesign. The same test recorded reduced-motion `0s`, no serious/critical axe violations, Escape focus return, and zero PATCH.
- Guarded live run `t5008-36804-5eb1decc55a322f1` passed 200 nodes / 300 connections at 59.87485 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 177 ms stable render, and zero long tasks. Owned services and ports were cleaned, and a normal production build was restored.
- Final hygiene passed valid UTF-8/no-BOM checks, `git diff --check`, sensitive-path and secret-signature scans, exact file-growth review, port closure, and remote-drift verification.

## Acceptance classification

All T5-084 acceptance criteria pass. Registry identity and source eligibility fail closed; exact counts/topology/columns and one-command mutation are proven; visual asset ownership and existing recipe versions are preserved; failures and stale/busy contexts do not create unintended graph work; history, undo/redo, autosave/reload, recovery, duplication, Storyboard order/settings, image Storyboard v1, 920px editing, 375px review-only, reduced motion, accessibility, build, full regression, and guarded live performance remain green without threshold weakening.

The separately installed retired Hermes runtime check is an external-machine maintenance finding, not a Revid product regression or T5-084 acceptance failure. Its release condition is an out-of-scope repair of that external checkout if the historical tool is ever reactivated.

## Boundaries preserved

- No LibTV private source, prompt, schema, brand, icon, copy, or visual asset was copied.
- No real provider, paid call, external account, automatic script generation, database field, migration, cross-canvas reference, destructive operation, or incompatible UX was introduced.
- No `.env` was opened and no real secret value was read or printed.
- Existing untracked `.codex/`, `.hermes/plans`, and ignored/untracked `output/` remain outside staging.
