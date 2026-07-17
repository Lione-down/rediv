# REPORT-T5-089 - Audio generation and audio-driven video capability contracts

- Status: `DONE - PASS`
- Date: 2026-07-18
- Dependency: T5-088 at `da927e3dd3cd0d59fa5581483c758bd580ea118a`

## Delivered boundary

- Backend generation capability v4 adds one exact audio v1 section: production is `unavailable`, has no model, no supported/provider modes, no audio quota, and no durable task, cancel, or resume authority.
- Frontend capability parsing remains backward-aware for v1-v3 and requires strict audio v1 at v4. Pure preflight accepts exactly one bounded canonical script for text-to-audio or exactly one project-owned active audio asset plus one project-owned active video asset for audio-driven-video.
- Source validation rejects stale, duplicate, locked, malformed, foreign, wrong-project, wrong-user, wrong-type, and URL-drift inputs before capability consideration. Production returns `capability_unavailable` before Canvas/history/autosave, quota, task, asset, or provider mutation.
- Synthetic `mock-only` capability parsing proves the contract without producing media, task, quota mutation, asset, provider request, or Canvas mutation.
- The existing desktop Slash Palette adds one narrowly eligible audio preflight action. Its graphite/violet panel owns focus/Escape, states the blocked production boundary, has scoped Axe evidence, and is inaccessible at 375px review-only. It is asynchronously loaded; `CanvasStage.vue` is unchanged.

## Acceptance evidence

| Requirement | Evidence |
|---|---|
| Versioned, scoped, fail-closed contracts | Backend contract/parser tests included in 22/22 focused backend; frontend pure preflight covers capability, scope, duplicate, type, ownership, and URL drift. |
| Truthful source/result/task/quota/provider semantics | Production exposes no executable audio authority; mock-only remains non-durable and non-mutating. No endpoint, schema, asset, worker, adapter, migration, or paid call was added. |
| Canvas, Palette, accessibility, responsive preservation | Focused Chromium 21/21; adjacent Canvas/video/workflow regression 71/71; repaired Storyboard palette suite 15/15; screenshot and scoped Axe evidence at `output/playwright/t5-089-audio-generation-preflight/`. |
| Full functional regression | Chromium passed 466/466 in 8.6 minutes after updating the one stale Storyboard option-count expectation made obsolete by the legitimate new eligible action. |
| Build and hygiene | `npm run build` passed with 4,914 transformed modules. `git diff --check`, UTF-8/no-BOM, task-scoped token-like signature scan, and closed 8765/9765/9099 port checks passed. |
| 200-node/300-connection classification | Separate unchanged performance title ran on SwiftShader/no hardware acceleration and measured 52.001311281480724 FPS / 33.399999999999636ms p95 against unchanged 55/33 limits. Stable render 404ms, pointer p95 12ms, longest task 75ms, minimap 9.542352623663207/s, and the two companion functional performance/accessibility titles remained in bounds. This is an environment-sensitive exception, not a threshold change or product performance pass. |

## Verification record

- Focused backend: `backend/.venv/Scripts/python.exe -m unittest tests.test_audio_generation_contract tests.test_generation_parameter_contract tests.test_generation_provider_validation` — PASS, 22 tests.
- Focused frontend: `npx playwright test tests/e2e/canvas-audio-generation-preflight.spec.ts tests/e2e/canvas-audio-generation-preflight-ui.spec.ts tests/e2e/canvas-generation-parameters.spec.ts tests/e2e/canvas-professional-action-registry.spec.ts --project=chromium --reporter=dot` — PASS, 21/21.
- Adjacent frontend: T5-089/generation/Palette/history/resource/video/workflow suites — PASS, 71/71.
- Project asset services: `tests.test_project_asset_services` — PASS, 9 tests.
- Affected Storyboard regression after expected Palette count update — PASS, 15/15.
- Final functional Chromium excluding only the separately classified pressure title — PASS, 466/466.
- Final production build — PASS, 4,914 transformed modules.

## Deferred and classified boundaries

- Real audio/audio-driven-video provider execution, paid calls, external accounts, secrets, worker/storage deployment, real user-media processing, destructive media operations, and irreversible schema changes remain Human Owner gates. None was attempted.
- The broader existing upload-security suite remains environment-limited by its AnyIO process-worker bootstrap `ImportError: attempted relative import with no known parent package` (28 errors). Focused T5-089 backend contracts and isolated project-asset service tests pass; no production workaround was applied.
- The retained SwiftShader-only 200/300 result is classified above without changing thresholds or touching Canvas hot paths.

## Change scope

- New backend audio capability contract and focused tests.
- Backward-aware frontend capability parsing, pure preflight, extracted overlay/panel/composable, Palette registration, and scoped tests.
- One updated pre-existing Storyboard Palette option-count expectation, because the new eligible audio action is intentionally visible for a valid script selection.
- Task state, plan, progress, current state, roadmap, and this report.
