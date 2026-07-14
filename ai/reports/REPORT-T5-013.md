# REPORT-T5-013 - Canvas node workflow restoration

- Result: `DONE - PASS`
- Date: 2026-07-15
- Task: `T5-013 - Repair Canvas node editing, generation lifecycle, and connections`

## Delivered

- Added a synchronized DOM surface over the persistent Leafer world for canonical node-local text editing and native image/video rendering.
- Kept `canEditContent` registry capabilities authoritative, preserved IME and editable-focus shortcut ownership, and committed drafts through the existing serialized Canvas autosave boundary.
- Removed the shared 15-second timeout from generation POSTs, preserved ambiguous transport outcomes as reconciling, and added bounded cancellable polling for durable queued/running tasks.
- Preserved backend task/quota authority and exactly-once result materialization across refresh, Canvas switches, and reconciliation.
- Added explicit media loading, unavailable, decoded image, playable video, and native controls behavior.
- Added edge direction markers and registry-typed compatible/incompatible drag target feedback without replacing Leafer.

## Verification

- Focused workflow/generation/resource coverage: PASS; final node workflow 7/7 and combined focused suites passed.
- Full Chromium regression: PASS; 140/140.
- Backend image/video/generation transaction regression: PASS; 20 tests plus 3 subtests.
- Frontend production build: PASS; 4,775 modules transformed.
- Owned guarded live MySQL/browser lifecycle: PASS; disposable schema and owned processes/ports cleaned.
- Live 200/300 profile: 157 ms stable render, 59.97 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, 0 long tasks.
- Live retained evidence: `output/playwright/t5-008-live/t5008-28292-31e01b853453aa39/summary.json`.
- Media evidence: `output/playwright/t5-013/visible-image-result.png` and `output/playwright/t5-013/broken-media-state.png`; video metadata verified at 160x90 with native controls.
- Hygiene: `git diff --check`, strict UTF-8 for all changed files, <=500-line gate, and sensitive-path review passed.

## Acceptance reconciliation

- Editable canonical script/prompt/note/generation content persists after reload: PASS.
- Slow or disconnected generation is not falsely failed by the shared client timeout: PASS.
- Durable queued/running/succeeded/failed/timed-out states and bounded reconciliation remain distinguishable: PASS.
- Successful image/video results materialize exactly once and render native media or a concrete unavailable state: PASS.
- Connections expose direction, typed compatibility feedback, selection, keyboard deletion, and reduced-motion-safe visuals: PASS.
- No database migration, paid provider call, real secret access, destructive operation, or Canvas engine replacement occurred.
