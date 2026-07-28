# TASK-T6-012 - Implement the automatic story director and story-production contract

- State: `BLOCKED`
- Verification outcome: `FAIL`
- Phase: `Product V3 / Phase 6 contract-first reset`
- Objective: convert story/script input into a strict Revid-owned `revid.story-production.v1` document and per-shot video prompts through the automatic, project-owned, non-selectable `revid.story-director`.
- Dependency: `T6-011 - DONE / PASS` at activation baseline `HEAD == origin/main == 214b7c202ecb00b6504cdda849421ada3f04c38e`.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Frozen RED evidence: [REPORT-T6-007](../../reports/REPORT-T6-007.md).
- Plan: [TASK-T6-012-PLAN](../doing/TASK-T6-012-PLAN.md).
- Progress: [TASK-T6-012-PROGRESS](../doing/TASK-T6-012-PROGRESS.md).

## Objective and scope

- Define strict version-1 story, event, role, scene, prop, reference, continuity, shot, field-lock, and validation-state schemas.
- Stamp `revid.story-director` automatically; users select only a backend-allowed text model and never select, upload, replace, or configure the internal Skill.
- Route standalone-shot and sequence-project work through explicit Revid-owned paths.
- Compile only the current shot's concise provider-facing video prompt from validated production state; never send the internal production document to a media provider.
- Preserve stable asset/shot IDs, source revisions, duplicate display names, locked/user-edited fields, partial-regeneration targets, and accepted-take lineage.
- Keep rejected takes out of canonical and continuation state; accepted observed end state may update transient continuity without rewriting canonical identity/design state.
- Add bounded repair for structurally invalid text-model output and fail closed on invalid, oversized, unsafe, or unresolved output.
- Project allowed text-model capabilities through the existing Script authoring boundary without exposing a Director/`导演台` Canvas entry.
- Retain a source/evidence manifest for the pinned public research baseline, license, derived-decision boundaries, and current official-provider capability boundaries.

## Non-goals and locked boundaries

- No visible Director/`导演台` Canvas authoring type, menu item, console, selector, or node.
- No T6-013 Script production UI/asset-area/storyboard rebuild, T6-014 image lifecycle, T6-015 semantic video execution, or T6-016 compatibility removal.
- No framework, database, Canvas-engine, route, provider-authority, quota, durable-job, graph/history/autosave, or stable-node-ID rewrite.
- No schema migration, user/runtime-data mutation, real or paid provider call, secret/environment-file access, external Skill installation, or copied third-party prompt prose/assets.
- T6-011's accepted Canvas result and unspecified deferred minor issues remain untouched.

## Acceptance criteria

1. `StoryProductionDocument` strictly validates the exact Revid schema/version/Skill stamps, rejects extra fields, and requires at least one non-empty video prompt for every shot.
2. Stable asset and shot IDs remain authoritative when display names duplicate; every shot reference resolves to an existing asset definition with a stable source revision and explicit transfer/exclusion policy.
3. Deterministic routing and strict JSON handling produce a validated document or a bounded retryable failure; unvalidated free text is never accepted as production state.
4. Partial regeneration changes only the requested unlocked target, while whole-document regeneration preserves locked and user-edited fields.
5. The prompt compiler includes only the current shot, accepted opening state, required continuity locks, and reserved-beat exclusions; internal JSON and unrelated future shots are absent.
6. Accepted takes may become transient continuity parents; rejected takes never become continuation parents or canonical state.
7. Frontend capability parsing exposes allowed text models plus the fixed non-selectable director identity. No Skill selector or visible Director entry is introduced.
8. Existing frozen T6-012 backend/browser REDs become GREEN without weakening assertions, and T6-013 through T6-016 REDs remain frozen.
9. Focused tests, related regression, fresh frontend build, applicable browser/live proof, relevant broad checks, validator, and fresh diff/security audit are recorded.
10. Task remains `DOING` or `VERIFYING / PENDING` until the Human Owner explicitly records `ACCEPT` or `ACCEPT_WITH_DECLARED_BOUNDARIES`; no REPORT, staging, commit, or push occurs before that decision.
