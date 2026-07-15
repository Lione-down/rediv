# TASK-T5-071 Progress

- Task state: `VERIFYING`
- Active unit: the authorized three-request Agnes batch was executed safely, but provider 503 responses produced no images for Human fidelity review.

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

## Remaining work

- After Agnes image generation recovers, obtain renewed bounded-call authorization and rerun the three cases.
- Retain successful local outputs and collect the Human fidelity verdict against the checklist.

## Exact next action

Wait for Agnes image generation service recovery, then request renewed authorization for the same maximum-three-call batch. Do not retry automatically or exceed the consumed call limit.

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

## Blockers

- Provider execution blocker: three distinct v2 cases returned HTTP 503 from the Agnes image endpoint; zero outputs were created, so visual fidelity remains untestable. Release condition is provider recovery plus renewed bounded-call authorization.
