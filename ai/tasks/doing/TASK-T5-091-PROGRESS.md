# TASK-T5-091 Progress

- Task state: `DOING`
- Active unit: `Unit 6 - Regression and closure`

## Completed work

- Activated the requested target objective and reconstructed repository truth from AGENTS, CURRENT, ROADMAP, T5-090 Task/PLAN/PROGRESS, T5-091, ADR-002/004/005, the direct-delivery ADR, source, tests, Git history, and `origin/main`.
- Confirmed T5-086 through T5-090 are `DONE - PASS`, committed, and pushed. `origin/main` is `c27e6f9058d15a3da3be461f816953d395f65444`; T5-090 business delivery is `1aad57189497353c5e54a60ac8b87b6fa9677d7a`.
- Classified the delegation's “unfinished T5-086 changes” statement as a stale cursor: the current working tree contains no T5-086 business diff. Preserved untracked `.codex/`, `.hermes/plans/`, `output/`, and the now-activated T5-091 Task.
- Audited T5-090's closed manifest/preflight implementation, generation capability v4, fixed Agnes model constants, existing image/video request normalization, immutable task request snapshots, native generation transaction authority, User model, and lack of reusable server-side account preferences.
- Locked the backward-compatible Agent/Skill v2, structured mention, canonical request, existing-generation-route handoff, provider/model catalog, billing acknowledgement migration, and stale-lineage boundaries in the active PLAN.
- Loaded the project `revid-visual-assets` skill. Its provider-fidelity honesty boundary is retained: mock/contract/provider completion never proves visual acceptance.
- Completed Unit 0 RED/GREEN contract work. T5-090's exact default v1 discovery/preflight remains unchanged, while an explicit v2 registry adds only the three cinematic manifests and still exposes no generic execute route.
- Added deterministic backend cinematic capability, structured mention/source revision, group expansion, canonical request, exact handoff drift, and billing duration contracts. Source revisions exclude display title so renames preserve stable bindings while relevant content changes fail closed.
- Added authenticated Canvas-scoped v2 discovery, cinematic provider/model catalog, source index, and preflight API routes. Canvas revision or source drift returns before any native generation handoff.
- Added strict frontend capability, mention, source-index, preflight, and transport parsing. The client strips display-only titles from the persisted request and rejects hidden or drifted fields.
- RED evidence: backend initially failed collection on missing `core.cinematic_skill_contract`; frontend failed on missing `cinematic-skills` export. GREEN evidence: new backend contract/billing/handoff tests passed 9/9, combined legacy/new backend passed 19/19, new frontend contract passed 4/4, combined T5-090/new frontend passed 6/6. Baseline production build passed 4,921 modules.

## Unit 1-5 delivery update

- Completed reversible Canvas Skill settings, capability-driven provider/model selection, structured `@` references, Escape behavior, concise summary, exact disclosure, and preview-to-submit native handoff.
- Reused `/api/text-generate`, `/api/image-generate`, and `/api/video-generate`; no generic Skill execute route exists. Current Canvas, capability, provider/model, controls, prompt, reference order, and acknowledgement are revalidated before the generation transaction.
- Added deterministic image and video constraint envelopes, strict script shot schema v2 through the existing text lifecycle, atomic graph insertion, stale lineage, duplication remapping, and server-authoritative billing acknowledgement.
- Billing migration evidence used only disposable `revid_test_provider_cost_acknowledgement_migration`; no user/runtime database was upgraded.
- Focused evidence: backend 34 tests plus 15 subtests; migration 1/1; cinematic browser 7/7; earlier combined browser contract/service 16/16; production build 4,926 modules.

## Unit 6 verification update

- Full backend rerun passed `512` tests plus `116` subtests in `461.36s`; the first full run's four stale Alembic-head expectations were updated to the new authored head and the affected restart group then passed `19/19`.
- Final production build passed with `4,926` transformed modules. Final functional Chromium, excluding only the separately classified 200/300 title, passed `496/496` in `10.4m`.
- Final focused cinematic browser evidence passed `8/8`, including default-off zero-discovery behavior, explicit enable, structured mention/undo/redo, exact request disclosure, 1366/920/375 ownership, billing cancel/24-hour acknowledgement, video first/last keyframes, and strict cinematic script graph creation.
- The guarded current build passed the unchanged 200-node/300-connection title at `56.35185107977278 FPS`, `16.80000000000291ms` frame p95, `557ms` stable render, `9.899999976158142ms` pointer p95, and `62ms` longest task under SwiftShader/no hardware acceleration. Earlier current and exact-baseline reruns crossed the threshold in both directions; the final pass used a measured low-load window and no threshold/code change.
- Inspected `output/playwright/t5-091-cinematic-skills/cinematic-image-1440x900.png`; the existing graphite/violet Context ownership, structured reference, provider/model, and preflight hierarchy are visually coherent. This mock/browser evidence does not prove real-provider visual fidelity.
- `git diff --check` passed. New task-owned source modules remain below 500 lines; the pre-existing oversized `CanvasContextPanel.vue`, `CanvasWorkspace.vue`, and shared generation fixture were not refactored in this Task.

## Remaining work

- Complete final sensitive-path/encoding/staging review, exact-stage the business delivery, commit, and push.
- Write REPORT and close Task/PLAN/PROGRESS/CURRENT/ROADMAP in a second state commit using the verified delivery commit hash.

## Exact next action

Run final hygiene and exact-stage review, then create and push the T5-091 business delivery commit.

## Files changed

- `ai/tasks/todo/TASK-T5-091.md`
- `ai/tasks/doing/TASK-T5-091-PLAN.md`
- `ai/tasks/doing/TASK-T5-091-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `backend/core/agent_skill_contract.py`
- `backend/core/cinematic_skill_contract.py`
- `backend/core/cinematic_skill_billing.py`
- `backend/api/agent_skills.py`
- `backend/tests/test_cinematic_skill_contract.py`
- `backend/tests/test_cinematic_skill_execution.py`
- `backend/tests/test_cinematic_skill_billing.py`
- `frontend/src/modules/canvas/cinematic-skills.ts`
- `frontend/tests/e2e/canvas-skill-mentions.spec.ts`

## Commands run and summarized results

- Required Git preflight passed at `c27e6f9058d15a3da3be461f816953d395f65444`; no tracked business diff existed.
- `git fetch origin --prune` confirmed `origin/main` at the same state commit and the complete T5-086 through T5-090 delivery chain.
- `backend ... pytest ... test_cinematic_skill_* -x`: initial RED collection failure, then 9/9 passed.
- T5-090 plus new backend focused regression: 19/19 passed.
- `playwright ... canvas-skill-mentions.spec.ts`: initial RED missing-module failure, then 4/4 passed.
- T5-090 plus new frontend pure contract regression: 6/6 passed.
- `npm run build`: baseline passed, 4,921 modules.

## Blockers and release conditions

- No Unit 0 blocker.
- Real/paid provider fidelity remains Human-gated and is excluded from default verification.
- Any new migration will be authored and tested only against guarded disposable MySQL infrastructure; applying it to user/runtime data requires separate Human authorization.
