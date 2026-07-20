# T6-001 Unit 1 Contract Evidence

- Date: `2026-07-20`
- Baseline: `de2db15a2e1807439ac98778dfd09e39aaa6e40d`
- Scope: registry lifecycle plus strict director, reference-transfer, sequence, and retake schemas. No compiler, v2 preflight, generation handoff, Canvas mutation, provider work, or UI is included.

## Registry decision

- Capability contract v1 remains the exact T5-090 Canvas Context response.
- Capability contract v2 remains the exact T5-091 response with Canvas Context v1 and three cinematic v1 manifests, with no lifecycle fields added.
- New contract v3 carries lifecycle. Discovery returns Canvas Context v1 plus exactly three active cinematic v2 manifests. Cinematic v1 remains exact-version historical resolution only.
- Registry validation rejects duplicate active versions, unknown lifecycle, invalid replacements, duplicate identity, unknown/future resolution, imported IDs, and generic execute remains absent.

## Strict schemas

- Backend Pydantic and frontend TypeScript parsers require exact keys, bounded strings/lists, lowercase SHA-256 source revisions, backend-owned roles/exclusions, bounded attempts/depth, unique IDs, complete accepted canon, and source-matched director brief/sequence state.
- Completed/reserved beat references must be known, disjoint, and match the referenced beat's actual state.
- Reroll/rewrite require one repair variable; rewrite alone accepts a revised instruction. Review-only decisions cannot carry hidden generation fields.

## RED/GREEN

- Initial missing-symbol/module collection errors established the absent surface but were not treated as behavior proof.
- Valid behavior RED: backend and frontend accepted a clip whose `completed_beat_ids` referenced a `planned` beat; both tests failed at the expected “did not throw” assertion.
- GREEN adds only the `beat_id -> state` consistency check. The targeted tests and all focused backward-compatibility suites then passed.

## Verification

- Backend registry/new schemas plus existing cinematic contract/execution: `24/24` passed.
- Frontend existing Agent/Skill/mentions plus new lifecycle/schema parsers: `12/12` passed.
- Production build: `4937 modules transformed`.
- New files remain below 500 lines; existing `cinematic_skill_contract.py`, `cinematic-skills.ts`, and `CanvasCinematicSkillControls.vue` were not enlarged.

## Safety and attribution

- No provider call, task, quota, asset, Canvas mutation, database/migration, secret, `.env`, external account, or destructive operation occurred.
- Source diff contains no `seedance`, upstream author, Volcengine, or BytePlus expression. Contracts are independently expressed Revid code; no MIT notice addition is required for Unit 1.
