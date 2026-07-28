# T6-027 release candidate - Compatibility retirement and final Human handoff

- State: `VERIFYING`
- Verification outcome: `PENDING`
- Date: `2026-07-29`
- Activation baseline: `0f9aa9a53af694f208a354b5fa2bd9628f0d4141`
- Delivery commit: the exact scoped commit containing this record; its full SHA and fetched parity belong in the
  final handoff because the record is necessarily created by that commit
- Task: [TASK-T6-027](../tasks/todo/TASK-T6-027.md)
- Final REPORT: prohibited until the Human Owner records the required acceptance decision

## Decision

The currently executable T6-027 machine scope is a release candidate, not final product acceptance. The candidate
retires the ordinary Image/Video compatibility paths superseded by compact generation jobs, removes production
reachability of the browser-local mock Workflow batch, removes write-capable hidden Result reconciliation, closes
the useful old T6-016 provisional scope without fabricating historical Task files, and preserves only declared
history/admin or read-only compatibility.

The frozen PRD still requires Human visual, interaction, and complete-journey acceptance. Therefore T6-027,
ROADMAP, and CURRENT remain `VERIFYING / PENDING`; this file is intentionally not `REPORT-T6-027.md`.

## Delivered machine candidate

### Compact media authority

- Ordinary Canvas Image and Video submission now uses authenticated `/api/v2/generation-jobs` receipts and binds the
  returned job to the same stable card through the existing typed command/history/autosave authority.
- The v2 backend accepts the frozen typed Image/Video authoring fields, validates owner/project/Canvas/node and asset
  scope before job mutation, normalizes current capability defaults, stores a bounded provider-valid request snapshot,
  and dispatches only from that durable snapshot.
- Structured Video references remain ordered and mutually exclusive with legacy `image_ids/reference_mode`; Agnes
  Video resolution participates in cinematic drift validation only when the request or handoff explicitly carries
  the contract-gated field.
- Ambiguous retries remain deterministic by `client_request_id`; a different request fingerprint fails closed and a
  replay returns the existing compact receipt without another quota/job/provider mutation.

### Compatibility retirement

- Removed the production `workflow.canvas-generation-batch` action, overlay, panel, local orchestration contract, and
  their mock-only execution tests. Explicit durable WorkflowRun remains the executable V3 template authority.
- Removed ordinary successful-media use of legacy full generation responses and project-resource reconciliation.
  Current-Canvas delta or exact bound-job status/result routes own runtime progress and reload recovery.
- Removed write-capable `createGeneratedResultCommand` / `hasResultForTask` reconciliation and its watcher. Successful
  media is applied to the owning stable card; explicit ordinary batch siblings remain typed graph commands.
- Preserved explicit history/admin generation-task reads and read-only historical Result projection. The redirect-only
  old workspace and specialized Script/story response remain declared compatibility boundaries because the compact
  media replacement does not provide their structured story-production response contract.
- Preserved readable legacy Graph Templates, immutable lineage, explicit result branching/remix tools, and supported
  provider result parsing; none becomes a second Canvas, provider, job, history, or autosave authority.

### Image default and security reconciliation

- Reconciled all discovered backend and frontend ordinary Image default assertions to the runtime-authoritative `1:1`
  and `output_count: 1` contract. Explicit non-default ratios remain preserved.
- A release audit found `postcss@8.5.15` affected by `GHSA-r28c-9q8g-f849` (`<=8.5.17`; patched in `8.5.18`).
  The lockfile now resolves `postcss@8.5.24` and its compatible `nanoid@3.3.16` transitive dependency. No direct
  dependency or application API changed.
- `npm audit --omit=dev --audit-level=high` now reports zero vulnerabilities.

## TDD and verification evidence

### RED fingerprints

- Compact Image/Video submit first returned schema `422` because v2 rejected the frozen media fields.
- Direct durable media dispatch first failed with `Workflow generation projection is invalid`.
- The compatibility-retirement static/browser contract first found reachable Workflow batch and legacy reconciliation
  symbols.
- The T6-026 broad Image mismatch reproduced as four stale `4:3` / absent-`output_count` assertions.
- The related frontend parameter group reproduced seven stale assertions: two `4:3` defaults and five legacy
  `/api/image-generate` or `/api/video-generate` request expectations.
- The first production dependency audit found one high PostCSS advisory before the lockfile remediation.

### GREEN evidence

- Focused backend Image/transaction/compact job/provider/text group: PASS.
- Cinematic v2/v7 gate, Video, semantic-reference, parameter, compact API, and provider-dispatch group: `76/76` PASS.
- Backend minus the three unrelated upload-process modules: `712/712` PASS in `811.673s`.
- Full backend discovery classified `747` tests rather than being called PASS: all `30` upload errors and both upload
  failures share `anyio.BrokenWorkerProcess: Error during worker process initialization`; one related cinematic
  resolution-gate error was fixed and its related group is GREEN.
- The same three upload modules reproduced the worker-initialization fingerprint in isolation. No backend upload
  source, upload test, backend dependency, or storage path is changed by T6-027, so this remains an explicit Windows
  test-process infrastructure boundary, not silently omitted evidence.
- Alembic: one head, `g2b3c4d5e6f7`; backend compileall: PASS.
- Fresh frontend build after the dependency remediation: PASS, Vue type-check included, `5,049` modules transformed.
- Generation compatibility/parameter Chromium: `26/26` PASS.
- Fresh built-artifact T6-017 through T6-026 release journey Chromium: `66/66` PASS, including Template Library,
  accessibility/review-only behavior, Script/Image/Video lineage, explicit WorkflowRun, lifecycle, same-card compact
  result, Canvas switch/reload, strict scope, graph history, and autosave.
- Focused compatibility-retirement Chromium: `2/2` PASS.
- Cinematic Script and Script stable-card/typed-command/history/autosave authority: `9/9` PASS after replacing one
  stale `.n-drawer`-only test gate with the visible node-details close contract used by the replacement runtime.
- Project-state validator and `git diff --check`: PASS before final state reconciliation.

Browser automation, screenshots, build output, and provider-free fixtures are machine evidence only. No real or paid
provider ran, and no Human acceptance is claimed.

## Old T6-016 closeout

Old T6-016 was a provisional scope only. It never had a formal Task, PLAN, PROGRESS, or REPORT, so none is invented.
Its useful compatibility-retirement value is completed by T6-027 as follows:

1. normal Image/Video runtime no longer consumes legacy full-task success payloads;
2. normal Canvas runtime no longer reads project-wide generation-task history;
3. successful Image/Video results use same-card or explicit batch-sibling authority, not hidden Result creation;
4. the browser-local Workflow batch mock is no longer production-reachable;
5. retained compatibility is explicitly limited to history/admin reads, historical Result/Graph Template readability,
   redirect-only old workspace code, and the specialized Script/story response not replaced by compact media jobs.

This is a closeout of capability scope, not a retroactive `DONE`, `FAIL`, or historical REPORT for T6-016.

## Boundaries and release condition

- No real/paid provider call, secret/env access, provider raw capture, user prompt/source-content/evidence read, external
  account change, user/production database mutation, destructive migration, reset, stash, or cleanup occurred.
- No database table or field changed. Existing migration comments remain the authority.
- Protected user-owned untracked paths remain excluded from staging and delivery.
- No successor Task exists or may be created.
- Sole product release condition after the exact commit/push/parity handoff: Human Owner records
  `ACCEPT` or `ACCEPT_WITH_DECLARED_BOUNDARIES` for the final visual, interaction, and complete journey.
