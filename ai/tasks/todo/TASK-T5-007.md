# TASK-T5-007 - Node registry, project resources, and generation integration

- State: `DOING`
- Phase: Product V2 / Phase 5
- Dependency: T5-006 `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Started: 2026-07-13

## Objective

Deliver the first-acceptance node registry and connect Canvas to project-shared assets, versioned graph templates, durable generation tasks/results, and backend-authoritative quota responses without losing legacy or unknown graph data.

## Scope

- one frontend node registry for canonical `script`, `note`, `asset`, `generation`, `result`, and `group` nodes;
- compatibility definitions for existing node types and a non-mutating unsupported view for unknown future types;
- additive MySQL schema and APIs for project-scoped assets, Canvas attribution, versioned template graphs, and generation task/result persistence;
- project resource browsing and insertion from every Canvas, including image, video, and audio asset subtypes;
- mock-provider image/video generation flows with durable success/failure tasks, generated assets, result nodes, and backend-returned quotas;
- contextual desktop/narrow Canvas controls with a mobile review-only boundary;
- focused unit, guarded MySQL, mock integration, browser, build, regression, restart, and hygiene evidence.

## Non-goals

- audio generation, real-time collaboration, cross-canvas edges, a second Canvas engine, or a public API version migration;
- page-level global V2 redesign owned by T5-009 and T5-010;
- final 200-node/300-connection Canvas milestone certification owned by T5-008;
- paid provider calls, real secret access, user/runtime migration execution, destructive database/filesystem work, or cleanup of ignored local artifacts;
- automatic conversion of legacy or unknown node types.

## Compatibility Decisions

- New creation surfaces expose only the six canonical first-acceptance node types.
- Existing legacy node types remain registered as compatibility-only definitions so stored graphs continue to render and save.
- Unknown `node_type` values and content remain byte-for-byte representable through load/save and render as a labeled unsupported state; the client never coerces them to `script`, `note`, or another known type.
- Templates use versioned `graph_data` containing nodes and connections. Existing template/project creation behavior remains compatible while Canvas receives an explicit graph-instantiation path.
- Project ownership is authoritative for assets and generation history. `origin_canvas_id` is attribution/filtering metadata, not ownership.
- Resource writers derive and lock scope in `Project -> Canvas -> CanvasNode` order; semantic node deletion locks the same node before clearing links, while retaining origin history.
- Project deletion is non-destructive: projects with linked assets or generation tasks return `409` until a separately approved resource lifecycle removes those links.
- Quota state is changed only by the backend transaction and returned by the generation response; the client replaces local quota state from that response.

## Delivery Units

1. Unit A - registry contract, canonical/legacy/unknown mapping, renderer metadata, creation surfaces, and focused unit/browser tests.
2. Unit B - additive MySQL resource schema, comments, constraints, versioned template graph contract, safe backfill, and guarded migration/API tests.
3. Unit C - project-scoped asset/template services, graph-template instantiation, audio asset support, ownership checks, and cross-Canvas persistence tests.
4. Unit D - mock-provider generation service, durable task/result linkage, backend-authoritative quota response, failure semantics, restart evidence, and frontend service extraction.
5. Unit E - Canvas asset/template/generation UI, responsive/mobile boundaries, complete regression, independent review, REPORT, and state closure.

## Acceptance Criteria

- [x] Registry defines type, subtype, ports, default size, icon, capabilities, and serialization version in one place for all six canonical node types.
- [ ] Tool dock, `Tab`, double-click/context menu, asset insertion, renderer, access tree, and serialization resolve node behavior through the registry.
- [x] Legacy graphs remain usable; unknown future node types render a safe labeled unsupported state and round-trip without graph corruption.
- [x] Image/video results use real media previews when available or explicit labeled placeholders; audio is supported only as an asset subtype.
- [ ] Project assets, templates, generation tasks, and generated assets are available from every Canvas without copying ownership.
- [x] Template graphs preserve nodes, connections, relative placement, parent relationships, and version metadata while remapping IDs into the target Canvas atomically.
- [x] MySQL comments, indexes, checks, and composite foreign keys enforce project/Canvas attribution and clear node links without erasing retained origin history.
- [ ] Provider success persists one task, one generated project asset, and a linked result; provider or asset persistence failure records a specific task failure, creates no success asset/result, and consumes no quota.
- [ ] Generation success/failure and project resource visibility survive backend restart.
- [ ] Generation responses include authoritative quotas and the frontend never invents quota changes.
- [ ] Automated provider evidence uses mocks only; no paid provider call runs.
- [ ] Desktop and narrow layouts expose contextual resource/generation controls; 375px remains browse/review-only with no edit, delete, upload, template-use, or generation action.
- [ ] Focused tests, guarded MySQL migration/API/restart evidence, full backend regression, full Chromium regression, production build, accessibility checks, fresh diff review, and hygiene gates pass.

## Linked Decisions And Specifications

- `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`
- `ai/decisions/ADR-002-v3-1-technology-stack.md`
- `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- `ai/decisions/ADR-005-project-multi-canvas.md`
- `ai/requirements/REVID-V2-PRD.md`
- `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- `ui/REVID-V2-DESIGN-SYSTEM.md`

## Risks And Controls

- Graph corruption from type coercion: preserve raw unknown identifiers/content and gate mutation capabilities through registry support.
- Schema rollout on populated databases: use expand/backfill/validate/constrain ordering and guarded disposable `revid_test_*` MySQL evidence only.
- Partial template insertion: validate the complete source graph and apply one document mutation batch with remapped IDs.
- Cross-scope resource leakage: authenticate every project, Canvas, asset, template, task, node, and result relationship.
- Quota/task divergence: keep failure-before-charge semantics and return post-transaction quota state from backend.
- Provider coupling: route automated evidence through injected mocks; never retry paid work automatically.
- UI regression: keep provider requests out of `CanvasWorkspace.vue`, use existing V2 tokens/components, and verify the four accepted viewports.
