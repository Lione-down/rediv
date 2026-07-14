# Revid Current Project State

Last updated: 2026-07-15

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Delivery decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Product State

- Phase 4 initial version: `COMPLETE - PASS`
- Product V2 / Phase 5: active
- V2 priority: Canvas first acceptance
- Database direction: MySQL-only
- Completed V2 Tasks: T5-001 through T5-018 (`DONE - PASS`)

## Active Delivery

- Active implementation Task: none
- State: `IDLE`
- Most recently completed: `T5-018 - Continue connections into new typed nodes` (`DONE - PASS`)
- Final report: `ai/reports/REPORT-T5-018.md`

## Current Verified Facts

- T5-004 through T5-007 now provide the complete pre-certification Canvas product: full-screen multi-Canvas routing, persistent Leafer world, deterministic command model, autosave/recovery/revisions, canonical node registry, project-shared resources, versioned templates, durable generation tasks/results, and backend-authoritative quota snapshots.
- T5-007 Unit E adds responsive project resource and contextual generation controls, registry-backed asset/template insertion, durable success/failure result presentation, desktop/narrow keyboard behavior, and a strict 375px browse/review-only boundary.
- Local upload handling now uses bounded JSON/multipart bodies, provisional cross-process reservation slots, per-user/global active and scan limits, same-volume staging, idle/total deadlines, cancellation-safe disk lifecycle, real decodable media fixtures, and bounded CPU/memory validation.
- T5-007 final evidence passed 384 backend tests plus 56 subtests, 134 upload/security tests plus 48 subtests, 117 Chromium tests, a 4,761-module build, four accepted viewport inspections, and independent frontend/security review at 0 HIGH / 0 MEDIUM / 0 LOW.
- Repository Alembic head is `c9d0e1f2a3b4`; no user/runtime migration occurred.
- Browser offline and prior 200-node/300-connection performance evidence remains classified as mock-browser evidence; T5-008 additionally records the final local-MySQL live run.
- T5-008 classified all 97 acceptance checkboxes and closed its live harness, persistence, performance, visual, accessibility, and security evidence gates.
- Unit A pure gates now include missing/unreachable/missing-Alembic/wrong-dialect/revision-mismatch runtime checks; the owned harness also requires an exact run-scoped backend health identity and preview build marker.
- Unit A is complete: independent harness review is 0 HIGH / 0 MEDIUM, and the latest owned live run passed 4 pre/post tests with 200 nodes/300 connections, exact restart checksum, 30-second metrics (195 ms stable render, 59.88 FPS, 16.7 ms frame p95, 0 long tasks), four viewport screenshots, mobile review-only checks, and cleaned schema/runtime/ports. Retained summary: `output/playwright/t5-008-live/t5008-8680-6db47c18b0c27d80/summary.json`.
- Product RED fixes cover world-aligned grid, workflow starters/blank path, `Ctrl+L` feedback, editable/dialog/interactive shortcut ownership, and visible status feedback.
- T5-008 is `DONE - PASS`: latest live evidence and full regression are recorded in `ai/reports/REPORT-T5-008.md`.
- T5-009 is now `DONE - PASS`: V2 tokens are globally bridged; shared top bar, auth shell, and admin shell use the approved dark-purple roles; build and focused responsive shell verification passed.
- T5-010 is now `DONE - PASS`: Login, Home, Space, Admin, error, empty, loading, and responsive page-level V2 UX migration passed build, route, visual, and source audit gates.
- T5-011 is now `DONE - PASS`: backend (438), full Chromium (132), 4,767-module build, retained live MySQL evidence, security-signature, encoding, compile, diff, and file-size audits all passed; final report is `ai/reports/REPORT-T5-011.md`.
- T5-012 is now `DONE - PASS`: Canvas blank-page root cause was the Naive UI color parser receiving CSS `var(...)` values; concrete parser-facing theme colors restore the live Canvas shell. Focused theme regression (1), Canvas shell regression (8), frontend build (4,767 modules), and live browser Console verification passed; final report is `ai/reports/REPORT-T5-012.md`.
- T5-013 is now `DONE - PASS`: canonical node-local editing, bounded outcome-safe generation polling, decoded image/playable video results, explicit unavailable media, and directional typed connection feedback passed full Chromium 140/140, backend generation 20 tests plus 3 subtests, a 4,775-module build, and guarded live 200/300 evidence. Final report: `ai/reports/REPORT-T5-013.md`.
- T5-014 is now `DONE - PASS`: typed semantic geometry, intrinsic-ratio single-surface media, external media titles, detached contextual composer, passive Canvas edges, and restrained state styling passed focused 22/22, full Chromium 147/147, a 4,779-module build, four viewport inspections, and guarded live 200/300 evidence. Final report: `ai/reports/REPORT-T5-014.md`.
- T5-015 is now `DONE - PASS`: intrinsic media-shaped outer geometry, compact text/generation silhouettes, decoded metadata adoption, latent ports, solid quiet edges, and lighter contextual tools passed focused 22/22, metadata/workflow 13/13, full Chromium 147/147, a 4,779-module build, six screenshot inspections, and guarded live 200/300 evidence. Final report: `ai/reports/REPORT-T5-015.md`.
- T5-016 is now `DONE - PASS`: deterministic mixed image/video workflows, four-way convergence, six-way result branching, lifecycle/content extremes, overlay ownership, restrained state styling, and four viewport evidence passed focused 26/26, full Chromium 150/150, a 4,779-module build, and guarded live 200/300 evidence. Final report: `ai/reports/REPORT-T5-016.md`.
- T5-017 is now `DONE - PASS`: connected scripts and images become the actual bounded prompt and validated reference inputs for image/video generation, with visible provenance and dynamic disconnect behavior. Focused frontend 24/24, guarded generation backend 29/29, full Chromium 155/155, and a 4,779-module build passed. Final report: `ai/reports/REPORT-T5-017.md`.
- T5-018 is now `DONE - PASS`: output dragging can continue into a compatible new typed node through a release-point chooser, committed as one node-plus-edge command with deterministic cancellation and undo/redo. Focused 8/8, relevant Chromium 50/50, full Chromium 163/163, and a 4,786-module build passed. Final report: `ai/reports/REPORT-T5-018.md`.

## Exact Next Action

Await the next bounded Canvas interaction or evidence-backed refinement unit; reverse input dragging and edge insertion/rerouting are the strongest remaining graph interaction gaps.

## Blockers And Human Gates

- No active blocker. Full backend upload process tests have a separately documented Windows Python 3.13 / AnyIO worker import verifier failure; generation-focused guarded suites pass.
- Applying Alembic revisions through `c9d0e1f2a3b4` to user/runtime data requires reviewed backup discipline and Human authorization.
- Paid provider calls, real secret access, credential rotation, destructive MySQL work, and ignored local `.db` cleanup remain Human Owner gates.
- The pre-existing `revid_test_db` schema remains untouched pending ownership confirmation.

## Worktree And Automation

- T5-008 started from verified and pushed T5-007 baseline `f7c885e8e1ef3c0984cccdaf422c65eb72ca298a`; T5-011 closes the resulting verified Phase 5 worktree.
- Ignored `.env`, `.db`, Playwright output, and runtime artifacts remain excluded from staging.
- Automation memory is only a cursor; repository documents, code, diff, tests, and runtime evidence are authoritative.
