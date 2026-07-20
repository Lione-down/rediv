# T6-002 Unit 9 Canvas UI State Evidence

Date: 2026-07-20

## Contextual-surface authority

- `context-surface-state.ts` owns one discriminated `CanvasContextSurface`: `none`, `agent-skill`, `audio-preflight`, `compare`, `context`, `professional`, `resources`, `revision`, `stage`, `video-preflight`, or `workflow-batch`.
- `use-canvas-context-surface.ts` closes every competing surface before activation, captures only a connected opener, and restores focus after close to that opener or the Canvas surface fallback.
- `CanvasWorkspace.vue` exposes the active kind only as a diagnostic `data-context-surface` attribute; existing panel/drawer/overlay DOM, copy, shortcuts, mutation commands, and presentation order remain owned by their existing components.
- The deterministic browser regression opens Resources, opens Revision from its trigger, proves Resources closes, closes Revision, and proves focus returns to the Revision trigger.

## Scoped production splits

| File | Before | After | Result |
|---|---:|---:|---|
| `CanvasContextPanel.vue` | 652 | 499 | PASS; cinematic lineage and the unchanged scoped stylesheet were extracted. |
| `use-canvas-stage.ts` | 522 | 498 | PASS; interaction types, viewport ownership, and global pointer-listener lifecycle were extracted. |

All new TypeScript/SCSS files are below 500 lines. The extracted `canvas-context-panel.scss` is byte-for-byte text-equivalent after line-ending normalization to the former embedded style block.

## Approved aggregate-file exceptions

The Project Lead approves these bounded Unit 9 exceptions under TASK-T6-002 acceptance criterion 9:

- `CanvasWorkspace.vue`, 950 physical lines: 602-line route/store orchestration script plus a 345-line root template and an external stylesheet. It remains the route composition root required by the architecture and contains neither provider transport nor low-level pointer handling. Re-split is mandatory before adding another presentation domain or when its script exceeds 650 lines.
- `CanvasStage.vue`, 780 physical lines: its script is already below the business-file limit at 467 lines; the remaining aggregate is the existing root Stage template plus an external stylesheet reference. Re-split is mandatory if script logic reaches 500 lines or a new Stage chrome domain is introduced.

These exceptions do not apply to extracted behavior modules, which must remain below 500 lines. `backend/controllers/store.py` is outside the Canvas-file scope of Unit 9; Unit 8 removed its process-cache authority and recorded its remaining compatibility-facade boundary separately.

## Verification

- `npm run build`: PASS, 4,952 modules transformed.
- Focused Chromium: `canvas-context-surface.spec.ts`, `canvas-professional-action-palette.spec.ts`, and `canvas-revisions.spec.ts`: PASS, 11/11 in 14.1 seconds.
- `git diff --check`: PASS.
- Legacy opener/listener authority scan: no `revisionPanelOpener`, `videoEditPreflightOpener`, or `windowPointerListenersBound` remains.
- No real provider request, secret access, user database, destructive action, or user-owned untracked path was used.
