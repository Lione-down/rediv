# TASK-T5-008 - Canvas first-acceptance certification

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5
- Dependency: T5-007 `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Started: 2026-07-14

## Objective

Certify the complete V2 Canvas milestone against `REVID-V2-CANVAS-ACCEPTANCE.md` with reproducible live FastAPI plus disposable MySQL browser evidence, exact 200-node/300-connection persistence and performance measurements, four-viewport visual/accessibility checks, failure/security coverage, and final repository regression.

## Scope

- one project-local live acceptance harness that owns an isolated `revid_test_*` MySQL schema, production FastAPI lifespan, Vite preview, Chromium session, restart, evidence, and cleanup;
- live browser create, rename, reorder, switch, duplicate, edit, autosave, conflict, revision, resource, and mobile review-only journeys;
- exact 200-node/300-connection seed, load/render/save/reopen/checksum/restart evidence and the approved 30-second interaction profile;
- keyboard-only, reduced-motion, 200% zoom, WCAG AA/axe, focus, Chinese labels, visual screenshots, and all four accepted viewports;
- database identity/comments/constraints, unauthorized access, fail-closed runtime, secret hygiene, full regression, independent review, REPORT, and milestone state closure.

## Non-goals

- global app-shell or non-Canvas page redesign owned by T5-009 and T5-010;
- paid provider calls, audio generation, real-time collaboration, cross-canvas edges, a second Canvas engine, or public API migration;
- user/runtime schema migration, destructive MySQL/filesystem operations, real secret access, deployment, or ignored local `.db` cleanup;
- weakening approved performance, accessibility, security, or mobile review-only thresholds.

## Delivery Units

1. Unit A - deterministic live acceptance harness, isolated schema lifecycle, environment recording, and RED gap matrix.
2. Unit B - live functional, persistence, conflict, restart, resource, and security browser journeys.
3. Unit C - exact 200/300 seed, load/render/save/reopen/checksum/restart, 30-second performance, switch/listener, and heap evidence.
4. Unit D - four-viewport visual, keyboard, reduced-motion, 200% zoom, axe/WCAG, empty-state, shortcut, and mobile boundary closure.
5. Unit E - complete backend/Chromium/build regression, independent review, hygiene, REPORT, and state closure.

## Acceptance Criteria

- [ ] A project atomically owns `画布 1`; create, rename, full-order reorder, switch, duplicate, refresh, and backend restart preserve exact metadata and graph scope.
- [ ] Canvas graphs, viewports, undo/redo, revisions, resources, generated history, parents, ports, and connections remain correctly isolated or project-shared according to the approved contract.
- [ ] Negative coordinates, 10%-800% zoom, fit, pan, minimap, edges, grid, arrange, empty starters, and a true blank-canvas path work without drift or unintended mutation.
- [ ] Pointer and keyboard selection/edit/group/connect/delete/align/distribute/lock commands share the canonical command boundary and respect input/dialog/focus ownership.
- [ ] Autosave, response loss, offline/server failure, 409 conflict, idempotent retry, preserve-local-copy, revision retention, and restore-to-new-head remain deterministic.
- [ ] The exact 200-node/300-connection document loads and reaches stable render within 3 seconds, then saves, closes, reopens, restarts, and matches its canonical checksum.
- [ ] The recorded 30-second interaction profile averages at least 55 FPS, frame p95 is at most 33 ms, pointer p95 is at most 50 ms, and no interaction long task reaches 200 ms.
- [ ] Twenty Canvas switches do not duplicate listeners or show linearly growing retained heap; renderer and minimap remain incremental and bounded.
- [ ] Chromium passes at 1440x900, 1366x768, 920x900, and 375x812; mobile exposes no edit/delete/upload/template-use/generation action.
- [ ] Keyboard-only, synchronized DOM access, visible focus, Chinese labels, reduced motion, 200% zoom, target size, text contrast, and serious/critical axe checks pass.
- [ ] MySQL identity, Alembic head, comments, constraints, ownership, unauthorized access, cross-scope rejection, and fail-closed configuration/runtime checks pass.
- [ ] Full backend, full Chromium, production build, visual inspection, fresh diff review, staged secret hygiene, independent review, REPORT, and durable project state all agree.

## Linked Decisions And Specifications

- `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- `ai/requirements/REVID-V2-PRD.md`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- `ui/REVID-V2-DESIGN-SYSTEM.md`
- `ai/decisions/ADR-002-v3-1-technology-stack.md`
- `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- `ai/decisions/ADR-005-project-multi-canvas.md`

## Risks And Controls

- Live-test contamination: use a unique guarded `revid_test_*` schema, owned processes/ports, exact identity checks, and cleanup only for the owned disposable schema.
- Secret exposure: consume only already-injected process environment, never open `.env`, and redact URLs, headers, credentials, and evidence.
- Performance noise: record hardware/browser/runtime details, run one owned serial profile, retain raw metrics, and never weaken thresholds after measurement.
- Mock/live confusion: label browser mocks, live local service, disposable MySQL, and provider mocks separately; paid provider evidence is not required or authorized.
- Harness-induced product drift: prefer test infrastructure and acceptance gaps only; do not redesign global pages or change long-term contracts in this Task.
