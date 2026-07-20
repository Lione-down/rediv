# TASK-T6-001 Progress

- State: `DOING`
- Active unit: `Unit 1 - versioned registry and strict v2 schemas`
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
- Reproduced the detached draft edge under a translated `50%` viewport. RED expected screen x `590` at the source port and measured `435`, proving `155 CSS px` of double-transformed drift.
- Fixed the draft coordinate boundary: pointer interaction remains surface-space, while the SVG path now receives the shared world-space port anchor and a surface-to-world pointer conversion before the layer applies viewport transform once.
- Hardened browser coverage to read actual SVG screen endpoints at 17%, 36%, 100%, and 200% with non-zero translation. The focused test passed and produced zero document PATCHes.
- Related connection/port/target/motion/T5-096 node/selection matrix passed `34/34`; production build passed with `4937 modules transformed`.
- Inspected the Revid-owned 1440x900 36% capture. The draft visibly leaves the script output port and follows the pointer; SHA-256 is recorded in `ai/evidence/t6-001/unit-0a-detached-edge-evidence-2026-07-20.md` and the raw PNG remains untracked.

## Remaining Work

- Complete Units 1 through 6 for cinematic director Skills v2.
- Complete fresh self-review, Human UX review, REPORT, durable-state synchronization, exact staging, commit, push, and remote equality.

## Exact Next Action

Audit the current backend/frontend cinematic v1 registry and public capability/preflight shapes, then write Unit 1 RED fixtures for exactly three active v2 manifests, exact historical v1 resolution, duplicate/unknown lifecycle rejection, and strict director/sequence/retake schema bounds before product-code changes.

## Files Changed

- `ai/tasks/todo/TASK-T6-001.md`
- `ai/tasks/doing/TASK-T6-001-PLAN.md`
- `ai/tasks/doing/TASK-T6-001-PROGRESS.md`
- `ai/evidence/t6-001/README.md`
- `ai/evidence/t6-001/source-license-ledger.md`
- `ai/evidence/t6-001/unit-0a-detached-edge-evidence-2026-07-20.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/tests/e2e/canvas-connection-continuation-browser.spec.ts`

## Commands Run And Results

- Required Git start audit: tracked clean; only preserved untracked paths; `HEAD 034a49f`.
- `git fetch origin main` plus branch/remote audit: `main`, `HEAD == origin/main`, ahead/behind `0/0`.
- External pin audit with `git ls-remote`: reference `main == 57d01dc...`, unchanged from the planning pin.
- Design skill update check: no update line returned.
- Unit 0A RED: focused Chromium `0/1`; expected x `590`, received `435`, drift `155 CSS px`.
- Unit 0A GREEN after production rebuild: focused `1/1`; four zooms and zero PATCHes.
- Related Chromium matrix: `34/34` passed in `50.7s`.
- Production build: `4937 modules transformed`.
- Visual evidence generation rerun: `1/1` passed; PNG decoded 1440x900 and hash recorded without staging the raw file.

## Blockers And Release Conditions

- Current blocker: none for Unit 0A investigation.
- Human gates remain real/paid provider calls, secrets, external accounts, destructive work, migrations/new long-term storage, incompatible provider contracts, and final real-output quality claims.
