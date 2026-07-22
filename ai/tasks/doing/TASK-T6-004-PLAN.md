# TASK-T6-004 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: none - all units complete
- Task: [TASK-T6-004](../todo/TASK-T6-004.md).
- Progress: [TASK-T6-004-PROGRESS](TASK-T6-004-PROGRESS.md).
- Activation baseline: `main`, `HEAD == origin/main == 4b5c028ef5ae93052c5de09f116db9ed9a2dd1a5`; tracked worktree clean and owned activation paths had no overlapping edits.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Objective and success standard

Deliver the approved text, script-to-asset-group, image batch, video-reference, retry, and floating-connection behavior through existing Revid authorities. Each behavior change follows RED, the smallest GREEN, focused regression, fresh diff review, and durable progress reconciliation. The Task is complete only after every non-deferred acceptance axis passes and the Human Owner explicitly accepts the changed visual and interaction workflow.

## Architecture contract

- Extend the current Canvas graph and generation contracts; do not add a second renderer, workflow store, or durable ownership layer.
- Model an image batch as N independently idempotent existing single-result tasks mapped to the initiating card plus sibling cards.
- Model a script-created asset group as the existing storyboard/group entity containing canonical image-generation cards.
- Model video references as ordered role bindings. All roles consume one universal nine-entry budget, while one asset may validly occupy distinct roles.
- Preserve the T6-003 shared visible-layout authority for cards, ports, hit targets, paths, toolbars, composers, and materialized results.

## Durable data contracts

### Image batch snapshot

```ts
interface ImageBatchSnapshot {
  batch_id: string
  slot_index: number
  slot_count: number
}
```

- Slot indices are one-based and counts are capability-approved.
- Every slot owns a separate `client_request_id`, existing task row, lifecycle, and at most one asset.
- A failed-slot retry reuses the card and slot meaning but receives a new request ID; successful siblings remain untouched.

### Video reference binding

```ts
type VideoReferenceRole = 'first-frame' | 'last-frame' | 'reference'

interface VideoReferenceBinding {
  node_id: string
  asset_id: string
  role: VideoReferenceRole
  order: number
}
```

- `video_references.length <= 9` is the sole count gate.
- At most one first-frame and one last-frame binding are allowed.
- Duplicate `(node_id, asset_id, role)` bindings are rejected; the same source in different roles is valid.
- Legacy `image_ids + reference_mode` remains readable and normalizes into the ordered structure. New saves and requests use the structured contract.

## Unit sequence

### Unit 0 - Activation and acceptance baseline

- Status: `complete`
- Materialize Task, PLAN, and PROGRESS; activate T6-004 as the sole implementation Task.
- Record the approved rules, assumptions, dependencies, risks, non-goals, Human gates, clean tracked baseline, and separate acceptance axes.
- Reconcile CURRENT and ROADMAP, then pass project-state validation before business-code edits.

### Unit 1 - Backend capability and request-contract RED

- Status: `complete`
- Add failing tests for capability v6, image output counts, strict batch snapshots, independent per-slot idempotency, ordered video roles, nine-entry enforcement, cross-role asset reuse, and legacy normalization.
- Run the exact focused backend suite and preserve the expected missing-contract failure fingerprint before production edits.

### Unit 2 - Backend capability v6 and durable snapshots GREEN

- Status: `complete`
- Add strict schemas and ordered normalization, unique asset lookup plus ordered URL reconstruction, batch/reference fingerprints, and immutable request-parameter snapshots.
- Preserve existing task tables, single-result responses, quota/admission rules, lifecycle, and completion transactions.

### Unit 3 - Frontend capability parsing and persisted parameters

- Status: `complete`
- Establish RED then GREEN for v6 parsing, capability-driven image counts, structured role bindings, legacy migration, request serialization, and accessible controls with a shared nine-entry budget.

### Unit 4 - Direct script overwrite

- Status: `complete`
- Establish RED then GREEN for draft/refine replacement of the selected card, no sibling or version UI, normal Canvas undo, and stale-context protection.

### Unit 5 - Image batch slot orchestration and partial retry

- Status: `complete`
- Establish RED then GREEN for original-card slot 1, deterministic sibling insertion, independently idempotent requests, mixed outcomes, reload reconciliation, and retry of exactly one failed card.
- Prepare siblings through one existing atomic graph command before requests; use bounded existing request/runtime authorities rather than a second batch store.

### Unit 6 - Script-created asset group and bounded generate-all

- Status: `complete`
- Establish RED then GREEN for atomic script-to-shot group creation, canonical child generation, ordered bounded generate-all, item-level failure continuation, honest completed/failed/skipped counts, and identity-preserving standard ungroup.

### Unit 7 - Video role interaction and universal nine-entry limit

- Status: `complete`
- Establish RED then GREEN for all role combinations, exact nine, rejected tenth, removal/reordering, persistence, cross-role reuse of one source, request snapshots, and review-only behavior.

### Unit 8 - Geometry, accessibility, persistence, and visual regression

- Status: `complete`
- Prove the floating control, fixed logical anchors, materialized cards, toolbar, composer, paths, and hit targets retain T6-003 behavior.
- Exercise keyboard/focus/ARIA, reduced motion, compact and readonly states, four-card/nine-reference overflow, reload, and deterministic mock-provider evidence.

### Unit 9 - Full gates, fresh review, Human acceptance, and closure

- Status: `complete`
- Run focused suites first, rebuild frontend, then run locked full backend, full unexcluded Chromium, headed performance, production build, audit, state, diff, UTF-8, sensitive-path, secret-signature, and owned-path checks.
- Review the fresh diff against all eight product rules and every non-goal.
- Present focused visual and interaction evidence to the Human Owner. Only after explicit acceptance create REPORT, reconcile durable state to `DONE / PASS`, stage exact owned paths, commit, and push.

## Verification order

1. Unit-specific RED fingerprint.
2. Smallest coherent GREEN and focused owner-contract suite.
3. Related functional, persistence, accessibility, geometry, and interaction regression.
4. Production build and preview-backed Chromium after rebuild.
5. Locked full backend, full unexcluded Chromium, unchanged headed performance, dependency audit, and state/diff/hygiene checks.
6. Human visual and interaction acceptance before REPORT or delivery closure.

## Risks and mitigations

- Cross-role duplicate assets may be lost if database lookup deduplication also deduplicates semantic order. Keep unique lookup and ordered role reconstruction separate and test the path at schema, controller, service, and browser levels.
- A multi-result abstraction could corrupt single-task invariants. Represent a batch as normal independent tasks and assets.
- Quota/admission may change during a run. Preflight conservatively, use server admission per slot, bound scheduling, and preserve partial outcomes.
- Sibling/result geometry may detach at projected dimensions. Resolve current materialized visible layout before placement, ports, hit targets, and paths.
- Generate-all may overload providers. Snapshot eligible children, bound concurrency, continue item by item, and stop new scheduling when authoritative admission cannot continue.
- Ungroup may lose task/asset identity. Keep children canonical and assert identity, parameters, results, positions, and actions before and after ungroup.
- Legacy documents may become unreadable. Normalize old shapes on read and on the next edit/save; do not rewrite all documents eagerly.
- Controls may expand into a redesign. Preserve T6-003 dimensions and semantic colors and add only contract-required UI.

## Stop conditions

- Stop for explicit Human authorization before a real/paid provider call, secret access, destructive data/filesystem action, irreversible migration, external-account change, or incompatible provider contract.
- Stop on unknown overlapping edits in an owned path and preserve the user worktree.
- End every partial run with PROGRESS and CURRENT recording completed work, remaining work, exact next action, changed files, summarized commands/results, and blocker release conditions.
- Do not mark `DONE / PASS`, create REPORT, stage, commit, or push before all required automated evidence and explicit Human visual/interaction acceptance.
