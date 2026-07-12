# Task: V2 documentation and architecture baseline

## Status

- State: `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Dependency: Phase 4 complete and Human Owner V2 direction approval

## Task ID

T5-001

## Phase

Product V2 / Phase 5

## Category

Product / Architecture / Documentation

## Objective

Turn the approved MySQL-only, premium dark-purple, Canvas-first, and multi-canvas direction into a decision-complete document set that another engineer can execute without re-deciding product or architecture.

## Scope

- product requirements and non-goals;
- Canvas first-acceptance contract;
- V2 visual system and responsive behavior;
- MySQL, multi-canvas, renderer, persistence, history, API, migration, and rollback architecture;
- accepted ADRs for MySQL-only and project multi-canvas;
- Phase 5 roadmap and first implementation Task;
- project README and durable-document lifecycle guidance;
- reusable V2 pitfalls and explicit Human gates.

## Non-Goals

- business-code implementation;
- database migration execution;
- reading or changing secrets;
- deleting local `.db` files;
- paid Agnes calls;
- modifying archived Hermes or completed T4 evidence.

## Acceptance Criteria

- [x] PRD records goal, user, locked decisions, scope, non-goals, metrics, sequence, and Human gates.
- [x] Canvas acceptance defines multi-canvas, interactions, node registry, persistence, history, performance, browser, visual, accessibility, failure, and evidence gates.
- [x] Architecture defines exact schema, APIs, frontend/backend boundaries, migration, rollback, security, and verification.
- [x] V2 design system contains the nine production sections, exact tokens, layout, component states, motion, responsive behavior, accessibility, and prompt guide.
- [x] ADR-004 supersedes the SQLite retention and rollback clauses without rewriting history.
- [x] ADR-005 defines canvas-scoped graph/history and project-scoped assets/generation data.
- [x] ROADMAP and CURRENT identify one active implementation Task.
- [x] P0 hard-coded credential risk is recorded without displaying the candidate value.
- [x] no repository code, database, secret, or ignored evidence path is modified; the authorized disposable libTv benchmark left no persistent external state and made no paid call.
- [x] document links, terminology, UTF-8 decoding, secret patterns, and Git diff checks pass.

## Deliverables

- `ai/requirements/REVID-V2-PRD.md`
- `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- `ui/REVID-V2-DESIGN-SYSTEM.md`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- `ai/decisions/ADR-005-project-multi-canvas.md`
- `ai/tasks/doing/TASK-T5-001-PLAN.md`
- `ai/tasks/doing/TASK-T5-001-PROGRESS.md`
- `ai/reports/REPORT-T5-001.md`
- updated durable project navigation and state documents.
