# TASK-T5-011 - Full V2 regression and release closure

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5
- Dependency: T5-010 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Close the V2 delivery with full frontend/backend regression, real-runtime evidence where authorized, security and hygiene review, durable documentation, and reconciled release state.

## Scope

- full backend test suite and frontend build/Chromium suite;
- focused live MySQL acceptance boundary retained from T5-008 and route-level T5-010 evidence;
- source/diff/hygiene and sensitive-file audit without reading secrets;
- final task reports, CURRENT/ROADMAP reconciliation, and release readiness statement.

## Non-goals and human gates

- no paid provider calls, real secret access, destructive database/filesystem operations, deployment, or irreversible migration;
- no new product capability beyond the completed T5-010 page UX scope.

## Acceptance criteria

- all required automated suites pass or have an explicitly documented release-condition blocker;
- live MySQL evidence remains reproducible and cleanup-verified;
- security, secret hygiene, BOM/encoding, diff, and file-size checks are recorded;
- T5-001 through T5-011 states, reports, CURRENT, and ROADMAP agree.
