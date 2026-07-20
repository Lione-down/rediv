# TASK-T6-001 - Revid-native cinematic director Skills v2

- State: `DOING`
- Phase: `Product V3 / Phase 6`
- Objective: first eliminate the Human-reported detached Canvas connection geometry, then upgrade the three Revid-owned cinematic Skills to backward-compatible v2 director workflows with inspectable native handoff, durable sequence canon, accepted-take continuation, and explicit user-reviewed retakes.
- Dependency: `T5-096 - DONE - PASS` at pushed `HEAD == origin/main == 034a49f45952cfa0f893363d401aa9ccf52eddbd`.
- Plan: `ai/tasks/doing/TASK-T6-001-PLAN.md`.
- Progress: `ai/tasks/doing/TASK-T6-001-PROGRESS.md`.
- Planning source: untracked Human-owned `.hermes/plans/2026-07-19_225700-t6-001-revid-native-cinematic-director-skills-v2.md`; it remains preserved and is not staged.

## Product contract

1. Before cinematic v2 implementation, reproduce and fix the screenshot-like detached edge. Node port centers, connection endpoints, hit targets, Leafer geometry, and DOM geometry must consume one world-space boundary before and after load, viewport, metadata, and selection transitions.
2. Extend the existing three Revid-owned Skill IDs to active version 2. Historical v1 manifests, saved settings, request digests, task snapshots, results, and duplicated Canvases remain readable and unchanged.
3. Discovery exposes exactly one active version per cinematic Skill ID. Historical versions resolve only for exact replay or inspection. Unknown lifecycle/version, duplicate active version, imported manifest, and generic execute attempts fail closed.
4. Ordinary generation remains unchanged until the user explicitly enables a cinematic Skill or takes an explicit cinematic action. No hidden interview, prompt rewrite, provider request, model selection, task, or Canvas mutation is allowed.
5. Instruction precedence is current explicit instruction, per-reference instruction/non-transfer rule, accepted canon, current node parameters, director policy, then provider defaults.
6. Provider/model selection remains user-owned and backend-catalog driven. Prompt wording never selects a provider/model or enables an unsupported medium, role, or control.
7. Preflight is deterministic and non-mutating. Preview, canonical JSON, digest, native request, and immutable task snapshot must agree exactly; scope/capability/canon/request drift stops before mutation.
8. Director brief generation is user-entered or an explicit existing text-authority action. No hidden model call invents a brief.
9. Sequence state stays inside canonical Canvas node content and reuses commands, history, autosave, revisions, recovery, switching, and duplication. No new table, scheduler, task store, or second Canvas authority is introduced.
10. Continuation requires an explicitly accepted current-Canvas result and user-reviewed observed end state. Rejected, stale, deleted, foreign, wrong-media, or wrong-lineage results never become canon.
11. Retakes are explicit, bounded, and single-variable. No automatic evaluation, retry, regeneration, continuation, provider fallback, or model routing is added.
12. Existing authenticated native text/image/video generation, idempotency, quota, admission, polling, cancellation, result, retry, history, and lineage remain the only execution authorities.

## Scope

- Detached-edge root cause, RED regression, minimal geometry fix, focused browser proof, and related Canvas regression.
- Three active cinematic Skill v2 manifests plus exact historical v1 resolution.
- Strict provider-neutral director brief, sequence, reference transfer, workflow mode, and retake contracts in Python and TypeScript.
- Pure deterministic director compiler, canonical request/digest, immutable native-handoff snapshot, and drift validation.
- Standalone fast lane, explicit director/sequence authoring, next-unresolved-clip planning, accepted-take continuation, and take review.
- Progressive disclosure in existing Canvas surfaces, with 375px review-only ownership retained.
- Duplication-safe IDs/revisions, stale lineage, deterministic offline eval fixtures, browser flows, source/license ledger, accessibility, build, functional regression, and existing performance thresholds.

## Non-goals and Human gates

- Do not install or execute the third-party `seedance-20` package, vendor its files, import remote Skills, or add a generic Skill marketplace/runtime.
- Do not integrate Seedance/Volcengine/BytePlus, create an account, read credentials, access `.env`, or make real/paid calls.
- Do not add a provider adapter, second scheduler/store, new database table/migration, cross-Canvas edge, mobile editing, or incompatible long-term contract.
- Do not copy third-party prompt prose, examples, provider/router tables, brand assets, or README visuals. Add an MIT notice only if the actual diff contains copied substantial expression.
- Real-provider cinematic fidelity and creative quality remain unverified without a separately authorized call budget and Human verdict.
- Destructive database/filesystem operations, user/runtime migrations, real secrets, paid calls, and incompatible contract changes remain Human gates.

## Acceptance criteria

1. The screenshot-like detached edge is deterministically reproduced before GREEN; after the fix, both endpoints land on their actual node boundaries within 2 CSS px at 17%, 36%, 100%, and 200%, including initial load and delayed layout/metadata reconciliation.
2. Edge repair preserves port acquisition, draft continuation, selection/reroute, commands, autosave, and graph serialization, with no unrelated refactor.
3. Exactly three cinematic Skill IDs are active/discoverable at v2; v1 history resolves unchanged.
4. No arbitrary, imported, remote, provider-branded, or generic execute runtime exists.
5. New Skill behavior is off until an explicit user action; ordinary generation performs zero hidden Skill work.
6. Explicit user and per-reference instructions outrank director policy; every reference has stable node identity, source revision, one primary role, and bounded non-transfer rules.
7. Unsupported media, roles, transfers, and controls fail closed before quota, task, asset, provider, or Canvas mutation.
8. Provider/model selection is explicit and backend-catalog driven; prompt wording never changes it.
9. Preflight preview, canonical request, digest, native handoff, and immutable task snapshot agree byte-for-byte and drift fails before mutation.
10. Director briefs are explicit; sequence planning exposes only the next unresolved clip for execution.
11. Continuation requires an accepted current-Canvas result and observed end state; rejected/deleted/stale/foreign/unsupported results never become canon.
12. Completed beats do not replay and reserved future beats do not leak into the current prompt.
13. Sequence edits and take review use exact atomic Canvas commands with undo/redo, autosave, reload, recovery, switching, and duplication evidence.
14. Retakes are explicit, bounded, single-variable, and never auto-execute.
15. Disclosure-only UI causes zero graph/history/autosave/quota/task/asset/provider mutation.
16. No new database table/migration, provider integration, second scheduler/store, cross-Canvas relation, or mobile editing enters the diff.
17. Desktop, compact, narrow, 375px review-only, keyboard, focus, IME, reduced motion, axe serious/critical zero, and 200% zoom evidence pass.
18. Existing 200-node/300-connection thresholds remain unchanged and are classified with renderer/hardware context.
19. Source/license attribution is decided from the actual diff and recorded; mock/contract/browser evidence is never represented as real-provider fidelity.
20. Focused tests precede related regression, production build, full functional Chromium, accessibility, performance, UTF-8, diff, sensitive-path, secret-signature, exact-stage, and HEAD-drift checks.
21. Task, PLAN, PROGRESS, evidence, implementation, tests, REPORT, CURRENT, ROADMAP, scoped commits, and `origin/main` agree before `DONE - PASS`.
