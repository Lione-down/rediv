# Hermes Atomic DISPATCH_ONLY Fix Plan

## Goal

Eliminate the crash window where a `DISPATCH_ONLY` worker commits an Executor child but is killed before committing its own terminal transition, leaving the child permanently blocked by its parent.

## Root Cause

`kanban_create` and `kanban_complete` currently commit separate SQLite transactions. The LLM performs additional round-trips between those calls, while `enforce_max_runtime()` applies a hard wall-clock kill. A timeout after child creation but before parent completion therefore leaves `parent=blocked` and `child=todo` indefinitely.

## Scope

- Hermes runtime Kanban DB transaction path.
- Hermes `kanban_create` tool behavior for exact standalone `Action: DISPATCH_ONLY` workers.
- Targeted runtime regression tests and an isolated Kanban smoke.
- Revid governance report/progress documenting the runtime change.

## Non-goals

- No Revid business code, migration, tests or database changes.
- No mutation, release, retry, reparenting or deletion of rev25 cards `t_cc15e296` and `t_25ac2145`.
- No automatic publication of revision `-26`.
- No broad Hermes refactor or timeout tuning.

## Design

1. Extend the canonical task creation transaction with an internal atomic-dispatch option.
2. In that transaction, create/link the child, CAS-complete the running parent/run, reset its failure counter, and promote the child to `ready`.
3. If the idempotency key already resolves to an exact matching child, safely reconcile the still-running parent instead of creating a duplicate.
4. Reject mismatched child contracts, multiple children, wrong parent/run identity or non-`DISPATCH_ONLY` callers without changing state.
5. Make `kanban_create` select this path automatically only when the current worker owns the parent and the parent body contains standalone `Action: DISPATCH_ONLY`.

## TDD Sequence

1. RED: child create for `DISPATCH_ONLY` currently leaves parent running and child todo.
2. RED: injected failure during atomic dispatch must roll back child creation and preserve parent running.
3. RED: idempotent recovery must complete the same parent without duplicating the child.
4. GREEN: implement the minimal DB and tool changes.
5. REFACTOR: keep the completion primitive private and reuse it for fresh and idempotent paths.

## Verification

- Targeted DB and tool tests prove RED then GREEN.
- Existing Kanban DB/tool suites pass.
- Python compile checks pass.
- Isolated board smoke proves parent `done`, exactly one child `ready`, and no LLM `kanban_complete` dependency.
- Failure-injection smoke proves no committed child survives without the parent terminal transition.
- Installed CLI path runs the modified source.

## Success Criteria

- No observable state can contain a newly committed atomic-dispatch child whose parent remains running/blocked because completion was not committed.
- Normal non-dispatch `kanban_create` behavior remains unchanged.
- Existing rev25 evidence remains untouched.
- All targeted tests and isolated runtime smoke pass.

