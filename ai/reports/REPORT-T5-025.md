# REPORT-T5-025 - Multi-input generation request preflight

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-024 `DONE - PASS`

## Delivered

- Added a collapsible generation request preflight backed directly by `ResolvedGenerationContext`.
- Shows the exact bounded final prompt that is sent to the provider.
- Shows image references in stable R order and distinguishes multi-image video keyframes from one-image img2vid reference.
- Keeps excluded media separate with the existing missing, unsupported, duplicate, and limit reason.
- Supports desktop, compact drawer, and readonly 375px review without mutation.

## Verification

- `npm run build`: PASS, 4,797 modules transformed.
- Focused preflight browser scenarios: PASS, 3/3.
- Related generation context/provenance/multi-scenario regression: PASS, 14/14.
- Full Chromium: PASS, 191/191.
- Preview-to-provider assertion: exact final prompt matches `/api/image-generate` request body.
- No-mutation assertions: opening and reviewing produces no document PATCH or generation request.
- Visual review: PASS at 1440x900 and readonly 375x812.
- Diff, file-size, UTF-8, scoped-worktree, and sensitive-path gates: PASS.

## Evidence

- `output/playwright/t5-025-generation-preflight/image-four-input-preflight-1440x900.png`
- `output/playwright/t5-025-generation-preflight/readonly-preflight-375x812.png`

## Deferred by design

- Prompt rewriting, token estimation, drag reordering, provider calls outside the existing action, backend changes, and Canvas engine changes.
