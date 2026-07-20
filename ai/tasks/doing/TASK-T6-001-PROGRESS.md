# TASK-T6-001 Progress

- State: `DOING`
- Active unit: `Unit 0A - detached connection geometry correction`
- Activation baseline: `HEAD == origin/main == 034a49f45952cfa0f893363d401aa9ccf52eddbd`; ahead/behind `0/0`.
- Task: `ai/tasks/todo/TASK-T6-001.md`
- Plan: `ai/tasks/doing/TASK-T6-001-PLAN.md`

## Completed Work

- Read AGENTS, CURRENT, ROADMAP, T5-096 Task/PLAN/PROGRESS/REPORT, T5-091 REPORT, the direct-delivery ADR, the complete Human-owned T6-001 planning artifact, and the user screenshot.
- Diagnosed the screenshot symptom as a fully detached edge, not a cosmetic curve-style mismatch: the node is at upper left while the rendered SVG path occupies a remote lower-right region.
- Verified T5-096 is the final T5 Task and `DONE - PASS`; `main`, `HEAD`, and `origin/main` agree at `034a49f`, with ahead/behind `0/0` and no tracked changes.
- Preserved user-owned `.codex/`, `.hermes/plans/`, and `output/` as untracked/out of scope.
- Repinned the external workflow reference: `seedance-2.0/main` remains `57d01dc66f93ecb03c2475be5f22dc416d9b701d` on 2026-07-20, so no upstream drift is adopted.
- Materialized and activated the formal T6-001 Task/PLAN/PROGRESS plus evidence baseline before business-code edits.

## Remaining Work

- Reproduce, RED-test, fix, and browser-verify the detached connection.
- Complete Units 1 through 6 for cinematic director Skills v2.
- Complete fresh self-review, Human UX review, REPORT, durable-state synchronization, exact staging, commit, push, and remote equality.

## Exact Next Action

Trace connection endpoint computation from the persisted graph through shared node layout, port presentation/interaction, renderer reconciliation, and SVG connection presentation; add the smallest deterministic RED fixture matching the screenshot before any product-code change.

## Files Changed

- `ai/tasks/todo/TASK-T6-001.md`
- `ai/tasks/doing/TASK-T6-001-PLAN.md`
- `ai/tasks/doing/TASK-T6-001-PROGRESS.md`
- `ai/evidence/t6-001/README.md`
- `ai/evidence/t6-001/source-license-ledger.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`

## Commands Run And Results

- Required Git start audit: tracked clean; only preserved untracked paths; `HEAD 034a49f`.
- `git fetch origin main` plus branch/remote audit: `main`, `HEAD == origin/main`, ahead/behind `0/0`.
- External pin audit with `git ls-remote`: reference `main == 57d01dc...`, unchanged from the planning pin.
- Design skill update check: no update line returned.

## Blockers And Release Conditions

- Current blocker: none for Unit 0A investigation.
- Human gates remain real/paid provider calls, secrets, external accounts, destructive work, migrations/new long-term storage, incompatible provider contracts, and final real-output quality claims.
