# Revid Codex Direct Delivery Operating Model

## Purpose

Allow scheduled Codex runs to continue the project with minimal repeated context while preserving implementation quality and Human Owner control over high-impact decisions.

## Ownership

- Human Owner: product, cost, secret, external-account, destructive, irreversible, and major contract decisions.
- Codex Project Lead Engineer: all normal planning, implementation, testing, self-review, reporting, and project-state work.
- Hermes: retired; historical evidence only.

## Required Read Set

Every run must completely read:

1. `AGENTS.md`
2. this operating model
3. `ai/state/CURRENT.md`
4. `ai/state/ROADMAP.md`
5. CURRENT's exact Task
6. CURRENT's PLAN and PROGRESS when present
7. ADRs explicitly linked from those active documents

Then inspect `git status --short`, `git diff --stat`, `git diff --name-only`, `git diff --cached --name-status`, `git diff --name-only --diff-filter=U`, `git branch --show-current`, and `git rev-parse HEAD`.

Do not routinely read `ai/state/archive/`, `ai/automation/archive/`, old Hermes REPORTs, old REVIEWs, or old HANDOFFs. Read one only when an active document links it for a concrete unresolved fact.

## Run Algorithm

### 0. Single-Flight Guard

Before any repository write, use the Codex task list when available to detect another older active/running instance of this same automation. If more than one same-controller run is active, the newest run must make no filesystem or Git change and return `IDLE` as the concurrency guard. The older run retains ownership.

If task-list inspection is unavailable, do not fail solely for that reason; rely on the starting branch/HEAD/index snapshot and recheck them before staging and commit. Any unexplained drift is a blocker.

### 1. Reconstruct State

Verify that CURRENT, ROADMAP, Task, PLAN, and PROGRESS agree on:

- active Task and state;
- objective and scope;
- completed work;
- remaining work;
- exact next action;
- blockers and Human gates.

If they conflict, repair project documents before business work and record the resolution in PROGRESS.

### 2. Protect The Worktree

Record the starting branch, HEAD, and pre-existing modified/untracked files. Preserve unrelated work. If active-Task files have unknown overlapping edits, inspect and work with them; never reset or clean them.

Never assume that a dirty file belongs to the current run merely because it is inside the active Task's nominal scope. Determine ownership from PROGRESS, REPORTs, the actual diff, and fresh verification.

Treat the Git index as user-owned pre-existing state. If staged content cannot be proven to be an owned, verified delivery unit, do not unstage it, add more paths, or commit it. Also stop staging/commit work when there are unmerged paths, an in-progress merge/rebase/cherry-pick/revert, a detached HEAD, or unexplained branch/HEAD drift. Record the exact blocker and release condition without altering the user's Git state.

### 3. Reconcile Uncommitted Delivery Backlog

If earlier runs left completed or verified project work uncommitted, reconcile that backlog before starting new business work:

- map each changed path or hunk to a documented completed unit;
- preserve unknown, unrelated, or mixed-owner changes;
- rerun the minimum verification needed for each candidate unit;
- split the backlog into logical commits instead of hiding it in one catch-all commit;
- stop and record a precise blocker when ownership cannot be established safely.

A verified commit backlog is executable work and is not an `IDLE` condition.

### 4. Select One Bounded Unit

Continue the exact next action in PROGRESS. A bounded unit must be small enough to implement, verify, and document in the current run. Do not start a second Task.

If PLAN or PROGRESS is missing, create it before business-code edits.

Use a total wall-clock budget of roughly 45 minutes and enter the final verification, state-update, staged-diff review, and commit window no later than minute 35. Do not start another code change after entering that window.

### 5. Implement And Verify

- inspect existing patterns first;
- make minimal scoped changes;
- run focused tests;
- run relevant regression, build, browser, or integration checks in proportion to risk;
- distinguish mock evidence from real integration evidence;
- perform a fresh diff review against Task scope and acceptance criteria.

### 6. Persist Context

Before the run ends, update PROGRESS with:

- what was completed;
- what remains;
- the single exact next action;
- files changed;
- commands and summarized outcomes;
- blockers and release conditions.

Update CURRENT with the latest rolling snapshot. Replace stale state instead of appending a long chronology.

Write REPORT only when the Task is complete. Then mark ROADMAP and Task `DONE`, select the next dependency-ready Task, and create its PLAN and PROGRESS before code work starts.

### 7. Commit The Verified Unit

Every completed and verified bounded unit or Task phase must end in a local Git commit before the run ends. Normally one run selects one unit and creates one commit. Multiple commits are allowed only when safely splitting a pre-existing backlog into independently verified logical units.

Commit protocol:

1. For a normal new unit, update PROGRESS and CURRENT before staging so the durable state travels with the implementation.
2. Recheck that branch and HEAD still match the starting baseline except for commits intentionally created by this run, and that no Git operation or unmerged path appeared.
3. Stage only exact owned paths or hunks. Never use `git add -A`, `git add .`, broad wildcards, or any command that captures unrelated changes.
4. Never stage `.env`, `.env.*`, credentials, tokens, certificates, private keys, deployment keys, generated runtime data, or other sensitive artifacts. Check `.gitignore` and the staged path list without opening secret files.
5. Review `git diff --cached --stat`, `git diff --cached --name-only`, `git diff --cached`, and `git diff --cached --check` against the bounded unit, Task scope, and acceptance criteria. Run an existing repository secret scanner when available; otherwise perform a redacted staged-diff credential-pattern check and never print candidate values.
6. Run `git diff --cached --quiet`; exit code `0` means there is no staged diff and therefore no commit may be created.
7. Commit with `type(scope): subject`; one commit contains one logical change. Do not bypass hooks.
8. After success, verify `git status --short` and `git log -1 --oneline`. Report every commit hash and subject created in the run.

When splitting a pre-existing backlog, do not fabricate or rewrite historical intermediate CURRENT/PROGRESS states. Commit each Task/unit with its own accurate PLAN/PROGRESS/REPORT evidence when available, then place cumulative CURRENT, ROADMAP, and active PROGRESS reconciliation in the final backlog commit. After that final commit, the durable documents must agree with HEAD.

Do not create an empty commit. Do not commit failed, incomplete, unverified, mixed-owner, or unknown-source business changes. A durable docs-only blocker or planning update may be committed separately when it does not stage unverified business code. Do not push unless the Human Owner explicitly requests it.

Do not edit tracked files after a successful commit merely to record that commit's own hash; keep the hash in the event output and automation memory so the run does not manufacture a new uncommitted diff.

## Token And Context Budget Rules

- Project documents are the durable truth; automation memory stores cursors only.
- Rewrite automation memory as one concise latest-state snapshot; do not append a per-run diary.
- Keep CURRENT under roughly 250 lines.
- Keep active PROGRESS focused on current Task evidence; archive superseded detail when it becomes large.
- Record summaries and evidence paths, not raw logs.
- Do not reread all completed Task reports each run.
- Search and open only code relevant to the current bounded unit.
- Do not regenerate unchanged plans or reports.

## Human Gates

Stop business execution and request the Human Owner only for:

- incompatible product choices;
- a paid API call not already authorized;
- a required real secret or external account;
- destructive or irreversible action;
- a major API/schema/architecture direction change;
- missing facts where guessing materially changes cost, direction, or data safety.

Record `BLOCKED`, the owner, and the release condition in PROGRESS and CURRENT. Ordinary bugs, failing tests, refactors within scope, and implementation choices remain Codex responsibilities.

## Safety

- Never open or print `.env` or secret files without explicit authorization.
- Never put credentials, full URLs containing credentials, tokens, or Authorization headers in docs or output.
- Never run destructive operations on user or production data without explicit authorization.
- Paid Agnes smoke requires explicit authorization even when a key is already present.
- Preserve all unrelated dirty-worktree changes.

## No-Work Behavior

Return `IDLE` without writing files only when:

- there is no dependency-ready work; or
- the active Task is blocked on an already-recorded Human gate and no evidence changed; or
- the project is complete; or
- a newer overlapping controller run yielded to an already-running older instance.

Incomplete implementation with an executable next action is never `IDLE`.

Completed or verified work that is still waiting for a safe logical commit is also never `IDLE`.

A true `IDLE` run does not update CURRENT, PROGRESS, automation memory, or Git.

## Event Output

When state changes, report:

```text
【Revid Codex Delivery Event】
Task:
State Before:
Completed This Run:
Verification:
Files Changed:
State After:
Branch:
HEAD Before:
HEAD After:
Commits: <all hashes and subjects | NONE with reason>
Committed Paths:
Dirty Remainder:
Remaining:
Exact Next Action:
Human Decision Required: YES/NO
Reason:
```

After the state-change event block, also append a short Chinese summary for the Human Owner:

- `本轮总结`: what changed, what was verified, and whether anything remains blocked.
- `下一轮计划`: the single next bounded action expected in the next run.

The Chinese summary is required in addition to the structured event block, not instead of it.

When no state changes and no work is executable, output only `IDLE`.
