# ADR-005: A project owns multiple independent canvases

- Status: Accepted
- Date: 2026-07-12
- Decision owner: Human Owner
- Applies from: Product V2 / Phase 5

## Context

The Phase 4 model stores nodes and connections directly under a project, which makes every project an implicit single canvas. Product V2 prioritizes an infinite Canvas experience and the Human Owner has approved multiple canvases per project.

A real libTv interaction benchmark showed that a creator benefits from separating script, character, shot, generation, and assembly work without losing access to project assets. Revid must adopt that information boundary while keeping its own product identity and architecture.

## Decision

1. A project owns one or more canvases. Project creation atomically creates the first canvas named `画布 1`.
2. Each canvas owns an independent graph: nodes, connections, groups, viewport, graph revision, local undo/redo history, and durable edit-revision history.
3. Assets, generation tasks, generated-asset history, permissions, quota, and project settings remain project-scoped and are available from every canvas in that project.
4. Cross-canvas connections are prohibited. The database must enforce that both connection endpoints belong to the same canvas.
5. V2 first acceptance includes create, rename, switch, reorder, and duplicate canvas. It does not include real-time collaboration, cross-canvas edges, or hard deletion from the primary UI.
6. Canvas duplication is transactional. It creates new node and connection IDs, remaps group parents and edge endpoints, and preserves project-shared asset references.
7. A project cannot have zero active canvases. Archiving or later deletion of the last active canvas must return a conflict.
8. The canonical route is `/app/projects/:projectId/canvases/:canvasId`. The Phase 4 workspace route redirects to the project's first active canvas during migration.
9. The frontend continues to use Leafer UI. Replacing the Canvas engine requires a separate Human Owner ADR.

## Data Ownership Matrix

| Data | Scope | Shared across canvases |
|---|---|---|
| Node, edge, group | Canvas | No |
| Viewport and view preferences | Canvas | No |
| Undo/redo and edit revision history | Canvas | No |
| Asset and generated media | Project | Yes |
| Generation task and generated-asset history | Project, optionally filtered by nullable `origin_canvas_id` | Yes |
| Quota, permissions, project settings | Project or user | Yes |

## Consequences

Benefits:

- large workflows can be separated by creative stage;
- users can reuse project media without duplicating ownership;
- graph load, save, history, and performance can be bounded per canvas;
- multi-canvas data integrity becomes explicit in MySQL and APIs.

Costs:

- nodes, connections, templates, graph stores, routes, and tests need a required canvas identifier;
- generation tasks remain project-owned and may carry a nullable `origin_canvas_id` for source attribution and filtering only;
- old single-canvas clients need a compatibility redirect during migration;
- after a project contains multiple canvases, an old client cannot safely flatten the project.

## Migration Strategy

1. Create `canvases` and `canvas_revisions` as additive tables.
2. Create one first canvas for every existing project.
3. Add nullable `canvas_id` fields to existing graph tables and backfill them from the project's first canvas.
4. Validate no missing nodes, orphan connections, cross-project endpoints, or cross-canvas endpoints.
5. Add composite foreign keys and indexes, then make `canvas_id` non-null.
6. Introduce canvas-scoped APIs while legacy project-scoped APIs resolve only the first canvas.
7. Switch the frontend route and store to explicit canvas IDs.
8. Remove legacy graph routes before Canvas first acceptance.

## Rollback

- Before multi-canvas writes are enabled, application code may roll back while the additive schema remains.
- After any project owns more than one active canvas, automatic downgrade or flattening is prohibited.
- Recovery prefers a forward fix. Database restore uses a verified MySQL backup and explicit Human Owner authorization.

## Acceptance Gates

- every project has at least one active canvas;
- existing node and connection IDs survive backfill unchanged;
- all graph rows have non-null `canvas_id` and no orphan or cross-canvas connection exists;
- duplicate canvas remapping is atomic and deterministic;
- switching canvas isolates graph, viewport, undo/redo, and revision history;
- project assets remain visible and reusable from each canvas;
- refresh and backend restart restore the exact active canvas document;
- every new or changed table and column has a non-empty MySQL comment.
