# TASK-T6-001 Progress

- State: `DOING`
- Active unit: `Unit 4 - accepted-take continuation and duplication-safe canon`
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
- Preserved capability v1 and v2 byte-shape semantics and added a separate v3 lifecycle registry with Canvas Context v1 plus exactly three active cinematic v2 manifests; cinematic v1 remains exact historical resolution only.
- Added strict backend/frontend director brief, reference transfer, sequence, and retake contracts with exact keys, bounded values, source revisions, unique identities, complete accepted canon, and no execution fields.
- Unit 1 behavior RED proved completed beat references could point at a planned beat; GREEN binds completed/reserved references to their actual beat state on backend and frontend.
- Unit 1 verification is green: backend `24/24`, frontend `12/12`, production build `4937 modules transformed`; v1 contract/execution and frontend Agent/Skill/mention fixtures remain unchanged.
- Added a separate pure v2 director compiler while preserving v1 preflight and snapshot shapes. It has no network, database, filesystem, or clock dependency.
- Added exact workflow/context compatibility, fixed instruction precedence, strict reference-transfer projection, native parameter validation, explicit vague/conflict outcomes, sequence/canon projection, canonical JSON/digest, and non-ready handoff blocking.
- Unit 2 primary RED proved active v2 fell through to the v1 response. Self-review RED proved group-expanded children lost the parent transfer policy; both are closed.
- Extended only the existing authenticated `/cinematic-preflight` and native generation handoff. A replay-safe explicit Send captured byte-equal canonical request/digest in the existing task snapshot with zero provider calls.
- Unit 2 verification is green: backend `26/26`, frontend `8/8`, production build `4937 modules transformed`.
- Locked sequence storage to `sourceScript.contentData.cinematic_sequence`, preserving script text and existing Canvas document/history/autosave authority.
- Extended the existing text endpoint to validate exact v2 sequence output against the submitted source revision and director brief while preserving v1 shot documents.
- Added one atomic sequence command, strict stale/wrong-source rejection, next-unresolved-clip gating, and an explicit existing-text-authority planning method.
- Unit 3 RED proved v2 sequence output was incorrectly parsed as a v1 shot document. GREEN plus command/history verification is backend `19/19`, frontend `21/21`, build `4941`.

## Remaining Work

- Complete Units 4 through 6 for cinematic director Skills v2.
- Complete fresh self-review, Human UX review, REPORT, durable-state synchronization, exact staging, commit, push, and remote equality.

## Exact Next Action

Write Unit 4 RED fixtures for accepted/rejected review transitions, current-Canvas result/task lineage, observed end state, completed/reserved beat rules, stale/deleted/foreign/wrong-media rejection, exact canon revision increments, continuation preflight, and duplication remapping.

## Files Changed

- `ai/tasks/todo/TASK-T6-001.md`
- `ai/tasks/doing/TASK-T6-001-PLAN.md`
- `ai/tasks/doing/TASK-T6-001-PROGRESS.md`
- `ai/evidence/t6-001/README.md`
- `ai/evidence/t6-001/source-license-ledger.md`
- `ai/evidence/t6-001/unit-0a-detached-edge-evidence-2026-07-20.md`
- `ai/evidence/t6-001/unit-1-contract-evidence-2026-07-20.md`
- `ai/evidence/t6-001/unit-2-director-compiler-evidence-2026-07-20.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/tests/e2e/canvas-connection-continuation-browser.spec.ts`
- `backend/api/agent_skills.py`
- `backend/api/generation_common.py`
- `backend/core/cinematic_director_compiler.py`
- `backend/core/cinematic_skill_contract.py`
- `backend/core/cinematic_skill_handoff.py`
- `backend/schemas/generation.py`
- `backend/tests/test_cinematic_skill_v2_execution.py`
- `frontend/src/modules/canvas/cinematic-director-preflight.ts`
- `frontend/tests/e2e/canvas-cinematic-director-preflight.spec.ts`
- `ai/evidence/t6-001/unit-3-sequence-planning-evidence-2026-07-20.md`
- `backend/api/text_generate.py`
- `backend/tests/test_cinematic_sequence_planning.py`
- `frontend/src/components/canvas/composables/use-canvas-shot-schema.ts`
- `frontend/src/modules/canvas/cinematic-sequence-command.ts`
- `frontend/tests/e2e/canvas-cinematic-sequence-planning.spec.ts`

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
- Unit 1 backend focused/legacy matrix: `24/24` passed.
- Unit 1 frontend focused/legacy matrix: `12/12` passed.
- Unit 1 production build: `4937 modules transformed`.
- Unit 2 backend focused v1/v2 matrix: `26/26` passed.
- Unit 2 frontend focused v1/v2 matrix: `8/8` passed.
- Unit 2 production build: `4937 modules transformed`.
- Unit 3 backend text-authority/compatibility matrix: `19/19` passed.
- Unit 3 frontend sequence/command/history matrix: `21/21` passed.
- Unit 3 production build: `4941 modules transformed`.

## Blockers And Release Conditions

- Current blocker: none for Unit 3 implementation.
- Human gates remain real/paid provider calls, secrets, external accounts, destructive work, migrations/new long-term storage, incompatible provider contracts, and final real-output quality claims.
