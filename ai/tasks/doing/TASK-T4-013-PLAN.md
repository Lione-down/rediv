# T4-013 Direct Delivery Plan - Phase 4 E2E And Closure

Last updated: 2026-07-12

## Objective

Verify the complete authenticated Revid workflow across MySQL, Canvas, Agnes, assets, quotas, browser behavior, security hygiene, and durable documentation, then close Phase 4 without expanding product scope.

## Scope And Non-Goals

- Use existing backend tests, MySQL integration profile, frontend production build, browser E2E, and sanitized runtime evidence.
- Add only missing E2E/QA artifacts or the smallest fixes proven necessary by failures.
- Do not redesign features, delete SQLite/MySQL data, expose secrets, or broaden a fix beyond five business files.

## Evidence Workstreams

1. Inventory current T4 reports and map every T4-013 acceptance criterion to existing versus missing evidence.
2. Run backend full regression and authorized MySQL integration checks; verify schema comments, foreign keys, persistence, restart, happy path, and failure path.
3. Run frontend build and browser E2E at 1440x900, 920x900, and 375x900, reusing existing evidence where current and reproducible.
4. Verify Login, Home, Workspace, generation states, Space assets, refresh/restart persistence, quota, and error UX.
5. Run repository and staged secret hygiene checks without opening secret files.
6. Fix only failures proven by evidence, rerun focused then relevant regression, and keep any repair within the five-business-file limit.
7. Write REPORT-T4-013 and REVIEW-PHASE4-COMPLETE, perform a fresh diff/test review, and reconcile CURRENT/ROADMAP.

## First Bounded Unit

Read all current Phase 4 reports, inspect existing test/browser evidence, and produce an acceptance matrix identifying the smallest executable verification gap. Do not edit business code in this planning unit.

## Success Standard

Every non-deferred T4-013 acceptance criterion has fresh, classified evidence; any unavailable check has an exact blocker and release condition; repository documents, code, tests, runtime state, and final review agree.
