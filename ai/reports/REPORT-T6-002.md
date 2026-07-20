# REPORT-T6-002 - Project audit remediation and structural hardening

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-20`
- Activation baseline: `760d2ef3dcb217b6026e7da345a4702484f370c6`
- Human decision: full-plan execution authorized

## Delivered

- Made authentication fail closed by default, moved development-admin credentials out of URLs, enforced strong signing configuration and loopback-only development auth, and added MySQL-backed cross-worker throttling without storing raw subjects.
- Made invitation redemption, user/identity creation, quota initialization, and usage increment one locked transaction with rollback and concurrent single-use proof.
- Removed client-forgeable generated provenance and unsupported project-scoped graph mutation routes; native generation and exact Canvas-scoped APIs remain authoritative.
- Added pre-persistence Canvas body, field, depth, key, string, and UTF-8 aggregate budgets with exact boundary and zero-mutation failure evidence.
- Fixed credential-bearing Agnes traffic to the exact approved HTTPS origin, with fail-before-client validation and directly injected mock transports.
- Added least-privilege immutable-action CI, exact Python constraints, guarded MySQL, deterministic Chromium, pinned secret/SAST checks, and a process-safe backend runner.
- Normalized Task state/outcome metadata, complete ROADMAP coverage, concise CURRENT state, durable link validation, and all-done/no-active final-state validation.
- Replaced production full-table cache authority with request-scoped domain repositories and proved cross-worker auth/admin/domain freshness.
- Added one discriminated Canvas contextual-surface authority with deterministic opener restoration, same-project resource retention, and scoped production behavior splits.
- Split all six oversized frontend test/fixture files by behavior domain while preserving the exact public fixture export manifest and ordered test-title hashes.

## Verification

- Final backend: `577/577`, exit `0`, `506.6s`, using the locked backend environment and guarded disposable `revid_test_*` schemas.
- Final deterministic functional/accessibility Chromium: `553/553` in `9.9m`; axe/accessibility, responsive, focus, keyboard, reduced-motion, mutation, and persistence paths are included.
- Headed 200-node/300-connection gate: `2/2` in `1.2m`; all unchanged performance thresholds passed in both configured Chromium projects.
- Unit 10 affected-title regression: `54/54`; all five ordered title-set counts and SHA-256 values equal their pre-split baselines.
- Production build: `4,952` modules transformed. Frontend test TS/JS files above 500 lines: `0`.
- Locked Python `pip check`, `npm audit` with zero vulnerabilities, one Alembic head, state/CI validators, UTF-8, diff, database-artifact, sensitive-path, strong-secret-signature, exact-stage, HEAD-drift, push, and origin agreement checks passed.

## Boundaries

- No real or paid provider request was made. Real-provider capacity, fidelity, creative quality, and cost remain outside this report.
- No real secret or `.env` content was read; no user/production database, destructive migration, external account, or incompatible supported contract was changed.
- `CanvasWorkspace.vue` and `CanvasStage.vue` retain quantified aggregate-SFC exceptions recorded in Unit 9; extracted behavior modules remain below 500 lines and re-split triggers are explicit.
- User-owned untracked `.codex/`, `.hermes/plans/`, and `output/` paths remain untracked and excluded from delivery.

## Delivery

- Task, PLAN, PROGRESS, evidence, implementation, tests, REPORT, CURRENT, ROADMAP, scoped commits, and `origin/main` are synchronized to `DONE / PASS`.
- T6-002 is complete. No later Product V3 implementation Task is activated.
