# T4-004 Direct Delivery Plan

## Goal

Add secure username/email password authentication, registration-mode enforcement, and an idempotent Admin bootstrap while preserving existing WeChat identities and login behavior.

## Implementation Units

1. Audit current Auth routes, security helpers, schemas, User model, DatabaseStore methods, settings, migrations, requirements, and tests; record a field/endpoint/compatibility gap matrix.
2. Add failing tests for username/email uniqueness, password policy and hashing, wrong password, open/invite-only/closed registration, banned/frozen behavior, non-sensitive settings, legacy WeChat users, and idempotent Admin seed.
3. Implement the additive User schema and Alembic revision with non-empty table/field comments and compatibility for nullable password hashes.
4. Implement bcrypt helpers, login/register/settings endpoints, store methods, and explicit client-side logout semantics without token-revoke claims.
5. Implement `scripts/seed_admin.py` using process environment only, with no default password and idempotent behavior.
6. Preserve and test WeChat behavior; use `httpx` for retained real mode, make only the three-file frontend callback exception needed to carry and validate backend-signed OAuth `state`, and report any real OAuth verification that remains externally blocked.
7. Run focused Auth tests, safe backend regression, compile checks, migration review, secret scan, and authorized MySQL acceptance before writing REPORT.

## Non-Goals

- No forgot-password, reset-password, email delivery, SMS, general frontend Auth UI beyond the scoped WeChat callback exception, Agnes, Canvas, or quota product redesign.
- No server-side token revocation in this Task.
- No destructive database operation.

## Human Gates

- Implementing the approved additive migration is in scope.
- Applying it to `revid_db` requires a fresh migration diff/rollback review before execution; stop if the migration is destructive or changes an unapproved long-term contract.
- Real WeChat credentials or external-account interaction require explicit Human Owner authorization.

## Completion

All Auth acceptance criteria, focused tests, safe regression, migration/comment checks, and non-secret runtime evidence must pass before `REPORT-T4-004.md` is written and T4-004 is marked DONE.
