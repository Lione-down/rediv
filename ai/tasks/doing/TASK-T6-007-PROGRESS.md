# TASK-T6-007 Progress

- State: `DOING`
- Verification outcome: `PENDING`
- Task: [TASK-T6-007](../todo/TASK-T6-007.md).
- Plan: [TASK-T6-007-PLAN](TASK-T6-007-PLAN.md).
- Activation date: 2026-07-23.
- Activation baseline: `082f01f238b896b2baac5afa35445f0fd4d8a0f7`.

## Completed Work

- T6-006 replacement workflow, architecture, rejected-code disposition, and T6-007 through T6-016 sequence received explicit Human approval.
- Activated T6-007 as the sole implementation Task.
- Scoped T6-007 to replacement RED contract tests and precise expected failure fingerprints only.

## Remaining Work

- Inspect overlapping source/tests and map contract ownership.
- Add backend compact/payload/semantic-reference/story-director RED contracts.
- Add browser rename/durable-generation/director/semantic-reference/same-card RED contracts.
- Run focused tests and eliminate infrastructure or unrelated failure noise.
- Review, document, commit, and push the verified RED characterization.

## Exact Next Action

In a new goal-mode Codex task, re-read the full active chain and existing test authorities, then implement Unit 0 and the smallest focused backend RED contract without changing production runtime behavior.

## Files Changed

- `ai/tasks/todo/TASK-T6-007.md` - activated Task contract.
- `ai/tasks/doing/TASK-T6-007-PLAN.md` - dependency-ordered RED test plan.
- `ai/tasks/doing/TASK-T6-007-PROGRESS.md` - activation and exact next action.
- `ai/state/CURRENT.md` and `ai/state/ROADMAP.md` - sole active Task reconciliation.

## Commands Run And Results

- T6-006 closure verification: project-state, diff, UTF-8/no-BOM, link, and scoped-path checks pass; Git delivery is pending.
- T6-007 runtime/test commands: not started.

## Blockers And Release Conditions

- No current blocker.
- Production implementation remains blocked until T6-007 RED failure surfaces are precise and T6-007 is completed.
