# TASK-T5-073 - Canvas authoring card hierarchy refinement

- State: `DONE`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-072 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-16
- Reference: local MIT-licensed `D:\works\codexWorks\AIGCCanvasFlow-master`

## Activation rule

- Do not activate, implement, stage, or mix this Task while T5-072 is active.
- The executing session must first confirm T5-072 is committed and pushed, `CURRENT` is released, and remaining worktree ownership is clear.
- Only then activate T5-073 as the single implementation Task and create or refresh its PLAN and PROGRESS before editing business code.
- Re-read `REPORT-T5-014.md`, `REPORT-T5-015.md`, `REPORT-T5-063.md`, `REPORT-T5-071.md`, and `REPORT-T5-072.md` before implementation. This Task adjusts the prior authoring-card decision but must preserve the verified media-first, overlay-isolation, and enterprise-certification contracts.
- Existing `.hermes` and `output/` content belongs to the user or other work and must remain untouched.

## Objective

Give canonical authoring nodes a clearer, more compact card grammar inspired by the strongest information-architecture patterns in AIGCCanvasFlow: a readable type/title header, bounded content body, local lifecycle summary, and coherent selected-editor treatment. Reimplement the patterns with Revid's Leafer renderer, typed node registry, command model, tokens, accessibility rules, and responsive ownership. Do not copy the reference project's VueFlow architecture or turn media results back into generic framed cards.

## Visual thesis

- Structured graphite authoring cards with quiet violet interaction, not glow-heavy generic node boxes.
- Header answers what the node is, body answers what it contains, and one restrained status surface answers what it is doing.
- Script, note, and generation nodes gain card hierarchy; image, video, and result media remain the dominant visual anchor without a permanent header frame.
- Editing remains progressive disclosure. The selected editor must read as part of the same authoring card without duplicating mutation ownership.

## Reference audit

### Patterns to adopt

- A shared card shell with stable header, body, optional status/footer, and port slots.
- Compact type identity, bounded title, and local state that can be understood without opening a remote panel.
- Clear separation between content and controls, including honest empty, running, and failure states.
- Strong selected affordance with a restrained outline, while idle cards remain low contrast.
- Continuation and port affordances remain visually associated with the card edge.

### Patterns to adapt to Revid

- Use Revid's existing Lucide icon mapping, Sora typography, OKLCH tokens, 40px interactive-target rule, focus-visible treatment, and reduced-motion contract.
- Keep generation execution, quota, retry, ordered inputs, preflight, and run history in the existing `CanvasContextPanel` and generation service.
- Keep the current selected-node composer mutation path, IME behavior, debounce, autosave, undo/redo, and readonly guards. Only its visual relationship to the authoring card may change.
- Use stable bounded geometry derived from `canvasNodeVisualSize`; do not let long prompt text grow a node indefinitely.

### Patterns explicitly rejected

- No VueFlow dependency, loose `data` schema, direct selected-state persistence, or reference-store code.
- No permanent fixed header on media/result nodes, bright purple edges, strong selection glow, emoji icons, or tiny 9px controls.
- No inline model selector, aspect-ratio selector, AI polish action, type switcher, scope toggle, delete, duplicate, or close button in this Task.
- No raw JSON dump as the default content presentation.
- No hover-only primary action, fixed-position Teleport picker, or animation without reduced-motion handling.

## Scope

### 1. Authoring-card presentation contract

- Add one pure presentation resolver for canonical `script`, `note`, and `generation` cards.
- Resolve registry type/subtype identity, icon key, bounded title, body preview, empty state, lock state, and lifecycle state from current node data without introducing a second schema.
- Define stable header/body/status slots from the same world geometry that drives ports, edges, selection, minimap, fit, collision checks, and overlays.
- Keep legacy and unsupported nodes honest. They may reuse safe presentation primitives but must not be silently reclassified as canonical authoring cards.

### 2. Shared visual shell

- Render a restrained in-card header for canonical authoring nodes with type identity, one-line title, and reserved lock/lifecycle space.
- Add a subtle body boundary and improve long Chinese, long English, empty, and multiline content scanning without increasing node height from content length.
- Show generation lifecycle exactly once. If the existing status overlay moves into a reserved card slot, remove the duplicate visual for that authoring node while retaining its semantic status.
- Keep selected, hover, focus, running, failed, locked, and readonly states token-driven. Selection uses a thin violet outline and modest depth only.
- Keep port positions and continuation trigger alignment derived from shared geometry, not magic offsets.

### 3. Selected editor coherence

- Make the selected script/note/generation editor visually belong to the card through shared width, material, border, radius, and spacing.
- Preserve one editor and one mutation boundary. Do not render an editable card body and detached editable composer at the same time.
- Preserve IME composition, 500ms commit, blur/Escape flush, keyboard ownership, autosave, exact undo/redo, reload, lock, and readonly behavior.
- Keep the header or other non-interactive card area available as a drag target. Editing controls must not make the node impossible to move.
- At compact width, retain the existing drawer ownership. At 375px, remain review-only with no editing controls.

### 4. Generation-card honesty

- Improve the generation card's static summary using only capabilities already supported by Revid: image/video role, prompt preview or recipe title, lifecycle, and visible failure state.
- Keep internal visual-recipe prompts hidden. Recipe nodes may show the public recipe title and description only.
- Do not add model, ratio, style, quality, seed, or provider selectors until a separate backend/provider contract exists.
- Do not add a second generate or retry button in the card. The Context Panel remains the only generation action owner in this Task.

### 5. Accessibility, responsive, and performance

- Preserve keyboard selection, focus visibility, screen-reader naming, reduced motion, and 40px minimum interactive targets.
- Verify desktop `1440x900` and `1366x768`, compact `920x900`, and review-only `375x812` from one fresh production build.
- Verify 10%, 100%, 200%, and 800% Canvas zoom for header/body alignment, editor scaling, ports, status, and selection geometry.
- Only the selected editable node may add an interactive DOM authoring surface. Idle authoring cards remain Leafer-rendered so the 200-node/300-connection performance boundary remains applicable.
- Visual restyling alone must produce zero document PATCH, history entries, selection changes, or viewport persistence requests.

### 6. Reference and license hygiene

- Treat AIGCCanvasFlow as pattern evidence and implement against Revid abstractions. Do not copy its Vue components, store, schema, or SCSS blocks.
- The source is MIT licensed under `Copyright (c) 2026 MaLunan`. If implementation copies any code or substantial portion instead of clean-room pattern synthesis, preserve the MIT notice in the appropriate third-party attribution before commit.
- Do not stage or modify the reference repository.

## Likely files

The executing session must verify paths against the post-T5-072 tree before editing.

- `frontend/src/assets/styles/v2-canvas-tokens.scss`
- `frontend/src/views/app/canvas-workspace.scss`
- `frontend/src/components/canvas/canvas-node-presentation.ts`
- `frontend/src/components/canvas/canvas-renderer.ts`
- `frontend/src/components/canvas/canvas-geometry.ts`
- `frontend/src/components/canvas/canvas-node-interaction.ts`
- `frontend/src/components/canvas/CanvasNodeSurfaceLayer.vue`
- `frontend/src/components/canvas/CanvasNodeComposer.vue`
- `frontend/src/components/canvas/canvas-node-surfaces.scss`
- `frontend/src/components/canvas/canvas-stage.scss`
- create `frontend/src/components/canvas/canvas-authoring-card-presentation.ts` if needed to keep the renderer focused and files below the project size limit
- create `frontend/tests/e2e/canvas-authoring-card-shell.spec.ts`
- `frontend/tests/e2e/canvas-node-presentation.spec.ts`
- `frontend/tests/e2e/canvas-libtv-visual-parity.spec.ts`
- `frontend/tests/e2e/canvas-port-geometry.spec.ts`
- `frontend/tests/e2e/canvas-node-workflow.spec.ts`
- `frontend/tests/e2e/canvas-composer-zoom.spec.ts`
- `frontend/tests/e2e/canvas-status-zoom.spec.ts`
- `frontend/tests/e2e/canvas-multi-scenario-visual.spec.ts`
- `frontend/tests/e2e/canvas-keyboard-ownership.spec.ts`
- `frontend/tests/e2e/canvas-performance-accessibility.spec.ts`

## Delivery sequence

1. Confirm T5-072 release, activate T5-073 alone, and create PLAN/PROGRESS.
2. Capture current script, note, generation, image result, video result, selected editor, locked, running, failed, compact, and readonly baselines before source edits.
3. Add pure RED tests for authoring-card eligibility, header/body/status slots, long-content bounds, recipe prompt secrecy, and unchanged media/result presentation.
4. Add browser RED tests for idle, selected, editing, locked, running, failed, empty, long Chinese, and long English authoring cards. Record zero-mutation baselines.
5. Add dedicated authoring-card tokens and the smallest pure presentation resolver.
6. Update the Leafer renderer to draw the shared authoring shell without changing the engine, keyed reconciliation, media surfaces, or typed ports.
7. Align the selected composer with the new shell while retaining one editor and the existing command/autosave boundary.
8. Reconcile lifecycle rendering so every authoring card has one status expression and no duplicate badge or error surface.
9. Run focused visual, geometry, editing, keyboard, generation, overlay, compact, readonly, and performance regressions.
10. Build once and inspect the same representative graph at all required viewports and zoom levels. Compare against the user reference for hierarchy, not pixel copying.
11. Review the fresh diff, attribution need, UTF-8, file size, and sensitive paths. Do not read `.env`.
12. Update PROGRESS/CURRENT/ROADMAP and write REPORT only after every acceptance criterion passes, then commit and push the single scoped Task.

## Acceptance criteria

- Canonical script, note, and generation nodes share one coherent header/body/status grammar and remain recognizably Revid.
- Type identity, bounded title, content preview, empty state, lock, running, success, and failure states are readable without opening the Inspector.
- Long Chinese and English content never expands the card indefinitely, collides with ports, or escapes the body.
- The selected editor reads as part of the same authoring card and retains IME, debounce, Escape/blur flush, autosave, exact undo/redo, reload, drag, lock, and readonly behavior.
- Generation lifecycle appears once, visual-recipe internal prompts remain hidden, and no unsupported parameter control or second generation action is introduced.
- Image/video assets and generated results retain intrinsic ratio, external label, exactly one DOM media surface, native playback, frame tools, comparison, and media-first hierarchy.
- Port anchors, edges, status, selection bounds, toolbar avoidance, continuation trigger, fit, minimap, and collision placement all agree with the new visual geometry.
- Desktop and compact editing remain usable; 375px remains review-only; focus and reduced-motion checks pass.
- Visual-state changes alone emit zero graph PATCH, history, selection, and viewport persistence mutations.
- Focused performance stays within the current acceptance thresholds, and the executor explicitly audits whether T5-072's 200/300 evidence remains applicable after renderer changes.
- No backend, provider, schema, migration, paid call, secret access, or destructive operation is introduced.

## Verification requirements

```powershell
cd frontend
npm run build
npx playwright test tests/e2e/canvas-authoring-card-shell.spec.ts tests/e2e/canvas-node-presentation.spec.ts tests/e2e/canvas-port-geometry.spec.ts
npx playwright test tests/e2e/canvas-node-workflow.spec.ts tests/e2e/canvas-composer-zoom.spec.ts tests/e2e/canvas-status-zoom.spec.ts
npx playwright test tests/e2e/canvas-multi-scenario-visual.spec.ts tests/e2e/canvas-keyboard-ownership.spec.ts tests/e2e/canvas-performance-accessibility.spec.ts
npx playwright test tests/e2e/canvas-libtv-visual-parity.spec.ts tests/e2e/canvas-generation-context.spec.ts tests/e2e/canvas-visual-asset-recipes.spec.ts
```

- Rebuild before every preview-backed visual decision so browser evidence cannot use stale `dist`.
- Retain one current screenshot set for script, note, generation, image result, selected editor, running, failed, locked, compact, and readonly states without overwriting unrelated artifacts.
- Compare actual DOM/Leafer bounding boxes for editor, card, ports, status, selection toolbar, and neighboring media.
- Run `git diff --check`, encoding, file-size, exact staging, and sensitive-path audits before commit.

## Risks and release guards

- Replacing the reference's VueFlow DOM nodes with Leafer primitives can create renderer/DOM drift. One pure presentation contract and shared geometry are release blockers.
- Extra Leafer primitives can affect 200/300 performance. Keep shapes minimal, preserve keyed reconciliation, and measure instead of assuming.
- A visually richer card can become dense or generic. Header, body, and status each get one job; avoid decorative chrome and strong glow.
- Moving or docking the composer can break drag, focus, IME, or overlay placement. Preserve a non-interactive drag region and prove the full editing lifecycle in browser tests.
- Duplicating generation controls would create two state owners. Context Panel remains authoritative for generation actions, ordered inputs, preflight, quota, retry, and history.
- T5-015 previously rejected permanent headers on every node. This Task is an explicit user-directed adjustment for authoring nodes only and must not regress the media-first result treatment.

## Non-goals

- Whole-Canvas restyling, media/result card framing, VueFlow adoption, engine replacement, node schema change, backend/provider work, model/aspect/style/seed controls, AI text polish, type switching, scope switching, inline delete/duplicate, new generation action, mobile editing, or copying reference assets/source.

## Completion standard

- T5-073 is complete only when the new authoring-card hierarchy passes focused browser, geometry, editing, responsive, accessibility, performance, build, visual, diff, and hygiene gates while media-first and generation-ownership contracts remain unchanged.
- Preference alone is not evidence. The final REPORT must include current screenshots and explicitly state which reference patterns were adopted, adapted, and rejected.
