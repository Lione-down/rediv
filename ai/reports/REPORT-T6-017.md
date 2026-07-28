# REPORT-T6-017 - Revid V3 workflow-template V1 contract freeze

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-28`
- Activation baseline: `515b8c90097108b05e8cc838e3ba6402e30c366b`
- Task: [TASK-T6-017](../tasks/todo/TASK-T6-017.md).
- Plan: [TASK-T6-017-PLAN](../tasks/doing/TASK-T6-017-PLAN.md).
- Progress: [TASK-T6-017-PROGRESS](../tasks/doing/TASK-T6-017-PROGRESS.md).
- PRD: [Reusable cinematic template PRD](../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- JSON Schema:
  [revid-workflow-template.v1.schema.json](../requirements/contracts/revid-workflow-template.v1.schema.json).

## Delivered

- Approved the PRD as `APPROVED / V1 CONTRACT FROZEN`, version `1.0`, with no unresolved V1 product decisions.
- Froze built-in plus user-owned private scope, three built-in seed categories, immutable private publish, explicit
  compatible upgrades, no V1 import/export or Pro Alpha selector, explicit-only Image 2.0 precomposition, quota units
  plus cost class, target-project asset rebinding, and legacy Graph Template readability.
- Added a strict draft-2020-12 JSON Schema and matching Pydantic/TypeScript contracts for the portable manifest and
  supporting definition/version, binding, instance, run, and provider-projection shapes.
- Added deterministic RFC 8785-compatible canonical JSON and SHA-256 fingerprints. The normative fixture fingerprint is
  `bb3f4c5214f5e2ff18138d9ac8809cc7cdbcded8e0f3e03b729e1be9bb35bbbb`; a valid astral-Unicode fixture also matches
  across backend and frontend.
- Added normative portable, non-portable, security-abuse, valid provider-projection, and provider-projection-abuse
  fixtures. Unknown/code/network/credential/runtime fields and forged scope/fingerprint/revision fail closed.
- Froze provider-valid sanitized projections for Agnes Text, Image 2.0, Image 2.1, and Video V2.0. Unsupported
  `resolution`, semantic Video fusion, mixed Video modes, Image `tags`, and top-level image `response_format` fail closed.
- Preserved existing Graph Template, Canvas atomic patch, typed command/history/autosave, strict Story Production,
  compact durable jobs, same-card result, and provider adapter authorities.
- Corrected the state validator's terminal-state classification so historical `BLOCKED / FAIL` Tasks do not require a
  fabricated active Task during the Human-authorized session handoff gap; `TODO / DOING / VERIFYING` remain the only
  unfinished states.

## TDD and verification

- RED backend: `20 failed`; every failure was the missing `schemas.workflow_template` contract module.
- RED frontend: `3 failed`; every failure was the missing TypeScript workflow-template contract module.
- Focused and provider GREEN: `61 passed, 58 subtests passed`.
- Legacy Template/Canvas regression: `23 passed`; one pre-existing `TestInMemoryStore` collection warning only.
- Provider-free Playwright contract proof: `3/3` passed.
- Fresh frontend production build: `5,041` modules transformed; existing large-chunk advisory only.
- Project-state validator: passed.
- `git diff --check`: passed.
- Contract implementation files remain below the repository's 500-line guideline.

## Security and evidence boundaries

- The Task made no database or Canvas mutation, migration, quota reservation, job creation, provider request, external
  account action, user-data mutation, or secret access.
- Fixtures contain sanitized dummy values only. No environment file, credential, raw provider payload/response, user
  content, or protected runtime evidence was read, staged, or committed.
- Provider-free fixture and browser evidence proves contract behavior only; it is not real provider success or Human
  visual/interaction acceptance.
- Public/team marketplace, arbitrary-code templates, destructive operations, and real/paid provider calls remain outside
  authorization.

## Decision

T6-017 is `DONE / PASS`. It is a pure contract Task whose complete acceptance criteria are machine-verifiable. The
program-level Human visual, interaction, and journey acceptance remains explicitly deferred to T6-027. T6-018 may be
created only after the T6-017 scoped commit is pushed and remote parity is confirmed.
