# TASK-T6-012 Progress

- State: `BLOCKED`
- Verification outcome: `FAIL`
- Active unit: `Human rejected - visible Script workflow is not usable`
- Task: [TASK-T6-012](../todo/TASK-T6-012.md).
- Plan: [TASK-T6-012-PLAN](TASK-T6-012-PLAN.md).

## Completed work

- Confirmed live baseline `HEAD == origin/main == 214b7c202ecb00b6504cdda849421ada3f04c38e`; tracked diff was empty.
- Preserved the user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` paths.
- Re-read AGENTS, CURRENT, complete ROADMAP, the accepted T6-006 architecture, T6-007 Task/PLAN/REPORT ownership evidence, the T6-012 section of the historical approved execution plan, and the frozen backend/browser story-director RED contracts.
- Confirmed T6-012 is the next dependency-ready Task after T6-011; no later Task is active.
- Confirmed the product boundary: the internal Skill is automatic and non-selectable, while Director/`导演台` remains absent from the Canvas taxonomy.
- Created the T6-012 Task/PLAN/PROGRESS and activated it in CURRENT/ROADMAP before business-code edits.
- Created the pinned source/license/provider-boundary evidence manifest and deterministic offline-eval manifest without installing or executing external Skills.
- Observed focused backend and frontend RED fingerprints before production edits.
- Implemented strict `revid.story-production` version 1 schemas for stories, events, stable assets, ordered references, continuity, shots, validation state, editable-field provenance, and locks.
- Implemented deterministic standalone/sequence routing, Revid-owned messages, strict bounded output parsing, one bounded repair, current-shot prompt compilation, partial/whole regeneration, and accepted/rejected take reconciliation.
- Preserved both locked fields and user-edited fields during whole regeneration; partial regeneration mutates only one resolved target and rejects source-revision drift.
- Added fixed non-selectable `revid.story-director` capability metadata and a validated same-card story-production handoff through the existing Script command/executor boundary.
- Preserved the accepted six-item Canvas taxonomy; no visible Director/`导演台`, T6-013 production UI, media-provider execution, migration, or runtime-data mutation was introduced.
- Completed focused, related, build, fresh-build browser, validator, dependency, sensitive-path, protected-path, and fresh-diff checks.

## Remaining work

- No further implementation is authorized under terminal T6-012.
- T6-013 may selectively reuse the strict story-production contract while delivering the independently planned visible Script and Canvas interaction remediation.

## Exact next action

Execute only the active T6-013 plan. Keep T6-012 `BLOCKED / FAIL`; do not create a T6-012 REPORT, stage, commit, or push it as an accepted delivery.

## Files changed

- `ai/tasks/todo/TASK-T6-012.md`
- `ai/tasks/doing/TASK-T6-012-PLAN.md`
- `ai/tasks/doing/TASK-T6-012-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/evidence/t6-012/source-provider-evidence-manifest-2026-07-25.md`
- `ai/evidence/t6-012/offline-eval-manifest.json`
- `backend/schemas/story_production.py`
- `backend/core/story_director_contract.py`
- `backend/core/story_director_prompts.py`
- `backend/core/story_director_skill.py`
- `backend/core/script_authoring_contract.py`
- `backend/services/generation/story_director_executor.py`
- `backend/tests/test_story_director_contract.py`
- `backend/tests/test_story_director_skill.py`
- `backend/tests/test_story_director_partial_regeneration.py`
- `backend/tests/test_script_authoring_contract.py`
- `backend/tests/test_generation_parameter_contract.py`
- `frontend/src/modules/canvas/script-authoring.ts`
- `frontend/src/modules/canvas/canvas-commands.ts`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/tests/e2e/canvas-script-director-contract.spec.ts`

## Commands run and summarized results

- `git status --short`, `git diff --stat`, `git diff --name-only`: tracked baseline clean; only protected user-owned untracked paths present.
- `git rev-parse HEAD`, `git rev-parse origin/main`: both `214b7c202ecb00b6504cdda849421ada3f04c38e`.
- `backend\.venv-ci-check\Scripts\python.exe scripts\validate-project-state.py`: expected activation-gate RED, `found []`, because unfinished future T6 Tasks existed before T6-012 documents were created.
- Post-activation and final `backend\.venv-ci-check\Scripts\python.exe scripts\validate-project-state.py`: PASS.
- Source-of-truth and historical contract reads: complete for the T6-012 activation decision.
- Existing frozen backend T6-012 contract: observed `story-production-schema-module-absent` RED before implementation.
- Existing frozen browser contract: observed missing `parseStoryDirectorCapabilities` RED; the second old Slash Palette flow was identified as T6-011 fixture drift and rewritten at the headless same-card contract boundary, where it observed `built-in-story-production-handoff-absent` RED.
- Focused schema/Skill/partial/prompt/eval tests: observed seven intended assertion failures before implementation; final focused backend `16/16` PASS.
- `npm run test:e2e -- canvas-script-director-contract.spec.ts`: `2/2` PASS.
- Related frontend run: `35/35` applicable contracts PASS; one excluded legacy `canvas-script-generation.spec.ts:147` old Slash Palette timeout remains outside T6-012.
- `npm run build`: PASS, Vite production build transformed `5,034` modules.
- Fresh-build browser proof for capability, same-card handoff, and exact six-item Add menu: `3/3` PASS.
- Related backend story/cinematic/script/text-generation/generation-parameter suite: `44/44` PASS in `37.355s`; disposable test database only.
- An additional full backend `unittest discover` attempt was terminated by the command runner after about five seconds and provides no test evidence; the bounded relevant broad suite above is the recorded broad evidence.
- `npm audit --audit-level=high`: existing PostCSS `GHSA-r28c-9q8g-f849` high advisory remains; no dependency file changed and no automatic fix was run.
- `git diff --check`, env-like diff-path audit, protected runtime-path diff audit: PASS.
- Fresh diff audit found and closed one user-edited-field preservation gap through a new observed RED followed by the minimal merge fix.

## Blockers and release conditions

- Human rejection on 2026-07-25 is terminal for this candidate: the visible Script function is not usable.
- The same feedback explicitly requires selection marquee, group/ungroup, and whole-card connection acquisition with a strong hover/drop affordance; those are owned by the independently activated T6-013 contract.
- The existing PostCSS high advisory remains an explicit dependency boundary; T6-012 adds no dependency and does not authorize an upgrade.
- One legacy old-Canvas Slash Palette browser fixture remains stale after the accepted T6-011 replacement; it is outside this Task and does not invalidate the headless/fresh-build T6-012 proof.
- Migration, real/paid provider, secret, destructive, external-account, and incompatible-contract gates remain closed unless separately authorized.
