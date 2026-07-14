# TASK-T5-017 - Make connected nodes real generation context

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-016 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Turn typed upstream Canvas connections into the actual prompt and image-reference inputs used by image and video generation, with visible context provenance and deterministic browser/backend evidence.

## Scope

- Resolve active incoming `prompt` and `media` port connections in graph order.
- Compose connected script content with the generation node's local prompt under the existing 4,000-character UI boundary.
- Resolve connected image asset/result nodes to owned asset IDs, deduplicate them, and enforce the backend eight-image limit.
- Show connected context, included inputs, and unusable media references in the generation inspector.
- Send image IDs through the frontend generation service for both image and video generation.
- Validate image ownership server-side and route one/multiple references into provider image-to-image, image-to-video, and keyframe inputs.
- Keep paid provider calls, migrations, secrets, and destructive operations out of verification.

## Acceptance criteria

- Two connected scripts plus a local generation prompt produce one deterministic, bounded request prompt with visible provenance.
- Connected image/result nodes contribute deduplicated `image_ids`; disconnected, inactive, wrong-port, non-image, foreign, missing, and more-than-eight references cannot silently enter provider input.
- Image generation forwards all validated reference URLs; video generation forwards one image as `img2vid` and multiple images as ordered `keyframes`.
- The generation inspector distinguishes local prompt, connected text, usable image references, and unusable references without exposing raw URLs.
- Connection changes update the inspector and the next generation request without page reload.
- Existing quota, task lifecycle, result reconciliation, autosave, review-only, and no-charge-on-failure contracts remain intact.
- Focused frontend/backend tests, full Chromium, relevant backend regression, build, viewport screenshots, UTF-8, file-size, diff, and secret-hygiene gates pass.

## Active unit

Complete. See `ai/reports/REPORT-T5-017.md`.
