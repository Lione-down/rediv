# TASK-T5-077 Plan

- State: `DONE - PASS`
- Objective: deliver one additive durable progress slice from guarded MySQL schema through backend transaction/provider polling to shared Canvas and DOM presentation.

## Delivery sequence

1. Add RED migration tests for nullable progress columns, comments, check constraints, upgrade, and disposable downgrade.
2. Add RED schema/transaction/provider tests for null, monotonic valid provider progress, invalid/regressing input, persisting, failure/timeout preservation, and success at 100 after commit.
3. Add revision `e1f2a3b4c5d6` from verified head `d0e1f2a3b4c5`; do not apply it to user/runtime data.
4. Extend model, task serialization, creation/update helpers, and transaction boundaries with normalized nullable progress.
5. Keep image progress indeterminate through provider/persisting; capture only validated video provider percentage and retain the last monotonic value.
6. Extend frontend task parsing/types and runtime presentation with stage, optional percentage, truthful labels, and stable presentation keys.
7. Add the existing-slot 3 px Leafer track plus Inspector native determinate/indeterminate semantics and bounded Graph Access descriptions.
8. Add browser coverage for image indeterminate, video `12 -> 47 -> 83 -> 100`, invalid/missing/regressing input, persisting, failure, timeout, refresh, readonly, and reduced motion.
9. Run focused tests first, then full backend, related and full Chromium, build, migration/compile, visual, file-size, UTF-8, sensitive-path, and owned-diff gates.
10. Write REPORT/state closure, commit, and push only the verified T5-077 scope.

## Verification

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_generation_task_progress_migration.py backend\tests\test_canvas_generation_transactions.py backend\tests\test_generation_transaction_restart.py backend\tests\test_generation_provider_validation.py -q
cd frontend
npx playwright test tests/e2e/canvas-generation-progress.spec.ts tests/e2e/canvas-generation-run-history.spec.ts tests/e2e/canvas-generation-run-result.spec.ts tests/e2e/canvas-performance-accessibility.spec.ts
npm run build
```

Then run full backend and Chromium regression, backend compile/Alembic head checks, retained visuals, and hygiene audits.

## Stop rules

- Stop on Alembic head drift, backend contract incompatibility, required user/runtime migration, paid provider/secret need, concurrent Canvas ownership, or any design that fabricates progress.
