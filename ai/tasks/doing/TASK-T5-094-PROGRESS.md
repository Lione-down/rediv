# TASK-T5-094 Progress

- State: `DONE - PASS`
- Last updated: 2026-07-19
- Activation HEAD: `e932a3615273f3fde9c3173a51f39c8291acac34`

## Completed work

- Activated T5-094 as the only implementation Task after reading the required truth sources and the user-owned source plan.
- Confirmed `HEAD == origin/main == e932a361...`, preserved unrelated `.codex/`, `.hermes/plans/`, and `output/`, and verified the local frontend/backend return HTTP 200 on ports 5173/8000 without reading secret values.
- Audited the provider path against official Agnes text/image/video documentation and model catalog. Real-provider calls were not made.
- Added one typed Agnes contract for base URL, model IDs, submit/poll endpoints, exact media request adapters, and capability consumers.
- Added bounded redacted provider failures with stable deterministic/transient codes, safe correlation IDs, retryability, Retry-After, route status mapping, and durable task metadata.
- Added frontend transport normalization so deterministic failures ask for changed input/parameters and transient failures remain manually retryable.
- Added a five-minute same-fingerprint deterministic-failure guard; changed effective input is admitted and transient failures are not blocked.
- Proved the local upload root cause: Revid recorded `/uploads/...` without exposing a static route, so the relative value was not a provider-fetchable public URL.
- Added a strict owned-upload adapter that converts canonical local image files to bounded Agnes-supported Data URIs and rejects cross-user, traversal, symlink, missing, unsupported, private, credentialed, and oversized references before provider work.
- Replaced the obsolete Agnes integration note with the current backend-owned contract, error, reference, task/quota, and verification boundaries.
- Added backend-owned `script_draft` and `script_refine` contracts for Agnes 2.0 Flash, strict Canvas/source revision checks, bounded prompt/output validation, typed stale-source failure, immutable task snapshot, and source lineage without persisting raw brief/source text in task parameters.
- Added capability v5 text truth, contextual and Slash Palette script authoring entry points, visible model identity, cancel handling, default-new output, explicit replace, atomic lineage commands, autosave/history/reload support, and stale-result retention without automatic application.
- Kept Cinematic Script as a separate explicit action: script authoring never creates a shot graph, image, video, or cinematic preflight.
- Verified desktop/compact/review-only focus behavior, draft and refine requests, explicit replace, undo/redo/reload, and Cinematic independence through browser mocks. The live unauthenticated local shell loaded without console warning/error; authenticated Canvas runtime was not claimed from that smoke.
- Completed the clean-room LibTV Canvas inventory from current official public pages/repository plus Human-authorized retained captures, without login, prompt submission, generation, payment, or account mutation.
- Added a 94-row parity ledger (`23 MATCHED`, `43 BLOCKED`, `28 NOT_OBSERVABLE`), a Revid-only semantic color-token map, and a 28-scenario machine-readable manifest covering every ledger ID at four target viewports and zoom 10/17/36/100/200.
- Recorded a release condition for every blocked or non-observable item. Static captures are not used to infer hidden interaction, motion timing, lifecycle, finishing, or private Canvas contracts.
- Completed Unit 5A's first shell slice: compact one-line identity, fixed left action rail using existing Revid actions, detached bottom-left zoom group, centered four-entry empty-Canvas starters, and progressive empty-Canvas minimap disclosure.
- Preserved the former aggregate `画布视图控制` accessibility scope while adding the more precise `画布主要操作` toolbar; deterministic Tab order now moves from Add to Project Resources.
- Updated continuation evidence for Unit 3's intentional script input lineage: text output now offers script, prompt, image, and video continuation without changing atomic insert/undo behavior.
- Completed the safe Unit 5B catalog/metadata slice: seven observable add categories map to canonical Revid nodes or Project Resources, empty media has a node-local safe-upload entry, and decoded media exposes a compact natural-resolution badge.
- Kept product maturity truthful: the observed LibTV Script Beta label is not copied onto Revid's formal canonical script; the ledger keeps that version-specific fact `NOT_OBSERVABLE`.
- Completed Unit 5C continuation parity: the selected text output exposes text/image/video/audio/script in the source-local menu, with audio visibly disabled and non-mutating; available options retain exact typed insertion and undo.
- Added 100%/36%/17% numeric geometry evidence proving the continuation menu stays within the workspace and in the source trigger's immediate horizontal neighborhood.
- Completed the bounded Unit 5D/5F starter slice: story script, character multi-view, and first-frame video create canonical atomic graph scaffolds; audio-driven video is visible but disabled and returns no command.
- Preserved result lineage in the first-frame starter: image-generation tasks are not falsely connected as media references before a durable image result exists.
- Completed Unit 5E's selected-media toolbar slice: owned image/video assets expose a deterministic toolbar above the node, exact eligible image-operation routes, direct download, and fullscreen.
- Added a fail-closed media-action target resolver covering project, user, active status, media type, asset ID, and URL equality. Unavailable multi-angle, lighting, brush, crop, and inapplicable grid actions stay visible and disabled.
- Completed Unit 5H's dense-overview slice: 72 nodes/72 edges retain exact media geometry at 36%/17%, while idle edge opacity, stroke, and arrow markers recede without weakening selected/provenance emphasis.
- Completed the remaining implementable Unit 5 surfaces: compact generation submission summaries, selected result-family stack, selected empty-media recovery, fixed-rail revision access, honest collaboration/link controls, and an empty-Canvas main creation composer.
- Main composer Send preserves the user's exact punctuation, writes only an atomic local graph command, makes no provider call, and remains undoable. Agent/Skill selection is visible but does not claim external Agent authority.
- Reconciled the 94-row ledger to `61 MATCHED`, `5 BLOCKED`, and `28 NOT_OBSERVABLE`. The five blocked rows all require Human product/ADR authority; no safely implementable row remains blocked.
- Closed the final request-adapter self-review gap: Agnes text requests now accept only explicit `model`, `messages`, `temperature`, and `stream` fields; unknown provider parameters fail at the adapter boundary instead of entering an HTTP payload.
- Audited the manifest against the ledger after correcting three stale aggregate statuses: 94 rows and 28 scenarios now have zero unknown IDs, zero uncovered rows, and zero status mismatches.
- Short-circuited selected-media Palette eligibility so the complete action registry is evaluated only when a fail-closed owned-media target exists; ordinary selected nodes no longer pay toolbar-only eligibility work.

## Remaining work

- None for T5-094. Real Agnes service health remains outside this accepted offline closure and requires a separately authorized smoke or a future resilience Task.

## Active Unit 6 verification

- Scope: final regression, performance, coverage, hygiene, Human acceptance, and delivery evidence.
- Non-goals: no threshold reduction, fabricated provider proof, real call, relaxed upload limit, or long-term product contract without Human authorization.
- Success criteria: all non-deferred gates pass; every deferred gate has explicit Human acceptance; durable state and remote delivery agree.
- Result: `DONE - PASS`; functional and performance verification is green, the Human parity/provider decision was supplied on 2026-07-19, and the scoped closure is delivered to `origin/main`.

## Exact next action

Await the Human Owner's next bounded Task. If requested, treat additional Agnes 503 resilience as a separate plan with provider-side ambiguity, retry budget, and idempotency boundaries made explicit.

## Files changed

- Task state: `ai/tasks/todo/TASK-T5-094.md`, `ai/tasks/doing/TASK-T5-094-PLAN.md`, `ai/tasks/doing/TASK-T5-094-PROGRESS.md`, `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`.
- Agnes contract/runtime: `backend/core/agnes_contract.py`, `backend/core/agnes_provider.py`, `backend/core/agnes_image_reference.py`, `backend/core/generation_parameter_contract.py`, `backend/core/cinematic_skill_contract.py`, `backend/core/generation_task_utils.py`, generation routes/controllers/settings, and `backend/AGNES_INTEGRATION.md`.
- Focused tests: Agnes contract/provider/reference, image/video route, idempotency/admission, and frontend generation service specs.
- Script authoring: `backend/core/script_authoring_contract.py`, structured text route/schema/capability changes, `frontend/src/modules/canvas/script-authoring.ts`, Canvas command/executor/registry/service changes, `CanvasScriptGenerationControls.vue`, `use-canvas-script-generation.ts`, Context Panel/Workspace/Palette integration, and focused/browser fixtures/specs.
- Unit 4 evidence: `ai/evidence/t5-094/libtv-canvas-parity-ledger.md`, `ai/evidence/t5-094/libtv-canvas-color-token-map.md`, and `ai/evidence/t5-094/libtv-canvas-scenario-manifest.json`.
- Unit 5A shell: `CanvasZoomControls.vue`, Canvas Stage/View/Tool/Empty/Identity components and styles, `canvas-libtv-shell-parity.spec.ts`, plus updated continuation/focus regressions.
- Unit 5B catalog/metadata: `CanvasToolDock.vue`, `CanvasNodeMedia.vue`, `CanvasNodeSurfaceLayer.vue`, Stage resource routing, and focused shell/visual tests.
- Unit 5C continuation: source-local display catalog, licensed audio icon, unavailable semantics, and 100/36/17 browser geometry coverage.
- Unit 5D/5F starters: `canvas-workflow-starters.ts`, empty-guide availability presentation, and pure/browser graph/honesty tests.
- Unit 5E media toolbar: `CanvasMediaToolbar.vue`, fail-closed owned-media resolver, Stage/Workspace routing, node-surface identity, and focused visual parity tests.
- Unit 5H dense overview: low-zoom edge/marker presentation and deterministic 72-node/72-edge 36%/17% geometry evidence.
- Unit 5 completion: generation editor summaries, result-family stack, empty-media recovery, rail revision routing, honest collaboration/link controls, main creation composer, and their focused parity tests.
- Unit 6 performance gate: `frontend/playwright.performance.config.ts` selects Playwright full Chromium new-headless for representative hardware-accelerated performance evidence while leaving the default headless-shell functional regression unchanged.

## Commands run and summarized results

- Required start audit and process/port/readiness probes: activation tracked tree clean; local frontend/backend HTTP 200; no secret content read.
- Official contract audit: Agnes official text/image/video docs and GitHub model catalog, checked 2026-07-18.
- RED/GREEN route and pure tests proved typed errors, malformed responses, submit/poll shapes, deterministic guard, and local Data URI conversion.
- Final focused backend matrix: `65 passed, 49 subtests passed` in 124.35s across contract/reference/provider/capability/idempotency/text/image/video suites.
- Final focused Chromium service matrix: `11 passed` in 3.0s.
- Final Unit 3 backend matrix: `64 passed, 52 subtests passed` in 129.84s across Agnes contract/provider/reference, admission, parameter contract, text/image/video, and script-authoring suites.
- Final Unit 3 browser matrix: `10 passed` in 18.7s across script authoring, Cinematic independence, Slash Palette, accessibility, compact focus ownership, and 375px review-only behavior.
- Production frontend build: `4931 modules transformed`, completed in 2.73s after `vue-tsc -b`.
- In-app local smoke: unauthenticated landing page loaded at 5173 with zero captured warning/error logs; no credentials were requested and no authenticated Canvas claim was made.
- Unit 4 public browser study: current LibTV home was inspected read-only; direct unauthenticated `/canvas` returned to login acquisition. No authenticated/private state was claimed and no external mutation occurred.
- Unit 4 manifest audit: JSON parsed; `94` ledger rows, `28` deterministic scenarios, `4` target viewports, `5` zoom levels, `0` unknown references, and `0` uncovered ledger IDs.
- Unit 5A RED: 2/2 failed on the missing action rail against the fresh production bundle.
- Unit 5A GREEN: focused shell `2 passed`; affected action/continuation/shell matrix `32 passed`; broader initial matrix had `37 passed` with five classified assertions subsequently closed; production build transformed `4934` modules.
- Unit 5B RED/GREEN: add catalog failed at 6 versus 7 then passed with safe resource routing; resolution and node-local upload each failed before implementation then passed. Combined shell/visual parity passed 11/11 before the upload addition; focused upload passed 1/1.
- Unit 5C RED/GREEN: overview catalog failed at 4 versus 5; the final source-local five-category scenarios passed 2/2, including typed insert/undo and 100/36/17 geometry.
- Unit 5D/5F RED/GREEN: old generic starter IDs failed first; final starter/grid/shell matrix passed 7/7. A direct generation-task-to-video-media edge was rejected and correctly removed in favor of the durable-result boundary.
- Unit 5E RED/GREEN: missing owned-media resolver failed at module export; final resolver and selected-media browser matrix passed 2/2. Toolbar geometry, disabled unavailable actions, exact Palette filtering, download URL, and fullscreen target passed after a `4937 modules transformed` production build.
- Unit 5H dense RED/GREEN: idle overview edges initially stayed at opacity 1; final 36%/17% dense scenario passed 1/1 after a `4937 modules transformed` build with bounded opacity/stroke/marker and exact media scaling.
- Unit 5 final RED/GREEN: media border started at 0px then passed 1px/6–8px; missing submission summary, version stack, recovery toolbar, revision/disabled collaboration controls, and main composer each failed before implementation and passed after. The composer test also caught and removed unintended NFKC punctuation mutation.
- Final backend target matrix after adapter hardening: `76 passed, 57 subtests passed` in 129.49s.
- Final production build after the hot-path short-circuit: `4937 modules transformed`; `vue-tsc -b` and Vite completed successfully.
- Final related Chromium matrix: `74 passed` in 1.1 minutes. The post-short-circuit visual/registry subset passed `24/24` sequentially after the production build.
- Final post-performance-config product regression rerun: the same related Chromium matrix passed `74/74` again in 1.1 minutes.
- Performance/accessibility full file: Canvas switching and accessibility/required viewport tests passed `2/2`; the 200-node/300-connection test failed only the FPS threshold at 47.48 in that run.
- 200/300 isolated evidence is mixed on the same SwiftShader/no-hardware-acceleration environment: prior pass 57.41 FPS with 16.8ms frame p95; current retries 45.61 FPS, then 55.07 FPS with 33.3ms frame p95, then 44.75 FPS. Stable render stayed 409–661ms, pointer p95 9.8–22.8ms, longest task 74–111ms, and minimap 7.46–10.19 updates/s. Thresholds remain 55 FPS and 33ms p95.
- Root-cause A/B: the default project launches Playwright's separate `chromium_headless_shell` with forced SwiftShader, while the official `channel: 'chromium'` path launches full Chromium new-headless and records AMD Radeon D3D11 hardware acceleration. Added `frontend/playwright.performance.config.ts` without changing the default functional project or any threshold.
- Full-Chromium 200/300 stability run passed `3/3`; the complete performance/accessibility file passed `3/3`. Final metrics: stable render 717ms, 128.29 FPS, 25.1ms frame p95, 3.3ms pointer p95, 69ms longest task, 10.30 minimap updates/s, and hardware acceleration true.
- Manifest/ledger audit: 94 rows, 28 scenarios, zero unknown, zero uncovered, zero status mismatch; final counts `61 MATCHED`, `5 BLOCKED`, `28 NOT_OBSERVABLE`.
- Hygiene: `git diff --check` passed; 74 owned text files are strict UTF-8 with no replacement characters; zero sensitive-path candidates and zero high-confidence secret signatures. Seven changed existing files exceed the general 500-line guideline; all were already large before T5-094 and no new monolithic file was introduced.
- `git diff --check`: passed; line-ending notices are repository autocrlf warnings, not whitespace errors.
- Human acceptance closure rerun: backend target matrix passed `76/76` in `121.55s`; production build passed with `4937` modules; related Chromium passed `74/74`; dedicated full-Chromium performance/accessibility passed `3/3`.
- Final closure audit: 75 pre-REPORT owned paths were strict UTF-8 with zero replacement characters, zero sensitive-path candidates, zero high-confidence secret signatures, and zero out-of-scope prefixes; manifest/ledger remained 94 rows, 28 scenarios, and zero mismatch.
- No real Agnes request, paid call, user/runtime schema migration, destructive operation, or secret access occurred.

## Blockers and release conditions

- No active closure blocker remains. On 2026-07-19 the Human Owner accepted `A03`, `B17`, `E08`, `E09`, `E10`, and the 28 `NOT_OBSERVABLE` rows as documented deferrals and deferred real Agnes smoke.
- Units 1/2 remain offline/mock verified only. The accepted deferral does not claim current real-provider health.
- LibTV login-only, dynamic, or non-public behavior remains evidence-limited and is not guessed or represented as matched.
- Performance release condition is satisfied through the dedicated full-Chromium new-headless project. Default headless-shell/SwiftShader variance remains recorded as environment evidence and does not replace or weaken the unchanged product thresholds.
