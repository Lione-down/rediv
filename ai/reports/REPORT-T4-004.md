# REPORT T4-004 - Password Authentication And Admin Bootstrap

- Status: `PASS`
- Completed: 2026-07-10
- Owner: Codex Project Lead Engineer
- Delivery mode: `CODEX_DIRECT_DELIVERY`

## Outcome

Revid now supports username/email password registration and login, registration-mode enforcement, explicit client-side logout semantics, and an idempotent environment-driven Admin bootstrap. Existing WeChat identities remain compatible and do not require a password.

The shared MySQL database `revid_db` was migrated from Alembic revision `a1b2c3d4e5f6` to `b7d4c2e9f001`. Runtime health now reports `mysql`, connected, ready, and revision-matched at the new head.

## Implementation

| File | Change |
|---|---|
| `backend/api/auth.py` | Added password register/login/logout, public registration settings, signed WeChat OAuth state issuance, and callback state validation. |
| `backend/api/admin.py` | Hardened dev-login so it fails closed without a password-backed bootstrapped Admin. |
| `backend/controllers/store.py` | Added username/email/password lookup, password hash persistence, registration checks, Admin bootstrap, and non-leaking serialization. |
| `backend/core/security.py` | Added bcrypt password policy, hashing, and verification helpers using the existing signed-token primitives for OAuth state. |
| `backend/models/user.py` | Added nullable `username`, `email`, and `password_hash` fields with comments while preserving WeChat-only users. |
| `backend/schemas/auth.py` | Added password Auth request/response schemas and exposed nullable username/email without `password_hash`. |
| `backend/settings/config.py` | Added explicit Admin bootstrap settings. |
| `backend/database.py` | Kept legacy SQLite files compatible by upgrading missing T4-004 columns before store reads. |
| `backend/migrations/env.py` | Kept Alembic URL resolution aligned with live runtime settings. |
| `backend/migrations/versions/b7d4c2e9f001_add_password_auth_columns_to_users.py` | Added nullable auth columns, comments, and unique username/email indexes. |
| `backend/scripts/seed_admin.py` | Added env-only, idempotent Admin seeding with no default password. |
| `backend/scripts/migrate_sqlite_to_mysql.py` | Updated same-PK comparison to tolerate target-only nullable auth columns. |
| `backend/tests/*` | Added and updated Auth, Admin, WeChat, migration, health, store, quota, invitation, asset, and runtime regression coverage. |
| `frontend/src/api/auth.ts` | Threaded backend-issued WeChat OAuth state through the client API contract. |
| `frontend/src/store/auth.ts` | Persisted the backend-issued signed OAuth state token. |
| `frontend/src/views/app/WechatCallback.vue` | Rejected callback state mismatches before posting to the backend. |

## Verification

### Automated Tests

| Verification | Result |
|---|---|
| `backend/.venv\Scripts\python.exe -m compileall .` | passed |
| `backend/.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"` | 172 passed |
| `npm run build` in `frontend/` | passed |
| Disposable SQLite `alembic upgrade head` | passed in prior T4-004 reconciliation |
| `git diff --check` | passed during final closeout; LF-to-CRLF warnings only |

### Shared MySQL Migration

| Check | Result |
|---|---|
| Target database | `revid_db` |
| MySQL version | `8.0.43` |
| Pre-migration revision | `a1b2c3d4e5f6` |
| Pre-migration auth columns/indexes | absent |
| Migration review | additive nullable columns plus unique indexes; no data rewrite, drop, truncate, delete, downgrade, or reset |
| `alembic upgrade head` | passed |
| Post-migration revision | `b7d4c2e9f001` |
| Auth columns | `username`, `email`, `password_hash` nullable with non-empty comments |
| `generation_status` comment | `Generation status: enabled/frozen` |
| Auth indexes | `ix_users_username`, `ix_users_email`, both unique |
| Non-bcrypt non-null `password_hash` count | `0` |

### Runtime Acceptance

| Check | Result |
|---|---|
| `/health` | `200`, `status=ok` |
| Health database state | `dialect=mysql`, `connected=true`, `ready=true`, `alembic_match=true` |
| Health revisions | `b7d4c2e9f001` / `b7d4c2e9f001` |
| `/auth/registration-settings` | `200`, keys limited to `registration_mode,wechat_login_enabled` |
| Invalid password login smoke | `401`, no write required |

## Acceptance Criteria

| Criterion | Verdict |
|---|---|
| Registration modes, duplicate username/email, weak password, wrong password, banned/frozen behavior have tests | PASS |
| Admin seed has no hardcoded password and is idempotent | PASS |
| Auth responses, logs, and ordinary DB inspection do not expose plaintext password | PASS |
| Legacy WeChat records can continue without password | PASS |
| All backend tests pass | PASS |
| Shared MySQL schema has auth columns, comments, and unique indexes | PASS |

## External Verification

Real WeChat OAuth end-to-end verification remains a Human Owner credential/external-account gate. The retained real-mode code path is covered by mocked `httpx` exchange tests, signed state issuance/validation tests, and frontend callback build verification. This report does not claim a real WeChat provider smoke.

## Safety

- No `.env` file was opened or printed.
- Runtime commands consumed `REVID_TEST_MYSQL_ADMIN_URL` from process environment and did not output the URL or password.
- No credential, token, Authorization header, or secret-bearing URL was written to project docs.
- No paid external API was called.
- No destructive database operation, downgrade, reset, or cleanup was executed against `revid_db`.

## Final Verdict

`T4-004 DONE - PASS`. T4-011 is dependency-ready.
