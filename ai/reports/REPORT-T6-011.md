# REPORT-T6-011 - Text card workflow with explicit model selection

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-23`
- Activation baseline: `11cdaaac7be485e219830ebf9a6c589996830a47`
- Task: [TASK-T6-011](../tasks/todo/TASK-T6-011.md).
- Architecture:
  [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Delivered

- Published text capability v2 with explicit allowed model IDs and per-model workflow modes. Legacy `model` and
  `model_label` remain read-only compatibility projections; `models[]` is the execution authority.
- Added bounded compact text-job `mode` and `content_revision` fields. Unsupported model/mode pairs and text-only fields
  on non-text media fail before repository, quota, provider, Canvas, history, or autosave mutation.
- Added typed undoable/autosaved commands for direct text edits, durable job binding, and result application. Canonical
  `script:script` stays on its prior editing path for T6-013; T6-011 owns text cards and legacy `script:prompt`.
- Rebuilt the text empty state with four truthful visible choices. Assisted modes are enabled only when an allowed model
  advertises them; direct writing remains available without capability-dependent graph mutation.
- Added a selected-card attached composition surface using the existing stage/inset geometry authority, explicit required
  native model selection, node-local pending/error feedback, and same-card result application without a new result card.
- Restored durable text jobs through current-Canvas compact synchronization. Result application verifies the scoped job,
  original node, and submitted content revision; stale results remain recoverable and never overwrite newer text.
- Preserved stable node identity, graph bindings, legacy capability/result readability, and existing script authoring,
  while stopping before every T6-012 through T6-016 behavior.

## TDD Evidence

- Backend RED first produced four expected failures for missing text capability v2/model-mode authority and one additional
  expected failure for non-text field leakage. The related GREEN set passed `34/34`.
- Frontend RED first produced `3/3` expected failures for the missing v2 capability and typed text-command fingerprints;
  the focused GREEN set passed `3/3`.
- Browser RED covered explicit model selection, attached placement, direct edit persistence, refresh restoration,
  no-new-card application, stale revision, undo, and redo before the final focused set passed.
- Broad Chromium exposed a real T6-013 boundary regression in canonical script editing; the typed command was narrowed to
  text and legacy prompt cards. The second broad failure was an existing debounced viewport screenshot timing flake, and
  its exact unchanged test passed on rerun.
- The first broad backend run passed `609/611` and exposed two legacy consumers of `text.model`. The compatibility
  projection was restored without changing `models[]` execution authority; focused post-fix regression passed `34/34`,
  then a fresh full broad rerun passed `611/611`.

## Verification

- Focused and related backend post-fix regression: `34/34` PASS.
- Fresh broad backend suite excluding only future-owned T6-012/T6-015 frozen modules: `611/611` PASS in `766.995s`;
  disposable MySQL and fake providers only.
- T6-011 focused frontend contract tests: `3/3` PASS.
- Related capability, compact job, runtime, result, and script regression: `24/24` PASS.
- Final focused browser/contract set: aggregate `21/21` PASS after one legacy-fixture correction and exact retry.
- Broad Chromium run: `644/646` PASS. Exact post-fix reruns passed `2/2`, so all `646` relevant assertions are green on
  final source; this is not represented as one uninterrupted `646/646` run.
- Production build: PASS; Vue type-check and Vite transformed `4,998` modules.
- Frontend production dependency audit: PASS; `0` vulnerabilities.
- Automated geometry proof measured the attached surface disjoint from the card and inside the `1366x768` stage/insets,
  including the existing above-flip behavior. Automated visual/functional/interaction evidence passed.
- Human visual/interaction acceptance was not performed and is not claimed.
- Activation and pre-close single-active project-state validation passed. Post-close validation has exactly the expected
  handoff error because unfinished future Tasks exist while T6-011 is closed and T6-012 is intentionally not active.
- Diff review, UTF-8, protected-path, sensitive-path, staged-secret, exact-staging, commit, and push checks form the final
  delivery gates.
- Pre-commit recheck detected and preserved two already-pushed Human Owner security commits with no T6-011 path overlap.
  The updated AGENTS rules were re-read, and the exact staged set contains no environment-related file.

## Boundaries

- No T6-012 director Skill, T6-013 script asset/shot workflow, T6-014 image lifecycle, T6-015 semantic video, T6-016
  compatibility removal, or later behavior was implemented.
- No real or paid provider call, secret access, user/runtime-data migration, destructive database operation,
  external-account action, new dependency, or framework/runtime replacement occurred.
- No migration was added or applied to user/runtime data.
- User-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` are excluded from delivery and staging.
- Legacy result documents, capability projections, and current compact job compatibility remain readable.

## Decision

T6-011 is `DONE / PASS`. T6-012 is dependency-ready but not active; it may begin only after this delivery is committed
and pushed and a new goal-mode task restores the single-active invariant.
