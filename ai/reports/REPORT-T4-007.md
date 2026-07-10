# REPORT T4-007 - Login/Register UI And Route/Session Guards

- Status: `PASS`
- Completed: 2026-07-11
- Owner: Codex Project Lead Engineer
- Delivery mode: `CODEX_DIRECT_DELIVERY`

## Outcome

Revid now has v3 dark-design password login and registration entry points, registration-mode-aware availability, deterministic session restoration, authenticated and Admin route guards, safe local redirects, guest entry, and race-safe WeChat callback handling without changing backend contracts.

All non-deferred acceptance criteria passed. The separately scoped backend direct-API bcrypt 72-byte trust-boundary guard remains a security follow-up; the T4-007 UI already rejects passwords over that UTF-8 boundary.

## Implementation

| Area | Delivered |
|---|---|
| Auth API/types | Backend-aligned registration settings, password login/register/logout, guest, current-user, and nullable identity contracts. |
| Auth store | Ordered settings loads, password actions, token-keyed `/me` deduplication, transient-failure preservation, guest boundary, authoritative local logout, and race-safe WeChat state. |
| Request interceptor | A delayed 401 clears auth only when the failed bearer still matches the current session. |
| Login/register UI | Scoped dark auth shell, responsive workflow preview, accessible password forms, loading/error/closed/invitation states, settings-aware entries, and 72-byte UI validation. |
| Router | `/login` and `/register`, restoration-aware `requiresAuth`/`requiresAdmin`, and sanitized post-auth destinations. |
| WeChat callback | Browser-bound state requirement, current-attempt correlation, stale-completion rejection, safe return destinations, and existing-session preservation on failure. |

## Verification

### Automated And Build Checks

| Check | Result |
|---|---|
| `npm exec vue-tsc -- --noEmit -p tsconfig.app.json` | PASS |
| `npm run build` | PASS; 4,649 modules transformed |
| `backend/.venv/Scripts/python.exe -m unittest tests.test_password_auth_contract` | PASS; 11 tests |
| Mocked headed real-router matrix from Slice C | PASS; 16/16 scenarios, zero console errors/warnings |
| Cumulative Task diff scope and `git diff --check` | PASS |
| Redacted frontend credential/console/`.env` scan | PASS; zero findings |

### Real Local-Backend Browser Matrix

The acceptance backend was a real FastAPI process using an isolated SQLite database under the untracked evidence directory. It started from a working directory without a `.env`, used disposable process-only QA credentials, made no paid or external calls, and did not access the existing MySQL service.

| Scenario | Result |
|---|---|
| Admin username login | PASS; reached the protected Workspace and Admin dashboard |
| Wrong password | PASS; remained on login with localized invalid-credential feedback |
| Admin refresh and logout | PASS; protected refresh retained the session; browser-context store logout removed the token and identity |
| Open registration | PASS; a normal user was created through the real API and landed on the requested Space route |
| Normal-user email login | PASS; restored the protected Space destination |
| Admin/user guards | PASS; Admin reached `/admin`; a normal user was redirected from `/admin` to `/` |
| Invalid stored token | PASS; real `/me` returned 401, the token was cleared, and navigation returned to login with a local redirect |
| Closed registration | PASS; direct `/register` showed an explicit closed state and no form; login hid the registration link |
| WeChat settings | PASS; enabled state showed the entry, disabled state hid it, and guest remained available |
| WeChat mock callback | PASS; backend-signed state completed once, cleared pending state, established auth, and returned to Workspace |
| Guest entry | PASS; created a guest session without an account token |
| Settings restoration | PASS; the QA backend returned to original `invite_only` plus WeChat-enabled settings before shutdown |

Clean positive-flow sessions reported zero browser console errors or warnings. The wrong-password and invalid-token negative sessions each recorded only the expected browser failed-resource event for HTTP 401. Backend/frontend runtime log scans contained zero error-like hits.

### Responsive And Visual Acceptance

| Check | Result |
|---|---|
| 1440x900 auth checks | PASS; no horizontal overflow, localized copy fit, settled entry animation, and correct hierarchy |
| 375x812 auth checks | PASS; form-first order, no horizontal overflow, 44px primary/provider buttons, and 40px registration link |
| 375x812 protected Workspace login/refresh | PASS; no overflow and no login heading after restoration |
| Visual inspection | PASS; desktop/mobile login and closed-registration captures showed no clipping or responsive regression |

Canonical screenshot evidence:

- `output/playwright/t4-007-slice-d/run-20260711-qa/desktop-login.png`
- `output/playwright/t4-007-slice-d/run-20260711-qa/desktop-admin-dashboard-1440.png`
- `output/playwright/t4-007-slice-d/run-20260711-qa/desktop-normal-user-space.png`
- `output/playwright/t4-007-slice-d/run-20260711-qa/desktop-register-closed-settled-1440.png`
- `output/playwright/t4-007-slice-d/run-20260711-qa/mobile-login-375.png`
- `output/playwright/t4-007-slice-d/run-20260711-qa/mobile-normal-user-workspace-375.png`
- `output/playwright/t4-007-slice-d/run-20260711-qa/mobile-register-closed-375.png`

## Acceptance Criteria

| Criterion | Verdict |
|---|---|
| Login success, wrong password, closed registration, invalid token, and Admin/user guards | PASS |
| Protected refresh restores session without bouncing through the wrong page | PASS |
| WeChat and guest entries follow the backend settings/contract | PASS |
| Production build | PASS |
| 1440x900 and 375px browser checks | PASS |

## Safety And Residual Work

- No repository `.env` or secret file was opened by the acceptance runtime.
- No credential value, bearer token, Authorization header value, or secret-bearing URL was written to tracked docs or logs.
- No backend file, database schema, existing MySQL data, Home, Space, Workspace, or global design token was modified.
- No paid Agnes or real external WeChat call was made.
- Backend registration still needs a separately scoped validation and contract test for passwords over 72 UTF-8 bytes; this is not a deferred T4-007 acceptance criterion because backend changes were explicitly forbidden here.

## Final Verdict

`T4-007 DONE - PASS`. T4-008 is dependency-ready and activated for docs-only planning; no T4-008 business code was started in this closeout.
