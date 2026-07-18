# Revid Current Project State

Last updated: 2026-07-19

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid/real-provider calls, real secrets, and destructive or irreversible operations.
- Delivery decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Product State

- Phase 4 initial version: `COMPLETE - PASS`
- Product V2 / Phase 5: active; Canvas-first acceptance.
- Database direction: MySQL-only.
- Completed V2 Tasks: T5-001 through T5-094 (`DONE - PASS`); historical evidence lives in each Task/REPORT and `ai/state/archive/`.

## Active Delivery

- Active implementation Task: none.
- State: `IDLE`.
- Last completed Task: `T5-094 - Agnes contract recovery, AI script authoring, and LibTV observable Canvas parity` (`ai/reports/REPORT-T5-094.md`), delivered to `origin/main`.
- Dependency baseline: T5-093 business delivery `b23b6cb9d4354cc37a78b13352e95774a81f2b07`; state closure and T5-094 activation HEAD `e932a3615273f3fde9c3173a51f39c8291acac34`.
- Task: `ai/tasks/todo/TASK-T5-094.md`
- Plan: `ai/tasks/doing/TASK-T5-094-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-094-PROGRESS.md`

## Current Verified Facts

- Units 0 and 1 are complete. Agnes text/image/video now consume one backend-owned typed contract with bounded redacted provider failures, stable error mapping, safe task metadata, and deterministic-failure duplicate guards.
- Unit 2 is complete offline. Image/video request, reference, malformed-success, provider failure, video polling, prior-result preservation, and no-successful-quota behavior have fixture/mock evidence. No real Agnes call was made.
- Unit 3 is complete offline. Agnes 2.0 Flash draft/refine authoring creates a new editable lineage-bearing script by default, makes replace explicit and undoable, rejects stale source revisions, and remains separate from Cinematic decomposition.
- Unit 3 final evidence: backend `64 passed, 52 subtests passed`; browser `10 passed`; production frontend build `4931 modules transformed`; `git diff --check` passed.
- Unit 4 inventory is complete: 94 clean-room rows (`23 MATCHED`, `43 BLOCKED`, `28 NOT_OBSERVABLE`), one Revid semantic color map, and 28 scenarios covering every ledger ID at 1440x900, 1366x768, 920x900, 375x812 and zoom 10/17/36/100/200.
- Unit 5A shell slice is complete: compact identity/action rail/zoom, four empty-Canvas starters, progressive minimap disclosure, and preserved review-only/accessibility behavior passed focused 2/2 and affected regression 32/32.
- Unit 5B safe catalog/metadata slice is complete: seven add categories, Project Resources-backed node upload, decoded resolution badges, and an honest formal-script/unavailable-audio boundary have focused browser evidence.
- Unit 5C continuation slice is complete: source-local text/image/video/audio/script catalog, disabled audio honesty, atomic insertion/undo, and 100/36/17 geometry passed focused 2/2.
- Unit 5D/5F starter slice is complete: story, character multi-view, and first-frame video scaffolds are atomic; audio-driven video is first-class but disabled with zero mutation. Starter/grid/shell passed 7/7.
- Unit 5E selected-media slice is complete: owned media exposes a toolbar above the node, exact eligible image-operation routes, fail-closed download/fullscreen, and honest disabled actions. Focused resolver/browser evidence passed 2/2 after a `4937 modules transformed` build.
- Unit 5H dense-overview slice is complete: 72 nodes/72 edges pass 36%/17% media geometry and idle edge opacity/stroke/marker constraints while existing 200-node/300-connection performance evidence remains authoritative.
- Unit 5 safely implementable parity is complete: ledger is now `61 MATCHED`, `5 BLOCKED`, `28 NOT_OBSERVABLE`; every remaining blocked row requires Human product/ADR authority rather than more unapproved implementation.
- Final Unit 5 slices add capability-owned generation summaries, selected result-family stack, empty-media recovery, rail revision access, honest collaboration/link controls, and an exact-text local main composer with zero provider calls and undo.
- Final contract and regression evidence is green: backend `76 passed, 57 subtests passed`; related Chromium `74/74`; post-hot-path visual/registry `24/24`; production build `4937 modules transformed`; manifest coverage is 94/94 with zero status mismatch; diff/UTF-8/sensitive-path audits passed.
- Performance root cause is closed: the default Playwright project uses the separate headless shell with forced SwiftShader, while the dedicated official `channel: 'chromium'` project uses full Chromium new-headless and AMD Radeon D3D11 hardware acceleration. The exact unchanged 200-node/300-connection gate passed 3/3 consecutively; the complete performance/accessibility file passed 3/3 with final 128.29 FPS, 25.1ms frame p95, 3.3ms pointer p95, and 10.30 minimap updates/s.
- Public LibTV study stayed read-only and unauthenticated. Direct `/canvas` returned to login acquisition; no prompt, generation, payment, account mutation, private source, or proprietary asset was used.
- Local frontend/backend on ports 5173/8000 returned HTTP 200 at activation. The unauthenticated local shell had no captured warning/error; authenticated Canvas runtime was not claimed by that smoke.
- User-owned `.codex/`, `.hermes/plans/`, and `output/` remain outside Task staging scope.

## Exact Next Action

Await the Human Owner's next bounded implementation Task. Additional Agnes 503 resilience should be planned separately if requested; no real-provider probe is authorized by T5-094 closure.

## Boundaries And Human Gates

- T5-094 has no active closure blocker. On 2026-07-19 the Human Owner accepted `A03`, `B17`, `E08`, `E09`, `E10`, and the 28 `NOT_OBSERVABLE` rows as documented deferrals and deferred real Agnes smoke.
- Offline/mock evidence does not prove current real-provider success. Any future real Agnes text/image/video smoke still requires explicit authorization for exact media classes and maximum call/cost boundary.
- LibTV login-only/dynamic/private behavior remains evidence-limited and is not represented as matched.
- Alembic changes to user/runtime data, paid calls, real secrets, destructive MySQL/filesystem work, and external-account changes remain gated.

## Worktree

- T5-094 began from tracked-clean `e932a3615273f3fde9c3173a51f39c8291acac34`; its scoped implementation, evidence, Task documents, and REPORT are delivered to `origin/main`.
- User-owned `.codex/`, `.hermes/plans/`, and `output/` remain untracked and outside delivery scope.
