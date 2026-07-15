# TASK-T5-043 Progress

- Task state: `DONE - PASS`
- Active unit: complete
- Updated: 2026-07-15

## Completed work

- Read required project state, roadmap, active Task, and current Agnes provider/image/video generation boundaries.
- Verified pushed T5-042 baseline `4c57ca77c72d2fab57d03d89bfb1de1d167c507e`; preserved user-owned `.hermes` and local `output` paths.
- Retrieved both public official Agnes Markdown documents without credentials or provider calls.
- Confirmed the exact contract gaps: image-to-image references belong in `extra_body.image`, and completed video polling documents top-level `url`.
- Locked objective, scope, non-goals, acceptance criteria, implementation direction, and verification plan.
- Added offline `httpx.MockTransport` tests that assert the exact serialized text-to-image and image-to-image JSON bodies.
- Moved image references into `extra_body.image` while preserving `extra_body.response_format` and keeping text-to-image free of image fields.
- Accepted the documented top-level video `url` before bounded legacy `video_url` shapes, retaining the existing HTTPS media validation boundary.
- Verified provider, image, video, validation, E2E, restart, concurrency, and Canvas generation transaction paths.

## Remaining work

- None for T5-043.

## Exact next action

Continue the broader Canvas/node and multi-scene generation goal with the next bounded Task.

## Files changed

- `ai/tasks/todo/TASK-T5-043.md`
- `ai/tasks/doing/TASK-T5-043-PLAN.md`
- `ai/tasks/doing/TASK-T5-043-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `backend/core/agnes_provider.py`
- `backend/api/video_generate.py`
- `backend/tests/test_agnes_provider.py`
- `backend/tests/test_video_generate.py`
- `ai/reports/REPORT-T5-043.md`
- `pitfalls.md`

## Commands run and summarized results

- Required repository preflight: PASS; pushed baseline and untracked ownership confirmed.
- Official Agnes public Markdown retrieval: PASS (HTTP 200 for image and video documents); no API request or credential used.
- Provider/API/test audit: PASS; exact payload and result parsing gaps identified.
- Provider-boundary tests: PASS, 2/2.
- Initial image/video/Canvas transaction regression: PASS, 22/22 plus 3 subtests.
- Full focused provider/generation regression: PASS, 51/51 plus 3 subtests.

## Blockers and release conditions

- No T5-043 blocker.
- Real Agnes calls, paid smoke, secrets, frontend work, schema changes, and unrelated refactors remain outside scope.
