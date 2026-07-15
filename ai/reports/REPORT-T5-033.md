# REPORT-T5-033 - Multi-result remix composition

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `a9e15e923ae9395346cd15a9409acc77e6ef4e3e`

## Delivered

- Multi-selection intent now distinguishes ordinary image assets from generated image results while retaining canonical prompt/image totals and video mode.
- The existing compose menu identifies historical-result image fusion and ordered-keyframe video generation without adding a parallel UI surface.
- Selection-created generation nodes use complete graph bounds and one shared placement helper also used by result materialization and single-result branching.
- Placement scans until it is past the highest occupied bottom, so one extreme-height node cannot exhaust a node-count-based slot limit.
- Two image results plus text create one atomic generation fragment with prompt T1 and result media R1/R2.
- The full node-plus-three-edge insertion is removed and restored through one exact undo/redo boundary before execution.

## Verification

- Frontend build after final hardening: PASS, 4,802 modules transformed.
- Multi-result image/video/compact focused scenarios: PASS, 3/3 Chromium.
- Related generation, preflight, order, lineage, branch, placement, and command regression: PASS, 42/42 Chromium.
- Full frontend regression before the final tall-boundary-only helper hardening: PASS, 224/224 Chromium in 3.9 minutes.
- Post-hardening placement, remix, and selection regression: PASS, 12/12 Chromium.
- Exact browser payloads: both image and video requests contain the canonical composed prompt and only `asset-result-a`, `asset-result-b` in R1/R2 order.
- Output lifecycle: canonical video task/result, playable MP4, persistent generation/result nodes, and reload identity, PASS.
- Invalid/readonly: video and missing-asset results are rejected; 375px review exposes no mutation.
- Visual review: desktop remix menu and video workflow accepted; 920px menu remains within viewport bounds.
- Hygiene: `git diff --check`, UTF-8, file-size, staged-path, and sensitive-path gates passed.

## Retained evidence

- `output/playwright/t5-033-multi-result-remix/multi-result-remix-menu-1440x900.png`
- `output/playwright/t5-033-multi-result-remix/multi-result-video-1440x900.png`

The evidence directory is local test output and is intentionally excluded from the commit.

## Deferred boundaries

- No automatic provider execution or video-as-reference support.
- No backend, cross-Canvas remix, or mobile-editing changes.
- No paid provider call or secret access.
