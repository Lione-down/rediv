# TASK-T6-005 Progress

- State: `BLOCKED`
- Verification outcome: `FAIL`
- Task: [TASK-T6-005](../todo/TASK-T6-005.md).
- Plan: [TASK-T6-005-PLAN](TASK-T6-005-PLAN.md).
- Activation date: 2026-07-22.

## Closure Decision

- On 2026-07-23, the Human Owner explicitly rejected the delivered visual and interaction result and requested state closure.
- T6-005 is terminal and non-executable as `BLOCKED / FAIL`. No REPORT is created because acceptance criterion 13 failed.
- Passing machine gates remain implementation evidence only; they are not Human acceptance and do not justify `DONE / PASS`.
- The uncommitted business-code changes remain preserved in the worktree pending an explicit T6-006 decision to selectively reuse or fully remove them.

## Completed Work

- Human Owner corrected the authority split: Yuque screenshots are the strict visual source, and the authenticated LibTV Canvas is the strict observable logic source.
- Completed a fresh read-only authenticated LibTV audit without generation or mutation. Measured a 660 CSS-px composer, 16 world-px source gap, 16px outer radius, prompt-first hierarchy, one summarized parameter dialog, Canvas reference-selection mode, and `@` restricted to already-connected eligible assets.
- Completed Unit 2R correction: restored the fixed 660 CSS-px composer, 16 world-px visual gap, 16px outer radius, and no connector neck; the prior 6px connected-shell interpretation is fully superseded.
- Replaced the permanent media mode/source toolbar with the observed prompt-first hierarchy. `参考` now enters the existing typed Canvas selection flow, while `@` lists only already-connected eligible assets, shows an explicit empty state, and performs zero graph mutation.
- Collapsed routine parameters into one summarized popover while preserving capability-owned quality, resolution, ratio, count, structured video roles, provider/model, history, persistence, and request contracts.
- Reworked selected script authoring into the same compact prompt-first lower composer without duplicating the editable form in desktop Context Panel.
- Rechecked authenticated LibTV's empty script flow. Revid now presents the same three-start hierarchy: the script-source start enters the existing typed Canvas selection mode and creates a reversible `script out -> script in` connection, direct writing keeps the existing in-card editor, and the role-source start opens a bounded Canvas-image selector backed by the existing durable `reference_asset_ids` contract.

- Confirmed T6-004 is `DONE / PASS`, no implementation Task was active, and T6-005 is dependency-ready.
- Confirmed activation baseline `main`, `HEAD == origin/main == 6ae71ef00127c141c6a4a7fed9f85521a33e303f`; tracked worktree was clean and user-owned `.codex/`, `.hermes/`, `output/`, and `storage/` paths remain excluded from delivery.
- Used the Human-authenticated in-app Browser to inspect the exact Yuque document read-only.
- Captured and visually inspected 20 reference PNGs covering text, script, storyboard, asset groups, image, video, `@` references, first/last frames, loading/results, and shared add controls.
- Preserved local ignored reference evidence under `output/reference/yuque/t6-005/`; `manifest.json` SHA-256 is `59FA6146AE0BEAADAF5E513A6AF90B1E6C9132348D0CFED9FF5FA8980A0D015C`.
- Audited the active Revid Canvas token vocabulary and selected a Revid-native attached media workbench direction using existing graphite/violet surfaces, Sora type, 4/8/12/16px radii, and 120-180ms motion tokens.
- Materialized the T6-005 Task, PLAN, PROGRESS, and design contract before business-code edits.
- Unit 1 RED proved the old composer had no reference region or prompt shell, used a transparent unbordered prompt, retained a detached 16px gap, and exposed generation parameters mainly through Context Panel.
- Unit 2's first-pass 6px connector-neck shell and direct `@` Canvas discovery were superseded by Unit 2R after the authenticated logic audit.
- Capability v6 image counts and structured video-role controls are reused inside the card through the existing generation context and parameter update authority; no second state or request contract was added.
- Unit 3 added attached AI draft/refine controls for selected non-empty canonical scripts while preserving direct in-card editing, stale-safe direct replacement, Canvas undo, quota/capability ownership, and review-only behavior.
- Removed the duplicate editable script form from desktop Context Panel while keeping the readonly detail path available. Empty text cards and text-to-video/music workflows do not render or collide with the script workbench.
- Added shared horizontal viewport clamping for media and script work surfaces. The connector neck remains aligned with the source card while a left-edge script and right-edge media card stay within 16px viewport safety bounds.
- Production build passes with `4,983 modules` after the Unit 2R and empty-script correction.
- Focused work-surface/script/visual matrix passes `18/18`; related card interaction, capability v6, nine-reference roles, and asset-group regression passes `10/10`.
- Current Unit 2R visual evidence is retained under ignored `output/playwright/t6-005-yuque-workbench/`: video SHA-256 `FB4EA3094826A2EBBBF85F3DB50FE0627FE2E965DBF2A1CAD15995C9DC9372A8`, script `A98A2EF31DB81628DA837C13EF766F470F3692133E6C5A3848903A8F003A4920`, image `8B0D0675368A5D75ED6B8C917FC7134730AB2CCE0C99F2F1B1E529C11EC67386`, and empty script `219CF4A2F3C62751919276FB59FFD71D37A619BA9F738D44301ED35D789887F5`.
- Unit 4 now has an honest pure presentation resolver and Context Panel projection for story structure, character consistency, ordered roles, ordered scenes, optional canonical `shot_props`, and ordered canonical shot cards. Missing prop fields are explicitly reported instead of synthesized.
- Asset-group resolver plus browser integration pass `3/3`; inspected asset-group detail SHA-256 is `39D481399FD9715763D054335C52C3306278E48764DAF2D2A4B48C62705140FC`.
- Authenticated LibTV Unit 4 inspection confirmed the observable interaction contract: role, scene, and prop sections render selectable cards with independent menus and add cards; selecting a card opens a type-specific right-side editor with an image surface, name, and description/prompt field. No generation, upload, save, delete, or other product-data mutation was invoked during inspection.
- Completed Unit 4 with grouped role/scene/prop cards, section-local add cards, group-scoped remove and rename, card selection, and a type-specific right-side editor. The editor's image placeholder, name, and existing shot prompt field match the Yuque/LibTV hierarchy without inventing upload or asset-database authority.
- Unit 4 mutations use one `mutate-storyboard-asset` command over canonical prompt metadata, validate the group and prompt ownership, fail closed for locked/unrelated/duplicate inputs, roll back partial writes, and produce one undo/redo boundary. Browser proof covers mock document persistence, pointer and keyboard selection/removal, zero provider calls before explicit generation, and zero serious/critical Axe violations.
- Reconfirmed Unit 5 through the current prompt-first image workbench: reference selection, connected-only mention, capability-driven ratio/quality/resolution/count, card-local pending/result/retry, and batch sibling behavior remain covered by the exact-current-source work-surface and related regression. No new image contract was needed.
- Completed Unit 6 with a card-local structured video reference rail. Existing capability v6 `reference_bindings` remain authoritative for first-frame, last-frame, ordinary-reference, order, removal, nine-entry feedback, history, persistence, and provider payloads.
- Each selected video reference exposes a numbered thumbnail and an explicit per-image-intent action that inserts `@asset-name` into the existing durable prompt and restores prompt focus. The connected-only picker remains sourced from typed graph inputs, so removing a binding does not fabricate or delete a graph connection.
- Replaced the reference action layer's inaccessible `display: none` state with a focus-revealable transparent layer. Pointer hover and keyboard focus now reveal the same controls, and the focused work-surface Axe scan reports zero serious/critical violations.
- Unit 6 exact-current-source proof passes the new role/order/removal/mention/undo/redo browser test and the complete `canvas-card-work-surface.spec.ts` regression `11/11`. Visual evidence is retained at `output/playwright/t6-005-yuque-workbench/video-reference-rail-1440x900.png`.
- Completed Unit 7 across `49/49` responsive, keyboard, accessibility, delayed-media, zoom, geometry, autosave, persistence, capability v6, and nine-reference browser checks.
- Corrected three concrete layout boundaries exposed by Unit 7: the reference-free workbench now holds the approved 190px minimum hierarchy; reference-bearing workbenches reserve a 244px toolbar-safe height; and attached script workbenches flip above a bottom collision while preserving the canonical 320x160 script body.
- Removed the explicit four-row Grid assignment that placed the footer into the composer row when the optional reference rail was absent. Media toolbar placement now uses the same reference-aware workbench height contract, preventing overlap above and below the source card.
- Refreshed and visually inspected exact-current-source evidence at the required viewports. SHA-256: `video-reference-rail-1440x900.png` = `998A577790C36B41AC91FD11C1A91467254F2632676F1BC2BF81A701E283312C`; `image-workbench-920x900.png` = `1E801D89C04C4779E811695E2CFE77DD6F329B5BA811870C6F69A4692ED561AB`; `readonly-review-375x812.png` = `AC9609BA4F69D2BAD218AEF6272E3788A115B5861A722ED2252AF8D9121DEBCD`.
- Completed all authorized machine gates: locked backend `583/583`, full unexcluded Chromium `618/618`, headed 200-node/300-connection performance `2/2`, production build `4,987 modules`, and dependency audit `0 vulnerabilities`.
- The first full Chromium pass reached `615/618` because three old locators still targeted removed script mode tabs or used a non-exact shot-control label. Focused rerun reproduced all three; updating only the stale locators passed `3/3`, and the subsequent complete full Chromium run passed `618/618` in one run.
- Project-state validation, CI-contract validation, `git diff --check`, UTF-8 strict decoding, BOM absence, sensitive-owned-path scan, and owned/unowned worktree audit pass. The five files above 500 lines are pre-existing aggregate authorities; new focused T6-005 components remain below the guideline.
- Fresh combined exact-current-source frontend matrix passes `30/30` across work surfaces, scripts, visual convergence, interaction states, capability v6, video roles, asset-group generation, and asset-group presentation.
- Fresh diff check, project-state validation, UTF-8/BOM checks, and component size checks pass. New focused components remain below 500 lines; the pre-existing aggregate `CanvasStage.vue` and `CanvasWorkspace.vue` remain above the general guidance.
- Completed Unit 3R after source audit disproved the earlier missing-contract assumption. Empty scripts now enable `角色生成分镜脚本`, expose a readable thumbnail selector over canonical Canvas image asset/result nodes, persist at most eight exact asset IDs through one typed command, and submit those IDs through the existing script-authoring request without creating a media-to-text graph edge.
- Role-reference validation fails closed for incompatible, duplicate, locked, grouped, unowned, and over-budget inputs. Browser proof covers selection, persistence, zero graph mutation, undo/redo, request payload identity, and the existing review-only boundary.
- Corrected the picker visual after inspection found its first in-card layout compressed to an unreadable strip. The final floating panel uses Revid surfaces, shows title/thumbnail/name, and sits above the node continuation control without changing persisted node geometry or graph anchors.
- Exact-current-source final proof passes: production build `4,988 modules`, role-reference focused `4/4`, related frontend matrix `30/30`, full Chromium `622/622` in `11.6m`, headed performance `2/2`, locked backend `583/583`, and dependency audit `0 vulnerabilities`.
- Completion audit corrected the role-reference picker's transient-layer boundary. Escape now closes the picker first and restores focus to the role-source opener; successful selection restores focus only after the typed command completes; the picker chooses left/right placement from live screen geometry and stays within a 16px safe inset at 920px.
- Refreshed evidence SHA-256: `video-reference-rail-1440x900.png` = `998A577790C36B41AC91FD11C1A91467254F2632676F1BC2BF81A701E283312C`; `image-workbench-920x900.png` = `FBFF7663ABECC7715FB0FC23ED35C645027B237AF49D7D60C014D81078A0D717`; `readonly-review-375x812.png` = `AC9609BA4F69D2BAD218AEF6272E3788A115B5861A722ED2252AF8D9121DEBCD`; `empty-script-1440x900.png` = `D69EAC317B7D0D9FB8F969AE54EDA1788B2E16BA80739817768A2533EC558F07`; `empty-script-role-reference-panel.png` = `8932E763EC7E5FEF522F1C7AEA612CCA87B2441D19EA2F381FA6ABBD97AD0AC6`; `empty-script-role-reference-920x900.png` = `1A8E150D0C02CAB87CCE950439522862CEE71D8B8F6961E50A097203461D935A`.

## Remaining Work

- None inside T6-005. Any replacement architecture or implementation belongs to T6-006 or later independently approved Tasks.

## Exact Next Action

Use T6-005 only as rejected evidence during T6-006 architecture work. Do not resume, stage, commit, push, report, or mark it `DONE / PASS`.

## Files Changed

- `ai/tasks/todo/TASK-T6-005.md` - authoritative Task contract.
- `ai/tasks/doing/TASK-T6-005-PLAN.md` - dependency-ordered implementation plan.
- `ai/tasks/doing/TASK-T6-005-PROGRESS.md` - durable progress and next-action record.
- `ai/requirements/REVID-T6-005-YUQUE-NODE-WORKFLOW-DESIGN.md` - Human-authored reference translation into Revid-native design rules.
- `ai/state/CURRENT.md` - activates T6-005 as the sole implementation Task.
- `ai/state/ROADMAP.md` - adds T6-005 to Product V3 / Phase 6.
- `frontend/src/components/canvas/CanvasCardWorkSurface.vue` - prompt-first media workbench, typed Canvas reference selection, connected-only `@` mention, structured video reference rail, per-image prompt intent, local summarized settings, and viewport-safe placement.
- `frontend/src/components/canvas/CanvasGenerationParameterControls.vue` - compact card-local presentation mode.
- `frontend/src/components/canvas/CanvasScriptEmptyState.vue` - reference-aligned empty-script starts plus a readable canonical Canvas-image role-reference selector.
- `frontend/src/components/canvas/CanvasNodeSurfaceLayer.vue` and `canvas-node-surfaces.scss` - generation-context/reference projection, attached script workbench, and shared clamped placement.
- `frontend/src/components/canvas/canvas-media-toolbar-geometry.ts` - shared reference-aware workbench height and toolbar collision bounds.
- `frontend/src/components/canvas/CanvasStage.vue` and `frontend/src/views/app/CanvasWorkspace.vue` - bridge existing generation/script authorities to node-local surfaces.
- `frontend/src/components/canvas/CanvasContextPanel.vue` - suppress duplicate editable script authoring when the card owns it.
- `frontend/src/components/canvas/composables/use-canvas-stage-presentation.ts` - preserve the authenticated 16 world-px visual attachment gap without changing logical graph anchors.
- `frontend/tests/e2e/canvas-card-work-surface.spec.ts` - RED/GREEN coverage, structured video reference history/accessibility proof, and T6-005 visual captures.
- `frontend/src/modules/canvas/storyboard-asset-group-presentation.ts` - pure canonical role/scene/prop/shot projection.
- `frontend/src/modules/canvas/storyboard-asset-commands.ts` - typed add/remove/rename/deep-edit command validation and canonical node updates.
- `frontend/src/modules/canvas/script-reference-assets.ts` - bounded role-reference ID normalization, candidate validation, and typed command creation.
- `frontend/src/components/canvas/CanvasStoryboardAssetGroupDetails.vue` - grouped asset cards, add/remove, selection, and shot-location surface.
- `frontend/src/components/canvas/CanvasStoryboardAssetEditor.vue` - type-specific right-side deep editor over existing prompt authority.
- `frontend/tests/e2e/canvas-storyboard-asset-command.spec.ts`, `canvas-storyboard-asset-group-presentation.spec.ts`, and `canvas-asset-group-generation.spec.ts` - command, resolver, history, persistence, keyboard, accessibility, and browser integration proof.
- `frontend/tests/e2e/canvas-script-reference-assets.spec.ts` and `canvas-card-work-surface.spec.ts` - role-reference validation, history, persistence, payload, zero-edge, interaction, and screenshot proof.

## Commands Run And Results

- Required startup reads and Git baseline probes: PASS; T6-004 is closed, branch is `main`, tracked worktree was clean, and only preserved user-owned untracked paths were present.
- In-app Browser DOM/image inspection: PASS; authenticated Yuque content and 20 target PNG references were available.
- Local reference inventory and SHA-256 capture: PASS; no target evidence was written to a tracked path.
- Existing design-token/component inspection: PASS; Revid already exposes the surfaces, accent, border, radius, typography, motion, and shadow tokens needed for this work.
- Unit 1 RED: expected failure at missing `.canvas-card-work-surface__references`; script RED: expected missing attached `AI 脚本写作`; viewport RED measured the left script workbench at `x=-6.97px`.
- `npm --prefix frontend run build`: PASS, `4,980 modules`.
- `canvas-card-work-surface.spec.ts`, `canvas-script-generation.spec.ts`, and `canvas-card-visual-convergence.spec.ts`: PASS, `18/18` after correcting empty-text overlap and duplicate Context Panel ownership.
- Card interaction, capability v6, video roles, and asset-group related matrix: PASS, `10/10`.
- T6-005 capture subset: PASS, `4/4`; desktop/compact workbenches are attached and viewport-safe, and 375px remains review-only.
- Asset-group presentation RED/GREEN and integration: PASS, `3/3`; inspected grouped detail exposes honest empty/unsupported states for the v1 fixture and the pure v2 resolver proves populated ordered roles/scenes plus future canonical props.
- Final combined focused/related Chromium command: PASS, `30/30` in `1.1m`.
- Unit 2R exact-current-source build: PASS, `4,983 modules`.
- Unit 2R authority subset: PASS, `3/3`; related card, visual, capability, video-role, asset-group generation, and asset-group presentation matrix: PASS, `20/20` in `53.6s`.
- Empty-script RED/GREEN: the first run exposed the composer/body rectangle ownership bug; using the visible content rectangle restored the lower 16 world-px attachment. Source/direct-writing focused proof passes `3/3`, and the refreshed related matrix passes `20/20` in `57.4s`.
- Unit 4 RED/GREEN: the missing command module produced the expected RED; command/presentation/browser GREEN passes `7/7`. The browser path adds, selects, renames, edits, persists, keyboard-reopens, and keyboard-removes an asset before any generation request. Focused editor and workspace Axe scans report zero serious/critical violations.
- Unit 4 exact-current-source build: PASS, `4,987 modules`. Visual evidence is retained at `output/playwright/t6-005-yuque-workbench/asset-group-detail-1440x900.png` and `asset-role-editor-1440x900.png`.
- Unit 6 RED/GREEN: the RED proved the card had no structured reference rail. GREEN covers numbered thumbnails, first/last/reference roles, order, removal without graph deletion, connected-only rediscovery, per-image prompt intent, keyboard focus reveal, one undo/redo boundary, and zero serious/critical Axe violations.
- Unit 6 exact-current-source build: PASS, `4,987 modules`; full card-work-surface regression: PASS, `11/11`.
- Unit 7 first matrix exposed three old/new geometry boundary failures. After separating canonical script-body ownership from its attached workbench, fixing Grid row ownership, adding bottom flip, and sharing 190/244px toolbar-safe heights, the focused geometry rerun passes `9/9` and the complete Unit 7 matrix passes `49/49`.
- Unit 7 exact-current-source build: PASS, `4,987 modules`.
- Locked backend runner: PASS, `583/583`; dependency audit: PASS, `0 vulnerabilities`.
- Full unexcluded Chromium: first pass `615/618` with three reproducible stale locator failures; focused corrections `3/3`; subsequent single full run PASS, `618/618` in `13.8m`.
- Headed performance: PASS, `2/2` across the default Chromium and dedicated performance project.
- Final state/hygiene: project-state PASS, CI-contract PASS, diff check PASS, 32 owned files strict UTF-8 with zero BOM, zero sensitive owned paths, and preserved user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, `test-results/` paths.
- `git diff --check` and `scripts/validate-project-state.py`: PASS; only expected LF-to-CRLF notices were emitted.
- Unit 3R focused role-reference proof: PASS, `4/4`; complete script/card/LibTV/visual related matrix: PASS, `30/30`.
- Unit 3R exact-current-source build: PASS, `4,988 modules`.
- Final full Chromium: PASS, `622/622` in `11.6m`; headed performance: PASS, `2/2` in `1.2m`.
- Final locked backend runner: PASS, `583/583`; dependency audit: PASS, `0 vulnerabilities`.
- Completion-audit RED: Escape and 920px placement passed, but role-source focus was inactive after selection because child `nextTick` preceded the asynchronous typed-command redraw.
- Completion-audit GREEN: command-boundary focus restoration plus picker-owned Escape and adaptive side placement pass focused `1/1`; refreshed related matrix passes `30/30`.
- Refreshed exact-current-source production build: PASS, `4,988 modules`; full Chromium: PASS, `622/622` in `11.4m`; headed performance: PASS, `2/2` in `1.2m`.

## Acceptance Criteria Completion Audit

1. Continuous selected-card workbench: proven by `selected materialized composer presents one continuous creator hierarchy`, attached geometry assertions, and image/video/script captures.
2. Text, script, image, and video sequence: proven by direct script replacement, empty-script three-start, prompt-first workbench, image materialization, and structured video tests plus current captures.
3. Card-local result/loading/error/retry/batch/reference states: proven by card-work-surface runtime tests and asset-group partial-failure/retry coverage; all provider outcomes are mock-owned.
4. Storyboard role/scene/prop grouping and right-side edit: proven by pure presentation/command suites, browser add/select/rename/edit/remove flow, and `asset-group-detail-1440x900.png` plus `asset-role-editor-1440x900.png`.
5. Reference selection versus `@` mention, nine-role budget, order/removal/intent, pointer/keyboard: proven by work-surface and video-reference-role suites; role-script asset IDs use a separate no-edge contract because script ports remain text-only.
6. Shared add authority and typed compatibility: proven by `canvas-libtv-shell-parity.spec.ts`, shared continuation/action registry coverage, and full Canvas regression.
7. `1440x900`, `920x900`, `375x812` clipping/overlap/status: proven by inspected current captures, geometry bounds, compact role-picker placement, and review-only browser assertions.
8. T6-004 functional invariants: proven by unchanged request/persistence contracts, focused history/slot/role/retry tests, and full Chromium `622/622` plus backend `583/583`.
9. Shared visible geometry across zoom/delayed metadata: proven by `canvas-libtv-node-geometry.spec.ts`, visual-convergence coverage, and headed 200-node/300-connection performance `2/2`.
10. Focus, Escape, ARIA, target sizing, reduced motion, readonly, restoration: proven by Axe scans, viewport/accessibility suites, reference-mode lifecycle tests, and the completion-audit role-picker Escape/post-command focus correction.
11. No real provider invocation: all browser generation routes are mock fixtures; no paid call, secret, quota-bearing external action, or production mutation occurred.
12. Full gates without threshold weakening: build `4,988`, related `30/30`, Chromium `622/622`, backend `583/583`, performance `2/2`, audit `0`, project/CI/diff/UTF-8/hygiene all pass.
13. Human visual and interaction acceptance: `FAIL`; the Human Owner explicitly rejected the result on 2026-07-23 and closed T6-005 without REPORT, `DONE / PASS`, staging, commit, or push.

## Blockers And Release Conditions

- Unit 4 remains bounded to prompt-node content data: roles use `shot_characters`, scenes use `shot_scene`, and props use the already-recognized optional `shot_props` field. This permits honest add/remove/edit persistence without creating a separate durable asset collection; generated/uploaded asset identity remains outside this unit.
- Human visual/interaction acceptance failed. T6-005 is terminal and has no release condition; replacement work must use a new approved Task.
- Real/paid provider calls, secrets, destructive operations, irreversible migrations, external accounts, and incompatible contracts remain Human gates.
