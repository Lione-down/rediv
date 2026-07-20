# Revid V2 Canvas Architecture

- Status: Approved target architecture
- Date: 2026-07-12
- Related PRD: `ai/requirements/REVID-V2-PRD.md`
- Related acceptance: `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- Decisions: `ADR-004`, `ADR-005`, `ADR-002`

## 1. Architecture Position

Revid V2 keeps the existing Vue 3, TypeScript, Pinia, Leafer UI, Naive UI, FastAPI, SQLAlchemy, MySQL, and Alembic stack. The architecture changes the graph boundary from project-scoped to canvas-scoped, replaces full scene rebuilds with keyed incremental rendering, and introduces transactional graph revisions for autosave, conflicts, and recovery.

Recommended approach: expand the MySQL schema first, preserve a first-canvas compatibility path while the frontend migrates, then remove legacy project-scoped graph APIs before Canvas acceptance.

Rejected approaches:

- replace Leafer UI with Vue Flow or React Flow: rejected because it changes the core engine while the first milestone already requires major data, interaction, and visual work;
- store the entire project as one JSON graph: rejected because it weakens MySQL integrity, asset relationships, comments, queryability, and atomic conflict checks;
- keep SQLite for fast tests: rejected by ADR-004 because dialect parity and fail-closed runtime behavior are V2 requirements.

## 2. System Map

```text
Browser route /app/projects/:projectId/canvases/:canvasId
  |
  +-- CanvasIdentityBar ------ canvas list/create/rename/duplicate
  +-- CanvasToolDock -------- command dispatch and node registry
  +-- InfiniteCanvas -------- Leafer world + SVG edge/hit layer
  +-- CanvasContextPanel ---- selected node/edge/group editor
  +-- CanvasAssetPanel ------ project-shared assets and generation history
  |
  v
Pinia domain stores
  +-- canvas-list-store ------ project canvas metadata
  +-- canvas-document-store -- graph, revision, save state
  +-- canvas-interaction ----- selection, viewport, panel, shortcut scope
  +-- command-history ------- command and inverse-command stack
  +-- save-queue ------------ debounced idempotent mutation batches
  |
  v
FastAPI canvas controllers
  +-- canvas CRUD and duplication
  +-- graph document load/save
  +-- viewport save
  +-- revision list/restore
  +-- project asset and generation APIs
  |
  v
MySQL 8 + Alembic
  +-- projects -> canvases -> nodes/connections/revisions
  +-- projects -> assets/generation_tasks/quota
```

There is no runtime path from this graph to SQLite or an in-memory production store.

## 3. Scope Boundaries

| Concern | Owner | Persistence scope |
|---|---|---|
| Canvas metadata and ordering | canvas list domain | Project |
| Last-opened canvas navigation | canvas list store | Browser local, keyed by user and project |
| Graph nodes, edges, groups | canvas document domain | Canvas |
| Viewport and view preferences | canvas interaction domain | Canvas |
| Undo/redo | command history | Canvas, local 100-command stack |
| Durable edit revisions | graph service | Canvas, latest 50 plus checkpoints |
| Assets and generated media | asset domain | Project |
| Generation tasks | generation domain | Project with optional origin canvas |
| Authentication, quota, permissions | existing domains | User or project |

## 4. MySQL Schema

Every new or changed table and column requires a non-empty comment, InnoDB, and utf8mb4.

### 4.1 `canvases`

| Column | Type | Rules |
|---|---|---|
| `id` | `VARCHAR(36)` | Primary key |
| `project_id` | `VARCHAR(36)` | Non-null, FK to `projects.id`, cascade on project delete |
| `name` | `VARCHAR(255)` | Non-null, duplicate names allowed |
| `sort_order` | `INT UNSIGNED` | Non-null, default 0 |
| `status` | `VARCHAR(20)` | Non-null, `active` or `archived` |
| `viewport_x` | `DOUBLE` | Non-null, default 0 |
| `viewport_y` | `DOUBLE` | Non-null, default 0 |
| `viewport_zoom` | `DECIMAL(8,4)` | Non-null, default 1 |
| `graph_revision` | `BIGINT UNSIGNED` | Non-null, default 0 |
| `created_at` | `DATETIME` | Non-null |
| `updated_at` | `DATETIME` | Non-null |
| `deleted_at` | `DATETIME` | Nullable, no primary UI hard delete in first acceptance |

Indexes and constraints:

- unique `(project_id, id)` for composite scope foreign keys;
- index `(project_id, status, sort_order, created_at)`;
- no unique constraint on `name`.

### 4.2 `canvas_nodes`

Keep `project_id` during V2 to support ownership queries and a database-enforced composite scope. Add:

| Column | Type | Rules |
|---|---|---|
| `canvas_id` | `VARCHAR(36)` | Non-null after backfill |
| `z_index` | `INT` | Non-null, default 0 |
| `parent_node_id` | `VARCHAR(36)` | Nullable group parent |
| `is_locked` | `BOOLEAN` | Non-null, default false |
| `is_collapsed` | `BOOLEAN` | Non-null, default false |

Rules:

- composite FK `(project_id, canvas_id)` to `canvases(project_id, id)` with cascade;
- unique `(canvas_id, id)`;
- composite self-FK `(canvas_id, parent_node_id)` to `canvas_nodes(canvas_id, id)` with `RESTRICT`;
- indexes `(canvas_id, status, z_index)` and `(canvas_id, parent_node_id)`;
- `position_x` and `position_y` accept negative values;
- `content` carries a node-registry schema version.

MySQL cannot apply `SET NULL` to this composite foreign key without also nulling the non-null `canvas_id`. Ungroup and group deletion therefore clear child `parent_node_id` values before deleting the group in the same transaction; the FK remains `RESTRICT` to prevent orphan or cross-canvas parents.

### 4.3 `canvas_connections`

Add non-null `canvas_id` after backfill and change the edge uniqueness contract to:

```text
(canvas_id, source_node_id, source_port, target_node_id, target_port)
```

Foreign keys:

- `(project_id, canvas_id)` to `canvases(project_id, id)` with cascade;
- `(canvas_id, source_node_id)` to `canvas_nodes(canvas_id, id)` with cascade;
- `(canvas_id, target_node_id)` to `canvas_nodes(canvas_id, id)` with cascade.

These constraints make cross-canvas connections impossible at the database layer.

### 4.4 `canvas_revisions`

| Column | Type | Rules |
|---|---|---|
| `id` | `VARCHAR(36)` | Primary key |
| `canvas_id` | `VARCHAR(36)` | Non-null FK to canvas |
| `revision_no` | `BIGINT UNSIGNED` | Non-null |
| `base_revision` | `BIGINT UNSIGNED` | Non-null |
| `client_mutation_id` | `VARCHAR(64)` | Non-null idempotency key |
| `request_fingerprint` | `CHAR(64)` | Non-null SHA-256 of the canonical mutation payload |
| `operations` | `JSON` | Non-null normalized command batch |
| `checkpoint_snapshot` | `JSON` | Nullable full graph checkpoint |
| `created_by_user_id` | `VARCHAR(36)` | Non-null FK to user |
| `created_at` | `DATETIME` | Non-null |

Constraints:

- unique `(canvas_id, revision_no)`;
- unique `(canvas_id, client_mutation_id)`;
- index `(canvas_id, created_at)`.

Write a full checkpoint every 10 revisions and whenever the user restores history. Retain the latest 50 revisions plus the checkpoint needed to reconstruct them. Revision pruning runs only after a newer checkpoint is committed.

### 4.5 Related models

- `projects`: add non-null `canvas_order_revision BIGINT UNSIGNED DEFAULT 0`; create, duplicate, archive, and reorder operations increment it in the same transaction;
- `generation_tasks`: add nullable `origin_canvas_id`, index it, and use composite FK `(project_id, origin_canvas_id)` to `canvases(project_id, id)` with `RESTRICT`; origin is attribution and filtering only, not ownership;
- when `generation_tasks.canvas_node_id` is non-null, require `origin_canvas_id` and enforce composite FK `(origin_canvas_id, canvas_node_id)` to `canvas_nodes(canvas_id, id)` with `RESTRICT`; node deletion clears only `canvas_node_id` first so origin history remains;
- before a hard Canvas purge, clear matching task node references and `origin_canvas_id` values in the same transaction; archiving leaves attribution intact;
- `assets`: remain project-scoped; convert `canvas_node_id` into a real FK with `SET NULL`; optional `origin_canvas_id` supports filtering without changing ownership;
- templates: replace nodes-only `node_data` with versioned canvas-scoped `graph_data` containing nodes and connections;
- guest snapshots: if retained, add `schema_version` and a `canvases` collection before V2 restore is allowed.

## 5. API Contract

The current `/api` prefix remains. Product V2 does not introduce a separate public API version.

### 5.1 Canvas metadata

```text
POST   /api/projects/{project_id}/canvases
GET    /api/projects/{project_id}/canvases
PATCH  /api/projects/{project_id}/canvases/order
GET    /api/projects/{project_id}/canvases/{canvas_id}
PATCH  /api/projects/{project_id}/canvases/{canvas_id}
POST   /api/projects/{project_id}/canvases/{canvas_id}/duplicate
```

First acceptance does not expose hard deletion in the primary UI. Archive can be added only with last-active-canvas protection.

`GET canvases` returns `items[]` and `order_revision`. Reorder accepts `base_order_revision` plus the complete `ordered_canvas_ids[]`. In one transaction it locks the project, rejects a stale revision or any list that is not an exact permutation of active Canvas IDs, writes dense `sort_order` values from 0, and increments `canvas_order_revision`. Create, duplicate, and archive use the same revision contract.

The frontend stores only the last-opened Canvas ID in browser storage under the authenticated user and project IDs. After every list load it accepts that preference only when the Canvas is still active and belongs to the project; otherwise it selects the first active Canvas and replaces the stale local value. This preference is navigation state, not shared project data.

### 5.2 Graph document

```text
GET    /api/projects/{project_id}/canvases/{canvas_id}/document
PATCH  /api/projects/{project_id}/canvases/{canvas_id}/document
PATCH  /api/projects/{project_id}/canvases/{canvas_id}/viewport
GET    /api/projects/{project_id}/canvases/{canvas_id}/revisions
POST   /api/projects/{project_id}/canvases/{canvas_id}/revisions/{revision_no}/restore
```

`GET document` returns canvas metadata, nodes, connections, and revision in one response to prevent a torn graph.

`PATCH document` accepts:

```text
base_revision
client_mutation_id
node_upserts[]
node_deletes[]
connection_upserts[]
connection_deletes[]
```

The request fingerprint is SHA-256 over UTF-8 RFC 8785 canonical JSON containing `base_revision` and the four mutation arrays; `client_mutation_id` itself is excluded. It returns the committed revision, normalized changed entities, server timestamp, and current save state.

### 5.3 Save transaction

One save batch runs in one MySQL transaction:

1. select the canvas row `FOR UPDATE` and verify project ownership;
2. look up `(canvas_id, client_mutation_id)` before comparing `base_revision`;
3. for a repeated ID with the same canonical `request_fingerprint`, return the prior committed result; reject a different fingerprint with HTTP 409;
4. for a new mutation, verify `base_revision`;
5. validate nodes, group parents, ports, and same-canvas endpoints;
6. apply node and connection mutations;
7. write a revision with the request fingerprint and optional checkpoint;
8. increment `graph_revision`;
9. commit and return the new head.

A stale base returns HTTP 409 with the current revision and no partial write.

### 5.4 Compatibility window

Legacy project-scoped node and connection routes resolve only the first active canvas during schema rollout. They are marked deprecated and removed before Canvas first acceptance. The old workspace route redirects to the explicit project and canvas route.

## 6. Backend Structure

Add or change domain-aligned files:

```text
backend/
  api/canvases.py
  controllers/canvases.py
  controllers/canvas_documents.py
  models/canvas.py
  models/canvas_revision.py
  schemas/canvas.py
  schemas/canvas_document.py
  core/canvas_commands.py
  tests/fixtures/mysql.py
```

Rules:

- `main.py` only configures application lifecycle and router registration;
- API modules own HTTP validation and status mapping;
- controllers own transactions and domain behavior;
- models own schema, comments, and constraints;
- schemas own strict request and response contracts;
- production import order must never install `InMemoryStore`;
- project, graph, asset, and generation queries are request-scoped, not a process-wide full-table cache.

## 7. Frontend Structure

```text
frontend/src/
  views/app/CanvasWorkspace.vue
  modules/canvas/
    api.ts
    types.ts
    store.ts
    canvas-list-store.ts
    interaction-store.ts
    history.ts
    persistence.ts
    node-registry.ts
    commands.ts
  components/canvas/
    InfiniteCanvas.vue
    CanvasIdentityBar.vue
    CanvasToolDock.vue
    CanvasViewControls.vue
    CanvasAssetPanel.vue
    CanvasContextPanel.vue
    CanvasSelectionToolbar.vue
    CanvasEmptyGuide.vue
    CanvasMinimap.vue
    CanvasNodeA11yList.vue
    renderer/leafer-scene.ts
    renderer/node-view.ts
    renderer/edge-view.ts
```

No business file should exceed 500 lines. `CanvasWorkspace.vue` orchestrates domains and must not contain provider request logic or low-level pointer handling.

## 8. Renderer And Interaction Architecture

The current full `leafer.clear()` and scene rebuild path is replaced by:

- one persistent Leafer world group;
- viewport pan and zoom through the world-group transform;
- keyed `Map<nodeId, NodeVisual>` create/update/delete diffs;
- one SVG world group for edges and hit paths with the same transform;
- `requestAnimationFrame` coalescing for pointer movement;
- minimap updates capped at 15 FPS;
- lightweight offscreen media placeholders with viewport culling;
- command creation on pointerup, not on every pointermove;
- no `JSON.stringify` scene signature as a render invalidation mechanism.

The node registry supplies rendering metadata and port rules. The command layer supplies `apply`, `invert`, serialization, and affected IDs. Pointer, keyboard, toolbar, and context-menu actions all dispatch the same commands.

## 9. Client State And Autosave

`canvas-document-store` owns the server document and current revision. `canvas-interaction-store` owns transient tool, selection, viewport, open panel, and shortcut scope. `command-history` owns at least 100 applied commands plus redo commands.

Save queue behavior:

- batch compatible commands for up to 500 ms while interaction continues;
- begin save immediately after the final pointerup or text debounce;
- generate one `client_mutation_id` per submitted batch;
- show `Saving`, `Saved`, `Error`, or `Conflict` in the identity bar;
- retain unsent and rejected commands in memory and local recovery storage;
- flush before canvas switch, route exit, and page hide;
- send viewport state through a separate debounced endpoint;
- on HTTP 409, stop automatic overwrite and offer reload-latest or preserve-local-copy.

## 10. Migration Plan

Migration is expand-first and forward-fix oriented:

1. remove the tracked credential literal and determine the separate rotation gate;
2. complete MySQL-only runtime and tests;
3. create canvases and revisions tables;
4. create one first canvas per existing project;
5. add nullable canvas IDs and backfill graph rows;
6. run preflight queries for null, orphan, and cross-scope rows;
7. add composite keys, foreign keys, indexes, and non-null constraints;
8. release canvas APIs and the first-canvas compatibility path;
9. release the explicit frontend route and multi-canvas stores;
10. remove legacy project-scoped graph APIs before Canvas acceptance.

The removal gate is complete as of 2026-07-20: production caller scans found no
frontend or supported external client dependency on `/projects/{project_id}/nodes`,
`/projects/{project_id}/connections`, or `/assets/from_generation`. Canvas-scoped
document/resource APIs and native generation transactions are the only active
mutation authorities; generated-asset provenance cannot be supplied by clients.

No migration runs against a user database without the normal migration authorization and backup discipline. Automated tests operate only on guarded `revid_test_*` schemas.

## 11. Rollback And Failure Handling

- SQLite is never a rollback path.
- Before multi-canvas writes, old application code may run against the additive schema.
- Once a project owns multiple canvases, old application code is unsafe because it would flatten graph scope. Automatic downgrade is blocked.
- Recovery favors a forward fix. A MySQL backup restore is a Human Owner action.
- Canvas save or revision failure preserves local commands and never claims `Saved`.
- Provider failure persists a failed generation task but does not consume quota or create a success asset.
- asset-service failure does not corrupt the graph document.

## 12. Attack Review

### Dependency failure

If MySQL is unavailable, backend readiness is false and graph mutations stop. The frontend keeps unsaved commands and exposes retry. It does not switch databases.

If Agnes is unavailable, Canvas editing and asset browsing remain available. Generation tasks enter a specific failure state and no paid retry loop runs automatically.

### Scale explosion

At 10x the first-acceptance graph size, DOM and edge hit testing are the first likely limits. The design therefore keeps the Leafer scene incremental, caps minimap work, uses viewport culling, and avoids process-wide graph caches. V2 does not promise 2000-node acceptance without a separate benchmark.

### Rollback cost

The load-bearing assumption is that multi-canvas data will not be flattened. After a second canvas exists, rollback must preserve the expanded schema and use a compatible forward-fix build. Any destructive downgrade requires explicit export or backup-restore planning.

## 13. Security And Observability

- never print credentials, authorization headers, or credential-bearing database URLs;
- use SQLAlchemy URL objects so string representation can redact passwords;
- audit canvas create, duplicate, archive, revision restore, and conflict actions without storing graph content in logs;
- expose health dialect, connectivity, readiness, and revision identity, never username or password;
- record save latency, conflict count, graph size, load latency, render metrics, and provider outcome without prompt or asset leakage;
- report credential candidates only as path, line, and redacted fingerprint.

## 14. Verification Strategy

Unit:

- world transforms, zoom anchors, marquee geometry, minimap mapping, snap, command inversion, registry validation, save batching, and conflict reducer.

Real MySQL integration:

- migration backfill, comments, constraints, duplicate transaction, cross-canvas rejection, 409 conflicts, idempotency, revision restore, asset ownership, and restart persistence.

Browser:

- multi-canvas create/rename/reorder/switch/duplicate;
- editing and keyboard commands;
- offline, 409, 500, retry, and local preservation;
- viewport matrix and mobile review boundary.

Performance:

- deterministic 200-node and 300-edge seed;
- recorded 30-second interaction trace;
- canvas-switch listener and heap regression.

Security:

- database identity guard;
- unauthorized canvas access;
- tracked and staged redacted credential scans;
- `git diff --check` and secret-file path checks.

## 15. Implementation Order

The authoritative sequence is in `ai/state/ROADMAP.md`. Canvas code starts only after ADR-004 is implemented and verified. Global page redesign starts only after the Canvas acceptance Task passes.
