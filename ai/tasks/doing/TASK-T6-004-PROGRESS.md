# TASK-T6-004 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-004](../todo/TASK-T6-004.md).
- Plan: [TASK-T6-004-PLAN](TASK-T6-004-PLAN.md).
- Activation date: 2026-07-22.

## Completed Work

- Confirmed T6-003 is `DONE / PASS`, no implementation Task was active, and T6-004 is dependency-ready.
- Confirmed activation baseline `main`, `HEAD == origin/main == 4b5c028ef5ae93052c5de09f116db9ed9a2dd1a5`; tracked worktree was clean.
- Audited the five activation-owned paths and found no overlapping changes. Preserved user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, and `storage/` paths.
- Preserved the user-owned T6-004 planning source unchanged and recorded SHA-256 `9833CAF0849C56763784068F68F9C06685B8789278205ACBE6D083369CD8338D`.
- Materialized the Task, PLAN, and PROGRESS chain with approved product rules, architecture/data contracts, dependencies, risks, non-goals, acceptance axes, and Human stop gates.
- Activated T6-004 as the sole implementation Task and reconciled CURRENT and ROADMAP to `DOING / PENDING`.
- No business code, tests, database schema/data, provider, secret, external account, or paid service was changed or invoked during activation.
- Unit 1 RED added capability v6, strict image batch, structured video-role, cross-role duplicate ordering, and independent slot idempotency/quota coverage. Valid RED was `32 tests` with `4 failures + 8 errors`, all caused by the missing v6 fields, missing normalizer arguments, rejected nested batch, and URL deduplication.
- Unit 2 GREEN added capability v6, strict batch/reference normalization and Pydantic schemas, immutable request snapshots/fingerprints, ordered duplicate-preserving provider URL reconstruction, and API wiring through existing single-result task authorities. No table or migration was added.
- Unit 1/2 focused backend passed `32/32`; adjacent image/video API and cinematic handoff regression passed `31/31`.
- Unit 3 added frontend capability v6 parsing, capability-driven output counts, strict ordered role bindings, legacy normalization, accessible count/role controls, persisted parameters, and structured request serialization. The focused v6 browser workflow and production build pass.
- Unit 4 changed both draft and refine to replace the selected canonical script through the existing stale-safe atomic update command. The replacement toggle and sibling/version creation path were removed; normal Canvas undo/redo remains authoritative.
- Unit 5 models a 2-4 image output as independent existing single-result cards/tasks: slot 1 stays on the initiating card, siblings are inserted atomically with deterministic positions and cloned inbound references, mixed outcomes persist, and card-local retry changes only the failed slot request.
- Unit 6 marks script-created shot groups as `分镜资产组`, keeps canonical child generation cards, and adds sequential bounded generate-all with per-item continuation, quota stop, honest completed/failed/skipped summary, identity-preserving standard ungroup, and local failed-child retry.
- Unit 7 adds ordered `first-frame`/`last-frame`/`reference` interaction under one nine-entry budget, accessible reorder actions, cross-role source reuse, reload persistence, exact request serialization, and review-only rendering.
- Unit 8 compatibility hardening now keeps ordinary image generation at the existing eight-reference backend boundary, preserves `output_count` and batch identity during image-operation edits, and prevents v6 card generation from rewriting structured bindings into legacy modes.
- Unit 8 geometry, persistence, accessibility, reduced-motion, desktop/compact, and readonly regression is complete. The T6-003 floating-control, shared-anchor, materialized-card, port/path, toolbar, and composer contracts remain unchanged; the only accessibility defect found was corrected by replacing an invalid direct-button `list` role with `group`.
- Unit 8 visual evidence is retained under ignored `output/playwright/t6-004/`: image batch SHA-256 `741D93DE7E5C217054ECC3102D9ACBC994662B9C15DC55EE9A570A8122901C21`, mixed asset group `E84E4C0FC656BE1390ED8FD91F1FC1C3087E4F16A8AF81A3AA4F6F9E9F6689B4`, nine video references desktop `EC4F7639FCB54B3D8E2717200DF5AB84C3123C301E7DBA799B89D5703566E825`, and readonly 375x812 `50F42B894525E2BEABBF9889C6DD764DAACA6EE2D2E0E00675F2A6A64ED0B2E4`. These hashes reflect the exact-current-source full Chromium run, which regenerated the first two captures.
- Unit 9 automated gates and fresh implementation review are complete: locked full backend `583/583`, exact-current-source full Chromium `610/610`, headed performance `2/2`, production build `4,976 modules`, dependency audit `0`, and scoped hygiene checks pass without threshold weakening.
- Human Owner explicitly accepted the T6-004 visual and interaction evidence on 2026-07-22. REPORT and durable state were reconciled to `DONE / PASS` only after that acceptance.

## Remaining Work

- None. T6-004 implementation, verification, Human acceptance, documentation, and delivery reconciliation are complete.

## Exact Next Action

No T6-004 action remains. Await Human product direction and create a new dependency-ready Task, PLAN, and PROGRESS before further implementation.

## Files Changed

- `ai/tasks/todo/TASK-T6-004.md` - created the authoritative Task contract.
- `ai/tasks/doing/TASK-T6-004-PLAN.md` - created the dependency-ordered implementation plan.
- `ai/tasks/doing/TASK-T6-004-PROGRESS.md` - created this durable activation and next-action record.
- `ai/state/CURRENT.md` - activated T6-004 as the sole implementation Task.
- `ai/state/ROADMAP.md` - added the T6-004 `DOING / PENDING` row and current summary.
- `ai/reports/REPORT-T6-004.md` - records the accepted delivery, verification, boundaries, and final state.
- `backend/core/generation_parameter_contract.py` - added capability v6 and strict batch/video-reference normalization.
- `backend/schemas/generation.py` - added strict nested request schemas.
- `backend/controllers/generation_starts.py` - preserved semantic reference order while resolving each unique asset once.
- `backend/api/image_generate.py` and `backend/api/video_generate.py` - wired normalized v6 snapshots through existing request/fingerprint/task paths.
- `backend/tests/test_generation_parameter_contract.py`, `backend/tests/test_canvas_generation_transactions.py`, and `backend/tests/test_generation_idempotency_and_admission.py` - added Unit 1 RED and Unit 2 regression proof.
- `frontend/src/modules/canvas/generation-parameters.ts`, `generation-service.ts`, and `generation-context.ts` - added v6 parsing, resolution, serialization, and reference budgeting.
- `frontend/src/modules/canvas/generation-capability-contract.ts` - split capability types/parsing into a focused contract module while preserving the public generation-parameter API.
- `frontend/src/components/canvas/CanvasGenerationParameterControls.vue` and `composables/use-canvas-generation-actions.ts` - added accessible v6 controls and carried structured references into requests.
- `frontend/src/modules/canvas/script-authoring.ts`, `frontend/src/components/canvas/CanvasScriptGenerationControls.vue`, `composables/use-canvas-script-generation.ts`, and `frontend/src/views/app/CanvasWorkspace.vue` - made direct stale-safe overwrite the only draft/refine apply path.
- Frontend generation parameter/service fixtures and specs plus `canvas-script-generation.spec.ts` - added Unit 3/4 RED-GREEN proof.
- `frontend/src/modules/canvas/image-generation-batch.ts` and `frontend/src/components/canvas/composables/use-canvas-image-generation-batch.ts` - added atomic sibling preparation and durable per-slot batch snapshots.
- `frontend/src/components/canvas/composables/use-canvas-storyboard-group-generation.ts` - isolated existing-authority group generation orchestration from the resource surface.
- `frontend/src/components/canvas/composables/use-canvas-generation-actions.ts`, `use-canvas-resource-experience.ts`, `use-canvas-storyboard-groups.ts`, `CanvasContextPanel.vue`, `CanvasSelectionToolbar.vue`, `CanvasStage.vue`, and `CanvasWorkspace.vue` - added batch execution/retry, asset-group generate-all, v6 card-role preservation, and UI wiring through existing authorities.
- `frontend/src/modules/canvas/shot-graph.ts` and related shot/storyboard tests - made the script-created group explicit and verified canonical identity through generation and ungroup.
- `frontend/src/components/canvas/CanvasGenerationParameterControls.vue`, `CanvasImageOperationControls.vue`, and `frontend/src/modules/canvas/generation-parameters.ts` - added ordered role controls and compatibility guards for the image reference, operation, and batch contracts.
- `canvas-image-generation-batch.spec.ts`, `canvas-asset-group-generation.spec.ts`, `canvas-video-reference-roles.spec.ts`, and adjacent generation/card/shot specs - added Units 5-8 focused RED-GREEN proof.
- `canvas-generation-parameters-v6.spec.ts` - split the v6 interaction matrix from the existing parameter regression file without changing coverage.

## Commands Run And Results

- Required startup reads: `AGENTS.md`, `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`, the completed T6-003 chain needed for dependency/format context, linked direct-delivery ADR, and the user-owned T6-004 planning source were inspected.
- `git status --short`, `git diff --stat`, `git diff --name-only`: tracked worktree clean before activation; only preserved user-owned untracked paths were present.
- `git branch --show-current`, `git rev-parse HEAD`, `git rev-parse origin/main`: PASS; `main`, HEAD, and origin/main agree at `4b5c028ef5ae93052c5de09f116db9ed9a2dd1a5`.
- `Get-FileHash -Algorithm SHA256 .hermes/plans/2026-07-22_180324-t6-004-node-workflow-productionization.md`: PASS; `9833CAF0849C56763784068F68F9C06685B8789278205ACBE6D083369CD8338D`.
- `backend/.venv-ci-check/Scripts/python.exe scripts/validate-project-state.py`: PASS; Task, PLAN, PROGRESS, CURRENT, ROADMAP, metadata, and links agree on the sole active T6-004 state.
- `git diff --check`: PASS; only expected Windows LF-to-CRLF notices were emitted for the two modified tracked state files.
- Activation-owned UTF-8/BOM check: PASS; five files decode as strict UTF-8, BOM count `0`.
- CURRENT rolling-snapshot budget: PASS; `50` lines against the `60`-line maximum.
- Direct `python -m pytest` attempt: environment-only failure because the locked interpreter intentionally has no pytest module; not counted as RED. The repository `scripts/run-backend-tests.py` unittest entrypoint was used thereafter.
- Unit 1 RED focused backend: expected `4 failures + 8 errors` across `32 tests`; missing v6/batch/reference behavior only.
- Unit 2 focused backend: PASS, `32/32` in `9.560s`.
- Adjacent image/video API and cinematic handoff backend: PASS, `31/31` in `86.735s`.
- Unit 3 frontend RED: v6 parser rejected contract 6, service omitted structured bindings, and browser UI lacked the `4 张` control.
- Unit 3 frontend GREEN: parameter/service specs pass `10/10` and `12/12`; focused v6 browser workflow passes `1/1`; `npm --prefix frontend run build` passes.
- Unit 4 RED: draft command returned `insert-graph` instead of `apply-script-authoring-result`.
- Unit 4 GREEN: focused command passes `1/1`, direct-overwrite browser workflow passes `1/1`, full script-authoring suite passes `6/6`, and production build passes.
- Unit 5 GREEN: image-batch suite passes `4/4`; adjacent concurrent and multi-origin failure coverage passes `4/4`; production build passes.
- Unit 6 GREEN: asset-group mixed-outcome/ungroup/retry test passes `1/1`; planned shot/group regression passes `14/14`.
- Unit 7 GREEN: video-role/parameter/card-surface suite passes `21/21`; backend focused structured-role proof remains included in the `32/32` pass.
- Unit 8 compatibility RED/GREEN: the missing preservation helper failed before production edits; image eight-reference and operation preservation pass in the parameter suite, and rebuilt-preview v6 card generation passes `1/1` with exact structured bindings and no legacy mode. Latest production build passes.
- Unit 8 geometry/accessibility/visual matrix: initial `29/32` exposed one batch-test locator defect, one genuine ARIA ownership defect, and a mixed-suite headless performance artifact. After scoped corrections, focused behavior passes `6/6`; all geometry/accessibility assertions pass; independent authoritative headed performance passes `2/2` without threshold changes.
- Post-split focused frontend suite: PASS, `27/27` in `36s`; production build: PASS, `4,976 modules`.
- Locked full backend through `backend/.venv-ci-check/Scripts/python.exe scripts/run-backend-tests.py`: PASS, `583/583` in `478.553s`.
- Exact-current-source `npm run test:e2e:ci`: PASS, `610/610` in `671.6s`, exit code `0`.
- `npm audit` from `frontend/`: PASS, `0` vulnerabilities. State validation, diff check, UTF-8/BOM, sensitive-path, secret-signature, database-artifact, conflict-marker, and owned-file-size hygiene pass; only the accepted aggregate `CanvasStage.vue` and `CanvasWorkspace.vue` remain above the general 500-line guidance.
- Human visual/interaction decision: ACCEPTED on 2026-07-22; closure authorization received before REPORT, `DONE / PASS`, staging, commit, or push.

## Blockers And Release Conditions

- None for T6-004. All acceptance criteria and the explicit Human gate are satisfied.
- Real/paid provider calls, real secrets, user/runtime data changes, destructive operations, irreversible migrations, external accounts, and incompatible provider contracts remain Human gates for future Tasks.
