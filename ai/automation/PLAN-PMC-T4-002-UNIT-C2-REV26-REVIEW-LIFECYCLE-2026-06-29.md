# T4-002 Unit C2 Revision 26 Review Lifecycle Publication Plan

## Goal

After the revision 26 Executor reached `REPORT_READY`, publish one review-only lifecycle continuation that independently verifies the implementation and produces a canonical post-review HANDOFF only after Reviewer PASS.

## Scope

1. Validate the revision 26 Task, REPORT, actual Allowed Files diff and execution status.
2. Record the PMC queue decision and evidence cursor.
3. Extend the revision 26 Task with explicit Reviewer and HANDOFF-only contracts.
4. Synchronize CURRENT, ROADMAP and the parent T4-002 Task.
5. Publish revision `26r1` as the only executable Queue stage and run `git diff --check`.

## Non-goals

- Do not modify business code, tests, migration files or Executor artifacts.
- Do not modify `HERMES-EXECUTION-STATUS.md` or create/claim/promote/unblock any Hermes card.
- Do not repeat Executor work or create business attempt 2.
- Do not issue PMC PASS before Independent REVIEW and canonical HANDOFF exist.

## Success Criteria

- Exactly one Queue revision is `APPROVED`, with action `REVIEW_DISPATCH_ONLY` and the revision 26 Task path.
- Reviewer must independently rerun the required unit and real disposable-MySQL verification and audit REPORT/diff semantics.
- A dependent `HANDOFF_ONLY` stage may write the canonical HANDOFF only after Reviewer PASS.
- All governance changes pass `git diff --check`.
