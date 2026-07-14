# Report: T5-007 Node registry, project resources, and generation integration

## Result

`DONE - PASS` on 2026-07-14.

Revid now has one canonical Canvas node registry, project-shared assets and generation history, versioned graph templates, durable mock-provider generation transactions, responsive resource/generation controls, and a bounded local upload boundary that preserves mobile review-only behavior and existing graph compatibility.

## Delivered

- Added six canonical registry definitions for script, note, asset, generation, result, and group nodes. Legacy types remain compatibility-only; unknown future types render a safe unsupported state and round-trip without coercion.
- Added guarded MySQL resource attribution, versioned template graphs, project/Canvas/node constraints, transactional node-link clearing, audio asset documentation, quota revisions, and microsecond ledger ordering through Alembic head `c9d0e1f2a3b4`.
- Added project-owned asset filtering and cross-Canvas visibility, strict template capture, atomic target-Canvas instantiation, deterministic create-only ID remapping, exact mutation retry, and one-transaction legacy template project creation.
- Added project-scoped generation reservations and transactions. Success atomically links one task, generated asset, result, quota debit, and ledger record; every terminal failure remains durable and no-charge.
- Extracted the frontend generation service and applied backend quota snapshots monotonically per authentication session.
- Added responsive Canvas resource and context panels, registry-backed asset insertion, server-confirmed template insertion, contextual generation editing, durable success/failure states, desktop resizing, narrow drawers, keyboard focus return, and a strict 375px review-only boundary.
- Replaced the upload endpoint with bounded JSON/multipart parsing, provisional cross-process reservation slots, per-user/global active and scan limits, same-volume named staging, atomic rename, idle/total deadlines, and cancellation-safe acquire/open/write/seek/close/commit/cleanup.
- Added real decodable media fixtures and bounded structure validation for images, WebM, classic/fragmented BMFF, Ogg/Opus, MP3, FLAC, and WAV. CPU/memory controls include a four-process validator limiter, 40-million-pixel and 128 MiB PNG decoded caps, 4,096 container elements, and a one-million BMFF sample budget.
- Raised the multipart dependency floor to `python-multipart>=0.0.32,<1`, retained independent part-header limits, and rejected truncated or oversized-boundary multipart bodies with controlled client errors.

## Acceptance Evidence

| Gate | Evidence | Result |
|---|---|---|
| Registry and compatibility | Canonical creation/render/ports/capabilities are registry-driven; legacy and unknown round trips remain lossless | PASS |
| Project resources | Assets, templates, generated assets, and task history remain project-owned and visible across Canvas switches | PASS |
| Template graph | Nodes, connections, parents, relative placement, schema version, ID remap, and exact retry commit atomically | PASS |
| Generation transaction | Success links task/asset/result/debit/ledger; provider, validation, timeout, cancellation, and persistence failures are durable and no-charge | PASS |
| Quota authority | Responses carry one database snapshot; frontend applies revisions monotonically per auth session | PASS |
| Responsive UX | Desktop 280-420px panel, 920px drawers, keyboard focus/targets, and 375px review-only controls | PASS |
| Upload limits | Byte quota/free floor, active reservations, scan budgets, idle/total deadlines, same-volume staging, and atomic finalization | PASS |
| Cancellation cleanup | Acquire, open, write, seek, close, validation, commit, marker, and compensation paths leave no owned late-result handle | PASS |
| Media validation | Real decodable fixtures accepted; forged, truncated, zeroed, cross-track, oversized, and CPU-amplified inputs rejected | PASS |
| Guarded MySQL and restart | Resource/template/generation scope and persistence survive recreated engine/session and production lifespan | PASS |
| Full backend | `384 passed, 56 subtests passed` in 400.99 seconds | PASS |
| Upload/security focus | `134 passed, 48 subtests passed`; post-dependency parser focus `23 passed`; `pip check` clean | PASS |
| Full Chromium | `117 passed` in 2.3 minutes; focused resource-race/revision coverage `10 passed` | PASS |
| Production build | `vue-tsc` and Vite transformed 4,761 modules | PASS |
| Visual/accessibility | 1440x900, 1366x768, 920x900, and 375x812 inspected; focused keyboard/axe contracts passed | PASS |
| Migration/static hygiene | Single Alembic head `c9d0e1f2a3b4`, compileall, UTF-8, 500-line, diff, and sensitive-file gates | PASS |
| Independent review | Frontend and final upload/security reviews returned 0 HIGH / 0 MEDIUM / 0 LOW | PASS |

## Evidence Classification

- Automated provider evidence is deterministic mock-provider evidence. No paid provider or real external generation service was called.
- Guarded persistence, constraints, lock ordering, restart, and API evidence use disposable `revid_test_*` MySQL schemas. No user/runtime schema was migrated.
- Unit E full Chromium and four-viewport evidence use the repository Playwright browser harness. Final live FastAPI plus disposable-MySQL 200-node/300-connection certification remains T5-008 scope.
- Independent security fuzz evidence covered 13,000 randomized validator inputs and 500 randomized multipart inputs with no unhandled exception; it supplements, rather than replaces, deterministic regression tests.

## Compatibility And Safety

- Existing legacy and unknown Canvas nodes are not converted. Existing template-to-new-project behavior remains available while the Canvas-specific versioned path is authoritative for graph insertion.
- Audio is supported as an asset subtype, not as a generation mode. Automated generation remains image/video mock-only.
- Project deletion remains non-destructive: linked resource history returns `409` until a separately approved lifecycle exists.
- Upload storage failures map to sanitized retryable `503`, capacity exhaustion to `507`, invalid media to `415`, and client size/quota failures to controlled `4xx` responses.
- No real secret or `.env` content was read, no paid call ran, no user/runtime migration ran, no retained `.db` was touched, and no destructive data/filesystem operation occurred.

## Human Owner Gates Remaining

- Applying Alembic revisions through `c9d0e1f2a3b4` to user/runtime data requires reviewed backup discipline and Human authorization.
- Paid Agnes smoke, real secret access, credential rotation, destructive MySQL work, and ignored local `.db` cleanup remain separate Human Owner gates.

These gates do not invalidate T5-007 repository acceptance.

## Next Task

Create and activate T5-008 Task/PLAN/PROGRESS for the final Canvas first-acceptance E2E, live FastAPI plus disposable MySQL 200/300 persistence and restart, performance, browser, accessibility, visual, and security closure.
