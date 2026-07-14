# REPORT-T5-014 - LibTV-inspired Canvas visual parity

- Verdict: `DONE - PASS`
- Date: 2026-07-15
- Owner: Codex Project Lead Engineer

## Delivered

- Added typed semantic presentation for text, media, generation, result, and unsupported nodes.
- Added shared content, label, selection, and detached-composer world geometry.
- Made decoded image/video DOM media the only visible result surface while Leafer retains outline, title, ports, hit testing, pan, and zoom.
- Preserved intrinsic 16:9, 1:1, and 9:16 media ratios through bounded structured metadata and non-stretching native media layout.
- Moved editable content into a contextual composer below the selected node without changing the command/autosave contract.
- Moved media/result titles outside the media boundary and removed heavy success outlines, glow, and duplicate placeholder chrome.
- Made Canvas edges passive to ordinary pointer/focus selection while retaining explicit port connection creation and accessible Graph Access inspection/deletion.
- Added dedicated Canvas tokens for restrained node outlines, ports, edges, composer surfaces, and media radius.

## Verification

- Focused visual/workflow/resource Chromium: PASS, 22/22.
- Final visual-parity Chromium: PASS, 6/6.
- Full Chromium regression: PASS, 147/147.
- Frontend build: PASS, 4,779 modules transformed.
- Guarded live MySQL/browser supervisor: PASS, run `t5008-36300-c050eb7b7049e7ce`.
- Retained live summary: `output/playwright/t5-008-live/t5008-36300-c050eb7b7049e7ce/summary.json`.
- Live graph: 200 nodes, 300 connections, revision 3, restart checksum retained.
- Live performance: 172 ms stable render, 59.97 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 0 long tasks.
- Final visual evidence: `output/playwright/t5-014-final/` at 1440x900, 1366x768, 920x900, and 375x812 plus selected composer and media/edge captures.
- Ratio evidence: deterministic 16:9, 1:1, and 9:16 SVG fixtures with native decoded dimensions, `object-fit: contain`, and exactly one visible image surface.
- Geometry evidence: DOM media surface scales within 1 px at 10%, 100%, and 200% Canvas zoom.
- Hygiene: strict UTF-8 pass, no changed file over 500 lines, `git diff --check` pass, and no changed sensitive path.

## Evidence classification

- Visual parity fixtures and full Chromium are route-mocked browser evidence.
- The guarded supervisor is disposable real-MySQL plus production FastAPI/Vite browser evidence.
- Provider behavior remains mock-only; no paid provider call or real provider credential was used.
- No user/runtime database, migration, schema contract, provider contract, or local `.db` artifact was modified.

## Acceptance audit

- Semantic node geometry: PASS.
- Correct media aspect ratio and recognizable content: PASS.
- Exactly one visible result media surface: PASS.
- Contextual composer and toolbar without media overlap: PASS.
- Passive Canvas edges with accessible Graph Access management: PASS.
- Restrained selected/generating/success/failure/unavailable hierarchy: PASS.
- Focused, full Chromium, build, guarded live, and 200/300 performance: PASS.
- Desktop viewport matrix and mobile review-only visual inspection: PASS.
- Durable documentation and evidence agreement: PASS.

## Notes

The guarded supervisor initially failed because it was launched with the system Python runtime, which lacked backend dependency `bcrypt`. Running the unchanged supervisor with `backend/.venv/Scripts/python.exe` restored the approved runtime boundary and passed. Temporary seed diagnostics were fully reverted and are absent from the final diff.
