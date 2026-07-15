# TASK-T5-043 - Align Agnes image and video provider contracts

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-042 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Align Revid's Agnes image-to-image request and video result parsing with the current official Agnes Image 2.1 Flash and Agnes Video V2.0 contracts.

## Scope

- Send image-to-image reference URLs through `extra_body.image` while preserving `extra_body.response_format`.
- Keep text-to-image requests free of an image field.
- Accept the documented top-level video result `url` while retaining safe compatibility with existing `video_url` response shapes.
- Add provider-boundary tests that assert the exact outbound JSON payload rather than stopping at a mocked provider method.
- Add video polling/result tests for the documented `url` response field.

## Non-goals

- Real Agnes calls, paid provider smoke, credential access, frontend changes, prompt tuning, model changes, quota changes, or database migrations.

## Acceptance criteria

- Image-to-image requests send references only as `extra_body.image` and receive URL output through `extra_body.response_format: "url"`.
- Text-to-image requests retain the documented `model`, `prompt`, `size`, and output-format contract.
- Completed video polling responses with top-level `url` are accepted and persisted.
- Existing supported `video_url` compatibility remains covered unless evidence shows it is unsafe.
- Focused provider, image-generation, video-generation, and generation-transaction tests pass.
- Diff review confirms no secret, paid-call, frontend, schema, or unrelated changes.

## Source evidence

- `https://agnes-ai.com/zh-Hans/docs/agnes-image-21-flash.md`
- `https://agnes-ai.com/zh-Hans/docs/agnes-video-v20.md`
