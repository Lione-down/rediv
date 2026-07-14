# TASK-T5-017 Progress

- Task state: `DONE - PASS`
- Active unit: complete
- Updated: 2026-07-15

## Completed work

- Read AGENTS, CURRENT, ROADMAP, direct-delivery ADR, ADR-002, ADR-004, ADR-005, design skill, and Playwright skill.
- Ran required git preflight at `674cec4fdd7d918eb35df327addcf5f44a3a1277`; only the user-owned retired-Hermes plan and unstaged QA output are present.
- Audited the T5-016 converging fixture against the real generation path.
- Confirmed the current frontend sends only the local editor prompt and omits connected script/media inputs even though the graph renders typed connections.
- Confirmed image generation already has strict bounded `image_ids` ownership validation, while video provider capability exists but is not exposed through the request schema/API.
- Created the formal T5-017 Task, PLAN, and PROGRESS documents.
- Added a pure typed-port generation-context resolver with deterministic connection ordering, local-prompt priority, a hard 4,000-character boundary, eight-image deduplication, and explicit unusable-reference states.
- Made the generation inspector show connected scripts, usable image references, excluded references, used-input count, and final prompt length without exposing raw URLs.
- Made image and video requests send the resolved prompt and connected `image_ids`; connection deletion updates the next request without reload.
- Extended strict video requests with bounded image IDs and reused transactional project ownership validation.
- Mapped one validated image to provider `img2vid` and multiple ordered images to `keyframes`; zero-image calls retain the original provider signature.
- Captured and manually reviewed connected-context screenshots at 1440x900 and 920x900.
- Closed focused frontend/backend, full Chromium, build, UTF-8, file-size, diff, and sensitive-path gates.
- Wrote `ai/reports/REPORT-T5-017.md` and synchronized durable state.

## Remaining work

- None for T5-017.
- Repository-wide upload process tests remain affected by the pre-existing Windows Python 3.13 / AnyIO worker import failure described below; this does not affect the generation code changed here.

## Exact next action

Preserve the connected-context contract and use a future Task for drag-edge continuation or richer sequence controls.

## Files changed

- `ai/tasks/todo/TASK-T5-017.md`
- `ai/tasks/doing/TASK-T5-017-PLAN.md`
- `ai/tasks/doing/TASK-T5-017-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T5-017.md`
- `backend/api/video_generate.py`
- `backend/controllers/generation_transactions.py`
- `backend/schemas/generation.py`
- `backend/tests/test_video_generate.py`
- `frontend/src/components/canvas/CanvasContextPanel.vue`
- `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- `frontend/src/modules/canvas/generation-context.ts`
- `frontend/src/modules/canvas/generation-service.ts`
- `frontend/src/views/app/CanvasWorkspace.vue`
- `frontend/tests/e2e/canvas-generation-context.spec.ts`
- `frontend/tests/e2e/canvas-multi-scenario-fixture.ts`
- `frontend/tests/e2e/canvas-multi-scenario-visual.spec.ts`
- `frontend/tests/e2e/canvas-resource-generation-fixture.ts`

## Commands run and summarized results

- Required source-of-truth reads and git preflight: complete.
- Pure resolver and multi-scenario browser: PASS, 8/8; final scenario-only rerun PASS, 5/5.
- Focused generation/resource frontend regression: PASS, 24/24.
- Focused guarded MySQL generation/security regression: PASS, 21/21 plus video API 8/8.
- Full Chromium: PASS, 155 tests in 31 files; `.last-run.json` reports `passed` with no failed tests.
- Frontend build: PASS, 4,779 modules transformed.
- Screenshots: `output/playwright/t5-017-connected-context/` at 1440x900, 1366x768, 920x900, and 375x812 overview/detail states.
- Full backend attempt: verifier environment failure outside the T5-017 diff. Existing upload tests fail when AnyIO `to_process` workers initialize under Windows Python 3.13 with `ImportError: attempted relative import with no known parent package`; the same failure reproduces in one package-qualified upload-only test. Release condition is repairing the upload worker import/runtime harness, then rerunning full backend. Generation-focused guarded MySQL suites pass independently.
- Hygiene: strict UTF-8, changed source files <=500 lines, `git diff --check`, and sensitive-path review passed.

## Blockers and release conditions

- No T5-017 blocker.
- Paid calls, real secrets, destructive operations, and migrations remain outside scope.
