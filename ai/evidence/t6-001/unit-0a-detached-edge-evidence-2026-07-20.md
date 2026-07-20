# T6-001 Unit 0A Detached Edge Evidence

- Date: `2026-07-20`
- Baseline: activation commit `eb13f7d14dd22339e80b3dbebcc712b66f24cbe7`
- Scope: active draft connection geometry only; persisted-edge and T5-096 dynamic-port contracts remain regression coverage.

## Root cause

Persisted connection paths are expressed in world-space and transformed once by `CanvasConnectionLayer`. The active draft path instead combined surface-space port/pointer coordinates and was rendered inside the same transformed SVG group, applying viewport translation/zoom twice. A non-identity viewport therefore detached the curve from its source node and pointer, matching the Human screenshot.

## RED

Focused Chromium at viewport `{ x: 140, y: 90, zoom: 0.5 }` expected the rendered draft start at screen x `590` but measured x `435`, a `155 CSS px` horizontal drift. The fixture loaded correctly and the failure occurred at the endpoint equality assertion.

## GREEN

- Draft interaction state remains surface-space for pointer hit testing.
- Path construction converts the current pointer back to world-space and resolves the origin from the shared world-space port anchor before `buildConnectionPath`.
- The browser test reads the actual SVG path endpoints through `getScreenCTM()` and proves source-port/pointer equality at 17%, 36%, 100%, and 200% with non-zero viewport translation.
- The test ends with zero document PATCHes.

## Verification

- Focused four-zoom browser regression: `1/1` passed.
- Related connection/port/target/motion/node/selection matrix: `34/34` passed.
- Production build: `4937 modules transformed`.
- Revid-owned visual QA capture: untracked `output/playwright/t6-001-unit-0a/draft-edge-36-percent.png`, decoded `1440x900`, SHA-256 `fa73961b1991b580c1182ea79ab59bb03f9d2ead1571bcb0561d179678b6d450`.
- Visual result: at 36%, the draft begins on the script node's visible right output port and terminates at the pointer; no detached lower-right curve remains.

## Boundaries

- No paid/real provider, secret, `.env`, external account, migration, database mutation, or destructive operation was used.
- The raw PNG remains untracked under `output/` and is excluded from staging.
- This evidence proves Canvas draft geometry and related regression safety, not real-provider cinematic output quality.
