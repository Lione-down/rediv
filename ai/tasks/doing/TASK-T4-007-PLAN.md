# T4-007 Plan - Login/Register UI And Route/Session Guards

Last updated: 2026-07-11

## Objective

Deliver the frontend authentication entry points and session-aware route guards for password, WeChat, and guest access while preserving the backend contracts completed in T4-004 and the visual system completed in T4-006.

## Scope

- Add `frontend/src/views/user/Login.vue`, `Register.vue`, and user-domain local components.
- Update `frontend/src/types/auth.ts`, `frontend/src/api/auth.ts`, and `frontend/src/store/auth.ts` for public registration settings, password auth, session restoration, and guest/WeChat entry state.
- Update `frontend/src/router/index.ts` for login/register routes, `requiresAuth`/`requiresAdmin`, safe redirect handling, and restoration-aware navigation.
- Update `frontend/src/api/request.ts` only to correlate a 401 with the bearer token used by that failed request, so stale failures cannot clear a newer session.
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

## Slice B UI Specification

1. **Visual theme and atmosphere**: use a deep, quiet creator-console entry surface. The page canvas is near-black, the workflow preview is the visual anchor, and the form remains the single dominant action surface.
2. **Color palette and roles**: use scoped auth variables mapped to the documented T4-006 dark values: canvas `#0e0e12`, app surface `#13131a`, panel `#1a1a24`, raised/input surface `#1e1e2a` to `#22222e`, primary text `#f0eef6`, secondary text `rgba(240,238,246,0.72)`, muted text `rgba(240,238,246,0.56)` for small-copy contrast, standard border `rgba(240,238,246,0.10)`, primary `#6347C2`, hover `#7B61D6`, pressed `#4E35A8`, error `#d9535c`, and success `#4caf7d`. Do not consume the light root color variables as dark values.
3. **Typography rules**: keep the existing Geist/system/CJK font stack with no new font dependency. Use a 32px to 40px form heading, 14px to 15px body copy, 12px to 13px helper copy, 650 heading weight, and normal tracking for Chinese text.
4. **Component styling**: use Naive UI large inputs and buttons, top labels, inline field feedback, a full-width primary submit, and quieter full-width provider buttons. Every state must cover default, focus, loading, disabled, server error, and press feedback.
5. **Layout principles**: desktop uses an asymmetric two-column grid with the workflow preview on the wider side and a form panel capped near 460px. The spacing ladder is 8, 12, 16, 24, and 32px from the existing tokens. The form is the first content on narrow screens.
6. **Depth and elevation**: communicate hierarchy through dark background-color steps and translucent light borders. Do not add dark drop shadows, glass blur, decorative gradient text, or a second card system.
7. **Project guardrails**: keep all styles scoped; preserve the global tokens and Naive theme; use only Lucide icons already installed; never place password or token values in URLs, logs, or copy; do not show registration before settings resolve; do not describe the in-memory guest session as an authenticated account; and position WeChat as an existing-account login when invitation-only registration is active.
8. **Responsive behavior**: keep a 40px minimum hit target, collapse to a form-first single column below 760px, compact the workflow preview below 560px, preserve safe-area padding, prevent horizontal overflow at 375px, and disable entry and press motion under `prefers-reduced-motion`.
9. **Implementation prompts**: build `AuthShell` on `#0e0e12` with `#13131a/#1a1a24` surface steps, 12px maximum token radius, a 40px heading at weight 650, and a semantic workflow preview; build `Login` with large Naive controls, `#6347C2` primary action, shared action locking, and settings-gated alternatives; build `Register` with an initializing state, explicit closed state, invitation-only field, exact eight-character letter-and-number password guidance, and inline server errors.

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

## Second Bounded Unit

Implement Slice B only: `AuthShell.vue`, `AuthWorkflowPreview.vue`, `Login.vue`, `Register.vue`, and cohesive user-domain form components. Include review-required token-correlated 401 cleanup in `api/request.ts`, generation-ordered registration settings in the auth store, accessible label/error/focus wiring, and a registration-side bcrypt 72-byte guard without changing backend code. Success requires settings initialization to remain distinct from closed registration, one shared action lock per page, exact password-policy guidance, a clean `npm run build`, and a scoped local commit with updated durable state. Router and callback wiring remain for Slice C.

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
