# TASK-T6-001 Plan

- State: `DOING`
- Objective: repair detached Canvas edge geometry first, then deliver Revid-native cinematic director Skills v2 without changing v1 history or creating a second execution/state authority.
- Activation baseline: `main`, `HEAD == origin/main == 034a49f45952cfa0f893363d401aa9ccf52eddbd`, ahead/behind `0/0`; tracked worktree clean; Human-owned `.codex/`, `.hermes/plans/`, and `output/` remain untracked and excluded.
- External workflow reference: `https://github.com/Emily2040/seedance-2.0`, pinned `main == 57d01dc66f93ecb03c2475be5f22dc416d9b701d` on 2026-07-20. It is an MIT-licensed design reference, not runtime code or provider truth.
- Task: `ai/tasks/todo/TASK-T6-001.md`.

## Locked decisions

1. T5-096 is the final Product V2 / Phase 5 Task. T6-001 is the only active implementation Task.
2. Unit 0A closes the user-reported detached-edge regression before cinematic v2 business work.
3. The active manifests are `revid.cinema-script.v2`, `revid.cinema-image.v2`, and `revid.cinema-video.v2`; exact v1 history stays separately resolvable.
4. The provider-neutral compiler is pure. Provider facts stay in the source-dated backend capability catalog.
5. Final provider prompts remain natural language. Typed JSON is internal planning, preflight, snapshot, or explicitly requested script data.
6. Sequence state uses canonical Canvas node content, existing atomic commands, history, autosave, revisions, recovery, switching, and duplication. No migration or second store.
7. Accepted output plus user-reviewed observed state is the only continuation canon. Retakes and generation always require explicit user actions.
8. Source adaptation uses independently expressed Revid contracts. The actual diff decides whether third-party notice text is required.

## Unit 0 - Activation and evidence baseline

- Status: `completed`

1. Reconstruct state from AGENTS, CURRENT, ROADMAP, T5-096 Task/PLAN/PROGRESS/REPORT, T5-091 REPORT, and direct-delivery ADR.
2. Verify `HEAD == origin/main`, ahead/behind `0/0`, no later T5 Task, T5-096 `DONE - PASS`, and only preserved untracked paths.
3. Repin the external reference SHA without adopting upstream drift.
4. Create Task, PLAN, PROGRESS, evidence index, and source/license ledger; activate T6-001 in CURRENT/ROADMAP.

Success gate: exactly one Task is active and only scoped activation documents change before RED product tests.

## Unit 0A - Detached connection geometry correction

- Status: `completed`

1. Reproduce the screenshot state with a deterministic fixture that distinguishes persisted node coordinates, shared resolved layout, Leafer port centers, and SVG connection endpoints.
2. Add RED assertions for initial load plus delayed reconciliation at 17%, 36%, 100%, and 200%, including both source and target endpoints, actual path endpoints, and 40px acquisition targets.
3. Trace world-space versus screen-space conversion through `node-layout`, port presentation/interaction, renderer reconciliation, and connection presentation.
4. Make the smallest fix at the shared geometry ownership boundary. Do not add offsets or screenshot-specific constants.
5. Run focused geometry/connection tests, related node/selection/reroute/continuation regression, production build, and real browser visual proof.

Success gate: no detached path on load or reconciliation; both edge endpoints remain within 2 CSS px of visible ports/boundaries at all required zooms.

## Unit 1 - Versioned registry and strict v2 schemas

- Status: `completed`

1. Write RED backend/frontend fixtures for three active v2 manifests, exact historical v1 resolution, duplicate-active/unknown-version rejection, and version-mixing rejection.
2. Add strict bounded director brief, sequence state, reference transfer, workflow mode, and retake schemas with extra keys forbidden.
3. Keep v1 capability, preflight, canonical serialization, and digest paths independent and unchanged.
4. Split new responsibilities into scoped modules so no new file exceeds 500 lines.

Primary files: `backend/core/agent_skill_contract.py`, `backend/core/cinematic_skill_contract.py`, new `cinematic_director_contract.py` and `cinematic_sequence_contract.py`, affected schemas, `frontend/src/modules/canvas/agent-skills.ts`, `cinematic-skills.ts`, and new director/sequence modules.

Success gate: focused backend and Chromium contract suites pass with exact v1 fixtures unchanged.

## Unit 2 - Deterministic director compiler and exact native preflight

- Status: `completed`

1. Add table-driven RED cases for standalone, vague brief, image continuity, video keyframes, conflicting roles, unsupported media, and instruction precedence.
2. Implement a pure compiler with no network, database, filesystem, or clock dependency.
3. Return explicit warnings/conflicts; never silently weaken a requested reference/control or invent a vague intention.
4. Revalidate scope, sources, capability, provider/model, acknowledgement, sequence/canon, prompt, parameters, canonical request, and digest immediately before the existing native transaction.
5. Persist policy, brief, transfer rules, canon revision, canonical request, and digest in the existing immutable generation task snapshot.

Success gate: preflight alone mutates nothing; one explicit Send yields one exact existing native request.

## Unit 3 - Explicit director brief and durable sequence planning

- Status: `in_progress`

1. Lock one backward-aware representation for director/sequence content before implementation.
2. Validate explicit text-authority output against source node/revision before one Canvas command.
3. Reject malformed JSON, duplicate identities, impossible ordering, or excessive clips with zero graph/history/autosave mutation.
4. Persist one undoable/redoable sequence command that survives autosave, reload, switching, and recovery.
5. Display the global spine while exposing only the next unresolved clip as executable. Editing makes dependants stale, never rewrites history.

Success gate: durable reversible planning creates no image/video task until a later explicit clip action.

## Unit 4 - Accepted-take continuation and duplication-safe canon

- Status: `pending`

1. Require accepted result lineage plus observed end state before continuation preflight.
2. Reject foreign, stale, deleted, rejected, wrong-media, or wrong-task results before mutation.
3. Accept/reject uses exactly one command/history entry and one canon revision increment; rejection preserves the result.
4. Prevent completed-beat replay and future-beat leakage.
5. Duplicate Canvas sequence/source/result references safely while historical tasks remain immutable.

Success gate: only explicit acceptance advances canon and exact lineage survives reload/duplication.

## Unit 5 - Reference transfer, capability gating, and retake UX

- Status: `pending`

1. Bind every reference to one role, ordered identity, source revision, explicit instruction, and bounded non-transfer enum.
2. Disable unsupported audio/video/reference roles with backend capability reasons; crafted requests fail before mutation.
3. Prove prompt wording never changes provider/model or speed preference.
4. Add concise progressive take review: keep, fix in post, available edit, reroll, and rewrite.
5. Reroll/rewrite creates a new preflight only; execution still requires explicit Send. Retakes name exactly one repair variable and remain bounded.

Success gate: unsupported intent is explicit/non-mutating and retakes remain user-owned.

## Unit 6 - Eval, browser UX, accessibility, regression, and performance

- Status: `pending`

Required offline eval covers standalone fast lane, vague brief, product/character continuity, accepted unexpected outcome, rejected take, completed/reserved beats, single-variable retake, unsupported media, stale canon, provider ownership, malformed schema, duplication, and 375px review-only.

Verification order:

1. Focused backend contracts/execution.
2. Focused frontend pure/browser suites.
3. Diff-derived T5-090/091/092/094/095/096 and Canvas geometry regressions.
4. Full backend through `backend/.venv/Scripts/python.exe` using the repository's guarded MySQL-compatible paths.
5. Production frontend build and full functional Chromium.
6. Axe, keyboard, IME, focus, Escape/outside dismissal, reduced motion, 200% zoom, 1440/1366/920 editing, and 375 review-only.
7. Existing guarded 200-node/300-connection performance thresholds without weakening.
8. UTF-8/BOM, file size, diff, source attribution, sensitive-path, secret-signature, exact-stage, and HEAD-drift review.

Success gate: deterministic evidence is green and no result is represented as real-provider quality proof.

## Unit 7 - Fresh review, Human UX gate, report, and delivery

- Status: `pending`

1. Review the fresh diff against every acceptance criterion and non-goal.
2. Prove no generic execute route, imported runtime, hidden routing/generation, unsupported-reference weakening, or second authority entered the diff.
3. Finalize source/license decision from the actual diff.
4. Present Revid-owned screenshots and action traces for Human review without claiming provider fidelity.
5. Write REPORT only when all non-deferred gates pass, then synchronize Task/PLAN/PROGRESS/CURRENT/ROADMAP.
6. Stage only owned paths, exclude `.env*`, `.codex/`, `.hermes/plans/`, `output/`, secrets, keys, certificates, and unrelated files; recheck HEAD, commit, push, and verify `0/0`.

Success gate: repository documents, implementation, evidence, scoped commits, and `origin/main` all agree on `DONE - PASS`.

## Stop rules

- Stop before secret/`.env` access, paid/real provider calls, external-account mutation, destructive work, user/runtime migration, third-party code/assets import, or incompatible long-term contract change.
- Stop for an ADR/Human decision if the required behavior cannot use existing native Revid authorities.
- Preserve and never stage `.codex/`, `.hermes/plans/`, `output/`, `.env*`, or unrelated user files.
