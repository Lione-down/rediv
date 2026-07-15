# TASK-T5-043 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- The official Agnes Image 2.1 Flash contract requires image-to-image references at `extra_body.image` and the output selector at `extra_body.response_format`.
- The current provider sends image-to-image references at the request top level, while text-to-image already avoids an image field.
- The official Agnes Video V2.0 completed response documents a top-level `url`; current result parsing only accepts `video_url` shapes.
- Existing API tests stop at mocked provider methods and therefore cannot detect an incorrect outbound Agnes JSON shape.

## Direction

- Keep the public provider method and API orchestration contracts stable.
- Build one `extra_body` object for image generation, add `image` only for image-to-image, and retain the selected `response_format`.
- Parse the documented top-level video `url` first, then retain bounded `video_url` compatibility for existing integrations.
- Use `httpx.MockTransport` provider-boundary tests so no network, credentials, or paid calls occur.

## Units

1. Add exact outbound image JSON tests for text-to-image and image-to-image.
2. Correct the image provider payload without changing API-facing generation behavior.
3. Add documented top-level video `url` polling coverage and retain `video_url` compatibility.
4. Run focused provider, image, video, and transaction regressions.
5. Review diff and hygiene, synchronize state/report, commit, and push.

## Risks

- Moving `image` must not introduce an empty image field into text-to-image requests.
- Compatibility parsing must still validate HTTPS media URLs and must not accept arbitrary nested shapes.
- Tests must inspect the actual serialized request body rather than duplicating implementation helpers.
