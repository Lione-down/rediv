# T6-003 Unit 6A-6B Card Work-Model Runtime Evidence

- Date: `2026-07-21`
- Reference authority: Human-supplied authenticated LibTV project recorded in `libtv-card-work-model-correction-2026-07-21.md`.
- Safety: Revid verification used deterministic mock APIs only. No LibTV mutation, real/paid provider request, secret access, quota spend, or backend/schema change occurred.

## Delivered contracts

- One pure `canvas-card-work-model` resolver owns text/image/video family modes, source disclosure, attached-surface eligibility, fail-closed readonly/locked behavior, empty-text choices, and source-card result projection.
- Selected image/video generation cards own a same-width work surface directly below the card with type modes, prompt, actual model/parameter summary, local upload, project assets, compatible canvas references, and card-local Send.
- Local image upload first uses the existing project asset API, then one atomic `insert-graph` history command creates the asset reference and media connection to the selected card. Project-asset selection uses the same command authority.
- Compatible canvas-reference candidates require a real `asset_id` and valid typed ports; selection uses the existing `connect-nodes` history authority and preserves the target selection.
- Materialized image/video results remain canonical lineage nodes but their latest compatible media is projected back into the originating generation card.
- Empty canonical text cards expose direct writing, text-to-video, image-to-prompt, and text-to-music. Direct writing is in-place; text-to-video opens a same-card prompt step then atomically creates a connected video generation; text-to-music opens the existing no-provider-call audio preflight. Image-to-prompt stays visibly disabled until its provider contract exists.
- Video card modes write `text-to-video`, `image-to-video`, or `keyframes` into the existing generation parameter contract before mock submission. First-frame requires one reference and keyframes requires two.

## Verification

- RED fingerprints: missing work-model module; missing card-source command; missing same-card projection; incomplete PNG upload rejected visibly; single empty text selection rejected by the existing two-source composition guard.
- Focused pure/browser GREEN: `12/12`.
- Related card, visual convergence, provenance, run/result, and selection-generation regression: `47/47`.
- Production build: PASS, `4,968` modules transformed.
- `git diff --check`: PASS.
- Screenshot: untracked `output/playwright/t6-003-card-work-model/selected-video-card-work-surface.png`.
- Screenshot SHA-256: `6FECF060BDFE38E31FB9A462060B6EDF97F7C9C2CBCB0B20F8687A7291DB5897`.

## Remaining before Unit 6C/6D closure

- Replace the bounded compatible-reference list with direct on-canvas candidate acquisition, including Escape/outside/Canvas-switch/delete lifecycle proofs.
- Implement image-to-prompt and card-local upscale through existing supported capabilities or keep them disabled with final Human-approved copy.
- Prove pending/failure/retry projection and eliminate or deliberately retain the duplicate desktop inspector entry.
- Run full functional/accessibility/reduced-motion/persistence/performance/hygiene gates and obtain fresh Human interaction acceptance.
