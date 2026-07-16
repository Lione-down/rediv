# TASK-T5-074 Progress

- Task state: `DONE`
- Active unit: authenticated logout and global session exit complete.

## Completed work

- Reconstructed state from AGENTS, CURRENT, ROADMAP, the direct-delivery ADR, and T5-073 closure documents.
- Confirmed the worktree contains only user-owned untracked `.hermes` and `output/` content outside this Task and preserved both.
- Added a typed backend logout response and required the existing `current_user` dependency on `POST /auth/logout`.
- Added backend coverage for missing bearer, invalid bearer, valid active user acknowledgement, and banned-user rejection.
- Fixed frontend logout ordering by snapshotting the active bearer into an explicit request header, immediately clearing local auth state, and completing backend acknowledgement as best effort.
- Added an `isLoggingOut` guard so repeated logout attempts cannot issue duplicate requests.
- Added one shared responsive account menu with account identity, personal-space navigation, danger-styled logout, `menu/menuitem` screen-reader semantics, `aria-expanded`, keyboard operation, reduced motion, and 40px targets.
- Reused the shared menu in Home, AppTopBar, canonical Canvas, and Admin. Space and legacy Workspace inherit it through AppTopBar.
- Updated the Canvas shell test from the retired account link to the new account button and narrowed one pre-existing ambiguous alert assertion to its intended navigation error.
- Proved backend success and 503 failure both clear local storage and replace the current route with `/login`; the backend request still receives exactly one bearer header.
- Inspected fresh production screenshots at desktop, Home 375px, and Canvas 375px. Menus remain inside the viewport with no horizontal overflow.
- Completed compile, build, focused regression, diff, UTF-8, trailing-whitespace, file-size, sensitive-signature, and ownership audits.

## Remaining work

- None.

## Exact next action

Open a separate Task only if persistent token revocation, refresh tokens, all-device logout, or session-management UI is requested.

## Files changed

- `ai/tasks/todo/TASK-T5-074.md`
- `ai/tasks/doing/TASK-T5-074-PLAN.md`
- `ai/tasks/doing/TASK-T5-074-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T5-074.md`
- `backend/api/auth.py`
- `backend/schemas/auth.py`
- `backend/tests/test_password_auth_contract.py`
- `frontend/src/api/auth.ts`
- `frontend/src/store/auth.ts`
- `frontend/src/components/layout/account-session-menu.vue`
- `frontend/src/components/layout/AppTopBar.vue`
- `frontend/src/views/app/components/home/home-route-header.vue`
- `frontend/src/views/app/CanvasWorkspace.vue`
- `frontend/src/views/app/canvas-workspace.scss`
- `frontend/src/views/admin/AdminLayout.vue`
- `frontend/tests/e2e/logout-session.spec.ts`
- `frontend/tests/e2e/canvas-shell-navigation.spec.ts`

## Commands and evidence

- Backend RED: project venv focused logout test failed as expected because anonymous logout returned HTTP 200 instead of 401.
- Backend GREEN: project venv focused logout test passed 1/1; full password auth contract passed 13/13 in 39.266 seconds.
- Backend compile: `compileall` for changed auth API, schema, and test passed.
- Frontend RED: logout spec failed 3/3 because no account menu existed.
- Frontend final regression: logout, T5-010 page UX, and Canvas shell navigation passed 12/12.
- Frontend final production build: PASS, 4,824 modules.
- Visual evidence:
  - `output/playwright/test-results/logout-session-authenticat-42380-onsive-account-session-menu-chromium/logout-menu-desktop.png`
  - `output/playwright/test-results/logout-session-authenticat-42380-onsive-account-session-menu-chromium/logout-menu-home-mobile.png`
  - `output/playwright/test-results/logout-session-authenticat-42380-onsive-account-session-menu-chromium/logout-menu-mobile.png`
- `git diff --check`: PASS.
- UTF-8 strict decode: 18/18 changed files; trailing whitespace 0; sensitive signatures 0.
- New source files are below 500 lines. `CanvasWorkspace.vue` remains a pre-existing 576-line file and this Task reduced its account integration by three lines; `canvas-shell-navigation.spec.ts` is exactly 500 lines.
- The first global-Python test attempt stopped before discovery because its unrelated FastAPI 0.133.1 install lacked `annotated_doc`; the approved `backend/.venv` ran all product assertions.
- One interim ARIA build stopped on TypeScript literal widening for `aria-disabled`; the type was narrowed without runtime workaround and the fresh final build passed.

## Blockers

- None.
