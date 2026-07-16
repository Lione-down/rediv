# TASK-T5-074 Plan

- State: `DONE`
- Objective: deliver an authenticated logout boundary and one reusable account menu across all authenticated application shells.

## Visual thesis

- Preserve the existing graphite dark shell and quiet violet interaction language.
- Use account identity as the compact trigger and reserve explicit danger styling for the logout row.
- Keep the menu small, keyboard-native, and responsive rather than adding another toolbar or settings page.

## Delivery sequence

1. Add backend RED tests for missing bearer, invalid bearer, valid user logout, and banned-user rejection.
2. Require `current_user` on `POST /auth/logout` and return a typed acknowledgement without claiming persistent token revocation.
3. Add frontend RED coverage for menu discovery, authenticated request ordering, route replacement, failure cleanup, repeated-click guard, and mobile fit.
4. Add one shared `AccountSessionMenu` using existing Naive UI, Lucide, scoped SCSS, and V2 tokens.
5. Reuse the menu in Home, AppTopBar, Canvas, and Admin while preserving each shell's existing navigation hierarchy.
6. Run focused backend and browser tests, build once, then inspect desktop and 375px output from that build.
7. Perform a fresh diff, UTF-8, file-size, sensitive-path, and untracked-ownership review.
8. Update PROGRESS, CURRENT, ROADMAP, and REPORT only after all non-deferred criteria pass.

## CSS strategy

- Existing Vue scoped SCSS and project design tokens only.
- Reuse the existing radius, surface, text, accent, danger, focus, and 40px control roles.
- No new CSS framework, global token family, gradient, glass effect, or decorative animation.

## Verification

```powershell
python -m unittest backend.tests.test_password_auth_contract
cd frontend
npx playwright test tests/e2e/logout-session.spec.ts tests/e2e/t5-010-page-ux.spec.ts
npm run build
```

- Inspect the shared menu at 1440x900 and 375x812 on representative Home, Canvas, and Admin shells.
- Confirm the logout request carries Authorization, local storage is cleared even on server failure, and protected history does not remain active.
- Run `git diff --check`, changed-file line counts, UTF-8 decode, and sensitive-path audits.

## Stop rule

- Do not expand this Task into refresh tokens, persistent revocation, new database state, account security settings, or provider logout without a separate product and architecture decision.
