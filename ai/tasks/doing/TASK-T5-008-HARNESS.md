# TASK-T5-008 Live Acceptance Harness Contract

- Status: `APPROVED FOR IMPLEMENTATION`
- Scope: T5-008 Unit A-E local certification only
- Updated: 2026-07-14

## Purpose

Run the Canvas acceptance suite through the production FastAPI lifespan, a production Vite build, Chromium, and one disposable MySQL schema. The harness must distinguish live-service evidence from route-mocked browser evidence and must leave user/runtime data untouched.

## Owned Lifecycle

One Python supervisor owns the following serial lifecycle:

1. Generate a collision-resistant `revid_test_t5008_<pid>_<nonce>` schema name.
2. Create that exact schema without replacing an existing schema, upgrade it to Alembic head, and verify `SELECT DATABASE()`.
3. Seed only the minimum test identity that cannot be created through the production API while registration is invite-only.
4. Build the frontend with the selected loopback API origin embedded through `VITE_API_BASE_URL`.
5. Start one production-lifespan FastAPI process and one Vite preview process on preflighted loopback ports.
6. Run the live pre-restart Playwright phase without API route interception.
7. Stop and restart only the owned FastAPI process, then run the post-restart phase.
8. Stop only owned child processes, remove only the owned runtime/storage directory, and drop only the exact schema created in step 2. Retain redacted acceptance evidence.

## Database Ownership Gates

- The only inherited credential source is the already-injected `REVID_TEST_MYSQL_ADMIN_URL`; the harness never reads `.env` and never records the URL or its fields.
- Schema creation uses `CREATE DATABASE` without `IF NOT EXISTS`. A collision fails closed and never drops or adopts the pre-existing schema.
- `owns_schema` becomes true only after this process successfully creates the schema and verifies its identity.
- Cleanup requires all of: `owns_schema`, an exact generated name matching `revid_test_*`, and a successful target identity check.
- The child backend receives only the derived `REVID_DB_*` runtime settings. It never receives the admin URL.
- Missing configuration, non-MySQL dialect, insufficient privileges, unreachable MySQL, migration mismatch, or uncertain ownership fails closed with no SQLite or user-database fallback.

## Process And Network Gates

- Services bind only to `127.0.0.1`; API and preview ports are explicit, distinct, and checked before launch.
- An occupied port fails closed. The harness never reuses an unknown server and never terminates a process by port lookup.
- Child commands use argument arrays and `shell=False`. The supervisor retains exact process handles/PIDs and stops only those children.
- Backend launch uses one Uvicorn worker, `--lifespan on`, no reload, the generated test JWT secret, the owned storage root, and CORS restricted to the owned preview origin.
- Frontend launch uses the already-built production bundle. The API origin is set during build, not only during preview.
- Readiness requires structured `/health` evidence that the application and MySQL are ready and the current Alembic revision equals head; an HTTP 200 alone is insufficient.

## Live Browser Contract

- The live Playwright config requires externally supplied loopback origins, has no `webServer`, runs serially with one Chromium worker, and writes only ignored artifacts.
- Live specs may not call `page.route`, `browserContext.route`, or otherwise fulfill production API requests.
- The browser authenticates through production login and performs product operations through production UI/API boundaries.
- A redacted ignored manifest may contain run ID, project/canvas IDs, canonical checksum, revisions, and expected counts. It must not contain passwords, bearer tokens, admin URLs, headers, or secret values.
- The pre-restart and post-restart phases are separate Playwright invocations so the supervisor can restart FastAPI without a test-only control endpoint.
- Provider calls remain mocked at the backend/provider test boundary. No paid or real external provider call is authorized.

## Evidence Contract

Evidence records may include:

- commit, schema name, run ID, loopback ports, OS/CPU/memory, browser/runtime versions, hardware-acceleration state;
- test phase, command result, timings, counts, revisions, checksums, FPS/frame/pointer/long-task/minimap/heap/listener metrics;
- screenshots, axe summaries, and redacted failure fingerprints.

Evidence must not include credentials, bearer tokens, authorization headers, full connection URLs, local secret values, or request bodies containing passwords. Logs use owned files and are reported by path plus summarized fingerprint, never pasted wholesale into durable state.

## Failure And Cleanup Contract

- Cleanup runs from `finally` for every partial-start state.
- Stop order is Playwright invocation, preview, backend, owned runtime/storage directory, then owned schema.
- Graceful process termination is attempted first; forced tree termination is limited to a still-live process started and recorded by this supervisor.
- A cleanup failure is a test failure. The report records the affected owned resource and release condition without exposing configuration.
- The ignored evidence directory is retained; the owned transient runtime directory is removed only after its resolved path is verified beneath the project `output/runtime/` root.

## Verification Gates Before Live Execution

- Unit tests prove collision/no-adoption behavior, unowned-stop behavior, exact environment redaction, port preflight, readiness validation, child command construction, and partial-start cleanup.
- Static checks prove the live config has no web server and live specs contain no route interception.
- The supervisor dry run proves missing admin configuration and occupied ports fail before schema/process mutation.
- Only after these gates pass may the live supervisor connect to the disposable MySQL service.
