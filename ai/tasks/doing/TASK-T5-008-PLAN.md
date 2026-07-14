# TASK-T5-008 Plan

- State: `DONE - PASS`
- Completed units: Units A-E - live harness, functional/persistence, performance, visual/accessibility/security, and final closure
- Active unit: none
- Updated: 2026-07-14

## Objective

Turn the approved Canvas acceptance document into one reproducible, evidence-classified certification run. Reuse the production FastAPI lifespan, current Vite build/preview, existing Playwright contracts, and guarded MySQL helpers; add only the harness and product fixes required by observed RED evidence.

## Unit A - Live Harness And Gap Matrix

1. Inventory every acceptance checkbox against existing backend, browser, visual, accessibility, and performance tests. `COMPLETE - 97/97 mapped in TASK-T5-008-COVERAGE.md`.
2. Build a project-local supervisor that creates a collision-safe unique guarded `revid_test_*` schema, upgrades to the exact Alembic head, starts owned FastAPI and Vite processes on explicit loopback ports, records redacted environment metadata, and always tears down only owned resources.
3. Add a live Playwright project/spec boundary with no API route mocks; authenticate and seed through production routes or guarded fixture helpers without reading `.env` or exposing credentials.
4. Record RED fingerprints for uncovered journeys before product changes.

Units A-D status: `COMPLETE`. The owned schema/service lifecycle, exact backend and preview identity handshakes, redacted failure handling, retained evidence, live functional/persistence/performance journey, responsive captures, mobile review-only checks, and security boundary all pass.

## Unit B - Live Functional And Persistence Certification

1. Verify project/default Canvas, metadata CRUD/reorder/conflict/duplicate, cross-Canvas isolation, project resources, graph commands, autosave, recovery, revisions, unauthorized access, and cross-scope rejection through live services.
2. Restart the owned backend and prove selected Canvas, exact graph/viewport, template/resource/generation history, idempotency, and restore still agree.
3. Fix only acceptance failures and keep all writes inside the disposable schema and ignored evidence directories.

## Unit C - 200/300 Persistence And Performance

1. Seed exactly 200 representative nodes and 300 valid connections deterministically, retain a canonical graph checksum, and prove live load plus first stable render within 3 seconds.
2. Execute the approved 30-second pan/zoom/single-drag/multi-drag profile and record FPS, frame p95, pointer p95, long tasks, minimap frequency, browser/OS/hardware acceleration, and raw evidence.
3. Save, close, reopen, restart, and compare the canonical checksum; run twenty Canvas switches and record listener/heap behavior without claiming unavailable browser internals.
4. Fix renderer, interaction, or persistence regressions only when reproducible evidence violates the approved threshold.

## Unit D - Visual, Accessibility, Keyboard, And Security

1. Cover all four viewports, 200% zoom, reduced motion, keyboard-only flows, synchronized DOM graph access, connection deletion, focus ownership, target sizes, Chinese labels, and serious/critical axe results.
2. Verify blank Canvas and workflow starters, Space/middle pan, Ctrl+L, Backspace/input safety, grid/edge/minimap toggles, zoom drift, and retry behavior.
3. Capture deterministic screenshots and perform visual inspection against the existing V2 design system; retain ignored evidence only.
4. Re-run database identity, comments/constraints, fail-closed runtime, unauthorized access, tracked/staged secret, and evidence-redaction gates.

## Unit E - Final Closure

1. Run focused suites, full backend, full Chromium, production build, Alembic head, compile, diff, UTF-8, file-size, and sensitive-path checks.
2. Perform a fresh acceptance-by-acceptance diff review and independent engineering/security/visual review.
3. Write `REPORT-T5-008.md`, mark only evidence-backed criteria complete, and reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP. `COMPLETE`.
4. Commit and push one scoped T5-008 closure only after every non-deferred gate passes. `COMPLETE`.

## Exact Next Action

T5-008 closure is complete. Activate T5-009 for the global V2 app-shell/shared-component rollout.
