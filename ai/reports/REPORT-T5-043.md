# REPORT-T5-043 - Align Agnes image and video provider contracts

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `4c57ca77c72d2fab57d03d89bfb1de1d167c507e`

## Delivered

- Aligned Agnes Image 2.1 Flash image-to-image requests with the official `extra_body.image` location.
- Preserved `extra_body.response_format` and kept text-to-image requests free of any image field.
- Added offline provider-boundary tests that inspect the exact JSON serialized by `httpx`, without credentials, network calls, or paid generation.
- Accepted the official Agnes Video V2.0 top-level completed-result `url` and retained bounded top-level/nested `video_url` compatibility.
- Kept all video result shapes behind the existing HTTPS media URL validation boundary.

## Verification

- Official public Markdown contract retrieval: PASS, HTTP 200 for Image 2.1 Flash and Video V2.0 documentation.
- Provider-boundary image contract: PASS, 2/2.
- Initial image/video/Canvas transaction regression: PASS, 22/22 plus 3 subtests.
- Focused provider, image, video, validation, E2E, restart, concurrency, and Canvas transaction regression: PASS, 51/51 plus 3 subtests.
- Fresh diff, compile, UTF-8, sensitive-path, and worktree ownership review: PASS.

## Deferred boundaries

- No real Agnes request, paid smoke, credential access, frontend change, prompt/model tuning, quota change, or database migration was performed.
