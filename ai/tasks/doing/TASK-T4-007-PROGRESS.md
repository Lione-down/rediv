# T4-007 Progress - Login/Register UI And Route/Session Guards

Last updated: 2026-07-11

## State

- Before this run: `DOING`
- Current: `DOING`
- Completed bounded units: Slice A, auth foundation; Slice B, login/register UI; Slice C, routing, recovery, and callback
- Next bounded unit: Slice D, full browser acceptance and Task closure
- Starting branch: `main`
- Base HEAD: `7a558918efd6a80cc0b8d88fcb4a1301ff353ed6`
- Pre-existing staged/modified files: none
- Pre-existing untracked files: `frontend/.playwright-cli/` only; known Slice B verification artifacts, excluded from delivery staging.
- Unmerged paths or in-progress Git operation: none

## Completed Work

- Read the required operating documents, Task, direct-delivery ADR, and applicable T4-006 design-system evidence.
- Confirmed CURRENT, ROADMAP, Task, and automation memory agree that T4-007 is the only dependency-ready active Task and has no Human blocker.
- Audited the existing frontend router, auth store/API/types, request interceptor, App startup restoration, WeChat callback, Home auth entry, layout patterns, design tokens, Naive UI provider, and frontend build configuration.
- Audited the backend auth schemas and endpoint behavior without modifying backend code.
- Resolved the guest-visibility contract conservatively: the backend exposes no guest settings flag and always exposes `POST /auth/guest`, so the frontend will not invent a setting or broaden Task scope.
- Locked the auth-page direction to the existing T4-006 dark palette, scoped SCSS, asymmetric desktop layout, and 375px form-first collapse.
- Created this PLAN and PROGRESS before any frontend business-code edit.
- Completed Slice A auth foundation:
  - added nullable password/WeChat identity fields, registration settings, password payload, and guest-session types;
  - added public settings, password login/register, logout, and typed guest API calls;
  - added settings request deduplication, password actions, guest expiry, authoritative local logout, and idempotent `/me` restoration to the Pinia store;
  - prevented registration-link flash before settings load, preserved valid tokens on transient restoration failures, and ignored stale `/me` responses after identity changes.
- Completed a fresh deep diff review across base, security, architecture, and adversarial concerns; four state/concurrency issues found during review were fixed and no hard stop remains.
- Verified the final Slice A implementation with the frontend production build and the existing backend password-auth contract suite.
- Reconstructed the 2026-07-11 run from the required direct-delivery documents and confirmed the repository began clean on `main` at `99ebd1faa1125554b8d5a66bb6691c7825f0e8fd`.
- Refreshed the PLAN before Slice B business-code edits with the exact dark palette, typography, layout, component-state, accessibility, responsive, and guest/WeChat contract constraints.
- Completed Slice B login/register UI:
  - added a scoped dark `AuthShell` and semantic workflow preview with desktop asymmetry, mobile form-first DOM order, safe-area spacing, reduced-motion handling, and no global token changes;
  - added username/email password login with localized validation, shared action locking, settings-aware registration/WeChat entries, and a guest identity boundary that refuses to mix an existing or restoring account session with guest browsing;
  - added registration loading, error, open, invitation-only, closed, and unknown-mode states plus a focused `RegisterForm` with localized server errors and a UTF-8 72-byte password guard;
  - made server-reported registration-mode drift authoritative in Pinia before forced refresh and invalidated older in-flight settings responses, so neither a failed refresh nor a delayed stale response can reopen the form;
  - associated labels, errors, required/invalid state, and first-invalid-field focus programmatically, with strengthened field/focus contrast and 40px minimum interactive targets.
- Hardened the Axios 401 interceptor so a delayed failure only clears the session whose bearer token actually failed; a browser race proved an old-token 401 cannot clear a newly established session.
- Completed fresh security, architecture, accessibility, and visual reviews; all Slice B findings were fixed. The backend direct-API bcrypt 72-byte boundary remains a documented follow-up because backend edits are forbidden in T4-007.
- Completed Slice C routing, recovery, and callback:
  - added `/login` and `/register`, protected Workspace/Space with `requiresAuth`, and required both restored auth and Admin role for every Admin route;
  - made the router the navigation decision point for session restoration while deduplicating direct App/router/Home `/me` callers and suppressing legacy App restoration during the callback route;
  - added one post-auth local-path resolver that preserves safe path/query/hash targets and rejects external, protocol-relative, backslash, control-character, auth-entry loop, and post-normalization double-slash targets;
  - carried the safe destination through password login, registration, and the session-backed WeChat round trip;
  - required a non-empty browser-bound stored WeChat state before exchange, correlated completion to the still-current OAuth attempt, ignored stale success/failure, and preserved an existing valid account session on callback errors or mismatches.
- Fixed two browser-discovered lifecycle races: concurrent App/router `/me` calls now share one token-keyed request, and callback startup cannot clear OAuth state or redirect before the callback component validates them.
- Completed deep security, architecture, concurrency, and adversarial reviews; login-CSRF, normalized redirect, duplicate-callback ordering, stale completion, arbitrary callback logout, and callback/App restoration findings were fixed, and final specialist rereviews were clean apart from an acknowledged low-risk router/view import-cycle advisory that is not expanded outside this Task's allowed paths.

## Remaining Work

1. Run Slice D browser acceptance against the local backend for password success/failure, closed registration, invalid token, Admin/user guards, refresh restoration, WeChat visibility/callback, guest entry, and logout at 1440x900 and 375px.
2. Capture the required screenshots, complete the final diff review, write REPORT, and align Task/ROADMAP/CURRENT only after every non-deferred acceptance criterion passes.
3. Carry the backend direct-API 72-byte password boundary into a separately scoped backend security follow-up before final auth hardening is considered complete.

## Exact Next Action

Run the complete Slice D local-backend acceptance matrix at 1440x900 and 375px with real local Admin and normal-user sessions, including screenshots and console/overflow checks; then perform the final review and close T4-007 only if every non-deferred acceptance criterion passes.

## Files Changed

- `frontend/src/router/index.ts` - wires auth routes, route metadata, restoration-aware guards, and normalized safe redirect resolution.
- `frontend/src/store/auth.ts` - deduplicates token-keyed `/me` calls, carries WeChat redirect state, suppresses callback restoration races, and correlates callback completion to the active attempt.
- `frontend/src/views/app/WechatCallback.vue` - requires browser-bound state, preserves valid sessions on failure, and applies only current callback completions.
- `frontend/src/views/user/Login.vue` - preserves safe post-login and WeChat destinations and passes them to registration.
- `frontend/src/views/user/Register.vue` - preserves the safe destination when returning to login.
- `frontend/src/views/user/components/RegisterForm.vue` - preserves the safe destination after registration.
- `ai/tasks/doing/TASK-T4-007-PLAN.md` - records the Slice C bounded-unit contract.
- `ai/tasks/doing/TASK-T4-007-PROGRESS.md` - records Slice C implementation, verification, review, and the next action.
- `ai/state/CURRENT.md` - advances the rolling snapshot to completed Slice C and Slice D next.

## Commands And Summarized Results

- Required document reads: PASS; active Task is T4-007, dependencies are complete, PLAN/PROGRESS were absent, and no Human blocker is active.
- 2026-07-11 required document and Git baseline reads: PASS; T4-007 remains the only active Task, `main` is clean at `99ebd1faa1125554b8d5a66bb6691c7825f0e8fd`, and no staged, untracked, unmerged, detached, or in-progress Git-operation state exists.
- Slice B source and design inspection: PASS; the public settings null/loading/error/closed states must remain distinct, all auth actions require a shared cross-action lock, the exact password policy is eight characters with a letter and number, and scoped auth colors must use the documented dark values rather than the light root variables.
- Git baseline commands: PASS; clean `main`, HEAD `c68177a3c376201944e0c6cebc40009b6db13d7b`, ahead of `origin/main` by three, with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- Frontend/auth searches and source reads: PASS; existing auth supports WeChat/guest and `/me`, but has no password API/store actions, no login/register routes, and no restoration-aware user guard.
- Backend contract reads: PASS; public settings are limited to `registration_mode,wechat_login_enabled`; login/register/guest/logout contracts match the Task plan.
- Design-system reads and reference survey: PASS; the implementation direction reuses existing dark-mode documentation and component vocabulary without global token changes.
- `npm run build` in `frontend`: PASS after implementation and again after review fixes; final run type-checked and built 4,634 modules with no error.
- `python -m unittest tests.test_password_auth_contract` with the global Python: SETUP FAILURE before test execution because `annotated_doc` is absent; no product assertion ran.
- `.venv/Scripts/python.exe -m unittest tests.test_password_auth_contract` in `backend`: PASS, 11 tests.
- Fresh deep review: PASS after fixes; no password/token logging or URL placement, no new dependency, no auth bypass, and no unresolved stale-response or transient-failure issue.
- `npm exec vue-tsc -- --noEmit -p tsconfig.app.json`: PASS after final Slice B fixes.
- Vite no-write multi-entry build for both views and all three local components: PASS, 4,576 modules.
- `npm run build` in `frontend`: PASS after final Slice B fixes, 4,634 modules.
- Headed Playwright Slice B checks at 1440x900 and 375px: PASS for settings open/invitation/closed/error states, localized bad-password behavior, duplicate-submit locking, form-first mobile order, keyboard skip/focus, no horizontal overflow, and no JavaScript exception.
- Focused Playwright adversarial checks: PASS; whitespace login made zero requests and focused the identifier, an existing account session blocked guest creation, a delayed old-token 401 preserved the new token/user, a 73-byte registration password made zero requests and focused the password, and server-closed mode persisted across navigation despite two failed settings refreshes.
- Mobile computed checks: PASS; brand and closed-state action measured 40px and 44px, with no 375px overflow.
- Post-review focused Playwright checks: PASS; a delayed pre-mismatch open-settings response could not replace the newer closed state or restore the form, keyboard focus on settings retry computed to a 3px solid `#a997ec` outline, and Login/Register forms exposed no duplicate form-level live region.
- Final specialist rereviews: CLEAN; security/concurrency, architecture/scope, and accessibility/visual reviewers reported no remaining actionable Slice B finding.
- `git diff --check`: PASS after the final code and durable-state updates.
- 2026-07-11 Slice C required reads and Git baseline: PASS; `main` started at `7a558918efd6a80cc0b8d88fcb4a1301ff353ed6`, index/modified/unmerged/Git-operation state was empty, and only the known `frontend/.playwright-cli/` artifact directory was untracked.
- `npm exec vue-tsc -- --noEmit -p tsconfig.app.json`: PASS after final Slice C fixes.
- `npm run build` in `frontend`: PASS after final Slice C fixes; typecheck and production build completed with 4,649 transformed modules.
- Headed Playwright mocked real-router matrix: PASS, 16/16 scenarios with zero console errors or warnings; covered anonymous protected/Admin redirects, invalid-token cleanup with one `/me`, valid refresh with one `/me` and no login flash, normal-user/Admin guards, authenticated auth-entry redirect, safe password/register destinations, six unsafe redirect classes, callback restoration suppression, browser-bound state, stale completion, failed-callback session preservation, and mismatch rejection without exchange.
- Fresh deep diff review and specialist rereviews: PASS; all confirmed security, normalized-path, lifecycle, stale callback, duplicate callback, and session-preservation findings were fixed. The remaining router/view helper import cycle is low-risk advisory only and avoids an out-of-scope new module.
- Final `git diff --check`: PASS after the durable-state update.

## Blockers And Release Conditions

- T4-007: no active blocker.
- Verification gap: no frontend unit-test runner exists. Slice C has focused mocked real-router behavioral evidence, but the Task-required local-backend desktop/mobile matrix and screenshots remain Slice D release evidence.
- Security follow-up: the browser UI rejects passwords over 72 UTF-8 bytes, but the backend direct registration API still lacks that trust-boundary guard. T4-007 cannot change backend; release condition for final auth hardening is a separately scoped backend validation and contract test.
- Worktree remainder: `frontend/.playwright-cli/` contains current-run Playwright CLI artifacts and is intentionally untracked. It must remain excluded from commits; removal requires Human confirmation under repository rules.
- Current-run verification artifacts under `output/playwright/t4-007-slice-c/` are also intentionally untracked and excluded from delivery staging; removal requires Human confirmation.
- T4-005 Unit B remains outside this Task and requires explicit Human Owner authorization for paid real Agnes smoke.
