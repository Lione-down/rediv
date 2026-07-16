# REPORT-T5-074 - Authenticated logout and global session exit

## Result

`DONE - PASS`

Revid now exposes one reusable account menu across Home, Workspace, Space, Canvas, and Admin. Logout clears browser session state immediately, replaces the active route with `/login`, and sends exactly one authenticated backend acknowledgement request with the captured bearer token.

## Backend delivery

- `POST /auth/logout` now requires the existing `current_user` dependency.
- Missing and invalid bearer tokens return HTTP 401; banned users return HTTP 403.
- Active users receive the typed acknowledgement `{ ok: true, detail: "Bearer session acknowledged for client logout" }`.
- The endpoint remains honest for the current stateless JWT architecture. It acknowledges client logout and does not claim persistent revocation or all-device logout.

## Frontend delivery

- The auth store snapshots the current token into the explicit logout request header, clears token, user, and quota state immediately, and treats backend completion as best effort.
- `isLoggingOut` prevents duplicate requests.
- The shared account menu provides personal-space navigation and danger-styled logout with one implementation owner.
- Home, AppTopBar, Canvas, and Admin use the shared component; Space and legacy Workspace inherit AppTopBar coverage.
- The menu adds `menu/menuitem` semantics, accessible names, `aria-expanded`, keyboard opening and dismissal, 40px targets, compact behavior, focus treatment, and reduced-motion handling.

## Verification

| Gate | Result |
|---|---|
| Backend password auth contract | PASS, 13/13 |
| Backend changed-file compile | PASS |
| Logout, page UX, Canvas shell browser regression | PASS, 12/12 |
| Production frontend build | PASS, 4,824 modules |
| Desktop and 375px visual inspection | PASS |
| Menu viewport and horizontal overflow assertions | PASS |
| Bearer request ordering, immediate local clear, single call | PASS |
| HTTP 503 fallback teardown and redirect | PASS |
| Keyboard, ARIA, reduced motion, 40px controls | PASS |
| UTF-8, whitespace, sensitive signatures, diff check | PASS |

## Visual evidence

- `output/playwright/test-results/logout-session-authenticat-42380-onsive-account-session-menu-chromium/logout-menu-desktop.png`
- `output/playwright/test-results/logout-session-authenticat-42380-onsive-account-session-menu-chromium/logout-menu-home-mobile.png`
- `output/playwright/test-results/logout-session-authenticat-42380-onsive-account-session-menu-chromium/logout-menu-mobile.png`

## Explicit boundary

Logout invalidates the browser's local session by discarding its bearer token. The existing 24-hour stateless token is not recorded in a server-side blacklist. Persistent revocation, refresh-token rotation, device sessions, and all-device logout require a separate architecture Task.
