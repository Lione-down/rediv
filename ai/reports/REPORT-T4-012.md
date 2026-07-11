# T4-012 Report - Canvas interaction and persistence

- Task: `T4-012`
- Result: `DONE - PASS`
- Completed: 2026-07-12
- Owner: Codex Project Lead Engineer

## Outcome

Canvas is now project-driven and persistent without fixture fallback. Node and connection load/create/update/delete use the existing backend contracts, optimistic ownership, rollback, temporary-ID reconciliation, debounced move persistence, and route-exit flush. `CanvasStage.vue` was decomposed from more than 1,000 lines into scoped renderer, geometry, persistence, context, interaction, and styling modules.

Advanced interaction includes ordered node multi-selection, marquee, editable-safe keyboard behavior, context actions, world-coordinate double-click creation, connection selection/deletion, and responsive minimap navigation. Existing Leafer pan, zoom, drag, and anchor connection behavior remains intact without a second canvas engine or backend contract change.

## Acceptance Evidence

- Real local FastAPI/MySQL/API/browser acceptance passed project-scoped load, node create/move/delete, connection create/delete/cascade, refresh recovery, route isolation, and queued-move route exit.
- Controlled failures passed exact rollback for create/move/delete node and create/delete connection with visible `NMessage` errors and no temporary ghosts.
- Selection/context QA passed click/toggle/marquee, Escape, editable Delete guard, duplicate/delete context actions, and zoom/pan world-coordinate creation.
- Unit B3 passed actual connection pointer hit at 25% and 200% zoom, focus/Enter selection, Delete rollback with selection restoration, and minimap node/background navigation using actual 160x104 and 128x86 rendered sizes.
- Browser layout passed at 1440x900, 920x900, and 375x900 with no horizontal overflow; minimap intentionally hides below 720px.
- Backend Canvas CRUD regression: 19/19 passed.
- Frontend production build: passed with 4,702 transformed modules.
- Final scoped diff, accessibility, security, secret-path, architecture, file-size, and `git diff --check` review: passed.

## Scope And Residuals

- No backend schema, migration, Auth, Home, Space, global design token, dependency, paid provider, or secret change was made in Unit B.
- Generation status/content persistence remains outside T4-012 and must not reopen this completed Task.
- Local mock users/projects and ignored Playwright evidence remain preserved; no destructive cleanup or push was authorized.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate. T4-013 is not dependency-ready until that gate is resolved.
