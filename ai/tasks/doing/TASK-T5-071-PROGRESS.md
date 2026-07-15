# TASK-T5-071 Progress

- Task state: `VERIFYING`
- Active unit: a cross-day maximum-three-request Agnes retry window was executed serially after the longer recovery wait, but every request still returned 503 and produced no image for Human fidelity review.

## Completed work

- Confirmed T5-070 is committed and pushed at `b5811c697c62f61dc6b98e3ba7cba6a300f24275` and CURRENT was released to IDLE.
- Confirmed remaining `.hermes` plan and `output/` are user-owned and remain outside Task staging.
- Read the final T5-070 report and retained its image-only authoring compatibility boundary.
- Classified the motivating output honestly: provider/layout success, medium and identity fidelity failure, wardrobe and palette partial.
- Activated T5-071 as the single implementation Task and recorded the no-extra-vision and no-paid-call boundaries.
- Re-read the Human-updated Task and incorporated the dense vertical recipe-flow toolbar collision as a mandatory regression.
- Fixed the placement contract: other-node visible bounds are hard occupancy; selected-node auxiliary overlap and contextual distance are secondary; panel-safe fallback is required when local slots collide.
- Split contextual toolbar scoring into hard other-node occupancy and soft selected-node content/composer/keyframe occupancy, with deterministic proximity only after overlap priorities.
- Added exact backend `(recipe_id, recipe_version)` resolution. Missing version remains pinned to v1; unknown pairs and version-without-ID reject during request validation before task, quota, or provider work.
- Preserved the exact T5-065 v1 prompts and added fidelity-first v2 character and scene prompts at `1024x768` with one reference.
- Made new frontend branches persist and submit v2 while reload and retry resolve the exact persisted v1 or v2 definition.
- Kept internal prompts backend-only and ordinary prompt/image/video generation behavior unchanged.
- Updated and validated the project-local visual-assets skill with the manual medium, identity, hair, proportion, wardrobe, palette/material, and cross-panel checklist.
- Rebuilt the frontend before browser verification and retained desktop, compact, readonly, failure, retry, and toolbar-isolation evidence.
- Audited the toolbar acceptance literally: desktop measures actual toolbar and both result bounds at zero intersection; 920px compact preserves drawer ownership with zero toolbar instances and two visible result surfaces.
- Separated document and viewport persistence evidence. The drawer-safe compact fixture emits neither document PATCH nor viewport PATCH on selection, while the desktop fixture also remains mutation-free.
- Waited for the compact drawer's final 360px geometry before screenshot and assertions, avoiding transition-frame false evidence.
- Received explicit Human authorization for a bounded paid Agnes visual batch and confirmed the process credential by name only without reading or printing its value.
- Added a dry-run-safe, maximum-three-call visual recipe smoke helper with per-case selection, v2 backend prompt resolution, one reference URL, redacted request identity, bounded image download, and local metadata.
- Replaced inaccessible Wikimedia media redirects after preflight; the final OpenCV and Pillow raw fixtures returned HTTP 200 and valid image content before provider calls.
- Executed exactly three authorized Agnes image requests: photographic character, illustrated character, and photographic scene. All three returned provider HTTP 503 before any result URL or image existed.
- Rechecked public service information on 2026-07-15 without calling the generation endpoint. No official image-generation status page or recovery notice was available; DNS/HTTPS reachability alone does not release the provider gate.
- Received renewed Human authorization for at most ten retries and executed exactly ten serial photographic-character requests with 30, 45, then 55-second bounded backoff intervals.
- Stopped at the authorized limit. All ten requests reached the same image endpoint and returned HTTP 503; no result URL, image file, Human verdict, or extra unapproved call exists.
- After the cross-day recovery window, received authorization for at most three more retries and executed exactly three serial photographic-character requests with immediate, 45-second, and 55-second timing.
- All three cross-day requests returned the same HTTP 503. No image or result URL was created and no fourth request was made.

## Remaining work

- After a materially longer Agnes recovery window, obtain a new bounded-call authorization and first prove one successful photographic-character request before spending calls on illustration and scene cases.
- Retain successful local outputs and collect the Human fidelity verdict against the checklist.

## Exact next action

Wait for a materially longer Agnes image-service recovery window. Then request new bounded-call authorization, try the photographic-character case first, and expand to illustration and scene only after the endpoint produces one image. Do not retry automatically.

## Files changed

- `ai/tasks/todo/TASK-T5-071.md`
- `ai/tasks/doing/TASK-T5-071-PLAN.md`
- `ai/tasks/doing/TASK-T5-071-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- Versioned backend recipe registry, request schema/API, and focused backend tests.
- Frontend recipe metadata/service/retry transport and focused browser tests.
- Contextual toolbar placement scoring and dense vertical recipe regression.
- `.agents/skills/revid-visual-assets/SKILL.md`

## Commands and evidence

- Required project/skill preflight completed without reading `.env`.
- Git preflight: HEAD `b5811c697c62f61dc6b98e3ba7cba6a300f24275`; only the user-owned `.hermes` plan, T5-071 Task draft, and `output/` were untracked before activation.
- Design skill update check was non-blocking and unavailable at its expected Windows path; execution continued per the skill contract.
- Backend focused recipe gate: PASS, 9 tests plus 6 subtests.
- Backend required generation/transaction regression: PASS, 37 tests plus 9 subtests.
- Frontend recipe/service focused gate: PASS, 16/16 after rebuilding stale preview output.
- Frontend recipe/context/result-branch regression: PASS, 29/29.
- T5-063 and interaction regression: PASS, 27/27.
- Frontend production build: PASS, 4,820 modules transformed.
- Project skill validation: PASS.
- `git diff --check`: PASS; scoped file-size audit records one pre-existing 500-line exception, `use-canvas-resource-experience.ts` at 532 lines.
- Visual evidence: `output/playwright/t5-065-visual-asset-recipes/recipe-flow-toolbar-isolation-1440x900.png` plus refreshed recipe desktop/compact/readonly/failure screenshots.
- Completion-audit browser gate: PASS, 25/25 across recipe, video/keyframe, compact drawer, readonly, keyboard, and command interactions.
- Exact compact evidence: `output/playwright/t5-065-visual-asset-recipes/recipe-flow-toolbar-isolation-920x900.png`; stable 360px drawer, zero selection toolbar, two result surfaces, zero document PATCH, zero viewport PATCH.
- Authorized real-service attempts: `output/agnes/t5-071-20260715T152913Z`, `...T153008Z`, and `...T153021Z`; each metadata file records HTTP 503, zero successful cases, and no credential value.
- No-call recovery check: public search found no Agnes-owned image endpoint status signal; no quota-consuming request was made and the consumed three-call authorization was not extended.
- Renewed retry evidence: ten directories from `output/agnes/t5-071-20260715T155008Z` through `...T155937Z`; every metadata file records `HTTPStatusError`, HTTP 503, zero cases, and no credential value.
- Cross-day retry evidence: `output/agnes/t5-071-20260715T160118Z`, `...T160209Z`, and `...T160311Z`; each metadata file records `HTTPStatusError`, HTTP 503, zero cases, and no credential value. Run IDs use UTC.

## Blockers

- Provider execution blocker: the original three distinct v2 cases, ten same-day backoff retries, and three cross-day retries all returned HTTP 503 from the Agnes image endpoint; zero outputs were created, so visual fidelity remains untestable. Release condition is provider recovery plus a new bounded-call authorization.
