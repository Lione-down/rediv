# T5-015 Canvas Media-first Fidelity Plan

- State: `DONE - PASS`
- Updated: 2026-07-15
- Product direction: quiet graphite workbench with media-shaped nodes and contextual controls.
- Implementation owner: Codex Project Lead Engineer

## Goal and architecture

Keep Leafer UI, DOM media overlays, Canvas commands, persistence, accessibility surfaces, and project contracts unchanged. Refine the shared presentation geometry so each semantic node kind owns its natural silhouette. Leafer and DOM continue to consume the same world rectangles, but decoded media dimensions become the primary node body instead of fitting inside a generic card.

## Reference diagnosis

Public LibTV screenshots show four repeatable traits: media itself is the node, labels sit above it, persisted edges are thin and recessive, and ports plus tool panels appear only in context. The T5-014 Revid baseline still uses tall fixed rectangles, bright always-visible ports, animated dashed edges, and panel-like selection/editor surfaces. T5-015 closes those observable deltas without copying brand assets or adding LibTV-only features.

## Visual and interaction thesis

- Visual thesis: near-black film workbench where media frames float directly on the graph and UI chrome recedes.
- Content plan: the graph shows content first, labels second, state third, and tools only after selection.
- Interaction thesis: hover and selection reveal ports and compact actions; persisted relationships stay quiet; authoring remains anchored beside the selected content.
- CSS strategy: existing Vue SFC plus shared SCSS tokens only.

## Implementation sequence

### Unit 0: reference-backed RED baseline

Retain public reference screenshots under ignored output, capture the current Revid fixture, and add assertions for outer media ratio, compact text/generation height, latent ports, solid persisted edges, and viewport-safe overlays.

### Unit 1: intrinsic media node geometry

Make media/result dimensions derive from validated aspect ratio with bounded long-edge sizing. Align node content, selection, label, ports, DOM media, and minimap geometry to that outer frame. Remove internal letterbox padding while preserving unavailable/loading states.

### Unit 2: compact semantic text and generation geometry

Give script/note and generation nodes content-appropriate minimum heights and tighter padding. Preserve readable titles, status semantics, prompt text, drag targets, and registry identity without retaining a universal card silhouette.

### Unit 3: quiet connection language

Dim idle ports, reveal them on node hover/selection/draft/focus, and keep their 24 px interaction area. Render saved connections as thin solid curves with low-contrast arrows. Reserve violet for a valid draft or explicit selection in Graph Access.

### Unit 4: contextual tool refinement

Compact the selection toolbar and composer, reduce surface depth, and make placement inspector-aware at the supported desktop widths. Keep IME, Escape, blur commit, keyboard shortcuts, and mobile review-only behavior intact.

### Unit 5: browser iteration and closure

Capture 1440x900, 1366x768, 920x900, and 375x812 screenshots, compare them to both T5-014 and the public LibTV traits, and iterate until content hierarchy is visually credible. Run focused tests, full Chromium, build, guarded live 200/300 evidence, accessibility, UTF-8, file-size, diff, and secret-hygiene checks. Write REPORT only after direct evidence satisfies every criterion.

## Verification commands

```powershell
Set-Location frontend
npx playwright test tests/e2e/canvas-libtv-visual-parity.spec.ts tests/e2e/canvas-node-workflow.spec.ts tests/e2e/canvas-resource-generation.spec.ts --project=chromium
npx playwright test --project=chromium
npm run build
```

Use the existing guarded live Canvas harness with the backend venv and disposable `revid_test_*` schema. Do not read `.env` files or expose credentials. Finish with strict UTF-8, <=500-line, staged-sensitive-path, `git diff --check`, status, stat, and name-only audits.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Aspect-ratio resize moves ports after load | Edges jump or saves churn | Apply one bounded metadata update and reuse shared geometry |
| Latent ports hurt discoverability | Users cannot create edges | Keep large hit targets and reveal on hover, selection, draft, and focus |
| Compact nodes clip localized content | Chinese text becomes unreadable | Assert representative long text and minimum readable body height |
| Overlay compaction breaks keyboard use | Accessibility regression | Retain semantic buttons, focus rings, labels, and Graph Access |
| Visual work expands into product cloning | Brand and scope risk | Copy only generic hierarchy patterns, retain Revid tokens and wording |
| More DOM media harms dense graph performance | 200/300 regression | Keep DOM ownership limited to visible native media and active editor |

## Completion rule

T5-015 is complete only when media-shaped geometry, compact semantic nodes, quiet ports and edges, lighter contextual controls, four-view screenshots, full regression, build, guarded live performance, and durable documents all agree.

## Reference-source decision

The Human Owner supplied `MaLunan/AIGCCanvasFlow` as an additional MIT-licensed study source. Revid adopts only general interaction principles visible in its source: controls revealed by hover/selection, semantic node/body separation, and contextual continuation affordances. Revid does not copy its fixed node header, permanent left toolbar, bright edge treatment, component code, branding, or workflow behavior. The engine remains Leafer UI.
