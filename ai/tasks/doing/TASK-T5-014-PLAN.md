# T5-014 LibTV-inspired Canvas Visual Parity Implementation Plan

- State: `DONE - PASS`
- Updated: 2026-07-15
- Product direction: graphite-black media-first Canvas with restrained violet interaction feedback.
- Implementation owner: Codex Project Lead Engineer

## Goal and architecture

Keep Leafer UI as the persistent world renderer and retain the existing command, autosave, revision, MySQL, and provider contracts. Replace the shared fixed-card presentation with typed semantic geometry. Leafer and DOM surfaces consume the same world rectangles; DOM owns visible native media and the active contextual composer, while Leafer owns static geometry, outlines, ports, labels, and passive connections.

## Visual and interaction thesis

- Visual thesis: a quiet graphite-black workbench where media is the only strong visual anchor and violet is reserved for interaction.
- Content plan: Canvas orients and navigates; nodes present content; selection reveals editing tools only when needed.
- Interaction thesis: explicit ports create connections, edges remain background information, and pan/zoom never separates DOM media or editor layers from Leafer geometry.
- CSS strategy: existing Vue SFC plus SCSS and shared V2 Canvas tokens only.

## Constraints

- Vue 3, TypeScript, Pinia, Naive UI, Leafer UI, SCSS, Playwright.
- Desktop editing at 1440x900, 1366x768, and 920x900; 375x812 remains review-only.
- Preserve node/connection IDs, command/autosave behavior, accessibility access to connections, and the 200/300 performance boundary.
- No new Canvas engine, UI framework, database field, provider API, paid call, or secret access.
- Keep changed or new source files within the repository's 500-line guideline.

## Implementation sequence

### Unit 0: deterministic baseline

Create `canvas-libtv-visual-parity.spec.ts`, extend the generation fixture with recognizable 16:9, 1:1, and 9:16 SVG media, freeze the five visible defects as RED assertions, and retain baseline screenshots under `output/playwright/t5-014-baseline/`.

### Unit 1: semantic node geometry

Add discriminated `visualKind` and validated aspect-ratio data to the shared presentation model. Define independent content, label, port-anchor, selection-outline, toolbar, and composer rectangles. Render text, media/result, generation, and unknown nodes with distinct geometry without changing graph identity or command contracts.

### Unit 2: media geometry and a single surface

Use the shared content rectangle for DOM media, apply `box-sizing: border-box`, preserve full-result media with `object-fit: contain`, update aspect-ratio presentation once after decoded metadata, and suppress Leafer placeholder content only while a valid DOM media surface is active. Verify 1 px alignment at 10%, 100%, and 200% zoom.

### Unit 3: contextual composer and toolbar

Create `CanvasNodeComposer.vue`, move authoring below the selected node, keep media stable, place the toolbar above or below according to viewport bounds, and retain IME, Escape, blur, flush, focus, keyboard, and review-only contracts.

### Unit 4: passive edges and explicit ports

Remove ordinary pointer/focus selection from Canvas edge hit paths, set connection SVG and draft paths to `pointer-events: none`, retain at least 24 px port hit areas with 10-12 px visible ports, and preserve Graph Access review/delete plus typed compatibility feedback.

### Unit 5: media-first visual hierarchy

Centralize node outline, selected outline, port, edge, composer surface, media radius, and restrained semantic-state tokens. Move titles outside content surfaces, remove large success fills/glow, keep violet for selection/valid target/primary action, and express multiple results as a controlled visual stack without duplicate DOM media.

### Unit 6: verification and closure

Run focused visual/workflow/resource specs, full Chromium, build, relevant guarded live Canvas harness, 200/300 performance profile, supported viewport screenshots, mobile review-only checks, accessibility checks, UTF-8/file-size/hygiene checks, and fresh diff review. Write REPORT and mark `DONE - PASS` only after every acceptance criterion has direct evidence.

## Verification commands

```powershell
Set-Location frontend
npx playwright test tests/e2e/canvas-libtv-visual-parity.spec.ts tests/e2e/canvas-node-workflow.spec.ts tests/e2e/canvas-resource-generation.spec.ts --project=chromium
npx playwright test --project=chromium
npm run build
```

Run the existing guarded live Canvas harness discovered from T5-013/T5-008 evidence without reading secrets or targeting user data. Finish with `git diff --check`, strict UTF-8, line-count, sensitive-path, status, stat, and name-only audits.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| DOM and Leafer drift after zoom/pan | Media and outlines separate | Use one typed world-geometry source and assert three zoom levels |
| Media metadata changes node geometry repeatedly | Ports and edges jump | Commit one bounded presentation resize after decoded metadata |
| Passive edges reduce discoverability | Connection deletion becomes unclear | Preserve Graph Access list, focus, locate, and delete actions |
| Composer covers nearby nodes or inspector | Narrow desktop unusable | Viewport-aware placement with dedicated 920px screenshot checks |
| Rich DOM surfaces regress dense graphs | 200/300 performance failure | Only visible media and the active composer use DOM surfaces |
| Visual parity expands into product cloning | Scope and contract churn | Limit work to geometry, hierarchy, states, ports, and screenshots |

## Completion rule

T5-014 is complete only when semantic geometry, media aspect ratio, single-surface rendering, contextual editing, passive edges, restrained visual hierarchy, focused/full/build/live/performance verification, four viewport screenshots, and all durable state documents agree.
