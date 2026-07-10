# T4-008 Progress - Real-Data Home Project And Asset Dashboard

Last updated: 2026-07-11

## State

- Before this run: `TODO`, dependency-blocked on T4-007
- Current: `DOING`
- Active bounded unit: Slice A, contract audit and project-domain foundation
- Starting branch: `main`
- Activation base HEAD: `6a676dad570baab36019726f58bead39bdfc4725`
- Pre-existing staged/modified files at activation: none
- Pre-existing untracked files: `frontend/.playwright-cli/` and `output/`; browser evidence only, excluded from delivery staging
- Unmerged paths or in-progress Git operation: none

## Completed Work

- Closed T4-007 as `DONE - PASS`, satisfying the T4-008 dependency.
- Confirmed T4-003 and T4-006 were already complete and ROADMAP order selects T4-008 next.
- Read the T4-008 Task and prepared PLAN/PROGRESS before any T4-008 business-code edit.
- Performed a planning-only surface scan:
  - `Home.vue` is 951 lines and contains fabricated `quickStarts` values;
  - real quota values already come from the auth store;
  - an existing asset API/store/type path is available for reuse;
  - authenticated backend `/projects` and `/assets` endpoints already exist.
- No T4-008 source file was modified in this activation run.

## Remaining Work

1. Complete Slice A source/contract audit and implement only the project-domain API/types/store foundation.
2. Complete Slice B Home decomposition and real-data state UI.
3. Complete Slice C real local-backend/MySQL cross-check, responsive browser acceptance, REPORT, and closure.

## Exact Next Action

Read the complete `frontend/src/views/app/Home.vue`, router, asset API/store/types, `backend/api/projects.py`, project schemas/store methods, and the existing Workspace project-ID consumption path; update PLAN if the contracts require it, then implement Slice A `frontend/src/modules/project/api.ts`, `types.ts`, and `store.ts` only, run focused typecheck/build, review the diff, update durable state, and create one scoped local commit.

## Files Changed

- `ai/tasks/todo/TASK-T4-008.md` - marks T4-008 active.
- `ai/tasks/doing/TASK-T4-008-PLAN.md` - records objective, scope, slices, acceptance mapping, risks, and gates.
- `ai/tasks/doing/TASK-T4-008-PROGRESS.md` - records activation evidence and the single next action.
- `ai/state/ROADMAP.md` - marks T4-008 `DOING` after T4-007 completion.
- `ai/state/CURRENT.md` - points the rolling project state to T4-008.

## Commands And Summarized Results

- Required T4-007 closeout verification: PASS; see `ai/reports/REPORT-T4-007.md`.
- T4-008 Task read: PASS; objective, scope, dependencies, AC, and forbidden paths are explicit.
- Planning surface scan: PASS; identified the 951-line Home, fabricated quick-start data, reusable asset domain, and existing backend project/asset routes.
- Git baseline: PASS; `main` at `6a676dad570baab36019726f58bead39bdfc4725`, no staged/modified/unmerged/Git-operation state, with only known untracked browser artifacts.

## Blockers And Release Conditions

- No active implementation blocker.
- Root-route behavior is a design-contract risk, not yet a Human gate. Release condition before changing it: reconcile the current public Home behavior with the Task's authenticated-dashboard objective and T4-007 guards from actual source.
- Real MySQL acceptance later requires an authorized runtime capability; do not read `.env` files or print credentials. If no safe runtime is available, record the exact verification blocker rather than substituting mock evidence.
- T4-005 Unit B remains a separate Human cost gate and is outside T4-008.
