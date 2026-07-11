# Revid - Phase 4 Direct Delivery Roadmap

Last updated: 2026-07-11

## Execution Policy

- One active implementation Task at a time.
- Codex plans, implements, verifies, self-reviews, reports, and updates state directly.
- Each Task must leave the repository usable before the next Task starts.
- Paid Agnes smoke calls and destructive or irreversible actions remain Human Owner gates.

## Delivery Order

| Order | Task | Deliverable | State | Dependency |
|---:|---|---|---|---|
| 1 | T4-003 | MySQL runtime, health, persistence, restart and Navicat acceptance | DONE - PASS | T4-002 done |
| 2 | T4-004 | Password authentication and Admin bootstrap | DONE - PASS | T4-003 done |
| 3 | T4-011 | Canvas connection model and CRUD API | DONE - PASS | T4-003 and T4-004 |
| 4 | T4-005 Unit A | GenerationTask persistence, provider integration and mock tests | DONE - PASS | T4-003 and T4-004 |
| 5 | T4-007 | Login/register UI and route/session guards | DONE - PASS | T4-004 and T4-006 |
| 6 | T4-008 | Real-data Home project and asset dashboard | DONE - PASS | T4-003 and T4-007 |
| 7 | T4-009 | Real-data Space asset workspace | DONE - PASS | T4-003 and T4-007 |
| 8 | T4-012 Unit A | Canvas decomposition, server load/save and optimistic rollback | TODO - NEXT | T4-007, T4-010 and T4-011 |
| 9 | T4-012 Unit B | Connection interaction, selection, context menu, minimap and responsive QA | TODO | T4-012 Unit A |
| 10 | T4-005 Unit B | Explicitly authorized real Agnes text/image/video smoke | TODO - HUMAN COST GATE | T4-005 Unit A |
| 11 | T4-013 | Full E2E, visual QA, security checks and documentation closure | TODO | T4-005/007/008/009/012 |

## Completed Foundations

| Task | Result |
|---|---|
| T4-001 | MySQL engine, model comments and Alembic baseline - DONE |
| T4-002 | SQLite to MySQL migration tooling - DONE |
| T4-006 | Dark design system and Naive UI provider - DONE |
| T4-010 | Workspace component layout - DONE |

## Planned Splits

T4-005 remains one product Task but has two independently verifiable units. Unit A cannot make paid calls. Unit B performs real provider smoke only after explicit Human Owner authorization.

T4-012 remains one product Task but has two independently mergeable units. Unit A establishes maintainable component boundaries and persistence. Unit B adds advanced interaction and visual acceptance without reopening backend contracts.

## Current Size Risks

- `frontend/src/views/app/Home.vue`: 499 lines - T4-008 target satisfied
- `frontend/src/views/app/Space.vue`: 497 lines - T4-009 target satisfied
- `frontend/src/components/canvas/CanvasStage.vue`: 1071 lines

The relevant Tasks must reduce each page or stage controller to at most 500 lines through domain-aligned components, without unrelated visual redesign.

## Phase Complete Definition

An authorized user can sign in, create a project, create and connect Canvas nodes, invoke Agnes, and inspect persisted projects, nodes, connections, generation tasks, assets, and quota data in MySQL. Refresh and backend restart preserve state. Home, Space, and Workspace pass browser checks at 1440x900, 920px, and 375px. Backend tests, frontend build, E2E, security checks, and final documentation all pass.

## Historical Roadmap State

The former Hermes-oriented timeline and blocker history is preserved in `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`. It is not part of normal per-run context.
