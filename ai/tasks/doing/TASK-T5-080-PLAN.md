# TASK-T5-080 Plan

- State: `DOING`
- Objective: close the audited Canvas interaction defects through strict RED-GREEN-REFACTOR units while preserving one authoritative graph, typed compatibility, command history, autosave, responsive ownership, and the 200/300 boundary.

## Locked design and engineering direction

- Visual thesis: retain the existing dark-purple, media-first, low-noise Revid Canvas; affordances become explicit only for hover, selection, compatible targeting, or active provenance.
- Content plan: orient with a neutral aggregate selection, show exact compatibility and counts, then enable only the action the current graph contracts can execute truthfully.
- Interaction thesis: use forgiving screen-space hit targets, magnetic exact-port landing, and restrained active-only edge flow; never add ambient graph motion.
- CSS strategy: existing scoped Vue SCSS plus `v2-canvas-tokens.scss`; no second styling system, global restyle, or ad hoc color/radius vocabulary.
- TDD rule: no production behavior change is written until its focused test has failed for the expected missing-behavior reason.

## Unit 0 - Durable activation

1. Create Task, PLAN, and PROGRESS documents.
2. Set `CURRENT.md` and `ROADMAP.md` to one active `T5-080` Task in `DOING`.
3. Record baseline HEAD, branch, worktree, source audit, risks, gates, and exact next action.
4. Re-read the complete required truth set and rerun the Git preflight before business-code edits.

Success gate: Task, PLAN, PROGRESS, CURRENT, and ROADMAP agree on one active Task and the same next action.

## Unit 1 - Freeze RED interaction evidence

Primary tests:

- `frontend/tests/e2e/canvas-port-geometry.spec.ts`
- `frontend/tests/e2e/canvas-connection-continuation-browser.spec.ts`
- `frontend/tests/e2e/canvas-command-interactions.spec.ts`
- `frontend/tests/e2e/canvas-selection-generation-output.spec.ts`
- `frontend/tests/e2e/canvas-libtv-visual-parity.spec.ts`

Add minimal behavioral cases for six-zoom port hit size, outside-dot pointer start, non-primary ownership, Escape/pointercancel, nearest compatible target ranking, general multi-selection hull, atomic batch output, group-plus-child drag parity, canonical group bounds, and active/static connection motion. Run each focused case and record its expected failure fingerprint before production edits.

Success gate: every planned production behavior has deterministic RED evidence and existing assertions remain green.

## Unit 2 - Canonical visible node geometry

Create `frontend/src/modules/canvas/node-layout.ts` with:

```ts
export interface CanvasNodeLayoutSize { width: number; height: number }
export interface CanvasNodeLayoutRect extends CanvasNodeLayoutSize { left: number; top: number }

export function resolveCanvasNodeLayoutSize(node: CanvasNode): CanvasNodeLayoutSize
export function resolveCanvasNodeLayoutRect(node: CanvasNode): CanvasNodeLayoutRect
```

Move authoritative media/aspect/authoring-card visible sizing out of presentation-only ownership. Delegate hit testing, reveal centering, group bounds, and selection-generation placement to the shared rect while preserving finite, legacy, unsupported, persistence, and serialization fallbacks.

Focused verification: node presentation, port geometry, and command interaction specs.

Success gate: every audited visible-bounds consumer returns the same rect for the same node.

## Unit 3 - Port visual and hit-target separation

Create `frontend/src/components/canvas/canvas-port-presentation.ts` with visible world-size and 32-44 CSS-pixel hit-target contracts. Represent each port as a quiet visible ellipse plus a transparent pointer ellipse on the same anchor. Update hit geometry on zoom without rebuilding the graph, reject non-primary pointerdown, and keep readonly/locked ports truthful.

Focused verification: port geometry and browser connection continuation specs at 10%, 25%, 50%, 100%, 200%, and 800%.

Success gate: the forgiving area is a real pointer target and does not steal pan/context-menu ownership.

## Unit 4 - Exact compatible drop resolution

Extend `canvas-connection-target.ts` to return one node, port, distance, and exact anchor after locked/direction/typed compatibility filtering. Use stable node and registry-port order for ties. Reuse the resolver for new connections and endpoint reroute, snap the draft to the exact eligible anchor, and retain duplicate-edge/same-node command validation.

Focused verification: port geometry, connection continuation, and edge reroute specs.

Success gate: geometric proximity can never choose a target that canonical authoring compatibility rejects.

## Unit 5 - Neutral aggregate hull and batch continuation

Create focused aggregate trigger/menu/resolver components rather than expanding `CanvasStage.vue`. Render a neutral hull for every editable supported selection of at least two nodes. Derive eligibility and exact counts solely from `resolveSelectionGenerationIntent`, dispatch the existing `createSelectionGenerationCommand` result unchanged, and keep Escape/outside-click/order/readonly/invalid states deterministic.

Focused verification: selection generation, selection output, command history, and visual parity specs.

Success gate: batch continuation is only a second entry point into the existing authoritative `insert-graph` command.

## Unit 6 - Group movement as one graph unit

Add one pure `resolveCanvasDragNodeIds` contract that expands selected normal groups into deterministic parent-before-child IDs. Use the same resolved set for pointer preview and one final `move-nodes` command. Preserve absolute child coordinates, selection ownership, grid snapping, pointercancel rollback, unrelated nodes, locked/unsupported safeguards, connections, one PATCH, and exact undo/redo/reload.

Focused verification: command contract, interactions, history, and document persistence specs.

Success gate: every moved child has the exact group delta during preview and after reload; ungroup causes no positional drift.

## Unit 7 - Active-only connection flow

Create a pure motion resolver and render one pointer-passive duplicate path with three bounded directional segments only for draft, selected edge, selected-node lineage, or explicitly active provenance. Use one CSS dash-offset animation, leave base/hit paths unchanged, keep unrelated edges static, and reduce to static emphasis under `prefers-reduced-motion`.

Focused verification: generation provenance, multi-scenario visual, and performance/accessibility specs.

Success gate: the 200/300 fixture does not animate all 300 edges or add graph/history/network work per frame.

## Unit 8 - Integrated verification and closure

1. Run all T5-080 focused specs and the related Canvas regression matrix.
2. Run `npm run build` from `frontend`.
3. Capture and inspect 1440x900, 1366x768, 920x900, and 375x812 review-only evidence at representative zooms.
4. Run full functional Chromium and classify any environment-sensitive performance case without weakening thresholds.
5. Because renderer hit targets and overlays change, run `backend\.venv\Scripts\python.exe scripts\canvas_acceptance_supervisor.py --execute` only when its guarded environment is already available.
6. Run fresh diff review, `git diff --check`, strict UTF-8, file-size/growth, sensitive-path, staged-secret, and exact staged-diff gates.
7. Write `ai/reports/REPORT-T5-080.md`, close Task/PLAN/PROGRESS/CURRENT/ROADMAP, then commit and push only exact owned paths after every non-deferred criterion passes.

Success gate: code, tests, visual evidence, performance evidence, durable documents, report, commit, and `origin` all agree on `DONE - PASS`.

## Stop rules

- Stop and document a blocker if the work requires Storyboard/T5-081, backend/schema/provider behavior, paid calls, secret access, a second graph, or incompatible persisted semantics.
- Stop and re-plan if a unit cannot be made RED for the expected behavior, if preview and commit require different graph membership, or if active-only motion cannot remain bounded at 200/300.
- Preserve pre-existing untracked `.hermes` plans and `output/`; do not stage them.
