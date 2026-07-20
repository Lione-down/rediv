# TASK-T5-096 Plan

- State: `DONE - PASS`
- Objective: deliver measured visual, functional, and interaction parity with the latest official authenticated LibTV Canvas while preserving Revid semantic colors, lawful assets, native authority contracts, and all Revid-only entries.
- Baseline: planning dependency `9871cedba00001e925497e2eadca855d6a76171e` is an ancestor of activation `HEAD == origin/main == e487dafc0c573641466835e028858d6ebdd23dd4`; no tracked worktree changes; user-owned `.codex/`, `.hermes/plans/`, and `output/` remain untracked and outside staging scope.
- Dependency: `T5-095 - DONE - PASS`.
- Task: `ai/tasks/todo/TASK-T5-096.md`.

## Planning decisions

1. Official source priority is authenticated official LibTV Canvas, then official LibTV documentation/video only for states that cannot be reached without a paid action. Third-party material and old retained screenshots cannot close parity.
2. Every scenario has independent visual, functional, and interaction outcomes. Overall `MATCHED` requires all three.
3. Revid-only entries are preserved as first-class extensions. They do not replace official-equivalent entries and may be masked only inside declared extension regions for structural comparison.
4. Revid's graphite/violet semantic colors, branding, copy, licensed icon system, Leafer engine, typed graph, commands, history, autosave, persistence, provider/model selection, quota/task/result ownership, responsive boundary, and accessibility requirements remain authoritative.
5. No task unit may claim parity from control presence, feature-name similarity, a still image for hidden interaction, a mock for real-provider output quality, or a prior documented deferral.
6. Default implementation evidence is pure/unit plus browser mock and guarded local regression. Real/paid provider calls remain separately gated and are not required to validate Canvas mechanics.
7. Human Owner explicitly excludes Director/`导演台`. The official entry/node stays in clean-room evidence, but Revid's scoped Add catalog has nine actions and no Director control, implementation, or inert placeholder.
8. Official guide section `1.4.2 画布左侧栏` and the authenticated Add disclosure place local media upload under Add/添加资源. Revid preserves that upload authority in its nine-action Add catalog; an additional node-local empty-media upload/recovery strip is duplicate visible chrome and must not remain as a parity exception.

## Unit 0 - Activate, capture the official baseline, and write RED contracts

- Status: `completed`

1. Re-read CURRENT, ROADMAP, T5-096 Task/PLAN, T5-094/095 evidence, applicable Canvas ADRs/specifications, current code, tests, runtime, and worktree state.
2. Activate T5-096 as the only implementation Task; create `TASK-T5-096-PROGRESS.md` with exact completed/remaining/next/files/commands/blocker sections.
3. Through supported browser control, open the user's already-authenticated official LibTV Canvas without paid generation, account mutation, source inspection, network inspection, or credential access.
4. Capture the complete scenario inventory at 1440x900, 1366x768, and 920x900 plus applicable 17/36/100/200 zoom states. Record each source URL, date, version clue, viewport, precondition, exact action trace, geometry, motion timing, focus, result, and capture hash.
5. Inventory Revid-only entries and assign each one a named extension slot before visual implementation.
6. Add `ai/evidence/t5-096/official-canvas-scenario-manifest.json`, `three-axis-parity-ledger.md`, `semantic-color-map.md`, `revid-extension-map.md`, and an evidence index. Raw official captures stay under untracked `output/`.
7. Add RED pure/browser tests for the first implementation slice and prove the failure fingerprints represent actual parity gaps, not fixture or encoding errors.

Completed Unit 0 evidence: the first RED browser contracts were proven with measured failure fingerprints (`column` vs `row`; scoped `7` vs `9` after the Director exclusion). Exact 1440x900/1366x768/920x900 CSS viewports, empty 17/36/100/200% states, a direct official guide, its public read-only populated/selected share, the exact-200 limitation with nearest 207%, and focus/controller timing bounds are retained. All fourteen Revid counterpart/extension decisions have a named slot, including no-counterpart main composer `X14`; Units 1-5 completed the final slot geometry and regression evidence.

The official 32x32 rail measurement describes the visual surface, not Revid's locked accessible hit target. The RED contract now asserts a 32px inner visual surface inside an at-least-40px hit target so later GREEN cannot trade away accessibility for screenshot similarity.

Success gate: official evidence, scenario schema, extension map, RED tests, Task/PLAN/PROGRESS/CURRENT/ROADMAP, and current source agree on a complete bounded target. Any scoped official behavior that cannot be safely observed has an exact blocker and keeps the Task from implementation closure.

## Unit 1 - Canvas shell, navigation, and main creation surface

- Status: `completed`

1. Write focused RED tests for full-window surface, grid, fixed identity/chrome, action rail, zoom group, empty hints/starters, add menu, and desktop/compact geometry.
2. Introduce the shared parity layout metrics without changing Revid semantic color values.
3. Match the official shell at 1440/1366/920 while preserving the no-counterpart Revid main composer in named extension slot `X14` above the rail.
4. Match attachment, model/Skill/mode, Send, loading, disabled, error, capability reload, and retained-retry interaction states.
5. Prove attachment/resource disclosure, model/Skill selection, and panel dismissal produce zero graph/history/autosave mutation; Send retains T5-095's exact durable authoring behavior.
6. Run focused shell/composer tests, T5-094/095 related tests, and viewport screenshots before proceeding.

Success gate: shell and main-composer scenarios pass all three axes, every extension remains reachable, and no disclosure action creates a node or request.

## Unit 2 - Shared node, card, media, port, and zoom geometry

- Status: `completed`

1. Write RED pure/browser tests for every observed node type and idle/hover/selected/editing/disabled/loading/running/success/failure/locked state.
2. Add one internal geometry/presentation contract consumed by Leafer visuals and DOM media/editor/composer layers.
3. Match official text/script external-label and content-shaped authoring geometry; remove conflicting generic card chrome without discarding content or lifecycle truth.
4. Match empty/generated image, native video, audio, generation, result, group, label, badge, version layer, outline, shadow role, and port placement.
5. Prove 17/36/100/200 zoom consistency, hit testing, selection, editor/media containment, and no DOM/Leafer drift.
6. Preserve node serialization, canonical dimensions, Graph Access, Storyboard projection, history, autosave, and unsupported-data retention.

Success gate: every node/card scenario passes measured visual geometry and its real edit/state behavior across target zooms with no schema or persistence regression.

## Unit 3 - Selection, graph editing, connection, and motion parity

- Status: `completed`

1. Write RED browser tests from the official action traces for click/shift-click, marquee, multi-move, group/ungroup, aggregate continuation, context menu, duplicate, delete, and undo/redo.
2. Match port visible geometry, acquisition area, compatible feedback, connection draft, exact landing, branching, edge selection, reroute, insertion, delete, and continuation menus.
3. Match official active-edge/hover/selected motion timing and local emphasis while preserving low-noise idle edges and reduced-motion behavior.
4. Make every menu/toolbar/panel maintain selection, stay inside the unobscured viewport, and restore focus on Escape/outside dismissal.
5. Prove failed/cancelled/incompatible graph actions are atomic no-ops and valid actions produce exactly one command/history entry.
6. Run connection, command, selection, group, continuation, geometry, motion, accessibility, and 200/300 hot-path focused tests.

Success gate: all observed graph actions reproduce the official gesture, feedback, and outcome while retaining Revid typed compatibility, atomic commands, accessibility, and performance.

## Unit 4 - Contextual authoring, generation, media operations, and results

- Status: `completed`

1. Write RED tests for node-local composer, media toolbar, operation panel, model/parameter/cost/optimization surfaces, progress, failure, retry, results, compare/version, download/fullscreen, replace, and continuation.
2. Move official-equivalent primary actions to their measured node-local anchors. Keep Revid-only diagnostics and advanced abilities in registered extension slots rather than a competing permanent primary surface.
3. Add one overlay coordinator for active surface, focus, Escape/outside dismissal, viewport collision, zoom-stable anchor, selection preservation, and cleanup.
4. Remove or repair every inert visible action. An unavailable function remains explicit, accessible, non-mutating, and explains the missing authority.
5. Preserve native generation/task/quota/provider/result/lineage/idempotency semantics, prior valid results, stale guards, retry boundaries, and no automatic replay of ambiguous provider POSTs.
6. Prove arbitrary success/failure/cancel/retry/reload/Canvas-switch sequences leave exact graph, runtime, pending-result, history, and focus ownership.

Success gate: contextual generation and media/result scenarios match official visual, functional, and interaction effects without fabricating provider execution or losing Revid safety.

## Unit 5 - Revid extension preservation and responsive/accessibility closure

- Status: `completed`

1. Add a deterministic browser scenario for every entry in `revid-extension-map.md`.
2. Prove each extension remains visible, one-level reachable, keyboard accessible, focus-safe, and fully functional at its supported viewport.
3. Prove declared extension regions do not change parity-core geometry, action ordering, focus path, overlays, or graph results.
4. Retain full desktop and compact editing; keep 375x812 review-only with no accidental mutation or hidden required review information.
5. Run axe serious/critical, keyboard-only, IME, focus restoration, reduced-motion, zoom, compact, mobile, Graph Access, Storyboard, revision, Skill, and provider-selection regression.

Success gate: `REVID_EXTENSION_REGRESSION=0`; parity-core comparisons remain within thresholds with only exact declared extension masks.

## Unit 6 - Deterministic comparison closure, Human review, and delivery

- Status: `completed`

The representative lawful fixture, clean-room comparison contract, reporter-bound 17-row action mapping, visible-control inventory, opt-in runtime Leafer/DOM geometry checks, and deterministic <=2px/<=2% outer-landmark verifier are complete. The `0%` structural result applies only to eleven populated 1440x900 outer landmarks. Upload remains in the official-equivalent Add authority without duplicate node-local chrome. Refreshed reporter `34/34`, focused parity/evidence `9/9`, final full functional `532/532`, production build `4937`, accessibility, and headed AMD D3D11 performance are complete. The Human Owner selected `ACCEPT_WITH_DECLARED_BOUNDARIES`; REPORT, exact staging, commit, push, and durable-state synchronization complete Unit 6.

### Unit 6A - Comparison contract and representative fixture

1. Add `completion-audit-2026-07-20.md` as the criterion-by-criterion truth source.
2. Build a lawful deterministic populated Revid graph covering the observed media-first nodes, external labels, large group, dense connections, selected media, minimap, and high-zoom context.
3. Define pair IDs, exact extension masks, semantic normalization, geometry targets, and action-trace mappings without copying official assets.

### Unit 6B - Numeric convergence and closure

1. Add a deterministic geometry/structural-edge verifier enforcing <=2 CSS px and <=2% on every declared critical pair.
2. Fix product or fixture mismatches until the verifier and affected interaction matrices pass.
3. Re-run one full functional invocation, build, accessibility, hardware performance, diff/hygiene, then publish the final Human review board.

1. Run all focused T5-096 tests first, then related Canvas tests, production build, full functional Chromium, guarded local runtime checks, accessibility, and 200-node/300-connection performance evidence without threshold weakening.
2. Generate side-by-side visual boards and action-trace reports for every scenario. Record numeric geometry, structural visual difference, mutation counts, focus trace, and extension result.
3. Audit the registered-row ledger for `VISUAL_MISMATCH=0`, `FUNCTIONAL_MISMATCH=0`, `INTERACTION_MISMATCH=0`, `UNOBSERVED=0`, and `REVID_EXTENSION_REGRESSION=0`; keep checklist boundaries and Human exclusions outside those counters and visible in the completion audit.
4. Submit the final side-by-side/action-trace evidence for Human Owner visual, functional, and interaction acceptance. Keep the Task `VERIFYING` until accepted.
5. Perform fresh diff review, `git diff --check`, strict UTF-8/BOM, file-size/growth, sensitive-path, secret-signature, exact-stage, and HEAD-drift checks.
6. Update PROGRESS/CURRENT/ROADMAP and write REPORT only after all non-deferred criteria and Human review pass; commit and push the exact owned paths.

Success gate: Task, PLAN, PROGRESS, evidence, implementation, tests, REPORT, durable state, commit, and `origin/main` agree on `DONE - PASS` with no overclaim about real provider quality.

## Unit 7 - Dynamic node visible-boundary parity correction

- Status: `complete`

1. Inspect the official LibTV Canvas first in a read-only, non-paid state and record the publicly observable node body, external label/resolution, port/edge landing, selection, and contextual-surface roles. These observations define the expected result; Revid never defines its own parity target.
2. Reproduce the Human Owner's `736 x 1312` portrait-media case in a deterministic Revid browser fixture, including the transition from the persisted fallback node dimensions to natural media metadata.
3. Write RED evidence that compares the DOM media body with the Leafer card, selection outline, input/output port centers, connection endpoints, hit target, status/version layers, and contextual toolbar at 17%, 36%, 100%, and 200% zoom.
4. Update existing Leafer node visuals from the shared layout size whenever metadata changes the visible node boundary; recompute port geometry instead of preserving creation-time coordinates.
5. Prove the same contract for representative portrait, landscape, square, authoring, generation, result, video, and group nodes without changing serialization or graph authority.
6. Run focused RED/GREEN, related node/port/connection/selection regressions, production build, Chrome browser QA, and the applicable full functional gate before closing the correction.
7. Refresh completion evidence and Human review artifacts so no outer-landmark result is used to overclaim port, edge, selection, or dynamic-metadata parity.

Success gate: every visible node layer follows one geometry source before and after metadata reconciliation, all target zooms stay within 2 CSS pixels, and the Human-reported detached-port state cannot recur.

## Planned test files

- Create `frontend/tests/e2e/canvas-libtv-parity-v2-fixture.ts` for deterministic Revid scenarios and mutation/focus instrumentation.
- Create `frontend/tests/e2e/canvas-libtv-three-axis-parity.spec.ts` for scenario-driven visual, functional, interaction, and extension assertions.
- Create focused pure tests for the new parity layout/geometry contract under `frontend/tests/e2e/` following the repository's current Playwright pure-test convention.
- Extend only the existing focused specs whose established responsibility is materially affected, including shell parity, visual parity, node presentation, authoring cards, command interactions, connection targets/continuation/motion, generation, resources, Storyboard, accessibility, and performance.

## Required command sequence

Run focused parity tests after each RED/GREEN slice:

```powershell
Set-Location frontend
npx playwright test tests/e2e/canvas-libtv-three-axis-parity.spec.ts --project=chromium --timeout=60000 --reporter=line
```

Run the affected related matrix before each unit closes, using exact spec paths established by the fresh diff and ownership audit.

Run the production build:

```powershell
Set-Location frontend
npm run build
```

Run full functional Chromium after focused and related tests are green:

```powershell
Set-Location frontend
npx playwright test --project=chromium --timeout=60000 --reporter=line
```

Run the unchanged guarded 200-node/300-connection performance/accessibility titles on full Chromium and record renderer/hardware context separately from product failures.

## Numeric completion thresholds

- 100% zoom parity-core boundary/size/anchor/gap error: at most `2 CSS px`.
- Zoomed screen-space contextual anchor error: at most `2 CSS px`.
- Semantic-color-normalized structural edge difference after exact declared extension masks: at most `2%` per critical state.
- Disclosure mutation count: exactly zero nodes, connections, revisions, history entries, autosave PATCHes, quota reservations, generation tasks, assets, and provider requests.
- Valid graph mutation: exactly one intended atomic command/history entry unless the existing documented durable generation transaction is authoritative.
- Accessibility: zero axe serious/critical violations; keyboard, IME, focus restore, and reduced-motion paths green.
- Performance: existing accepted 200-node/300-connection thresholds remain unchanged.
- Final registered-row ledger: no mismatch, unobserved registered row, unexplained mask, inert action, or Revid-extension regression; declared official observation boundaries and Human exclusions remain explicit rather than being forced into zero counters.

## Stop rules

- Stop before secret/`.env` access, paid/real provider calls, external account mutation, destructive operation, user/runtime migration, private LibTV implementation inspection, third-party asset copying, or incompatible long-term contract change.
- Stop and request an ADR/Human decision if an observed required function cannot be implemented through existing Revid native authorities without a new incompatible backend contract.
- Do not close from old screenshots, third-party material, control presence, feature-name similarity, or T5-094 documented deferrals.
- Do not delete, hide, or disable Revid-only entries to improve parity metrics.
- Preserve and never stage `.codex/`, `.hermes/plans/`, `output/`, `.env*`, or unrelated user files.
