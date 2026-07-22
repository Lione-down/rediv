# T6-003 Approval-Ready Implementation Gap Audit

- Audited at: `2026-07-21`, Asia/Shanghai.
- Baseline: `HEAD b4e7e4fad26f346648946bc0cad8919a1d8944e2` plus the tracked T6-003 Task/state/evidence activation changes.
- Boundary: read-only source and test inspection only. No frontend production or test code was changed, no runtime/provider call was made, and the static design decision remains `PENDING`.
- Purpose: separate already-correct contracts from measured gaps so implementation can begin with deterministic RED evidence immediately after Human approval.

## Acceptance-to-code map

| Contract | Current authority and evidence | Verified current behavior | Gap that must become RED | Planned owner after approval |
|---|---|---|---|---|
| Card state authority | `canvas-renderer.ts`, `canvas-node-presentation.ts`, `canvas-authoring-card-presentation.ts`, `canvas-node-surfaces.scss`, `v2-canvas-tokens.scss` | Media remains body-owned with external labels; selected stroke is already `1.5`; normal non-media idle cards do not receive a shadow; generic radius token is `12px` | Leafer card state is assembled inline and DOM surfaces have no shared semantic resolver; media radius is `8px`; hover/focus, compatible-drag, readonly/locked, lifecycle, and reduced-motion states are not expressed through one pure contract; accepted selected shadow/tone/transition still needs the Human-approved baseline | New pure `canvas-card-interaction-presentation.ts`, then narrow renderer/DOM/token consumers and a focused fidelity spec |
| Port geometry and acquisition | `canvas-port-presentation.ts`, `canvas-port-interaction.ts`, `canvas-geometry.ts`, `CanvasConnectionTargetPorts.vue` | Port centers derive from current node size and lie on the exact input/output boundary; acquisition is screen-stable at exactly `40 CSS px`; overlapping pointer candidates resolve by nearest center; locked nodes fail closed | Visible size is `16 world px` in both Leafer and DOM target presentation, not `20`; min/max constants still describe `32..44` instead of making the exact `40` contract explicit; target-drag selection uses a separate `24 CSS px` radius and must be reconciled by semantic purpose without breaking typed compatibility | Existing port presentation/interaction/target helpers plus geometry and direct/reverse browser contracts |
| Persisted/draft/reroute path | `canvas-geometry.ts`, `use-canvas-connection-presentation.ts`, `use-canvas-stage.ts`, `CanvasConnectionLayer.vue` | Persisted, initial draft, and reroute draft all call the same current `buildConnectionPath`; exact registry port anchors are preserved | The current curve always uses source `+110` and target `-110`; it does not implement midpoint-X forward controls or `132 world px` outward reverse tangents, and the generic geometry module is not a dedicated pure path authority | New pure `canvas-connection-path.ts`; all existing consumers migrate together; exact forward/reverse path assertions precede implementation |
| Edge still presentation | `CanvasConnectionLayer.vue`, `canvas-connection-presentation.ts` | Visible paths stay passive; the transparent path owns selection/focus; accessible labels, selected identity, reroute handles, insertion affordance, and provenance distinctions already exist | Every visible edge still receives `marker-end`; idle visible width is `1.6 CSS px` and hit width is `16 CSS px`, not `2/20`; overview widths intentionally thin further and must be reconciled with the accepted fidelity contract without losing density behavior | Narrow connection-layer markup/styles plus existing interaction regression specs |
| Localized flow and reduced motion | `canvas-connection-motion.ts`, `CanvasConnectionLayer.vue`, `canvas-connection-motion.spec.ts`, accessibility spec | Idle edges do not animate; draft, selected, and included provenance are bounded to three normalized segments; reduced motion already removes animation and leaves a deterministic static cue | Motion has no hover reason and runs `1200ms`, not `3000ms`; the pure resolver does not own duration/static presentation; CSS timing is not asserted; flow cleanup needs deterministic deselect/leave/cancel coverage | Extend pure motion presentation and focused browser coverage; preserve existing reduced-motion assertions |
| Contextual surfaces and focus | `context-surface-state.ts`, `use-canvas-context-surface.ts`, `CanvasWorkspace.vue`, `canvas-context-surface.spec.ts` | One discriminated authority closes competing surfaces, records a connected opener, restores valid focus with a Canvas fallback, and clears on project/Canvas lifecycle changes | Current browser proof covers resources-to-revision exclusivity and revision close only; source-attached toolbar/composer, Escape/outside click/pointer cancel/deletion/readonly/undo-reload/failure interruption, selection preservation, and zero-mutation disclosure are not covered as one compound matrix | Reuse existing authority; extend contextual/browser tests rather than introduce another state controller |
| Accessibility, mobile, persistence, and performance | Existing Canvas accessibility, history, persistence, continuation, reroute/insertion, and headed performance specs | Reduced motion, axe, keyboard graph access, `375x812` review-only behavior, typed continuation, and the `200-node/300-connection` thresholds already have regression foundations | T6-003 needs a deterministic fixture tying accepted visual anchors to functional and no-mutation assertions at `1440x900`, `1366x768`, `920x900`, and review-only `375x812`; existing arrow-marker assertions conflict with the new no-marker requirement | Add one scoped fidelity fixture/spec and update only assertions whose product contract intentionally changes |

## Existing assertions that intentionally conflict with T6-003

These are expected RED sites after approval, not evidence that the current suite should be weakened:

- `canvas-node-workflow.spec.ts` explicitly requires `marker-end="url(#canvas-edge-arrow)"`; T6-003 must replace that expectation with no persistent path marker while retaining passive-path and accessible selection assertions.
- `canvas-libtv-visual-parity.spec.ts` reads `#canvas-edge-arrow` and checks zoom-dependent marker dimensions; the replacement must assert marker absence and preserve low-zoom density/endpoint evidence.
- `canvas-connection-motion.spec.ts` states that only draft, selection, and provenance animate; the accepted contract adds localized hover while keeping idle null and included-provenance filtering.
- `canvas-port-geometry.spec.ts` already proves exact `40 CSS px` acquisition and current-boundary anchors; it should gain the explicit `20 world px` visual expectation, not be replaced.
- `canvas-connection-continuation-browser.spec.ts` compares the draft path with `buildConnectionPath`; migration must keep this direct/reverse continuation proof against the new single path resolver.

## Proposed RED sequence after Human approval

1. Record the static frame as `ACCEPTED` and freeze only its declared card hierarchy, selected treatment, source-attached surfaces, port size, idle-edge treatment, and localized-flow intent.
2. Add a pure card-state table covering idle, hover/focus, selected, compatible-drag, locked/readonly, lifecycle, and reduced-motion outputs without node geometry or graph mutation.
3. Extend port geometry tests to assert `20 world px`, exact `40 CSS px`, current visible boundary, delayed metadata at `17/36/100/200%`, nearest compatible overlap, reverse drag, and cancel.
4. Add pure forward and reverse path fixtures: midpoint-X controls for forward paths and `132 world px` outward tangents for reverse paths. Prove persisted, draft, reroute, insertion, selected, and provenance consumers share the same output.
5. Update edge/motion RED contracts for `2 CSS px` idle paths, `20 CSS px` hit paths, absent persistent arrow markers, localized hover/selected/draft/included-provenance flow, `3000ms` duration, deterministic cleanup, and static reduced-motion output.
6. Extend the existing contextual-surface test matrix with source attachment, collision bounds, Escape/outside/pointer-cancel/lifecycle closure, valid-opener/fallback focus, selection preservation, and zero graph/history/autosave/revision/quota/task/asset/provider mutation.
7. Run the RED fingerprint before any product change, then implement Units 1 through 4 in the Task PLAN order and close Unit 5 only with the full existing regression/performance gates and Human side-by-side review.

## Risks and controls

- The separate `24 CSS px` drag-target radius may be intentional pointer-release tolerance rather than the port acquisition hit box. The RED fixture must name these semantics before unifying values; do not silently replace both with one constant.
- Overview edge thinning is an existing density optimization. The accepted `2 CSS px` requirement must be tested at the declared 100% fidelity anchor while low-zoom behavior remains an explicit, reviewable contract.
- The selected edge identity contains a textual `→` between accessible source/target names. “No persistent arrows” applies to SVG path markers; removing the identity separator would be an unrelated accessibility/UI change unless the accepted design explicitly requires it.
- `CanvasWorkspace.vue`, `CanvasStage.vue`, and near-limit Canvas files must not absorb a second authority. New pure modules should remain scoped, and existing aggregate-file exceptions must not expand without a concrete split.

## Gate outcome

The implementation map and RED order are ready. Product/test edits remain blocked only on an explicit Human decision for `output/t6-003/design-preview/revid-canvas-card-interaction-static-v1-1440x900.png`. Automatic continuation does not satisfy that decision.
