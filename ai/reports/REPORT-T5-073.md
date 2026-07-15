# REPORT-T5-073 - Canvas authoring card hierarchy refinement

## Outcome

T5-073 is `DONE - PASS`.

Canonical script, note, and generation nodes now share a compact Revid-native header/body/status grammar. Image, video, asset, and result nodes retain the verified media-first treatment, and the selected composer remains the single editable DOM authoring surface.

## Delivered contract

| Area | Result |
|---|---|
| Pure presentation | Canonical eligibility, registry identity, icon key, bounded title/body, empty, lock, recipe-safe content, lifecycle, and fixed world-space slots resolve without a second schema |
| Shared shell | Leafer renders compact type/title headers, bounded bodies, and a single generation lifecycle expression with restrained selected depth |
| Geometry | Shared visual height preserves ports, edges, minimap, fit, selection, collision, toolbar, and continuation alignment |
| Editing | One selected composer remains the only editor and mutation owner; material, radius, width, and border read as one authoring family |
| Generation honesty | Recipe cards expose only public title/description; internal prompts, unsupported selectors, and duplicate generation actions remain absent |
| Media boundary | Media/results keep intrinsic ratio, external labels, exactly one DOM surface, playback, frame tools, comparison, and no permanent header |
| Responsive and access | Desktop and 920 editing remain usable; 375 remains review-only; keyboard, IME, focus, reduced motion, and readonly contracts remain intact |
| Performance | Idle authoring nodes add no DOM surface or decorative primitive; lifecycle text exists only for non-idle authoring nodes |

## Clean-room reference result

- Adopted: stable separation of type identity, title, content, and state.
- Adapted: Revid typed registry, Leafer renderer, shared geometry, tokens, command model, and responsive ownership.
- Rejected: VueFlow, loose data, emoji icons, type switcher, selectors, AI polish, inline destructive actions, Teleport picker, bright purple edges, and theme copying.
- License: the reference is MIT, Copyright (c) 2026 MaLunan. No source, SCSS block, asset, store, schema, or substantial portion was copied, so no attribution addition is required.

## Verification

- Production build: PASS, 4,821 modules.
- Presentation and geometry: PASS, 11/11.
- Editing, composer zoom, and status: PASS, 13/13.
- Multi-scenario and keyboard ownership: PASS, 15/15.
- Media/LibTV, generation context, and visual recipes: PASS, 17/17.
- Final authoring suite after restoring the standard production build: PASS, 5/5.
- Viewports 1440x900, 1366x768, 920x900, 375x812 and zoom 10%, 100%, 200%, 800% have current coverage.
- Visual hover emitted zero document PATCH; existing suites retain no-mutation selection, readonly, viewport, and media contracts.

## Performance evidence

- Mock dense profiling exposed a Windows 33.3 ms scheduling bucket and drove removal of unnecessary per-node primitives. Companion listener/heap and accessibility/viewport checks passed.
- Because the renderer changed, T5-072 live performance was not reused as final proof.
- Fresh guarded live run `t5008-38636-ef8c656b3c45d7d4`: PASS with 200 nodes, 300 connections, 59.94 FPS, 16.8 ms frame p95, 194 ms stable render, 0.1 ms pointer p95, and 0 long tasks.
- The harness used an owned disposable `revid_test_*` schema and ports, then cleaned schema, runtime, and processes.

## Visual review

- Type identity is quieter than the bounded title, and body copy stays readable without growing node height.
- Selection uses a thin violet outline and modest depth. The composer aligns below the card with matching width and material family.
- Generation lifecycle appears once inside the authoring card. Neighboring media/results remain dominant and unframed.

## Safety and scope

- No backend, schema, migration, provider, paid call, secret access, `.env` read, or destructive operation occurred.
- CanvasContextPanel remains the only owner of generation actions, quota, retry, ordered inputs, preflight, and history.
- User-owned `.hermes` and `output/` were not modified, deleted, or staged.
