# Report: T5-004 V2 Canvas shell, navigation, and viewport persistence

## Result

`DONE - PASS` on 2026-07-13.

Revid now enters an explicit project/Canvas route, renders a full-screen graphite-black/violet Canvas shell, manages Canvas metadata through server-confirmed order revisions, scopes graph reads and mutations to the exact Canvas, and restores each Canvas viewport independently.

## Delivered

- Added one Canvas-scoped semantic token source and route-local Naive UI bridge without changing unrelated Phase 4 pages.
- Added the canonical `/app/projects/:projectId/canvases/:canvasId` route, validated user/project Canvas preference, and legacy first-active redirect.
- Added serialized create, rename, reorder, switch, duplicate, and archive navigation with stale-revision recovery and last-active protection.
- Added a dedicated `100dvh` graph-first shell with compact identity/save/account context, no permanent app bar or empty inspector, contextual generation, and a below-768px review-only boundary.
- Added one authenticated Canvas document read boundary and exact Canvas-scoped node/connection mutations with fail-closed ownership and entity isolation.
- Added finite normalized viewport persistence with exact deduplication, 500ms debounce, route-exit flush, independent Canvas restoration, and unchanged graph revision.
- Closed document-language, focus contrast, 40px route-target, reduced-motion, responsive, and Chinese-label browser acceptance gaps.

## Acceptance Evidence

| Gate | Evidence | Result |
|---|---|---|
| Token isolation | 61 scoped tokens, 27-variable Naive bridge, zero unresolved or duplicated color literals | PASS |
| Canonical route and compatibility | Authenticated canonical, legacy first-active, stale/foreign/archived fallback browser checks | PASS |
| Canvas metadata navigation | Create, rename, exact reorder, switch, duplicate, archive, last-active, and stale-revision browser evidence | PASS |
| Full-screen shell and responsive boundary | Real screenshots at 1440x900, 1366x768, 920x900, and 375x812 | PASS |
| Graph scope and persistence | Guarded MySQL document/mutation/viewport tests plus Canvas backend regression 39/39 | PASS |
| Backend regression | 189 tests | PASS |
| Viewport restoration | Switch, refresh, backend-store restart, debounce, deduplication, and route flush evidence | PASS |
| Accessibility closure | `zh-CN`, first-focus skip link, Canvas focus transfer, Chinese labels, route targets, computed contrast, and reduced motion | PASS |
| Focused browser closure | Canvas shell 6/6 | PASS |
| Full Chromium regression | 16/16 tests across required viewports | PASS |
| Frontend build | `vue-tsc` and Vite, 4711 modules | PASS |
| Diff and hygiene | Fresh review, file-size, UTF-8, forbidden-pattern, `git diff --check`, sensitive-path, secret-candidate, and DB-artifact gates | PASS |

## Compatibility And Deferred Boundaries

- Legacy project-scoped graph routes remain a first-active-Canvas compatibility path. Their removal belongs before the full Canvas milestone acceptance.
- Incremental keyed rendering, command interactions, grouping, shortcut expansion, arrange, and 200/300 performance work belong to T5-005 and T5-008.
- Autosave revision batching, idempotency, conflicts, history, checkpoints, and restore belong to T5-006.
- Project-shared asset and generation registry expansion belongs to T5-007.
- This Task does not claim the full Canvas-first milestone checkboxes owned by T5-005 through T5-008.

## Human Owner Gates Remaining

- Applying Alembic revision `f0a1b2c3d4e5` to user/runtime data requires reviewed backup discipline and Human migration authorization.
- Ignored local `.db` artifacts and the pre-existing `revid_test_db` remain untouched pending exact authorization and ownership confirmation.
- Credential rotation remains required only if the removed T5-002 assignment was ever real or reused.

These gates do not invalidate T5-004 repository acceptance because no user/runtime migration, secret access, paid call, or destructive cleanup was in scope.

## Next Task

Create and activate T5-005 Task/PLAN/PROGRESS before implementing the incremental Leafer renderer, shared command model, selection/multi-move, grouping, connection, shortcut, and arrange boundaries.
