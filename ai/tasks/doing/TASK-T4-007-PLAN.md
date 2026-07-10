# T4-007 Plan - Login/Register UI And Route/Session Guards

Last updated: 2026-07-10

## Objective

Deliver the frontend authentication entry points and session-aware route guards for password, WeChat, and guest access while preserving the backend contracts completed in T4-004 and the visual system completed in T4-006.

## Scope

- Add `frontend/src/views/user/Login.vue`, `Register.vue`, and user-domain local components.
- Update `frontend/src/types/auth.ts`, `frontend/src/api/auth.ts`, and `frontend/src/store/auth.ts` for public registration settings, password auth, session restoration, and guest/WeChat entry state.
- Update `frontend/src/router/index.ts` for login/register routes, `requiresAuth`/`requiresAdmin`, safe redirect handling, and restoration-aware navigation.
- Update `frontend/src/views/app/WechatCallback.vue` so success and failure return through the auth entry flow without weakening state validation.
- Add focused frontend tests only if the existing toolchain can support them without an out-of-scope dependency change; otherwise use type/build and browser evidence explicitly.

## Non-Goals

- No backend, database, migration, Home, Space, Workspace, or global design-token changes.
- No paid Agnes calls, real WeChat calls, secret access, external account setup, or automatic push.
- No refresh-token or server-side token revocation design; the current bearer token remains a client-discard logout contract.
- No invented `guest_login_enabled` setting. The public backend settings contract exposes only `registration_mode` and `wechat_login_enabled`; guest access is currently always available through `POST /auth/guest`.

## Dependencies And Verified Contracts

- T4-004 and T4-006 are complete.
- `GET /auth/registration-settings` returns only `registration_mode` and `wechat_login_enabled`.
- `POST /auth/login` accepts `{ identifier, password }` and returns the existing `AuthResponse`.
- `POST /auth/register` accepts `{ username, password, email?, invitation_code? }` and enforces `open`, `invite_only`, or `closed` server-side.
- `GET /me` restores the current bearer-token session; `401` is already routed through the request interceptor to clear client auth state.
- `POST /auth/logout` is acknowledgement-only; logout correctness is client token removal.
- `POST /auth/guest` has no settings gate in the current backend contract, so the frontend treats guest access as available unless the request itself fails.

## Design Direction

- Visual thesis: a deep, quiet creator-console entry surface using the documented T4-006 dark palette and `#6347C2` brand accent, with surface depth expressed through luminance steps rather than dark drop shadows.
- Content plan: desktop uses an asymmetric two-column layout, with a compact Revid workflow preview as the visual anchor and a focused identity form as the action surface; mobile collapses to one form-first column.
- Interaction thesis: focus produces a restrained purple halo, submit feedback stays in place, and press/entry motion uses only transform and opacity with a reduced-motion fallback.
- Product references: Linear informs the reduced-navigation shell, Raycast informs the clear separation between primary login and registration, and Vercel informs a single dominant identity path with secondary providers visually demoted.
- CSS strategy: scoped SCSS inside Vue single-file components, reusing the existing spacing/radius/type tokens and the documented dark color values; no Tailwind, CSS-in-JS, global token rewrite, new font dependency, or mixed icon library.
- Radius scale: reuse `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`, and `--radius-pill`; interactive targets remain at least 40px.

## Implementation Slices

### Slice A - Auth foundation

1. Define registration settings and password-auth payload types.
2. Add public settings, login, register, and logout API functions.
3. Extend the Pinia store with deterministic settings/session state, password actions, guest completion state, and an idempotent session-restoration action.
4. Preserve WeChat callback-state validation and never place password or bearer token in URLs or console output.

### Slice B - Login/register UI

1. Add a shared user-domain auth shell that owns the dark responsive layout and accessibility scaffolding.
2. Implement password login with required-field validation, duplicate-submit prevention, loading, invalid-credential, and server-error states.
3. Load public registration settings before rendering alternate entries; hide registration when closed and show an explicit closed state on direct `/register` access.
4. Support open and invitation-only registration, including password-policy guidance and inline server errors.
5. Show WeChat only when `wechat_login_enabled`; show guest entry under the existing always-available backend contract.

### Slice C - Routing, recovery, and callback

1. Add `/login` and `/register` routes after the corresponding views exist and build cleanly.
2. Apply `requiresAuth` to protected app routes and `requiresAdmin` plus `requiresAuth` to Admin routes.
3. Restore `/me` before deciding protected navigation, preventing a protected-page refresh from bouncing through the wrong page.
4. Sanitize redirect query values to local absolute paths only and reject protocol-relative or external targets.
5. Redirect authenticated users away from auth entry pages without blocking a legitimate callback.
6. Preserve callback state validation and return success to a sanitized redirect or the protected workspace default.

### Slice D - Verification and closure

1. Run focused type/build verification first, then the production build.
2. Run browser checks for login success, bad password, closed registration, invalid token, Admin/user guards, refresh restoration, WeChat visibility, and guest entry.
3. Capture 1440x900 and 375px screenshots, check keyboard focus, localized copy fit, console errors, and horizontal overflow.
4. Perform a fresh diff review, write `ai/reports/REPORT-T4-007.md`, and mark Task/ROADMAP `DONE` only after every non-deferred criterion has evidence.

## First Bounded Unit

Implement Slice A after creating PLAN/PROGRESS. Success requires a clean `npm run build`, a fresh diff review showing only auth foundation and durable state changes, and a scoped local commit. UI/routes remain for the next bounded unit.

## Acceptance Mapping

| Acceptance focus | Planned evidence |
|---|---|
| Username/email login and bad password | Slice A API/store plus Slice D browser interaction |
| Closed registration | Settings load plus Slice D direct `/register` browser state |
| Invalid token and protected refresh | Idempotent restore plus router/browser checks |
| Admin and normal-user guards | Restoration-aware meta guards plus browser checks |
| WeChat and guest visibility | Public settings contract and login-page browser checks |
| No open redirect | Local-path sanitizer exercised with safe and unsafe query values |
| Build | `npm run build` in each implementation unit |
| Responsive UI | 1440x900 and 375px screenshots with overflow/console checks |

## Risks

- App-level `onMounted` restoration currently races router navigation; Slice C must make the router the single navigation decision point while keeping App startup harmless.
- The Axios `401` interceptor clears auth during restoration; the store must still mark restoration complete so guards cannot wait or redirect indefinitely.
- WeChat authorization returns a backend-signed state different from the caller seed; session storage must continue comparing the signed state returned by the backend.
- Legacy WeChat users may have nullable username/email fields; the frontend type contract must remain backward compatible.
- No frontend test runner is configured. This Task must not overstate build evidence as behavioral evidence; route/session behavior requires real browser verification before closure.

## Human Gates

None for planned frontend implementation. Any request to change backend settings schema, use real secrets/accounts, or make paid external calls requires separate Human Owner authorization.
