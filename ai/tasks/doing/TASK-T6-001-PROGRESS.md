# TASK-T6-001 Progress

- State: `DOING`
- Active unit: `Unit 7 - fresh review, Human UX gate, report, and delivery`
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
- Unit 4 adds one-revision accept/reject review, current-Canvas result/task/media/revision validation, reserved/completed beat preservation, continuation fail-closed checks, and duplication-safe sequence/source/result remapping.
- Unit 4 verification is backend `17/17` plus `3` subtests, frontend `8/8`, build `4941`.
- Unit 5 upgrades new opt-ins to active v2 while preserving exact v1 settings, retains backend-catalog role/media/control reasons, persists bounded non-transfer rules, and proves prompt wording cannot route provider/model/controls.
- Added progressive take review. Keep uses one canon command; Reroll/Rewrite produces only a transient single-variable preflight that is consumed by a later explicit Send on the original generation node.
- Unit 5 verification is backend `21/21`, frontend `28/28`, build `4947`; 1440 and 375 review-only screenshots were visually inspected and hash-recorded.
- Added the exact 14-case Unit 6 offline eval manifest and a fail-closed backend validator; focused eval is `14/14` plus `14` subtests.
- Full backend reached `563 passed` plus `147` subtests with one stable existing concurrency failure. Exact rerun reproduced MySQL `1213 deadlock`: image generation locks `generation_tasks` before its input `assets`, while source-node deletion updates `assets` before `generation_tasks`.
- Completed systematic root-cause and history analysis. The existing RED test has required a shared asset-then-task lock order since `f563e22`; the bounded fix is to resolve and lock input assets before admission acquires generation-task locks.
- Restored one shared `assets -> generation_tasks` lock order for new referenced generation requests while preserving admission-first replay behavior. Exact GREEN is `1/1`; related concurrency/idempotency/image/provider validation is `36/36` plus `11` subtests.
- Unit 6 is deterministic-green: backend `564/564` plus `147` subtests; full functional Chromium `551/551`; focused UX/accessibility `56/56`; headed full-Chromium performance `2/2` with unchanged thresholds; production build `4947 modules transformed`.
- Unit 7 fresh review moved the complete duplication subdomain out of the 525-line Canvas controller into a 191-line module and split the 531-line native-transaction integration class; final production controller is 343 lines and each new file is below 500 lines.
- The first post-split full backend run caught one omitted existing `deepcopy` import (`6 failed, 558 passed`). After the exact import restoration, focused duplication/cinematic passed `23/23` plus `3` subtests and final-diff full backend passed `564/564` plus `147` subtests.
- Final source/license and hygiene review found no third-party copied expression, notice obligation, generic execute/imported runtime/second authority, provider integration, dependency, migration, sensitive path, high-confidence secret assignment, invalid UTF-8, or BOM.
- Unit 6/review slice was committed as `a9b69be` and pushed; `HEAD == origin/main`, ahead/behind `0/0`. Final regenerated Human-review PNG hashes are `06e2375a...` at 1440x900 and `ab9388a6...` at 375x812.
- Final 21-criterion completion audit found AC13 switching evidence too indirect: cinematic tests proved atomic command/autosave/undo/redo/reload/duplication and generic Canvas suites proved switching/recovery, but no cinematic browser case directly reloaded accepted canon after switching away and back. This is an evidence gap, not a confirmed product defect.
- Added direct AC13 browser evidence: one Keep creates one document PATCH; accepted canon revision/result/end-state survive switching to the second Canvas, switching back, and reload through the native document authority. Exact case is `1/1`; cinematic + sequence + autosave + document persistence + revision recovery is `34/34`.
- Completed the 21-row audit in `completion-audit-2026-07-20.md`: AC1-AC20 are direct `PASS`; AC21 is `PENDING_HUMAN_UX` solely for the final screenshot verdict, REPORT, and durable `DONE - PASS` synchronization.

## Remaining Work

- Complete fresh self-review, Human UX review, REPORT, durable-state synchronization, exact staging, commit, push, and remote equality.

## Exact Next Action

Obtain the Human UX verdict on the final 1440x900 reference-transfer and 375x812 review-only screenshots. On acceptance, write REPORT and synchronize Task/PLAN/PROGRESS/CURRENT/ROADMAP to `DONE - PASS`, commit, push, and verify remote equality.

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
- `ai/evidence/t6-001/unit-5-reference-retake-evidence-2026-07-20.md`
- `frontend/src/components/canvas/CanvasCinematicTakeReview.vue`
- `frontend/src/modules/canvas/cinematic-director-ux.ts`
- `frontend/src/modules/canvas/cinematic-skill-settings.ts`
- `frontend/tests/e2e/canvas-cinematic-director-ux.spec.ts`
- `ai/evidence/t6-001/offline-eval-manifest.json`
- `backend/tests/test_cinematic_offline_eval_manifest.py`
- `backend/controllers/generation_starts.py`
- `ai/evidence/t6-001/unit-6-eval-regression-evidence-2026-07-20.md`
- `backend/controllers/canvas_duplication.py`
- `backend/tests/test_cinematic_skill_v2_native_transaction.py`
- `ai/evidence/t6-001/completion-audit-2026-07-20.md`

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
- Unit 4 backend/frontend/build: `17/17` plus `3` subtests, `8/8`, `4941 modules transformed`.
- Unit 5 backend focused matrix: `21/21` passed.
- Unit 5 frontend focused v1/v2 and real browser matrix: `28/28` passed.
- Unit 5 production build: `4947 modules transformed`; serious/critical axe findings `0` in v2 reference UI.
- Unit 6 offline eval: `14 passed`, `14 subtests passed`.
- Full backend: `1 failed, 563 passed, 147 subtests passed`; sole failure is `test_cross_canvas_input_start_and_node_delete_share_asset_then_task_lock_order` with MySQL `1213 deadlock`.
- Exact concurrency rerun: stable RED with the same `UPDATE generation_tasks SET canvas_node_id = NULL` deadlock fingerprint.
- Exact concurrency GREEN: `1/1`; related transaction/admission/image/provider validation: `36/36` plus `11` subtests.
- Final backend full suite: `564 passed, 147 subtests passed` in `437.00s`.
- Unfiltered Chromium: `551/552`; only the known headless SwiftShader performance boundary failed at `52.43 FPS` versus unchanged `55 FPS`.
- Fresh full functional Chromium excluding only the hardware gate: `551/551` in `10.1m`.
- Focused UX/accessibility/responsive/IME/focus/reduced-motion/zoom matrix: `56/56`.
- Headed full-Chromium performance: `2/2`; final AMD D3D11 sample `126.63 FPS`, frame P95 `18ms`, render `531ms`, pointer P95 `2ms`, longest task `0ms`, minimap `11.24/s`; metrics hash `2638accb...`.
- Final production build: `4947 modules transformed`.
- Duplication module split focused GREEN: `5/5` plus `3` subtests; cinematic/duplication split matrix: `16/16` plus `3` subtests.
- First post-split full backend: `6 failed, 558 passed, 147 subtests passed`; fingerprint `NameError: deepcopy` in duplicated connection metadata.
- Recovery focused matrix: `23/23` plus `3` subtests; final-diff backend full: `564/564` plus `147` subtests in `424.22s`.
- Fresh hygiene: `git diff --check` passed; sensitive paths `0`; high-confidence secret assignments `0`; strict UTF-8 failures `0`; BOM files `0`.
- Scoped delivery: commit `a9b69be`; push passed; local/remote ahead/behind `0/0`.
- AC13 evidence RED: expected at least three first-Canvas document GETs, observed two; product persistence assertions passed and the over-counted test assumption was corrected.
- AC13 direct GREEN: `1/1`; cinematic/sequence/autosave/document-persistence/revision-recovery matrix: `34/34`.

## Blockers And Release Conditions

- Current automated blocker: none.
- Final Human UX verdict is still required before REPORT and `DONE - PASS` closure.
- Human gates remain real/paid provider calls, secrets, external accounts, destructive work, migrations/new long-term storage, incompatible provider contracts, and final real-output quality claims.
