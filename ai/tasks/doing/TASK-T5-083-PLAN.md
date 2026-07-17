# TASK-T5-083 Plan

- State: `DONE`
- Objective: deliver a strict mock-first script-to-shot contract and one atomic shot/generation/Storyboard graph creation path while preserving all existing Canvas and provider boundaries.

## Unit 0 - Durable activation

1. Read AGENTS, CURRENT, ROADMAP, the direct-delivery ADR, T5-082 closure documents, and TDD instructions completely.
2. Verify clean committed/pushed T5-082 baseline and preserve untracked `.hermes/plans` plus `output/` outside ownership.
3. Create T5-083 Task, PLAN, and PROGRESS; correct stale T5-082 active-state lines; make T5-083 the only `DOING` Task.
4. Repeat Git truth checks before business-code edits.

Success gate: durable state agrees on one active Task, exact baseline, scope, non-goals, acceptance, and next RED test.

## Unit 1 - Contract audit and design lock

1. Map canonical script/generation/group node serialization, typed prompt connections, generation parameters, Storyboard v1 validation/projection/layout/commands, Canvas duplication, atomic `insert-graph`, history/autosave, and mock browser transport.
2. Map backend auth/project/canvas scope patterns and prove a mock-only endpoint can avoid generation provider, task, quota, asset, schema, and secret paths.
3. Lock the v1 shot fields, response scope identity, limits, deterministic mock rules, shot-plan group contract, node/edge counts, placement, and failure semantics.
4. Refresh PLAN/PROGRESS with exact owned files and RED fingerprints.

Success gate: implementation requires no Human gate, DB change, paid call, real provider, cross-canvas relation, or UI redesign.

### Verified integration design

- Backend contract: add strict `schemas/shot_schema.py`, deterministic `controllers/shot_schemas.py`, and authenticated `/api/projects/{project_id}/canvases/{canvas_id}/shot-schema` route. The route verifies current canvas ownership, accepts only contract version 1 plus provider `mock`, and never imports or calls generation provider/task/quota/asset code.
- Shot document: exact root identity is `contract_version: 1`, `schema_id: revid.shot-sequence`, `provider: mock`, `model: revid-shot-mock-v1`, current project/canvas/source-script IDs, one supported aspect ratio, exact `shot_count`, and 2-25 contiguous shots. Each shot has only `shot_id`, `index`, bounded `title`, `narrative`, and `image_prompt`.
- Frontend contract: add `shot-schema.ts` for independent exact-key runtime validation, `shot-schema-service.ts` for scoped transport verification, `shot-graph.ts` for pure command construction, and `use-canvas-shot-schema.ts` for request-time/current-state revalidation plus one dispatch.
- Graph shape for N shots: preserve the selected source script; create N canonical prompt nodes and N canonical image-generation nodes plus one Storyboard group (`2N+1` new nodes), then connect source script -> generation as T1 and shot prompt -> generation as T2 (`2N` typed edges). Persist no source-node pointer inside node content; typed edges remain the authoritative relationship and duplicate safely.
- Storyboard contract: retain image-group schema version 1 unchanged; add exact shot-plan schema version 2 whose only children are canonical image-generation nodes carrying shot schema version 1 and contiguous indices. Existing settings/reorder retain the active version, malformed/future versions fail closed, and Canvas duplication remaps only exact supported ordered child IDs.
- Placement: use one whole-block collision search; prompts form the upper ordered grid and the v2 Storyboard group lays out generation children below with existing Canvas geometry. The group is selected after the one insert command.
- Action integration: add one `script.create-shot-graph` intent to the existing professional registry/Palette. Eligibility requires one canonical unlocked ungrouped non-empty `script/script`, current editable Workflow view, and no active request. No new component or visual vocabulary is added.
- Focused evidence: backend contract/API tests, frontend parser/graph tests, extended Storyboard/duplication tests, and browser workflow cases for success, provider failure, malformed response, stale selection, one PATCH, undo/redo/reload, no generation request, 920px, and 375px review-only.

## Unit 2 - Strict backend mock contract

1. Write focused backend RED tests for strict request/response validation, deterministic 2-25 shot generation, authentication, ownership, project/canvas scope, and no provider/quota/task/asset mutation.
2. Add focused schemas, deterministic mock provider/controller, and one scoped API route using existing FastAPI organization.
3. Keep provider/model literals explicit and reject every unsupported mode/version.

Success gate: mock responses are strict, deterministic, scoped, bounded, and offline-only.

## Unit 3 - Frontend schema parser and graph builder

1. Write frontend RED tests for exact v1 parsing and every malformed/future/foreign/duplicate/order/extra-field rejection.
2. Add the strict runtime parser and service response scope validation.
3. Write RED graph-builder tests for exact prompt/generation/group nodes, typed connections, metadata, placement, source immutability, and fail-closed invalid input.
4. Build one collision-aware `InsertGraphCommand` using canonical node and Storyboard contracts.

Success gate: valid input produces one complete deterministic command; invalid input produces no command and no mutation.

## Unit 4 - Professional action and mock-first workflow

1. Write browser RED cases for eligibility, Palette execution, endpoint payload, response validation, one PATCH, no automatic generation call, provider failure, malformed response, and stale selection.
2. Add the action intent and one focused coordinator/service integration outside oversized Canvas components.
3. Revalidate the exact script and current project/canvas before and after the provider request, then dispatch once.
4. Prove undo/redo/autosave/reload/recovery, Storyboard order, keyboard ownership, 920px bounds, and 375px review-only behavior.

Success gate: one explicit action creates one atomic mock-planned graph; every failure path is mutation-free.

## Unit 5 - Storyboard compatibility and duplication

1. Add version-specific shot-plan group validation/projection/layout tests without weakening image Storyboard v1.
2. Preserve v1 update/reorder/convert behavior; define explicit shot-plan edit boundaries.
3. Extend fail-closed Canvas duplication only for the exact supported shot-plan contract and remap all internal node references.

Success gate: source and duplicate graphs both validate, while malformed/future/unsupported content remains unchanged and non-executable.

## Unit 6 - Integrated verification and closure

1. Run focused backend, pure frontend, browser workflow, history/persistence, Storyboard, duplication, accessibility, responsive, and failure tests.
2. Run relevant Canvas/generation/Storyboard/action regression, then backend regression and frontend build.
3. Run full functional Chromium and guarded owned 200-node/300-connection live evidence only as needed; close owned services afterward.
4. Perform fresh diff review, UTF-8, file-size/growth, `git diff --check`, sensitive-path/secret/artifact, exact scope, and HEAD-drift gates.
5. Write REPORT, close Task/PLAN/PROGRESS/CURRENT/ROADMAP, stage exact owned paths, commit, push, and verify local/remote agreement.

Success gate: code, tests, evidence, durable state, commit, and `origin/main` agree on `DONE - PASS` with the persistent goal still active for T5-084.

## Stop rules

- Stop and document a blocker before any real provider/paid call, secret access, external account, database/migration change, destructive operation, cross-canvas reference, second Canvas engine/store, mobile editing, or incompatible UX.
- Stop and re-plan if strict response validation, exact source preservation, one-command atomicity, or Storyboard v1 compatibility cannot be maintained.
- Preserve existing untracked `.hermes/plans` and `output/`; never stage them.
