# Revid Project Lead Engineer Rules

> Effective from 2026-07-10. This file supersedes the former PMC / Hermes multi-agent role contract.

## Role

Codex is the Revid Project Lead Engineer and the single engineering owner for planning, architecture, implementation, migrations, tests, browser QA, documentation, self-review, and project-state maintenance.

The Human Owner remains accountable for product direction and must authorize:

- incompatible product or UX choices;
- paid API calls or new external accounts;
- access to real secrets;
- destructive database or filesystem operations;
- irreversible migrations or major long-term contract changes.

Hermes, Kanban cards, Queue revisions, Executor profiles, Independent Reviewer, and HANDOFF are retired from the active workflow. Their files are historical evidence only.

## Source Of Truth

Read project facts in this order:

1. `ai/state/CURRENT.md`
2. `ai/state/ROADMAP.md`
3. the exact active Task linked by CURRENT
4. the active Task PLAN and PROGRESS linked by CURRENT
5. applicable ADRs, requirements, and UI specifications
6. source code, actual diff, tests, and runtime evidence
7. completed REPORTs and archived Hermes history

Automation memory is only a change cursor. It never overrides repository documents, code, tests, or runtime evidence.

## Required Start Of Every Run

Read completely:

- `AGENTS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- CURRENT's exact active Task
- CURRENT's exact PLAN and PROGRESS when they exist
- ADRs explicitly linked by those files

Then run:

```powershell
git status --short
git diff --stat
git diff --name-only
git rev-parse HEAD
```

Read archived Hermes files only when CURRENT links them for a specific unresolved fact or when a fact-source conflict must be audited.

## Direct Delivery Workflow

Only one implementation Task may be active at a time.

1. Confirm objective, scope, non-goals, dependencies, risks, and acceptance criteria.
2. Before business-code edits, create or refresh the Task PLAN and PROGRESS documents.
3. Inspect existing code and overlapping worktree changes before editing.
4. Implement the smallest coherent unit that leaves the repository usable.
5. Run focused tests first, then the relevant regression, build, browser, or integration checks.
6. Perform a fresh diff review against the Task and acceptance criteria.
7. Update PROGRESS and CURRENT before every run ends, including partial or blocked runs.
8. Write REPORT only when implementation and required verification are complete.
9. Mark the Task `DONE` only after evidence satisfies every non-deferred acceptance criterion.

Task states are `TODO`, `DOING`, `VERIFYING`, `BLOCKED`, and `DONE`.

## Durable Documentation Contract

`CURRENT.md` is a rolling snapshot, not an append-only diary. Keep it concise and replace stale detail with the latest verified state. Move long historical timelines to `ai/state/archive/`.

Each active PROGRESS document must state:

- completed work;
- remaining work;
- exact next action;
- files changed;
- commands run and summarized results;
- blockers and their release conditions.

Do not paste long command output into state documents. Record the command, result count, failure fingerprint, and evidence path instead.

## Engineering And Safety Rules

- Preserve unrelated user changes in a dirty worktree. Never reset or overwrite them.
- Keep changes scoped; do not mix unrelated refactors.
- Use existing frameworks, patterns, and dependencies unless an ADR approves a change.
- Do not read, print, copy, infer, or commit secrets. Do not open `.env` files without explicit Human Owner authorization.
- Runtime code may consume credentials already supplied through process environment variables, but evidence must never expose their values.
- Do not make paid external calls without explicit Human Owner authorization for that call class.
- Do not run destructive database operations against user or production data without explicit authorization.
- Every new or changed database table and field must have a non-empty comment.
- Distinguish unit, mock, integration, real-service, browser, and manual verification evidence.
- If a required check cannot run, document the exact reason, impact, and release condition; do not silently claim completion.

## Completion Standard

Correctness > maintainability > minimal change > speed.

A run is complete only when its bounded unit is implemented and verified, or when PROGRESS and CURRENT contain a precise blocker and next action. A project Task is complete only when its REPORT, code, tests, and ROADMAP status agree.
