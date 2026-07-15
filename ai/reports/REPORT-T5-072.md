# REPORT-T5-072 - Enterprise Canvas scenario certification and release closure

## Outcome

T5-072 is `DONE - PASS`.

Release recommendation: `RELEASE - PASS WITH DECLARED PROVIDER CAVEAT`.

The current Canvas is certified for its supported enterprise boundary across graph authoring, multi-node image and video workflows, dense composition, failure recovery, responsive ownership, accessibility, production performance, MySQL persistence, and security. Real Agnes v2 recipe fidelity remains unverified by explicit Human decision and is not presented as passed.

## Certification matrix

| Domain | Result | Current evidence |
|---|---|---|
| Graph authoring | PASS | Chromium command, selection, atomic mutation, undo/redo, lock, group, connect, reload, and mobile readonly coverage inside the 70-test representative matrix |
| Image workflows | PASS offline | Ordered composition, branching, recipe v1/v2, prompt secrecy, materialization, failure, retry, quota, and lineage browser/backend coverage |
| Video workflows | PASS | Text/image composition, two-origin keyframes, playable MP4, CORS fallback, frame capture, one playback owner, reload, failure, and retry coverage |
| Dense multi-node composition | PASS | Two prompts plus eight ordered image references, fixed actions, scrolling queue, keyboard reorder, and exact persisted/provider order |
| Lifecycle and recovery | PASS | Running locks, zero-charge failure, explicit retry, transaction concurrency, restart reconciliation, autosave/document persistence, and revision checksum evidence |
| Visual and responsive | PASS | Fresh 1440x900, 1366x768, 920x900, and 375x812 live and multi-media screenshots from current builds; stable drawer geometry and no competing toolbar ownership |
| Accessibility | PASS | Keyboard ownership, focus, accessible naming, viewport matrix, and browse/review-only mobile behavior in current Chromium coverage |
| Performance and persistence | PASS live | Fresh owned FastAPI, Vite, Chromium, disposable-MySQL lifecycle with 200 nodes, 300 connections, three canvases, restart revision 3, and exact checksum retention |
| Security and data | PASS | Current quota, Canvas document API/fingerprint, upload security/quota, project-scoped runtime, guarded schema, cleanup, and sensitive-path hygiene |
| Real-provider visual fidelity | HUMAN-DEFERRED | Twenty Agnes HTTP 503 responses, zero outputs. Provider availability and visual fidelity remain unsupported release boundaries |

## Current verification

### Frontend

- Production build: PASS, 4,820 modules transformed.
- Representative Chromium matrix: PASS, 70/70.
- Drawer-stability focused rerun after ordinary rebuild: PASS, 5/5.
- The matrix covers graph commands, selection composition, image/video results, two-origin merge and recovery, dense ordering, frame capture, playback ownership, recipe isolation, accessibility, and mock-browser 200/300 performance.

### Backend and security

- Focused recipe/provider, transaction concurrency/restart, quota, Canvas document fingerprint/API, upload security, and upload quota matrix: PASS, 80/80.
- No schema migration, user database mutation, secret read, or destructive operation occurred.

### Fresh live lifecycle

- Evidence: `output/playwright/t5-008-live/t5008-36472-d1f276f353cfae76/summary.json`.
- Runtime: owned production FastAPI, Vite preview, Chromium, and unique guarded disposable MySQL schema.
- Result: PASS before and after backend restart; owned processes, ports, runtime directory, and schema cleaned.
- Acceptance graph: 3 canvases, 200 nodes, 300 connections, revision 3.
- Performance: 179 ms stable render, 59.92 FPS over 30 seconds, 16.7 ms frame p95, 0.1 ms pointer p95, 0 long tasks.

## Visual review

- Aesthetic direction remains graphite media-first, with violet limited to selection and action emphasis and structural graph chrome kept quieter than content.
- Desktop layouts retain usable Canvas space beside contextual editing surfaces.
- The 920px drawer settles to exactly 360px at the right edge and suppresses the competing selection toolbar.
- The 375px drawer settles to exact full width and exposes browse/review content without graph mutation actions.
- The initial multi-media screenshots captured an animation frame before drawer settlement. The evidence spec now polls exact final geometry before capture, preventing transition-frame artifacts from being accepted as final UI.

## Evidence classification

- Unit and pure logic: current backend and frontend resolver coverage.
- Mock-browser: current 70-test Chromium matrix and four-viewport multi-media fixture.
- Live MySQL and production runtime: fresh owned 200/300 acceptance lifecycle.
- Real-network media: current video playback, CORS fallback, and frame extraction browser tests.
- Real provider: unavailable, 20 HTTP 503 responses and zero outputs.
- Human acceptance: offline-only release accepted; real Agnes fidelity explicitly deferred.

## Supported release boundary

Revid may claim an enterprise-ready Canvas for deterministic graph authoring, media workflow composition, inspectable lineage, durable failure/retry, responsive review, accessible interaction, production-scale 200/300 performance, MySQL persistence, and guarded security behavior.

Revid may not claim verified photographic identity preservation, illustrated-medium fidelity, or scene geometry fidelity from the current Agnes recipe model until future authorized outputs receive a Human verdict.

## Stop rule result

No open product defect remains in the certification matrix. Further preference-only Canvas polish, provider replacement, automatic visual scoring, mobile graph editing, or realtime collaboration requires a new product decision and a new Task.
