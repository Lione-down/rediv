# Revid T6-006 Accepted Full-Stack Modular Refactor

- Status: `ACCEPTED`
- Date: 2026-07-23
- Task: [TASK-T6-006](../tasks/todo/TASK-T6-006.md).
- Existing authority: [Revid V2 Canvas Architecture](REVID-V2-CANVAS-ARCHITECTURE.md).

## 1. Verdict

Redesign the product workflow first, then refactor through a contract-first modular-monolith strangler sequence. Do not replace the stack, split services, or change MySQL/Canvas ownership merely to perform the refactor.

The Human Owner has rejected all four T6-005 outcome dimensions: visual design, interaction logic, business flow, and information architecture. T6-005 code is retained only as a rejected audit/reference snapshot. The codebase still contains useful domain modules, composables, stores, controllers, repositories, schemas, and regression proof that may support the new design without defining it.

The replacement workflow is now supplied. It requires LibTV-style card work surfaces with Revid colors, custom node titles, same-card results, an automatic project-owned director Skill, editable roles/scenes/props/shots, truthful semantic multi-image video, durable browser-independent generation, and compact generation APIs.

## 2. Measured current state

| Area | Files | Lines | Files above 500 lines |
|---|---:|---:|---:|
| `frontend/src` | 270 | 47,908 | 8 |
| `frontend/tests` | 140 | 27,928 | 4 |
| `backend` source/tests | 247 | 41,584 | 2 |

Primary concentration:

- `backend/controllers/store.py`: 2,255 lines; production and test storage surfaces span users, identities, quotas, assets, tasks, projects, templates, nodes, connections, and admin operations.
- `frontend/src/components/canvas/CanvasStage.vue`: 1,133 lines; rendering composition, transient interaction, references, continuation, generation, lineage, focus, and viewport behavior meet in one component.
- `frontend/src/views/app/CanvasWorkspace.vue`: 1,102 lines; route, responsive shell, project/canvas state, resources, generation, overlays, context surfaces, storyboard, revisions, and navigation meet in one view.

## 3. Target dependency direction

```text
Vue route shells and presentation components
  -> feature orchestrators
    -> Pinia domain stores and typed commands
      -> typed API clients
        -> FastAPI routers
          -> application services / use cases
            -> unit of work and repository ports
              -> SQLAlchemy repositories
                -> MySQL 8

Provider application services
  -> provider ports
    -> Agnes adapter
```

Dependencies point downward only. Renderers and presentation components do not call HTTP. Routers do not contain transactions. Repositories do not decide product workflow. Provider adapters do not mutate Canvas state directly.

## 4. Frontend ownership

### Route shell

Own route identity, responsive shell composition, loading/error boundaries, and feature-orchestrator mounting. It does not own provider requests, pointer geometry, Canvas commands, or domain mutation details.

### Feature orchestrators

Own use-case composition such as project/canvas navigation, card generation, script-to-storyboard, resource selection, result branching, and revision restore. Each orchestrator consumes typed domain ports and exposes presentation-ready state/actions.

### Pinia domain stores

Own canonical client state by domain: auth, projects, canvas list, canvas document/revision, project resources, generation runtime, and capabilities. Transient component visibility remains in focused UI controllers, not durable stores.

### Commands and renderer

Typed commands remain the only graph/history/autosave mutation path. Renderer/geometry code projects canonical state and owns no business persistence. Pointer, keyboard, toolbar, context menu, and agent actions dispatch the same command contracts.

### Presentation

Vue components render state, accessibility, and local transient interaction. They receive small typed view models and emit domain intents. They do not derive provider payloads or duplicate canonical state.

## 5. Backend ownership

### Routers

Own authentication dependencies, HTTP request/response schemas, status codes, and error mapping only.

### Application services

Own business use cases and authorization checks. Generation start, Canvas document mutation, revision restore, asset lifecycle, quota changes, templates, and authentication each use explicit services.

### Unit of work

Own one request-scoped SQLAlchemy transaction. Multi-repository changes commit or roll back together. Application services never reach a process-wide mutable cache.

### Repository ports and implementations

Domain protocols define required persistence operations. SQLAlchemy implementations own queries and row mapping. Pure test fakes implement the same ports but are never a production fallback.

### Provider ports

Provider request normalization and response parsing sit behind explicit adapters. Business services own task/quota/idempotency lifecycle and treat provider failures as data, not control-flow leaks.

## 6. Contract policy

- Product journeys, information hierarchy, interaction order, and visible workflow are defined by the confirmed 2026-07-23 replacement workflow and the active T6-006 plan.
- Preserve current routes and payloads until a versioned replacement plus compatibility adapter is proved.
- Preserve Canvas document revision, idempotency, history, autosave, graph identity, multi-canvas scope, and provider/model authority.
- Preserve MySQL-only runtime and database-backed integration tests.
- Preserve review-only mobile, keyboard parity, accessibility, and 200-node/300-connection thresholds.
- Product behavior changes require a separate approved behavior matrix and visual/interaction acceptance.
- Ordinary generation clients receive compact submit/status/result/delta DTOs. Full request snapshots, provider raw responses, request fingerprints, duplicated content/URLs, and base64 media remain outside polling responses.
- Text, script, image, and video provider execution is owned by durable MySQL jobs, not browser request lifetimes.
- A user-visible card has one stable node identity. New results update that card; legacy generation/result pairs remain compatibility data until safely migrated.
- The built-in story director Skill is project-owned and automatic. Users choose an allowed text model, not a Skill.
- Semantic video references preserve stable node/asset IDs, role, instruction, source revision, and order. Unsupported providers fail closed.

## 7. Recommended migration slices

1. Add replacement RED contract tests and payload budgets.
2. Add compact durable MySQL generation jobs and a lease-backed runner behind versioned APIs.
3. Replace project-wide full-task polling with current-Canvas cursor/delta synchronization.
4. Establish one canonical card view model, one geometry authority, and user rename commands.
5. Rebuild text cards with explicit allowed-model selection.
6. Implement the project-owned story director Skill and versioned story-production schema.
7. Rebuild script asset/shot editing and partial regeneration.
8. Move image lifecycle/results into canonical image cards while preserving batch siblings.
9. Implement truthful semantic multi-image video with per-image role/instruction and capability gating.
10. Remove legacy payload/result coupling only after compatibility and full acceptance proof.

Each slice must be independently usable and reversible at the application-code level. Schema work, if later proven necessary, requires a separate expand-first migration Task and Human authorization.

## 8. Rejected alternative

A full frontend/backend rewrite is rejected. It would discard the current regression corpus, multiply migration risk, and make it impossible to distinguish architecture regressions from product redesign. The measured codebase is large but already modular enough for strangler extraction.

## 9. Premise collapse

This proposal assumes durable data-integrity and platform contracts remain useful even though the product workflow is being redesigned. If the replacement logic also changes Canvas ownership, history, persistence, provider authority, or MySQL scope, a new ADR and a recalculated migration sequence are required.

## 10. Human decisions required

The Human Owner has decided:

1. T6-005 visual design, interaction logic, business flow, and information architecture are all unacceptable.
2. Product workflows and frontend/backend architecture will be redesigned together.
3. T6-005 is committed only as rejected reference evidence.
4. The replacement text/script/image/video/card workflow recorded in T6-006 is correct.
5. The script director Skill is project-owned and non-selectable; Codex owns its design and implementation.
6. Semantic multi-image video is role/instruction based, not merely ordered keyframes.
7. Generation continues across browser refresh and returns to the original persisted card.
8. Compact-response remediation applies to text, script, image, and video, not video alone.

On 2026-07-23, the Human Owner explicitly approved completion and continuation by directing Codex to complete T6-006 and start the next T6 Task in a new goal-mode session. T6-007 is therefore authorized as the sole active implementation Task. Later Tasks remain dependency-blocked, and all retained Human gates still apply.
