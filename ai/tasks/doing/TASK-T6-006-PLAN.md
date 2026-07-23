# TASK-T6-006 Implementation Plan

- State: `DOING`
- Verification outcome: `PENDING`
- Active unit: `Unit 2 - Human-authored replacement workflow`
- Task: [TASK-T6-006](../todo/TASK-T6-006.md).
- Progress: [TASK-T6-006-PROGRESS](TASK-T6-006-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Delivery rule

T6-006 produces an approved architecture and dependency-ordered implementation backlog only. No business-code edit is authorized until the Human Owner approves the design and explicitly requests implementation.

## Recommended direction

Redesign the product workflow first, then refactor the existing modular monolith through a strangler sequence aligned to that approved workflow. Preserve durable data-integrity, Canvas, history, persistence, security, and provider-ownership contracts unless the Human Owner explicitly replaces them. Move orchestration out of aggregate Vue components, replace the backend process-wide store facade with domain ports and request-scoped services, and keep one deployable frontend plus one deployable FastAPI application.

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

- Status: `in_progress`
- Wait for the Human Owner's replacement workflow logic.
- Convert that logic into an approved end-to-end product contract covering information architecture, user journeys, state transitions, errors/recovery, responsive ownership, and Human acceptance evidence.
- Do not infer the replacement behavior from T6-005.

### Unit 3 - Frontend target boundaries

- Status: `pending`
- Define route-shell, feature-orchestrator, Pinia domain state, typed command, renderer/geometry, presentation component, and API-client ownership.
- Split future work around stable behavior contracts rather than file-size-only moves.
- Define how `CanvasWorkspace.vue`, `CanvasStage.vue`, command execution, rendering, autosave, generation, resources, and contextual surfaces communicate without circular ownership.

### Unit 4 - Backend target boundaries

- Status: `pending`
- Define HTTP router, application service, unit-of-work/transaction, repository port, SQLAlchemy implementation, provider adapter, and schema ownership.
- Replace the future `controllers.store` facade incrementally by domain, while retaining the current FastAPI process and MySQL-only runtime.
- Separate production repositories from pure test fakes without adding an alternate production data path.

### Unit 5 - Cross-layer contracts and observability

- Status: `pending`
- Freeze or version API payloads, errors, idempotency, revision/conflict, generation, and capability contracts.
- Define trace/correlation IDs, safe structured logs, metrics, and provider failure boundaries without recording secrets, prompts, or credential-bearing URLs.

### Unit 6 - Independently mergeable migration slices

- Status: `pending`
- Produce a dependency-ordered Task sequence with exact owned files, compatibility adapters, focused tests, full regression gates, rollout, and rollback.
- Each slice must leave the application usable and must not depend on an unfinished next slice to work.

### Unit 7 - Human architecture approval

- Status: `pending`
- Present the final architecture, behavior classification, T6-005 disposition, migration sequence, costs, risks, and acceptance checks.
- Stop after approval. Activate implementation only on an explicit follow-up request.

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

- Stop until the Human Owner supplies the replacement workflow logic.
- Stop before removing, reverting, or reusing T6-005 code without a later explicit implementation decision.
- Stop before any incompatible API, schema, Canvas, provider, or UX contract.
- Stop before real/paid calls, secrets, destructive operations, irreversible migrations, external accounts, or framework/runtime replacement.
