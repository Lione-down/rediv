# TASK-T5-072 - Enterprise Canvas scenario certification and release closure

- State: `DOING`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-071 must be `DONE - PASS` or receive an explicit Human offline-only closure decision
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Activation rule

- Keep T5-072 queued while T5-071 is active. Do not create T5-072 PLAN/PROGRESS or edit business code until CURRENT releases T5-071.
- Reuse existing reports and retained evidence before adding tests. Add a new scenario only when no current artifact proves the acceptance boundary.
- Real provider calls remain a separate Human authorization gate. Never turn a provider outage into an unbounded retry loop.

## Objective

Produce one enterprise release-certification matrix for the Canvas instead of continuing open-ended visual iteration. Prove the supported image, video, multi-node, recovery, responsive, performance, accessibility, security, and persistence scenarios against current production code, close only genuine evidence gaps, and publish one final report with explicit supported and unsupported boundaries.

## Product position

- Keep the graphite, media-first Canvas direction established by T5-014 through T5-071. Contextual chrome orbits content, violet communicates interaction, and graph structure stays quieter than media.
- Certification is evidence consolidation plus bounded gap closure, not a new redesign.
- Enterprise-ready means deterministic behavior, honest failure, recoverable state, accessible controls, stable responsive ownership, measurable performance, and separately classified real-provider quality.

## Certification matrix

| Domain | Required scenarios | Existing primary evidence | T5-072 action |
|---|---|---|---|
| Graph authoring | typed connect, reverse connect, insert, reroute, continuation, multi-select, exact undo/redo/reload | T5-018 through T5-021, T5-026, T5-029 | Consolidate and rerun the smallest representative browser gate |
| Image workflows | text-only, one reference, ordered multi-reference, result branching/remix, recipe v1/v2, explicit failure/retry | T5-030, T5-032, T5-033, T5-065, T5-070, T5-071 | Prove current recipe output only after T5-071 release gate; do not duplicate prompt tests |
| Video workflows | text-to-video, img2vid, two-origin keyframes, playable result, capture, CORS fallback, one playback owner | T5-030, T5-048 through T5-060, T5-066, T5-069 | Rerun one composed success and one durable failure/retry path |
| Dense multi-node composition | two prompts plus eight ordered images, exact provider order, compact preflight, no unintended mutation | T5-050 through T5-052 | Reuse near-limit evidence and rerun focused ordering gate |
| Lifecycle and recovery | running locks, zero-charge failure, explicit retry, restart reconciliation, autosave, conflicts, revisions | T5-006, T5-027 through T5-030, T5-060 | Add no new behavior unless current regression exposes a failure |
| Visual and responsive | 1440x900, 1366x768, 920x900, 375x812 readonly, panel/drawer insets, zero overlay collision | T5-008, T5-014 through T5-016, T5-031, T5-063, T5-071 | Capture one coherent final viewport set from the same production build |
| Accessibility | keyboard ownership, focus visibility, accessible naming, reduced motion, mobile review-only boundary | T5-004, T5-005, T5-008, later focused interaction reports | Run representative keyboard and readonly gates plus source audit |
| Performance and persistence | live 200 nodes/300 connections, 30-second metrics, exact restart checksum | T5-008, T5-011 | Reuse retained live evidence unless current renderer or persistence code changed after its baseline |
| Security and data | MySQL-only, project scope, quota integrity, no secret exposure, guarded runtime identity | T5-002, T5-003, T5-007, T5-008, T5-011 | Run focused current security signatures and staged sensitive-path review |
| Real-provider quality | photographic character, illustrated character, scene, image/video request compatibility, Human verdict | T5-043, T5-065, T5-070, T5-071 | Classify separately; current v2 fidelity requires successful Agnes outputs and Human review |

## Delivery sequence

1. Activate only after T5-071 releases and create T5-072 PLAN/PROGRESS.
2. Freeze the certification build baseline and map every matrix row to exact current tests, reports, and retained artifacts.
3. Run focused current gates for graph authoring, image/video composition, dense ordering, failure/retry, responsive ownership, keyboard access, and security signatures.
4. Rebuild once, then capture a coherent 1440, 1366, 920, and 375 viewport evidence set from that build.
5. Reuse T5-008 live 200/300 evidence if renderer and persistence boundaries are unchanged; otherwise rerun the guarded live harness.
6. Add minimal RED tests and fixes only for failures discovered by certification. Keep each correction scoped and independently verified.
7. Classify real Agnes evidence separately. Provider success is not visual acceptance; Human verdict remains authoritative.
8. Publish `REPORT-T5-072.md` with pass/fail/deferred status per row, exact commands, evidence paths, unsupported boundaries, and release recommendation.

## Acceptance criteria

- Every matrix row has current evidence, an explicit failure, or a named deferred Human/provider gate. No row is silently assumed.
- One production build supplies the final four-viewport visual set, with no node-content overlay collision, horizontal overflow, or desktop editing controls at 375px.
- Representative image and video multi-node paths prove exact prompt/reference order, canonical results, lineage, reload, quota, and durable failure/retry behavior.
- Toolbar, drawer, Inspector, comparison tray, video playback, and frame tools keep single ownership and create no unintended document or viewport mutation.
- Existing 200/300 live evidence is revalidated for applicability or rerun when its renderer/persistence baseline has materially changed.
- The report distinguishes unit, mock-browser, live MySQL, real-network media, real-provider, visual inspection, and Human acceptance evidence.
- No new external service, schema change, destructive operation, secret access, or paid call occurs without its required Human gate.
- The final report states a binary release recommendation and a finite list of unsupported boundaries. It must not end with an open-ended polish backlog.

## Effort and stop rule

- Expected engineering effort after T5-071 release: three to five focused working days when current regressions remain green.
- Provider recovery time is external and excluded from the engineering estimate.
- If certification finds more than two independent product defects, split each into a separate dependency-ready Task rather than expanding T5-072 indefinitely.
- Stop visual iteration when the matrix passes and the Human accepts the real-provider boundary. Further preference-only polish requires a new product decision and Task.

## Risks

- A full-suite rerun can create noise without increasing confidence. Use representative gates and evidence lineage first.
- Historical browser evidence can become stale after source changes. Final visual artifacts must come from one current build.
- Agnes availability can delay fidelity acceptance. Offline release is allowed only by explicit Human decision with the capability caveat recorded.
- Enterprise scope can expand without a stop rule. The certification matrix and two-defect split threshold are the hard boundary.

## Non-goals

- New collaboration model, realtime multi-user editing, mobile graph editing, provider replacement, automatic visual scoring, face embeddings, new schema, new design system, or wholesale Canvas restyling.
- Repeating every historical test or regenerating every historical screenshot when representative current evidence proves the same invariant.
