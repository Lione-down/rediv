# T4-007 Progress - Login/Register UI And Route/Session Guards

Last updated: 2026-07-10

## State

- Before this run: `TODO`
- Current: `DOING`
- Completed bounded unit: Slice A, auth foundation
- Next bounded unit: Slice B, login/register UI
- Starting branch: `main`
- Base HEAD: `c68177a3c376201944e0c6cebc40009b6db13d7b`
- Pre-existing staged/modified/untracked files: none
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

## Remaining Work

1. Implement Slice B login/register pages, local auth shell, validation, and settings-aware alternate entries.
2. Implement Slice C routes, restoration-aware guards, safe redirect handling, and callback navigation.
3. Run browser acceptance at 1440x900 and 375px, then complete fresh review, REPORT, Task/ROADMAP closure, and final commit.

## Exact Next Action

Implement `frontend/src/views/user/components/AuthShell.vue`, `frontend/src/views/user/Login.vue`, and `frontend/src/views/user/Register.vue` against the completed auth store, then run `npm run build` before wiring routes.

## Files Changed

- `ai/tasks/doing/TASK-T4-007-PLAN.md` - created the decision-complete implementation and verification plan.
- `ai/tasks/doing/TASK-T4-007-PROGRESS.md` - created the active execution ledger and Git baseline.
- `frontend/src/types/auth.ts` - added backend-aligned auth/settings/payload types and nullable legacy identity fields.
- `frontend/src/api/auth.ts` - added typed settings, password auth, logout, and guest API contracts.
- `frontend/src/store/auth.ts` - added settings/session state, password actions, stale-response protection, and deterministic restoration/logout behavior.
- `ai/state/CURRENT.md` - transitions T4-007 to DOING and records Slice A evidence and the next unit.
- `ai/state/ROADMAP.md` - transitions the active T4-007 row to DOING.

## Commands And Summarized Results

- Required document reads: PASS; active Task is T4-007, dependencies are complete, PLAN/PROGRESS were absent, and no Human blocker is active.
- Git baseline commands: PASS; clean `main`, HEAD `c68177a3c376201944e0c6cebc40009b6db13d7b`, ahead of `origin/main` by three, with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- Frontend/auth searches and source reads: PASS; existing auth supports WeChat/guest and `/me`, but has no password API/store actions, no login/register routes, and no restoration-aware user guard.
- Backend contract reads: PASS; public settings are limited to `registration_mode,wechat_login_enabled`; login/register/guest/logout contracts match the Task plan.
- Design-system reads and reference survey: PASS; the implementation direction reuses existing dark-mode documentation and component vocabulary without global token changes.
- `npm run build` in `frontend`: PASS after implementation and again after review fixes; final run type-checked and built 4,634 modules with no error.
- `python -m unittest tests.test_password_auth_contract` with the global Python: SETUP FAILURE before test execution because `annotated_doc` is absent; no product assertion ran.
- `.venv/Scripts/python.exe -m unittest tests.test_password_auth_contract` in `backend`: PASS, 11 tests.
- Fresh deep review: PASS after fixes; no password/token logging or URL placement, no new dependency, no auth bypass, and no unresolved stale-response or transient-failure issue.

## Blockers And Release Conditions

- T4-007: no active blocker.
- Verification gap: no frontend unit-test runner exists and Slice A has no standalone browser surface; release condition remains the Task-required real browser scenarios after Slice B/C before claiming behavioral completion.
- T4-005 Unit B remains outside this Task and requires explicit Human Owner authorization for paid real Agnes smoke.
