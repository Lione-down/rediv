# TASK-T6-024 PLAN - Provider-valid Video compiler and old T6-015 replacement

- State: `DONE`
- Verification outcome: `PASS`
- Baseline: `c79bf1e8c0deac88f4fa1111ba8dd8a3b7327d7c`
- Task: [TASK-T6-024](../todo/TASK-T6-024.md)
- Progress: [TASK-T6-024-PROGRESS](TASK-T6-024-PROGRESS.md)

## Authority and stop boundary

The frozen PRD, V1 behavior matrix, formal redesign plan, T6-013 official Agnes Video contract, and completed T6-017
through T6-023 contracts define this Task. Current backend capability/provider adapters, generation task/job
authorities, typed Canvas command/history/autosave, same-card result ingestion, and exact template lineage remain the
only runtime authorities.

Deliver only the pure provider-valid Video compiler and the narrow request/lineage integration required to use it.
Stop before T6-025 WorkflowRun, T6-026 upgrade/clone/detach, and T6-027 retirement/release. Do not call a real/paid
provider, access protected content or secrets, mutate user/production data, add a migration, create a third execution
path, auto-run a card, or rewrite frozen T6-017 through T6-023 contracts.

## Unit 1 - Characterize authority and observe focused RED

1. Inspect the frozen provider projection fixtures and abuse cases, current Video request normalization, Agnes
   adapter/dispatch, template lineage resolver, selected-shot Video authoring, and focused backend/browser tests.
2. Identify and preserve official Video V2.0 rules already implemented by T6-013, including model, ratio, clarity,
   duration, negative prompt, resolution/version gating, frame count, opaque `video_id`, status/result, and same-card
   ingestion boundaries.
3. Add the smallest focused backend REDs for a wished-for template Video projection/compiler that accepts only text,
   single image, or ordered temporal keyframes and rejects semantic fusion/conflicting modes/stale lineage before
   mutation.
4. Add the smallest frontend/browser RED proving selected-shot template Video intent preserves exact lineage and
   explicit temporal-frame semantics without automatic generation or semantic reinterpretation.
5. Run the exact focused tests and record failures caused by the missing T6-024 behavior, not syntax or environment.

## Unit 2 - Smallest coherent GREEN

1. Implement a pure provider projection service under existing backend module boundaries; it must not send HTTP or
   own transaction, task, quota, job, WorkflowRun, or Canvas state.
2. Reuse current generation parameter normalization, Agnes contract, provider dispatch, Video route, and template
   lineage validation rather than adding alternate authorities.
3. Project only the three official mutually exclusive input shapes. Keep semantic metadata in sanitized Revid
   context; reject semantic multi-reference Video unless the request already points to one independently composed,
   owned, current frame.
4. Carry exact template/version/instance/step/node/shot and asset source-revision facts through current persisted
   Video configuration and request snapshots.
5. Preserve current resolution compatibility: capability-authoritative width/height by default and top-level
   `resolution` only where the current versioned adapter contract explicitly permits it.

## Unit 3 - Focused and related regression

1. Run focused compiler, Agnes adapter, generation parameter, Video API, dispatch, template-lineage, status/result,
   and zero-mutation backend tests.
2. Run focused selected-shot/template Video and generation-parameter browser tests.
3. Run related Script/Image/template-instance regression to prove frozen T6-017 through T6-023 behavior is unchanged.
4. Classify any unrelated baseline failure without weakening tests or widening T6-024.

## Unit 4 - Fresh build, runtime/browser proof, and audit

1. Produce a fresh frontend production build before preview/browser evidence.
2. Run provider-free built-artifact browser proof for legal Video modes, semantic fail-closed behavior, persistence/
   reload, no automatic generation, and same stable card/lineage.
3. Run changed-file compile/type checks, project-state validator, `git diff --check`, file-size/UTF-8 checks,
   protected-path review, and sensitive/staged secret/database-artifact scans.
4. Perform a fresh diff review against every acceptance criterion and confirm no T6-025 through T6-027 scope.

## Unit 5 - Closure

1. Reconcile Task/PLAN/PROGRESS/REPORT/CURRENT/ROADMAP only after every non-deferred acceptance criterion passes.
2. Recheck `HEAD` against the activation baseline immediately before exact-path staging.
3. Stage only owned T6-024 paths, audit the index, create one `type(scope): subject` commit, and push `main`.
4. Fetch and confirm `HEAD == origin/main` with ahead/behind `0/0`.
5. Mark the thread goal complete only after no T6-024 work remains. Stop without activating or implementing T6-025.

## Completion outcome

Units 1 through 5 are complete. The provider-valid compiler is integrated through the existing Video route and
adapter; exact template shot lineage reaches the existing request snapshot; semantic multi-image fields fail closed;
focused/related backend and Chromium checks, fresh build, built-artifact proof, compile/state/diff/security audits,
scoped Git delivery, and remote parity passed. The attempted full Chromium run exceeded its 20-minute operational
budget without a terminal summary and is not claimed as PASS; direct T6-024 browser evidence passed `14/14`, and
related Chromium passed `43/43`. T6-025 remains inactive.
