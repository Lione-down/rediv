# TASK-T5-006 Plan

- State: `DONE - PASS`
- Completed units: Units A-E (`COMPLETE - PASS`)
- Active unit: none
- Updated: 2026-07-13

## Objective

Close T5-006 with fresh evidence that Canvas edits survive offline and server failures, explicit conflict recovery, browser refresh, and a real MySQL-backed backend restart without silent overwrite or local-work loss. Then run the complete regression and hygiene gates, review the final diff against every Task acceptance criterion, write the REPORT, and advance project state only when all evidence passes.

## Unit E Scope

1. Add focused Chromium coverage for browser offline/server failure, recovery persistence across reload, visible `Error`, stable mutation retry, and eventual successful save.
2. Re-run explicit HTTP 409 recovery coverage for reload-latest and preserve-local-copy, including failure paths that must retain the local copy.
3. Add or strengthen guarded real-MySQL evidence that a committed Canvas graph, viewport, idempotency result, and restorable revision survive application/backend restart boundaries.
4. Verify Canvas switch, route exit, page hide, and browser refresh preserve or flush pending work deterministically.
5. Run focused persistence suites first, followed by full backend regression, full Chromium regression, production build, and applicable accessibility checks.
6. Perform a fresh requirement-by-requirement diff review plus UTF-8, file-size, tracked/staged secret-path, database-artifact, and `git diff --check` gates.
7. Write `REPORT-T5-006.md`, mark every satisfied Task criterion, and update CURRENT/ROADMAP/PLAN/PROGRESS consistently.

## Unit E Non-goals

- node registry, project-shared assets/templates, and generation flows owned by T5-007;
- final local-MySQL 200-node/300-connection performance certification owned by T5-008;
- global V2 page redesign owned by T5-009 and T5-010;
- paid provider calls, real secret access, user/runtime migration execution, local `.db` handling, or destructive user-data operations.

## Dependencies And Risks

- Units A-D provide the atomic document API, autosave queue, local recovery, Canvas-scoped history, durable revisions, and recovery UI.
- Browser network emulation proves client offline behavior but is mock-browser evidence; it must not be presented as real MySQL or real-service evidence.
- Restart evidence must use a guarded `revid_test_*` MySQL schema and reconstruct application/database state rather than reuse an in-memory store.
- Retried work must preserve the original mutation ID and fingerprint so a response-loss retry cannot duplicate writes.
- Reload-latest may discard in-memory edits only after the server document loads successfully; failure must retain the local recovery copy.
- Full regression may expose unrelated historical failures. Any required check that cannot run must record its exact fingerprint, impact, and release condition.

## TDD And Verification Plan

1. Add focused browser tests for offline-before-save, reload with a stored recovery snapshot, online retry, stable mutation ID, and saved-state/recovery cleanup. Run RED before changing autosave behavior if a product gap appears.
2. Add focused guarded MySQL restart tests for graph, viewport, mutation idempotency, revision listing, and restore after database-engine/application reconstruction. Run RED before backend business-code edits if a persistence gap appears.
3. Make only the smallest implementation changes required by failing acceptance evidence.
4. Run focused browser autosave/revision suites and focused MySQL document/revision suites.
5. Run full backend and Chromium regressions, production build, browser viewport/accessibility checks, and restart evidence.
6. Review the complete T5-006 diff and all acceptance criteria; run hygiene/security gates and stage only owned paths.
7. Create the final REPORT, update durable state, commit with `feat(canvas): complete durable recovery workflow`, and push `main` only after all gates pass.

## Unit E Success Criteria

- offline or server failure keeps the exact unsaved document in Canvas-scoped local recovery and exposes `Error` without claiming `Saved`;
- restoring connectivity and retrying uses the same mutation ID, commits once, reaches `Saved`, and clears only the matching recovery snapshot;
- conflict handling never overwrites automatically and both reload-latest and preserve-local-copy paths remain explicit and truthful;
- graph document, viewport, mutation idempotency, revision history, and restore behavior survive a guarded real-MySQL application restart boundary;
- switch, exit, page hide, and reload behavior is deterministic and does not lose pending work;
- focused and full backend/browser tests, production build, accessibility checks, fresh diff review, and hygiene/security gates pass;
- `REPORT-T5-006.md`, Task, PLAN, PROGRESS, CURRENT, and ROADMAP agree that T5-006 is `DONE - PASS`.

## Exact Next Action

Create and activate T5-007 Task/PLAN/PROGRESS before changing node-registry, project-asset/template, generation-task/result, or provider-flow code.
