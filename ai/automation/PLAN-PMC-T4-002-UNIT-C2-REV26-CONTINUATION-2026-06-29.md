# T4-002 Unit C2 Revision 26 Continuation Publication Plan

## Goal

Publish one fresh bounded continuation after the accepted Hermes atomic dispatch runtime fix, without reusing or mutating revision `-25` cards.

## Scope

1. Verify revision `-25` is terminal and has no active worker.
2. Verify the business Allowed Files have no unknown working-tree modification.
3. Record PMC continuation approval and inherited failure fingerprints.
4. Create the revision `-26` Task with fresh dispatch/executor keys.
5. Synchronize CURRENT, ROADMAP and the parent T4-002 Task.
6. Write the executable Queue revision last and run `git diff --check`.

## Non-goals

- Do not create, claim, promote, unblock, reparent, retry or delete Hermes cards.
- Do not modify `HERMES-EXECUTION-STATUS.md`.
- Do not modify business code, tests or databases.
- Do not resume or invoke the Hermes cron from this publication task.

## Success Criteria

- Exactly one Queue revision is `APPROVED` and points to an existing revision `-26` Task.
- Revision `-26` uses fresh cards/keys and inherits all fingerprints through revision `-25`.
- The Executor scope, verification and stop condition are independently verifiable.
- `git diff --check` passes for all governance files written in this publication.
