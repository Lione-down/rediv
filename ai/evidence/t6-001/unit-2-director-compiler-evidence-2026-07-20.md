# T6-001 Unit 2 Director Compiler Evidence

- Date: `2026-07-20`
- Baseline: `b31ae2aa03f36bb7168296d5c46df50e4b034686`
- Scope: deterministic cinematic v2 compiler, exact existing preflight route, handoff drift validation, and immutable snapshot in the existing native generation transaction.

## RED and corrective evidence

- Primary behavior RED: an active cinematic v2 manifest returned the legacy `contract_version: 1` preflight shape. The assertion expected `2` and received `1`.
- Self-review RED: ordered group expansion projected child references without their parent transfer policy and raised `KeyError: image-b`.
- GREEN routes only version 2 through a separate pure compiler, preserves v1 independently, and resolves each expanded child to the explicit parent-group transfer policy.

## Deterministic contract

- Workflow modes are `standalone_clip`, `sequence_clip`, `continuation`, and `retake`; incompatible context combinations fail closed.
- The instruction ledger is fixed: current explicit instruction, reference transfer, accepted canon, current node parameters, director policy, provider defaults.
- Clear standalone instructions use the fast lane without inventing a brief. Known vague instructions return `director_brief_required` and cannot hand off.
- Transfer contradictions return bounded explicit conflicts. Unsupported media, roles, controls, native reference modes, stale source revisions, and malformed context fail before a native transaction.
- Canonical request JSON is sorted UTF-8 JSON. Frontend and backend verify exact request equality and SHA-256 digest; hidden fields fail closed.
- Reserved beats contribute IDs only and their future summary text does not enter the optimized prompt.

## Existing native authority proof

- Preflight route test returned the vague recommendation with the existing video transaction start mock at `0` calls.
- One explicit v2 Send used the existing `start_video_generation_request` path. A replay-safe transaction captured `request_parameters.cinematic_skill`; its canonical request and digest exactly matched preflight.
- The replay path performed no provider call. No new execute route, provider adapter, task store, scheduler, database field, or migration was added.

## Verification

- Backend focused v1/v2 contract, API, handoff, sequence/canon, group expansion, and existing native transaction matrix: `26/26` passed.
- Frontend v1/v2 preflight, digest, hidden-field, non-ready handoff, and legacy mention matrix: `8/8` passed.
- Production build: `4937 modules transformed`.
- New and affected owned code/test files remain below 500 lines.

## Safety and attribution

- No real/paid provider call, credential, `.env`, external account, destructive operation, Canvas mutation, asset persistence, or database mutation occurred.
- Product/test diff contains no upstream project/author/provider brand expression. The implementation is independently expressed Revid code; no third-party notice is required for Unit 2.
