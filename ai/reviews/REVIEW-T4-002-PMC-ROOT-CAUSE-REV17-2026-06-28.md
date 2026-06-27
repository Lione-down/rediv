# T4-002 PMC Root-Cause Review — Revision -17

## Verdict

`PMC_BLOCKED — INVALID_COMPARATOR_AND_STATE_CONFLICT`

PMC 已审阅 `ai/reports/ROOT-CAUSE-T4-002-PRE-DISPATCH-TIMEOUT-2026-06-28.md`，并直接只读核对 Kanban cards/runs。报告提出的 900s continuation 依据不成立，当前不发布 revision `-18`。

## Evidence Cursor

- Root-cause report hash：`45B368534CFD298CD0C53EF06E18662063F4BCA053EC39C0416ACD5190DA5E89`
- Hermes execution status hash：`CFE046B6AE87082B1A49AD78565F6733381F57A7141114314B290707F47B5654`
- Comparator：`t_1a9f1d32` run `#96`, profile `revid-pm`, elapsed `577s`, outcome `completed`
- Failed runs：`t_aeaefef4` run `#100` at `300s`; `t_3e1f6a06` run `#101` at `120s`
- Queue：`NONE — INFRASTRUCTURE_BLOCKED`
- Revision `-17` Executor / PLAN / PROGRESS / REPORT / Independent REVIEW / HANDOFF：`MISSING`

## Direct Kanban Findings

`hermes kanban --board revid show/runs ... --json` confirms:

1. `t_1a9f1d32` title is a Coordinator card, but run `#96` did not perform dispatch-only work. Its metadata and summary state that it ran both `py_compile` commands, executed `TestUnitB` (`7 passed`), created PLAN/PROGRESS/REPORT artifacts, and created Reviewer `t_6b4b7bc8`.
2. The card therefore combined Coordinator and Executor responsibilities. Its `577s` elapsed time is the duration of a combined business verification chain, not a measured pre-dispatch duration.
3. Run `#96` did not create a separate Backend Executor child. Its only child is the Reviewer. This is not the execution topology required by the operating model or revision `-17`.
4. Runs `#100` and `#101` only prove scheduler timeout before child creation at 300s and 120s. With `summary = null` and no step timing, they do not prove that pure dispatch requires 577s or that LLM inference is the concrete root cause.

## State Conflict

`HERMES-EXECUTION-STATUS.md` currently conflicts with canonical Queue and the execution state machine:

- `READY_FOR_CONTINUATION_REV17_ROOT_CAUSE_IDENTIFIED` is not an allowed execution state.
- It describes revision `-17` as `APPROVED`, while Queue marks it `TERMINAL_INFRASTRUCTURE_BLOCKED — NOT EXECUTABLE` and has no active revision.
- It states that PMC “must” create rev18, but Hermes evidence is advisory and cannot replace PMC Queue authorization.

PMC will not edit the Hermes-owned status file. Hermes Supervisor must correct it on its next legitimate state transition.

## Required Runtime Evidence

Hermes runtime owner must provide one of the following without creating or reusing a T4-002 business card:

1. A fresh same-profile dispatch-only probe with step timings for Queue read, Task read, idempotency lookup, profile resolution, Executor-card payload construction and dry-run validation; it must not run business tests or create Executor/Reviewer/HANDOFF cards.
2. Direct worker/Gateway instrumentation that identifies the blocking step in runs `#100/#101`, followed by a non-destructive validation of the corrected path.

Any proposed Coordinator budget must be derived from dispatch-only evidence with explicit margin. Historical combined-role run `#96` cannot be reused as that proof.

Expected output: `READY_FOR_CONTINUATION` or `STILL_INFRA_BLOCKED`, with exact evidence paths and timings.

## Prohibitions

- Do not publish, ACK or dispatch revision `-18`.
- Do not create a second revision `-17` Coordinator or reuse any historical card.
- Do not use `t_1a9f1d32` as proof of dispatch-only duration.
- Do not modify business code, migrations, tests, Executor artifacts, Independent REVIEW or HANDOFF.
- Do not read or output secrets and do not access any database.

## Human Decision

`NO`. This remains a Hermes runtime/role-separation problem.
