# TASK-T5-074 - Authenticated logout and global session exit

- State: `DONE`
- Objective: add a discoverable logout option across every authenticated Revid shell, require a valid bearer session at the backend logout boundary, and always clear browser session state safely.

## Scope

- Change `POST /auth/logout` from anonymous acknowledgement to an authenticated current-session acknowledgement.
- Keep the existing stateless bearer-token contract honest: this Task does not claim server-side revocation or all-device logout.
- Make the frontend send the current bearer token before local teardown, then clear local auth state in a `finally` path even when the endpoint is unavailable or rejects an expired token.
- Add one shared account/session menu and reuse it in Home, AppTopBar, Canvas, and Admin shells.
- Redirect to `/login` with history replacement after logout so protected content is not left as the active route.
- Preserve existing project, asset, template, canvas, and revision store token-change reset behavior.

## Non-goals

- Refresh tokens, persistent token blacklist, all-device logout, password changes, account deletion, provider logout, session management UI, backend schema changes, or a new visual language.

## Acceptance criteria

- `POST /auth/logout` returns success only for a valid active bearer session and rejects missing, invalid, or banned sessions through the existing auth dependency.
- The frontend logout action reaches the backend while the current token is still available, clears local token/user/quota state on success and failure, and cannot be double-submitted.
- Home, legacy Workspace, canonical Canvas, Space, and Admin expose a keyboard-accessible logout action through the shared account menu.
- Selecting logout closes the session and replaces the current route with `/login`.
- Account identity, danger semantics, focus visibility, 40px targets, reduced motion, long localized names, and 375px layout remain usable.
- Focused backend tests, focused Playwright tests, frontend build, desktop and 375px browser inspection, diff, UTF-8, file-size, and sensitive-path audits pass.

## Risks and guards

- Clearing local state before the request would strip the Authorization header. The request must run while the token is present, with cleanup in `finally`.
- An acknowledgement-only endpoint must not be described as persistent revocation. UI copy says `退出登录`, not `撤销所有会话`.
- Shared shell integration must not duplicate menu behavior or alter Canvas graph state.
- No `.env`, paid provider, database migration, destructive operation, or external account is needed.
