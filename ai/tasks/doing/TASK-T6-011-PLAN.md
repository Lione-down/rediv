# TASK-T6-011 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `Unit R8N - Bottom-layer edges and exact bound-job polling`
- Task: [TASK-T6-011](../todo/TASK-T6-011.md).
- Progress: [TASK-T6-011-PROGRESS](TASK-T6-011-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Human-confirmed interaction contract: [T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT](../../requirements/T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT.md).
- Activation baseline: `main`, `HEAD == origin/main == 11cdaaac7be485e219830ebf9a6c589996830a47`.
- Reactivation baseline: `main`, prior rejected delivery `05679e04484857e86541aafc4601a4a7cd1f2e72`.

## Reactivated delivery rule

T6-011 is a bounded strangler replacement of the visible Canvas card subsystem, not a patch queue and not a whole-stack rewrite. Preserve stable node/document/job identities and existing history/autosave/backend authorities while cutting visible cards, ports, selection, editing, and attached controls over to one DOM projection backed by one canonical runtime state.

Every production behavior must follow an observed focused RED failure. Focused GREEN precedes related regression, then a fresh frontend build, preview/browser proof, broad regression, and explicit Human review. Automated proof cannot close the Task.

## Replacement unit sequence

### Unit R0 - Freeze rejection evidence and runtime inventory

- Status: `complete`
- Treat prior `05679e04` delivery and REPORT as rejected audit evidence.
- Trace the current card projection through `CanvasStage.vue`, `CanvasNodeSurfaceLayer.vue`, `canvas-card-view-model.ts`, `canvas-card-geometry.ts`, work-model/interaction/port modules, Leafer renderer reconciliation, and SVG connection projection.
- Trace Script/Text/Image/Video/Asset/Result taxonomy, card state, mentions, generation-mode persistence, and current job synchronization.
- Add a frozen acceptance matrix mapping every Human finding to an exact focused test, implementation authority, browser proof, and Human review step.

#### R0 current authority inventory

| Concern | Current authority and defect |
|---|---|
| Visible card | `canvas-renderer.ts` draws the Leafer card/chrome/ports for every node while `CanvasNodeSurfaceLayer.vue` conditionally adds DOM media, editors, choosers, and work surfaces. The two layers do not share one interactive owner. |
| Drag and selection | `use-canvas-stage.ts` starts drag from the Leafer group and mutates node coordinates in place before command persistence. DOM card surfaces do not own a stable drag region, so DOM interception varies by state. |
| Geometry | `canvas-card-geometry.ts` projects the persisted node into a visible rect and logical port anchors, but `canvas-port-presentation.ts` adds independent visible output offsets and `canvas-port-interaction.ts` owns a second pointer resolver. |
| Ports and edges | Leafer owns visible `+` markers and elastic output movement. Input uses only a fixed hit square. SVG connections consume logical anchors, so visible markers, hit centers, drag anchors, and rendered endpoints can diverge. |
| Card state | Selection, editor visibility, work-surface visibility, runtime lifecycle, and persisted node status are derived independently across the view model, work model, surface layer, renderer, and Workspace. No explicit transition table exists. |
| Taxonomy | `getCreatableNodeDefinitions()` exposes canonical Result and Group to generic creation surfaces. `CanvasToolDock.vue` labels generation entries as generic image/video and mixes authoring types with unrelated history/preflight actions. |
| Mentions | `resolveCanvasCardReferenceDisplayTitle()` formats duplicate names as visible title/type/ID text. Card references are separate candidate/reference lists instead of persistent inline structured tokens. |
| Generation configuration | Video request mode is reconstructed from transient `CanvasCardWorkModeId` in `CanvasWorkspace.vue`; reference bindings exist in generation parameters, but card-level mode/model/reference configuration has no single persisted adapter. |
| Job synchronization | Compact bound-job sync exists in `generation-job-runtime.ts`, but `project-resource-store.ts` still fetches `/api/generation-tasks?page_size=100` on ordinary Canvas load and `use-canvas-generation-runtime.ts` retains legacy project-wide active polling. |
| Compatibility | Stable node/document/job IDs, typed commands, graph/history/autosave, compact v2 jobs, legacy node definitions, and result materialization already exist and remain retained authorities during the cutover. |

#### Frozen Human-finding acceptance matrix

The focused files named below are frozen before production edits. A test may be split only to reduce setup cost; its assertion and owned authority cannot be weakened.

| Finding | Exact focused RED target | Implementation authority | Required browser proof | Human review |
|---:|---|---|---|---|
| 1 | `canvas-card-runtime-contract.spec.ts` — structured reference token preserves stable ID, thumbnail, display name, revision, role, and order through serialize/restore; raw composite ID text is absent. | `canvas-card-runtime.ts` canonical reference model and document adapter; `CanvasCardReferenceToken.vue` presentation. | Inline token is inside the editable composition flow, keyboard-focusable, reorderable, and remains unchanged after deselect/reselect/reload. | Confirm thumbnail/name token reads as part of the sentence and no raw ID shelf remains. |
| 2 | `canvas-card-runtime-browser.spec.ts` — one pointer drag from the DOM drag region moves DOM rect, canonical node position, Leafer world proxy, and both attached SVG endpoints by the same screen delta before and after persistence. | DOM card runtime plus typed move-command commit; Leafer renderer becomes world/hit proxy only. | Drag Text, Script, Image Generation, Video Generation, and Asset cards at 50%, 100%, and 200%; no lower/upper layer separation. | Drag each visible card from its documented region and confirm no ghost/projection remains behind. |
| 3 | `canvas-card-runtime-contract.spec.ts` — explicit `image-to-video` mode/model/reference configuration survives deselect/reselect and document round-trip without fallback to keyframes. | Canonical persistent card configuration adapter and state kernel. | Select image-to-video, deselect/reselect, switch Canvas away/back, reload, and observe identical mode/model/ordered role tokens. | Confirm the visible selected mode never changes without an explicit action. |
| 4 | `canvas-card-runtime-browser.spec.ts` — every owned semantic type uses the shared DOM card shell and explicit lifecycle state attributes without a second visible Leafer body. | `CanvasRuntimeCard.vue`, canonical state machine, shared card tokens/SCSS. | Capture idle, selected, editing/composing, running, succeeded, and failed states at desktop and 920px. | Judge hierarchy, status clarity, density, labels, and attached-control relationship. |
| 5 | `canvas-card-runtime-browser.spec.ts` — Script empty/direct/assisted states all expose the same drag region and move through it; interactive controls do not disable the region. | Shared DOM drag handle and state machine; Script content remains a body variant. | Drag Script in all three states, including after opening/closing assisted controls. | Confirm Script is visually coherent and draggable in every non-disabled state. |
| 6 | `canvas-card-runtime-contract.spec.ts` — authoring taxonomy equals Text, Script, Image Generation, Video Generation, Video Composition, and Audio Generation; Director is absent; Asset/Material is utility/reference-only; Result is non-creatable; Audio is capability-gated. | Authoring catalog separated from utility and compatibility registries; canonical card ownership/editability/capability metadata. | Add every enabled authoring type; verify Director and Result absent; verify Asset/Material utilities; verify unsupported Audio fails closed without mutation. | Confirm labels match intent, Video Composition and Audio remain visible, Director is absent, and every enabled action is truthful. |
| 7 | `canvas-bound-job-sync.spec.ts` — ordinary Canvas load and active-card polling make zero `/api/generation-tasks` calls; only current-Canvas delta and bound job status/result routes are requested; terminal jobs stop. | Compact generation-job store/runtime and history-only legacy resource loader. | Record network requests during load, submit, running, success, result fetch, Canvas switch, and history-panel open. | Confirm Canvas does not repeatedly refresh the full project task list. |
| 8 | `canvas-card-runtime-workflow.spec.ts` — frozen workflow table covers Text direct/assisted same-card apply and stale recovery, Script empty/direct/assisted, Image Generation, Video Generation modes/roles, Asset ownership, and Result materialization. | Canonical runtime orchestrator plus existing typed command/job/provider boundaries. | Execute every row with fake providers/disposable fixtures; verify persistence, undo/redo, refresh, and Canvas switching separately. | Review the complete matrix rather than isolated screenshots and declare any accepted boundary explicitly. |
| 9 | `canvas-card-runtime-browser.spec.ts` — one visible `+` per logical port; input/output acquisition is symmetric; selection never adds another control; `getPointAtLength()` plus `getScreenCTM()` endpoints equal visible port centers at rest/hover/drag/selected/zoom. | Canonical projected port geometry consumed by DOM controls, hit targets, drag draft, and SVG path builder. | Prove rest, hover, pointer-down, drag, selected, and reset at 50%, 100%, and 200% for both directions. | Confirm the visible control is the actual edge origin/target and acquisition feels symmetric. |

### Unit R1 - Card runtime workbench and canonical kernel

- Status: `complete`
- Build an isolated card-runtime workbench/fixture before cutting over the production Canvas.
- Define strict canonical types for card identity, semantic type, persistent configuration, transient interaction state, state-machine events, visible layout, ports, references, jobs, and editability.
- Make one in-memory layout projection authoritative for DOM body, selection, ports, hit targets, attached surfaces, and SVG edge endpoints.
- Preserve Canvas document serialization through explicit adapters; no second permanent runtime.

### Unit R2 - Drag, selection, ports, and edge geometry cutover

- Status: `complete`
- RED-prove and fix visible-card/lower-layer separation during pointer drag.
- Remove duplicate visible Leafer/overlay card and port controls after DOM cutover.
- Provide one visible `+` per logical port, symmetric input/output elastic acquisition, stable drag anchors, and selection decoration without duplicate controls.
- Prove visible port center equals SVG endpoint at rest, hover, drag, selected state, and representative zooms using `getPointAtLength()` and `getScreenCTM()`.

### Unit R3 - Card state machine, taxonomy, and editability

- Status: `complete`
- Cut Text, Script, Image Generation, Video Generation, and Asset/Material cards to the canonical state machine.
- Make documented drag regions work in every non-disabled state, especially all Script empty/direct/assisted states.
- Replace ambiguous Add actions. Generated Result is not creatable; it is materialized only by successful generation.
- Define truthful editable/read-only fields and actions for Asset/Material and generated results.

### Unit R4 - Structured mentions and persistent composition

- Status: `complete`
- Replace raw mention strings/separate shelves with inline thumbnail-and-name tokens backed by stable structured reference data.
- Preserve reference ID, type, revision, role, order, display name, and preview through edit, reorder, reload, duplication, undo/redo, and Canvas switching.
- Persist explicit model/mode/reference choices as canonical configuration; never derive a replacement choice from selection state.

### Unit R5 - Text, image, and video same-card workflows

- Status: `complete`
- Revalidate truthful Text empty/direct/assisted behavior on the replacement runtime.
- Require explicit backend-authoritative allowed-model selection and preserve same-card typed result application with stale-revision recovery.
- Keep image and video authoring semantically separate; prove image-to-video remains selected across deselect/reselect/reload and that ordered keyframe/reference roles do not drift.
- Use fake providers/disposable test data only.

### Unit R6 - Compact bound-job synchronization

- Status: `complete`
- RED-prove that normal Canvas runtime no longer calls project-wide `generation-tasks?page_size=100`.
- Track only active/current Canvas job IDs and consume compact v2 status/result endpoints or bounded cursor deltas.
- Fetch a terminal result only for its bound task/job ID and stop polling terminal jobs.
- Preserve the legacy project task list for history/admin compatibility only.

### Unit R7 - Production cutover and compatibility

- Status: `complete`

- Cut all owned card types from the workbench into the production Canvas in coherent vertical slices.
- Prove legacy documents adapt into the canonical runtime without identity/history/autosave loss.
- Delete or disable superseded visible projection paths only after their replacement tests pass; do not leave competing authorities.
- Audit the full original workflow matrix and record any genuinely out-of-scope finding rather than silently deferring it.

### Unit R8 - Prior automated verification and rejected Human review

- Status: `superseded_by_human_rejection`
- R8A-R8G remediation and renewed automated verification completed, but the Human Owner rejected the visible result on 2026-07-24 after reviewing the live frontend.
- The prior independent `AUTOMATED ACCEPT` remains regression evidence only and cannot be used as release evidence for the Human-confirmed video contract.
- Run focused contract/unit/browser tests first, then related card/edge/history/autosave/job/compatibility regression.
- Rebuild `frontend` before preview-backed proof; validate current source rather than stale `dist`.
- Run broad frontend/backend checks and dependency/security/state/diff hygiene in proportion to the touched boundaries.
- Present separate automated visual, functional, interaction, API, and persistence evidence.
- Return T6-011 to `DOING / PENDING` for R8H remediation.

#### R8A-R8G independent-audit remediation

- `R8A` complete: canonical reference role/order persists atomically and is the provider-binding authority.
- `R8B` complete: the editable flow renders structured thumbnail/name tokens inline and preserves caret/order/reload identity.
- `R8C` complete: production direct-edit, composer, Script-authoring, submitting, and terminal states project through one runtime state authority.
- `R8D` complete: accepted image/video jobs recover by exact durable client-request/job binding without a project-wide list.
- `R8E` complete: cinematic lineage uses a bounded current-project/current-Canvas endpoint rather than ordinary legacy task reads.
- `R8F` complete: zoom-aware neighbor bounds prevent port acquisition overlap while rendered endpoint equality remains proven.
- `R8G` complete: foreign project/Canvas/generation-node lineage identity fails closed without latest-task fallback.

### Unit R8H - Human-confirmed video-reference remediation

- Status: `verification_blocked`
- Contract authority: [T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT](../../requirements/T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT.md).
- `R8H0`: `complete` - re-audit the current source and live DOM against every frozen contract row; record focused RED fingerprints before production edits.
- `R8H1`: `complete` - resting/selected/editing/composing hierarchy uses the shared card shell and one attached composer.
- `R8H2`: `complete` - direct edit, card drag, Canvas pan, port drag, and toolbar states are separated; running and Script cards retain the documented drag region.
- `R8H3`: `complete` - Add/continuation expose the exact six authoring workflows; Audio is backend-model-gated, Director is absent, Asset/Material is utility-only, and Result is non-creatable.
- `R8H4`: `complete` - edge-backed numbered thumbnails and inline thumbnail/name tokens share one typed persisted reference authority; disconnect prunes only the bound edge/token atomically.
- `R8H5`: `complete` - explicit video mode/model/first-frame/last-frame/reference roles and order survive capability refresh, deselect, Canvas switch, reload, undo/redo, and autosave.
- `R8H6`: `complete` - Script remains compact/draggable and opens its structured workflow only through an explicit action.
- `R8H7`: `complete` - one visible `+` per logical port, symmetric acquisition, and rendered SVG endpoint equality are proven across rest/hover/input-output draft/selected/50/100/200% zoom.
- `R8H8`: `blocked` - focused, related, broad, fresh build, browser proof, dependency audit, and independent source/DOM audit pass. The unchanged exact headed 200-node/300-edge benchmark fails under a measured 59% average host CPU baseline; release condition is an identical rerun after unrelated host load is cleared.
- `R8H9`: `pending` - request renewed Human review only after R8H8 is fully green. Do not enter R9 without explicit `ACCEPT` or `ACCEPT_WITH_DECLARED_BOUNDARIES`.

### Unit R8I - Human-visible resting-card hierarchy correction

- Status: `superseded_by_complete_frontend_replacement`
- Human rejection evidence: `C:\Users\mkd\AppData\Local\Temp\codex-clipboard-b611932e-ff17-4ff3-b6bc-8a80af5b96b1.png`.
- Root cause: `CanvasRuntimeCard.vue` renders the identical type label and default title inside a fixed internal header, `canvas-card-geometry.ts` forces empty generation cards to 160 world pixels, and the default body renders only a generic empty string. Existing tests froze the height without asserting the visible hierarchy.
- `R8I0`: `complete` - compare the Human screenshot with the frozen contract and the source-video frame at `00:12:05`; identify one external identity label, a media-dominant placeholder, and one selected-card attached composer as the observable hierarchy.
- `R8I1-R8I4`: `superseded` - the Human Owner directed the complete Canvas frontend to be replaced rather than continuing the local old-runtime correction. The unshipped R8I production/test patch was removed.

### Unit R8J - Complete Canvas frontend replacement

- Status: `superseded_by_2026_07_25_human_rejection`
- Contract authority: [T6-011-HUMAN-DIRECTED-CANVAS-FRONTEND-REPLACEMENT](../../requirements/T6-011-HUMAN-DIRECTED-CANVAS-FRONTEND-REPLACEMENT.md).
- `R8J0`: `complete` - audited the full 26:32 video, froze the global shell/node/composer/Script/image/video/port/edge evidence map, inventoried 239 relevant source files (approximately 43,366 lines), and froze the retain/replace/retire cutover matrix in the replacement contract.
- `R8J1`: `complete` - the replacement subtree now owns the full-screen dotted workbench, floating top/bottom chrome, Canvas selector, Workflow/Storyboard switch, camera controls, and one frame-coherent DOM/SVG projection without a permanent Inspector.
- `R8J2`: `complete` - rebuilt external-label Text, Script, Image Generation, Video Generation, Video Composition, and capability-gated Audio bodies; Result remains non-creatable and Asset/Material remains utility/reference-only.
- `R8J3`: `complete` - selection owns one attached toolbar/composer; Text edit and card drag are separated; placement is collision-safe; parameter/model popovers persist through existing authority; retained media actions open without Director.
- `R8J4`: `complete` - compact Script cards explicitly open and close one full structured Script workspace while preserving selection and Canvas camera state.
- `R8J5`: `complete` - inline thumbnail/name/role/order tokens, persisted Video modes, same-card runtime lifecycle, recovery presentation, and retained media-action authority are projected without a second job authority.
- `R8J6`: `complete` - single symmetric ports, SVG rest/selection/draft/zoom proof, input/output graph mutation, and blank-drop continuation all use existing graph/history/autosave authority.
- `R8J7`: `complete` - the normal route defaults to replacement; retired DOM fixtures explicitly use `?canvas_runtime=legacy`; legacy navigation preserves that compatibility query.
- `R8J8`: `blocked` - build, replacement/Human `34/34`, explicit legacy `28/28`, backend `8 + 2 subtests`, broad legacy routing, live DOM, dependency, state, size, forbidden-reference, and diff checks pass. The unchanged headed gate fails only frame-interval P95 at `65.1/66.3ms > 33ms`; average FPS remains `64.11/63.73`.
- `R8J9`: `pending` - request formal complete Human review only after R8J8 is green. Do not enter R9 without explicit `ACCEPT` or `ACCEPT_WITH_DECLARED_BOUNDARIES`.

### Unit R8K - Human-rejected acquisition, same-card media, playback, Agnes progress, and unified design remediation

- Status: `doing`
- Human rejection date: `2026-07-25`
- Evidence: `C:\Users\mkd\AppData\Local\Temp\codex-clipboard-a4079fcb-a876-4cb5-ac85-7178d5e1111d.png`, `C:\Users\mkd\AppData\Local\Temp\codex-clipboard-9fed7ecb-1fc1-468f-be6e-d02d096789db.png`, and the complete read-only `C:\Users\mkd\Videos\20260724_154111.mp4`.
- Current-session scope: the Human Owner's repeated 2026-07-25 `REJECT` supersedes any prior automated-ready conclusion. Before any other UI work, this session owns exactly three gates: (1) live current-document/current-node compact-job progress from provider fixture through repository/API/cursor/worker/frontend/card projection, (2) official Agnes 2.5 Flash text capability as backend-authoritative allowed execution, and (3) exactly one visible left acquisition `+` plus one visible right acquisition `+` with fail-closed logical-port resolution and shared SVG geometry. Same-card media and Figma work already present in the checkout are preserved but are not expanded in this bounded session.
- Verification order for these three gates is strict TDD: observed focused RED, smallest coherent GREEN, related regression, fresh frontend build, local live/browser proof, relevant broad checks, then a fresh independent audit. Unit tests alone cannot establish the progress fix.
- `R8K0`: `done` - complete-timeline metadata, scene detection, evenly spaced contact sheets, continuous frames, screenshot diagnoses, reusable interaction rules, and frozen Revid overrides are recorded in `ai/evidence/t6-011-video-2026-07-25/`.
- `R8K1`: `blocked-partial` - the installed Figma plugin created [file `4CT3rjl2lj5jauBOO7wRP9`](https://www.figma.com/design/4CT3rjl2lj5jauBOO7wRP9), three pages, `66` source-backed variables, `6` styles, and Cover node `5:6`; the Starter MCP call quota then rejected further writes. Resume the remaining card/port/composer/progress/media components and seven state screens only after the Figma MCP quota becomes available. This blocker does not stop non-Figma-dependent remediation.
- `R8K2`: `done` - Agnes official documentation at `https://agnes-ai.com/zh-Hans/docs/overview` was used as the sole technical fact source; the exact 2026-07-25 contract is frozen in `ai/evidence/T6-011-AGNES-OFFICIAL-CONTRACT-2026-07-25.md`.
- `R8K3`: `done` - observed backend/frontend REDs now cover strict Agnes allowed/known capability, root integer progress, exact finite statuses, compact v2 projection, provider-raw exclusion, monotonic persistence, and Audio fail-closed admission.
- `R8K4`: `done` - continuous browser proof covers symmetric pointer-following input/output acquisition, one visible `+` per logical port, radial clamp, and exact SVG endpoints at rest/hover/draft/selected/zoom using `getPointAtLength()` and `getScreenCTM()`.
- `R8K5`: `done` - typed command/store/browser proof updates the original stable Video Generation card, hides legacy Result from normal Canvas, preserves bindings, and plays a local MP4 with poster/native controls/loading/error/fallback and isolated pointer ownership.
- `R8K6`: `done` - the smallest coherent GREEN remains inside retained document/history/autosave/job/provider and shared geometry authorities; no real provider, migration, project-wide polling, or second result authority was added.
- `R8K7`: `blocked-partial` - backend `43/43`, replacement/remediation browser `18/18`, related browser `53/53`, fresh production build, state/diff/source audit, and live health pass. The unchanged headed gate still fails only frame-interval P95 at `68.1/67.6ms > 33ms`.
- `R8K8`: `verifying` - `127.0.0.1:5173` and backend `/health` on `127.0.0.1:8000` are reviewable. Await explicit Human `ACCEPT`, `ACCEPT_WITH_DECLARED_BOUNDARIES`, or another `REJECT`; do not enter R9 meanwhile.
- `R8K9`: `human-review-pending` - observed RED, coherent GREEN, related/broad regression, fresh build, local live/browser proof, and fresh self-audit are complete for all three repeated-REJECT gates. Exact bound-job progress survives an empty Canvas delta, Agnes 2.5 Flash is allowed end to end, and one visible acquisition per side retains fail-closed typed logical resolution plus rendered-SVG endpoint equality. Keep the live candidate pending explicit Human acceptance; the PostCSS high advisory remains a declared separate boundary.

### Unit R8L - Human-rejected Canvas behavior restoration

- Status: `doing`
- Human rejection date: `2026-07-25`
- Evidence: `C:\Users\mkd\AppData\Local\Temp\codex-clipboard-affceb86-f934-4c4c-9aa3-09ee6cd4d755.png`, `C:\Users\mkd\AppData\Local\Temp\codex-clipboard-4999d5dd-336b-4b91-81eb-b707018b2b22.png`, `C:\Users\mkd\AppData\Local\Temp\codex-clipboard-33dd3c76-c717-453f-ac4d-d55ea726752d.png`, and `C:\Users\mkd\AppData\Local\Temp\codex-clipboard-69d41007-45d1-4d03-9a2a-26b03a2b25c1.png`.
- `R8L0`: `done` - traced succeeded-job reconciliation, card media projection, edge/acquisition geometry, transient drag projection, minimap/camera/context-menu authorities, top-right actions, and chat workflow from the preserved dirty checkout.
- `R8L1`: `done` - observed four fresh browser REDs: no same-card video, body cursor `auto`, no minimap, and no share dialog; follow-up REDs isolated stale edge projection and unavailable media-action authority.
- `R8L2`: `done` - implemented the smallest coherent GREEN through the existing compact-job, typed command/history/autosave, shared projection geometry, camera, menu, account/share, and professional-action authorities without fake progress or a second persistence path.
- `R8L3`: `done` - focused browser proof is `4/4`; the fresh-build related compact-job/replacement/geometry/action/history matrix is `52/52`.
- `R8L4`: `done` - local fixture proof plays succeeded video on the original card and uses `getPointAtLength()`/`getScreenCTM()` to prove card-boundary endpoints follow the whole-card drag before pointer-up while the acquisition `+` moves independently.
- `R8L5`: `verifying` - backend `60 passed + 12 subtests`, fresh production build (`5,034` modules), validator, diff/protected-path checks, line-size review, and `5173/8000` health pass. Await explicit Human review; do not stage, commit, push, enter R9, or activate T6-012.

### Unit R8M - Zoom-scaled acquisition geometry

- Scope: correct only the oversized low-zoom acquisition trigger, cropped image projection, and redundant video lifecycle overlay shown in the two final 2026-07-25 Human screenshots. Do not expand other UI or change persisted edge attachment.
- `R8M0`: `done` - observed focused REDs for `160` world-unit acquisition at 50%, image `object-fit: cover`, and playable-video lifecycle chrome.
- `R8M1`: `done` - made acquisition/follow geometry constant in Canvas-world units, projected images with contain framing, and suppressed lifecycle chrome only when playable video media exists.
- `R8M2`: `done` - focused GREEN, fresh builds, `73/73` related browser regression, local browser screenshots, backend `59 passed + 12 subtests`, validator, diff audit, and `5173/8000` health pass.
- `R8M3`: `verifying` - keep T6-011 `VERIFYING / PENDING` until explicit Human acceptance; only then may a new session activate the next dependency-ready Task.

### Unit R8N - Bottom-layer edges and exact bound-job polling

- Human rejection date: `2026-07-25`.
- Scope: correct only the Human-reported edge/card paint order and compact Canvas-delta polling. Preserve card-boundary endpoint geometry, acquisition-only `+`, bound-job live provider progress, exact reload/result recovery, cursor/version fencing for the retained delta API, compact DTOs, document authority, and history/admin compatibility.
- `R8N0`: `done` - focused RED reproduced the card world at computed `z-index: auto` below edge `1`; the stricter polling RED then reproduced an unnecessary Canvas-delta request during reload and repeated active bound-job sync.
- `R8N1`: `done` - edge world is explicit layer `0`, card world layer `1`; exact compact status continues only for nonterminal persisted bindings. Canvas delta is removed from normal bound polling because the runtime executes only with a persisted binding.
- `R8N2`: `done` - stricter zero-delta focused GREEN, fresh build (`5,034` modules), related browser `62/62`, backend compact/job-runner `18/18`, browser paint/network proof, state/diff/live-health checks, and fresh self-audit pass.
- `R8N3`: `done` - Human recorded overall acceptance with minor unspecified issues deferred to future independent planning.

### Unit R9 - Closure and delivery

- Status: `complete`
- Reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP and write a new accepted REPORT section only after Human acceptance.
- Stage exact T6-011 paths, exclude protected/user-owned paths and secrets, commit one scoped change, push `main`, and verify `HEAD == origin/main`.
- Stop without activating or implementing T6-012.

## Verification order

1. Frozen Human-finding-to-test matrix.
2. Exact focused RED fingerprints.
3. Smallest coherent GREEN per replacement slice.
4. Focused and related automated regression.
5. Fresh production frontend build.
6. Preview/browser geometry and interaction proof.
7. Relevant broad backend/frontend regression and hygiene.
8. Explicit Human visual/interaction acceptance.
9. Exact staging, commit, push, and post-push state validation.

## Stop conditions

- Stop before T6-012 or any later Task behavior.
- Stop before real/paid provider calls, secret access, user/runtime migration, destructive operations, external-account changes, or compatibility removal.
- Stop if a cutover would create two lasting visible card runtimes or an unknown overlapping edit affects an owned path.
- Never claim Human acceptance from screenshots, Playwright, test totals, or the prior rejected REPORT.
- End every partial run with PROGRESS and CURRENT recording exact completed work, remaining work, next action, changed files, commands/results, and blocker release conditions.

## Prior attempted delivery plan (rejected reference only)

The completed Units 0-5 below describe the implementation rejected by the Human Owner on 2026-07-23. Their test evidence remains useful for regression characterization but does not satisfy the reactivated Task.

## Delivery rule

Implement only the T6-011 text-card workflow. Every production behavior must follow a focused failing test, an observed expected RED fingerprint, the smallest coherent GREEN, and refactoring only while green. Rebuild the frontend before preview-backed browser proof.

## Unit sequence

### Unit 0 - Activation and contract inventory

- Status: `complete`
- Create and activate the sole T6-011 Task, PLAN, and PROGRESS.
- Reconcile CURRENT and ROADMAP, then pass project-state validation before business-code edits.
- Inspect the frozen T6-011 RED assertions, compact durable text job schemas/services, allowed-model capabilities, card work model, direct editor, attached surface, typed commands, revision/history/autosave, and legacy compatibility boundaries.

### Unit 1 - Allowed model and mode contracts

- Status: `complete`
- Write focused backend RED assertions for an explicit allowed text-model list, stable IDs, per-mode capability flags, and rejection of omitted/unknown/incompatible selections before mutation.
- Extend only the existing generation capability/job/dispatch boundaries required by text generation.
- Preserve fake-provider/disposable-test isolation and do not call a real provider.

### Unit 2 - Text card empty state and direct editing

- Status: `complete`
- Write focused frontend RED assertions for truthful empty modes, keyboard behavior, direct in-card editing, and zero unintended mutation while browsing modes.
- Reconcile `canvas-card-work-model`, text chooser/composer, and node editor with the canonical T6-010 card model and geometry authority.
- Preserve text/script separation required by T6-012/T6-013 and avoid later workflow behavior.

### Unit 3 - Attached composition and same-card application

- Status: `complete`
- Write focused RED assertions for selected-card attached composition, explicit model submission, refresh/Canvas-switch continuity, same-card result application, and stale-revision recovery.
- Add the smallest text work surface and typed apply-result command/use-case boundary needed for one original card.
- Prove stable IDs, one history/autosave entry, exact undo/redo, no result-card creation, and no overwrite after user edits.

### Unit 4 - Focused and broad verification

- Status: `complete`
- Run focused backend and frontend tests first.
- Rebuild the frontend, then run related text/card/job/history/autosave/compatibility browser regression.
- Run the relevant locked backend and broad frontend suites while excluding only frozen later-Task RED assertions.
- Classify automated visual, functional, and interaction proof separately from Human acceptance.

### Unit 5 - Fresh review and delivery

- Status: `complete`
- Review the complete diff against model authority, mutation ordering, revision safety, compact payloads, accessibility, geometry, stable identity, compatibility, and protected paths.
- Reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP, create REPORT only after every non-deferred acceptance criterion passes, then run project-state, UTF-8, diff, sensitive-path, staged-secret, and exact-staging checks.
- Commit one scoped change, push `main`, and stop before activating or implementing T6-012.

## Verification order

1. Exact focused RED fingerprint.
2. Smallest coherent GREEN.
3. Focused backend/frontend/browser proof.
4. Fresh production build.
5. Related regression, then relevant broad regression.
6. State, diff, hygiene, staged-secret, commit, and push proof.

## Stop conditions

- Stop before T6-012 or any later Task behavior.
- Stop before a real/paid provider call, secret access, user/runtime migration, destructive operation, external-account change, or compatibility removal.
- Stop on unknown overlapping edits in an owned path.
- End every partial run with PROGRESS and CURRENT recording exact completed work, remaining work, next action, changed files, commands/results, and blocker release conditions.
