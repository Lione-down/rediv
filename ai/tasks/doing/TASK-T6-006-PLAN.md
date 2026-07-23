# TASK-T6-006 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `Complete`
- Task: [TASK-T6-006](../todo/TASK-T6-006.md).
- Progress: [TASK-T6-006-PROGRESS](TASK-T6-006-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Detailed execution plan: [T6-006 LibTV Canvas workflow and durable generation reset](../../../.hermes/plans/2026-07-23_160152-t6-006-libtv-canvas-workflow-durable-generation-reset.md).

## Delivery rule

T6-006 produces an approved architecture and dependency-ordered implementation backlog only. No business-code edit is authorized until the Human Owner approves the design and explicitly requests implementation.

## Recommended direction

Redesign the product workflow first, then refactor the existing modular monolith through a strangler sequence aligned to that approved workflow. Preserve durable data-integrity, Canvas, history, persistence, security, and provider-ownership contracts unless the Human Owner explicitly replaces them. Move orchestration out of aggregate Vue components, replace the backend process-wide store facade with domain ports and request-scoped services, and keep one deployable frontend plus one deployable FastAPI application.

## Confirmed replacement workflow

- All user-visible nodes have a custom renameable external title; stable IDs remain the authority for connections, `@` references, generation, history, and persistence.
- Text cards support direct writing and capability-gated assisted modes. Users select an allowed text model and accepted output returns to the same card.
- Script cards accept direct story text or one connected text source. Users select the text model; Revid automatically invokes a project-owned director Skill with no user-facing Skill selector.
- The director Skill produces roles, scenes, props, image prompts, structured shots, and one independent video prompt per shot. Users can edit, lock, add, remove, materialize, and locally regenerate assets/shots.
- `Emily2040/seedance-2.0` at commit `57d01dc66f93ecb03c2475be5f22dc416d9b701d` is an approved public research baseline for director coherence, reference-role/exclusion contracts, current-shot prompt compilation, accepted-take continuity, and eval design. Revid will implement its own internal non-selectable Skill and will not inherit Seedance-specific capability claims or install the external Skill.
- Image generation keeps the first result in the initiating card. Additional batch outputs create sibling image cards.
- Video generation supports text, first frame, first/last frame, and semantic multi-image references. Up to nine references retain stable node/asset IDs, title-plus-thumbnail display, semantic role, independent instruction, and order.
- `@` lists only already-connected compatible images and never creates a graph connection.
- Text, script, image, and video jobs continue across refresh, route/Canvas changes, and reconnect. Results return to the original persisted card.
- Ordinary submit/status/result/delta APIs are compact and exclude full task history, `request_parameters`, provider raw responses, duplicated result bodies, and base64 media.

## Read-only audit verdict

- `canvas-card-work-model.ts` currently treats script as text and has no semantic multi-image mode.
- `script_authoring_contract.py` explicitly does not run cinematic decomposition and exposes one hard-coded text model.
- `generation_parameter_contract.py` and `video_generate.py` reduce structured multi-image references to single-image or keyframe modes and carry no per-image instruction.
- `generation-result-projection.ts` plus `canvas-materialized-card-projection.ts` maintain separate canonical result nodes behind one visible card.
- No node-title rename command/UI was found.
- Generation provider work runs inside the text/image/video HTTP request coroutine; cancellation is persisted as `request_cancelled`.
- Frontend runtime polling refreshes the complete project task collection every two seconds, up to 100 tasks per page, while task DTOs include full `request_parameters`.
- Text and media completion responses duplicate canonical content/URLs and return full task/quota objects.
- No durable generation worker or server-side job runner exists.
- Existing machine tests protect several now-rejected keyframe, result-node, full-task-response, and project-wide polling contracts; replacement RED tests must lead implementation.

## Unit sequence

### Unit 0 - Rejected-task closure and measured baseline

- Status: `complete`
- Close T6-005 as `BLOCKED / FAIL` without REPORT, commit, push, rollback, or deletion.
- Measure current source size and concentration, read locked ADRs/architecture, and record the proposed direction.

### Unit 1 - Product behavior and rejected-code disposition

- Status: `complete`
- The Human Owner classified T6-005's visual design, interaction logic, business flow, and information architecture as entirely unacceptable.
- Product workflows and technical architecture must be redesigned together.
- Commit the current T6-005 implementation only as a rejected audit/reference snapshot. It is not an accepted behavior baseline and creates no reuse presumption.

### Unit 2 - Human-authored replacement workflow

- Status: `complete`
- The Human Owner supplied and confirmed the replacement workflow covering text, script, image, video, node naming, semantic references, built-in Skill ownership, durable generation, compact APIs, and LibTV/Revid boundaries.
- The earlier ordered-keyframe-only multi-image assumption is explicitly superseded.

### Unit 3 - Frontend target boundaries

- Status: `complete`
- Define route-shell, feature-orchestrator, Pinia domain state, typed command, renderer/geometry, presentation component, and API-client ownership.
- Split future work around stable behavior contracts rather than file-size-only moves.
- Define how `CanvasWorkspace.vue`, `CanvasStage.vue`, command execution, rendering, autosave, generation, resources, and contextual surfaces communicate without circular ownership.
- Use one canonical card view model and one visible geometry authority. New successful generation updates the original card; legacy result nodes remain behind an explicit compatibility boundary only.

### Unit 4 - Backend target boundaries

- Status: `complete`
- Define HTTP router, application service, unit-of-work/transaction, repository port, SQLAlchemy implementation, provider adapter, and schema ownership.
- Replace the future `controllers.store` facade incrementally by domain, while retaining the current FastAPI process and MySQL-only runtime.
- Separate production repositories from pure test fakes without adding an alternate production data path.
- Add compact v2 generation job services and a MySQL lease-backed runner inside the existing FastAPI deployment; browser requests only submit/read jobs.

### Unit 5 - Cross-layer contracts and observability

- Status: `complete`
- Freeze or version API payloads, errors, idempotency, revision/conflict, generation, and capability contracts.
- Define trace/correlation IDs, safe structured logs, metrics, and provider failure boundaries without recording secrets, prompts, or credential-bearing URLs.
- Set byte budgets for submit/status/delta payloads and keep full sanitized snapshots behind an authorized backend diagnostic boundary.

### Unit 6 - Independently mergeable migration slices

- Status: `complete`
- Produce a dependency-ordered Task sequence with exact owned files, compatibility adapters, focused tests, full regression gates, rollout, and rollback.
- Each slice must leave the application usable and must not depend on an unfinished next slice to work.
- Provisional slices T6-007 through T6-016 are defined in the detailed plan: replacement RED contracts, durable jobs, incremental sync, card identity/geometry/rename, text, director Skill, script workflow, image cards, semantic video, and compatibility closure. T6-012 includes a pinned public-source/license manifest, Revid-owned schema/prompt compiler, reference exclusions, continuity reconciliation, and eval fixtures.

### Unit 7 - Human architecture approval

- Status: `complete`
- Present the final architecture, behavior classification, T6-005 disposition, migration sequence, costs, risks, and acceptance checks.
- The Human Owner explicitly approved completion and continuation on 2026-07-23 by directing Codex to complete T6-006 and start the next T6 Task in a new goal-mode session.
- Activate T6-007 only; later Tasks remain dependency-blocked.

## Verification contract

1. Document links and project-state validation.
2. Measured file/module/API dependency inventory.
3. Contract map covering browser to MySQL and provider boundaries.
4. Happy path, validation error, provider error, conflict, retry, reload, restart, readonly, accessibility, and performance test ownership.
5. Independent mergeability and rollback review for every future implementation slice.
6. Human approval of product behavior, architecture, and T6-005 code disposition.

## Risks and mitigations

- Broad refactoring can hide product redesign. Lock the complete replacement workflow before moving code.
- File splitting alone can preserve the same coupling. Assign state-transition ownership and enforce dependency direction.
- Backend store extraction can change transactions. Migrate one domain at a time behind compatibility adapters and retain MySQL integration proof.
- The rejected T6-005 snapshot can contaminate a new design. Treat its committed code as audit/reference evidence only and require explicit justification for any later reuse.
- Full rewrite can invalidate years of regression evidence. Reject a rewrite and use independently shippable strangler slices.

## Stop conditions

- Stop until the Human Owner approves this replacement workflow and architecture for implementation.
- Stop before removing, reverting, or reusing T6-005 code without a later explicit implementation decision.
- Stop before any incompatible API, schema, Canvas, provider, or UX contract.
- Stop before real/paid calls, secrets, destructive operations, irreversible migrations, external accounts, or framework/runtime replacement.
