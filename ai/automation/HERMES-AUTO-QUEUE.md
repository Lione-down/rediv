# Hermes Automatic Queue

```text
Revision: phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2
Status: BLOCKED - NOT EXECUTABLE / RUNTIME OWNER STALLED
Approved By: Codex Project Master Controller
Task ID: T4-003
Project Task File: ai/tasks/todo/TASK-T4-003.md
Action: NONE — terminal evidence only
Coordinator Profile: revid-dispatcher
Coordinator Max Runtime: 300s
Executor Profile: revid-backend
Executor Max Runtime: 1800s
Review Profile: NONE - not authorized in rev47r2
Parallel Group: serial-phase4-wave2-t4-003-rev47r2
Attempt Policy: terminal runtime diagnostic reviewed and runtime owner stalled; no further automatic rework; no redispatch; no Reviewer/HANDOFF until runtime action-injection remediation returns fresh proof
Previous Failure Fingerprint: REV47_MYSQL_ENGINE_REFERENCE_AND_ACCEPTANCE_GATES_FAILED; REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT; REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED
Hard Gates: do not redispatch rev47r2; do not reuse rev47/rev47r1/rev47r2 cards; do not modify business code; no .env reads; no secret output; no destructive revid_db operation; return fresh runtime remediation proof only
Stop After: REV47R2_ACTION_INJECTION_REMEDIATION_DIAGNOSTIC_READY_OR_STALLED
Expected Hermes Action: ACK_RUNTIME_OWNER_STALLED_OR_RETURN_FRESH_REMEDIATION_DIAGNOSTIC
Coordinator Idempotency Key: revid:phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2:T4-003:dispatch
Executor Idempotency Key: revid:phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2:T4-003:execute:1
Allowed Report Output: ai/reports/REPORT-T4-003-REV47R2.md
PMC Review: ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R2-2026-07-10.md
PMC Review SHA256: C21260B304C1DB12BCE3B44C2601992D5E4DA4B6B6E58B6BA9229918FBD27E30
PMC Diagnostic Review: ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R2-2026-07-10.md
PMC Diagnostic Review SHA256: D8B5034156A8F0CBE2C2C4884D630EEDEDA33F652ED5A2EED896DC0F2DA70A6F
PMC Stalled Review: ai/reviews/REVIEW-T4-003-PMC-RUNTIME-OWNER-STALLED-REV47R2-2026-07-10.md
PMC Stalled Review SHA256: FDEAC65DD0141E99149567AD49EF63BB19BDD197945A0D090183A0009C5669D2
Runtime Diagnostic: ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-2026-07-10.md
Runtime Diagnostic SHA256: B54D120B5680083CE1797290FA0ECF4E20669870BEBA80C5795C52E38DD83271
Runtime Diagnostic Verdict: STILL_INFRA_BLOCKED
Expected Fresh Diagnostic: ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-REMEDIATION-2026-07-10.md
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_STOP
Runtime Diagnostic SLA: REMEDIATION DIAGNOSTIC MISSED AFTER MULTIPLE HERMES CHECKPOINTS
Resume Condition: fresh runtime remediation evidence proves worker-visible initial instruction includes exactly one standalone Action: IMPLEMENT_AND_TEST_ONLY for the Executor path without business writes, secret reads, destructive database action, or historical card reuse
```

## Current Hermes Cron Contract

T4-002 rev46 is terminal and acknowledged in `ai/automation/HERMES-EXECUTION-STATUS.md` with `ACK_TERMINAL_VERDICT_AND_STOP`. PMC emergency final acceptance is `ai/reviews/REVIEW-T4-002-PMC-EMERGENCY-FINAL-ACCEPTANCE-2026-07-09.md`.

Rev47 reached `REPORT_READY`, but PMC found required acceptance and verification failures. Formal review: `ai/reviews/REVIEW-T4-003-PMC-REV47-REWORK-AND-REV47R1-AUTHORIZATION-2026-07-09.md`. Rev47 Coordinator `t_2f055673` and Executor `t_cef284e1` are terminal evidence and must not be reused.

Rev47r1 was dispatched as a bounded remediation attempt, but Executor `t_dfaef3d8` blocked with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` before writing `ai/reports/REPORT-T4-003-REV47R1.md`. Runtime diagnostic evidence identified `fallback_prior_turn_content` in the finalization/output-capture path.

PMC remediated the installed Hermes finalization/output-capture path and added regression coverage. Runtime remediation diagnostic `ai/reports/DIAGNOSTIC-T4-003-REV47R1-FINALIZATION-REMEDIATION-2026-07-09.md`, SHA256 `9189B102CA719395535B286CE2736F50E58E9702EC67113CDAF10DD522D9B006`, returns `READY_FOR_CONTINUATION`. PMC authorization `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-FINALIZATION-REMEDIATION-REV47R1-2026-07-09.md`, SHA256 `DA3CDC978379DB8063703FB325E23A46B71CC2BA5D99B0BC3FAB5FA829878C25`, publishes rev47r2.

Hermes ACKed rev47r2 and created Coordinator `t_41e1a294`; the Coordinator completed run `#210` and created Executor child `t_4a0c6348`. Executor run `#211` blocked after `13s` with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` before writing `ai/reports/REPORT-T4-003-REV47R2.md`. Scheduled evidence says the persisted Executor card body contained standalone `Action: IMPLEMENT_AND_TEST_ONLY`, but the `revid-backend` SOUL did not receive or detect that action marker before fail-closed blocking.

PMC diagnostic review is now `PMC_BLOCKED - RUNTIME_ACTION_INJECTION_REMEDIATION_REQUIRED`. Formal review: `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R2-2026-07-10.md`, SHA256 `D8B5034156A8F0CBE2C2C4884D630EEDEDA33F652ED5A2EED896DC0F2DA70A6F`. Diagnostic `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-2026-07-10.md`, SHA256 `B54D120B5680083CE1797290FA0ECF4E20669870BEBA80C5795C52E38DD83271`, verdict `STILL_INFRA_BLOCKED`. Failure fingerprint: `REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED`.

Hermes next action is only `ACK_RUNTIME_OWNER_STALLED_OR_RETURN_FRESH_REMEDIATION_DIAGNOSTIC` for rev47r2 and this fingerprint. PMC recorded the one-time stalled event in `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-OWNER-STALLED-REV47R2-2026-07-10.md`, SHA256 `FDEAC65DD0141E99149567AD49EF63BB19BDD197945A0D090183A0009C5669D2`, because the expected fresh diagnostic remained missing after multiple Hermes checkpoints. Expected fresh diagnostic path remains `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-REMEDIATION-2026-07-10.md`. It must prove the worker-visible initial instruction contains exactly one standalone `Action: IMPLEMENT_AND_TEST_ONLY` for the Executor path, or return `STILL_INFRA_BLOCKED` / `NEEDS_HUMAN_DECISION`; if Hermes cannot safely produce that diagnostic, it must mark same revision/fingerprint `STALLED` with exact missing evidence and next owner/action. Do not redispatch, retry, claim, promote, unblock, reparent, delete, archive or reuse rev47r2 cards `t_41e1a294` / `t_4a0c6348`, rev47r1 cards `t_50707802` / `t_dfaef3d8`, rev47 cards `t_2f055673` / `t_cef284e1`, rev46 lifecycle cards, or any historical T4-002 card. Do not create Reviewer/HANDOFF for rev47r2, touch frontend/auth/Canvas product scope, perform destructive `revid_db` operations, read `.env`, output secrets, start T4-004/T4-005, or claim PMC PASS.
Rev44r4 remains terminal historical evidence: Coordinator `t_a65cf87c`, Reviewer `t_bd73f60b`, HANDOFF `t_6430b878`, and PMC PASS `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV44-PASS-2026-07-08.md` have already been ACKed in Hermes execution status.

## 2026-07-09 T4-002 Unit D Revision 45 Runtime Advisory

Hermes runtime diagnostic `ai/reports/DIAGNOSTIC-T4-002-REV45-DISPATCHER-LIST-FILES-BOUNDARY-2026-07-09.md` returned `STILL_INFRA_BLOCKED`: `ROLE_CONTRACTS_OK` proves the configured allowlist matches the verifier, but does not prove the actual Dispatcher worker path avoids unauthorized `list_files`. PMC verdict remains `PMC_BLOCKED`; formal diagnostic review `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV45-2026-07-09.md`.

Hermes runtime owner next action is to repair the least-privilege `revid-dispatcher / DISPATCH_ONLY` path and return `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED`, or `NEEDS_HUMAN_DECISION` with a fresh evidence path/hash. The machine-readable reconciliation action remains the canonical diagnostic handoff value above. No redispatch, duplicate Coordinator, Executor, Reviewer, HANDOFF, business file change, database access, `.env` read, secret output, historical card operation, T4-003 unlock or PMC PASS is authorized.

Hermes ACKed rev45 and created Coordinator `t_d6f567bb`, but the Coordinator blocked before creating an Executor child. Gateway run `#201` stopped after `41s` with `ROLE_BOUNDARY_VIOLATION: tool 'list_files' is not allowed for Kanban task t_d6f567bb`. Unit D PLAN/PROGRESS/REPORT remain absent.

PMC verdict: `PMC_BLOCKED - RUNTIME_REMEDIATION_REQUIRED`; formal reviews `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV45-2026-07-09.md` and `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV45-2026-07-09.md`; fingerprint `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION`. This is infrastructure/runtime ownership, not business REWORK. Hermes runtime owner must return fresh remediation evidence before PMC can consider continuation. No redispatch, duplicate Coordinator, Executor, Reviewer, HANDOFF, business file change, database access, `.env` read, secret output, historical card operation, T4-003 unlock or PMC PASS is authorized.

## 2026-07-07 T4-002 Unit C3 Revision 43 Runtime Status Structure Canonicalized

Hermes-owned status SHA256 `644911686712ECA0F98112605195711C520E026EBA540B9307EBAD64260DB32E` now has a single `## Active Queue` section for rev43 and preserves rev42 as `## Historical Queue — Revision 42`. This closes the earlier duplicate Active Queue structure conflict.

Fresh deterministic verification now fails closed at Hermes-owned status schema/action issues:

```text
STATUS_RECONCILIATION_ERROR: expected one section starting with '## PMC Attention', found 0
```

PMC canonicalized its owned Queue action to `NONE — terminal evidence only`, matching the established terminal contract, and marked terminal reconciliation acknowledged because Hermes status already has `ACK_TERMINAL_VERDICT_AND_STOP` plus `Runtime Owner State = DIAGNOSTIC_READY`. Hermes-owned status still lacks the required `## PMC Attention` section and still says `Action = NONE — terminal runtime evidence only`; Hermes next action is only to restore the canonical `## PMC Attention` section, update status action wording to `NONE — terminal evidence only`, and retain `PMC Action Required = NO`, `ACK_TERMINAL_VERDICT_AND_STOP`, `Runtime Owner State = DIAGNOSTIC_READY`, and the existing diagnostic path/hash. No card, retry, Reviewer, HANDOFF, continuation revision, database, `.env`, or secret action is authorized.

## 2026-07-07 T4-002 Unit C3 Revision 43 Runtime Status Partial ACK

Hermes-owned status SHA256 `9CB1299FE516E3A27BF5E3E23C815655DD24371467506693BB589AF91AB3C540` now records `Runtime Owner State = DIAGNOSTIC_READY`, `Runtime Diagnostic Verdict = STILL_INFRA_BLOCKED`, `Current Failure Fingerprint = REV43_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`, `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`, and `PMC Action Required = NO`. This closes the earlier partial cursor defects for owner state, STOP ACK, current fingerprint, and PMC action marker.

The status document is still not structurally canonical. Fresh deterministic check still fails with `STATUS_RECONCILIATION_ERROR: duplicate canonical field across document: Queue Revision at lines 9, 49` because terminal rev42 remains a second `## Active Queue` section. Formal review: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-STATUS-PARTIAL-ACK-REV43-2026-07-07.md`. Hermes next action is only to make rev43 the single active queue section and preserve rev42 as historical terminal evidence. No card, retry, Reviewer, HANDOFF, continuation revision, database, `.env`, or secret action is authorized.

## 2026-07-07 T4-002 Unit C3 Revision 43 Direct Fast-Path Implementation

PMC directly implemented the bounded rev43 Allowed File changes after Human Owner requested immediate progress. Report: `ai/reports/REPORT-T4-002-UNIT-C3-REV43.md`. `py_compile` passed; three non-MySQL regressions passed; in-memory injected failure probe no longer returns rev42 tuple `ValueError`; `git diff --check -- backend/tests/test_migration_tool.py` passed. The five real-MySQL selectors are blocked because the current process lacks `REVID_TEST_MYSQL_ADMIN_URL`; no `.env` fallback, secret output, `revid_db` access, Reviewer, HANDOFF, card operation, or continuation revision is authorized.

## 2026-07-07 T4-002 Unit C3 Revision 43 Runtime Status Conflict

Hermes-owned status SHA256 `FA3949629B55B9848D1B4A0CD297184FECA8F6626FA330E1A92AD587768E60C8` contains partial rev43 runtime cursor fields, but it is still not canonical. `Runtime Owner State` remains `ACKNOWLEDGED`, `PMC Verdict Confirmation` remains `ACK_TERMINAL_VERDICT_AND_DIAGNOSTIC_WRITTEN`, current failure fingerprint remains the inherited rev42 business fingerprint, `PMC Action Required` remains `YES`, and deterministic reconciler fails with duplicate canonical `Queue Revision` fields across two Active Queue sections.

Formal review: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-STATUS-CONFLICT-REV43-2026-07-07.md`. Queue remains terminal/non-executable. Hermes must only canonicalize its owned status and collect fresh session-root-cause runtime evidence for Executor session `20260707_145513_ac2eee`.

## 2026-07-07 T4-002 Unit C3 Revision 43 Runtime Diagnostic Reviewed

Hermes produced `ai/reports/DIAGNOSTIC-T4-002-REV43-RUNTIME-HEALTH-2026-07-07.md` with verdict `STILL_INFRA_BLOCKED`, SHA256 `E84B16F6B8E65BCCD64CCBB5B8D66DF00902FBE7E5A415F38C14AB1C544F934C`. PMC review: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV43-2026-07-07.md`.

This diagnostic does not authorize continuation. It lacks session transcript/root-cause evidence. Hermes-owned status now records partial ACK/diagnostic fields, but it still lacks canonical `Runtime Owner State = DIAGNOSTIC_READY`, exact `ACK_TERMINAL_VERDICT_AND_STOP`, rev43 runtime fingerprint as current, `PMC Action Required = NO`, and a single current Active Queue canonical section. Hermes must canonicalize status and return fresh runtime evidence before PMC can consider any continuation.

## 2026-07-07 T4-002 Unit C3 Revision 43 Runtime Advisory

Rev43 Dispatcher `t_fb444a42` completed in `92s` and created Executor child `t_af88d96e`. Executor run `#189` blocked after `991s` with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`, and no `ai/reports/REPORT-T4-002-UNIT-C3-REV43.md` exists for business acceptance. Formal advisory: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV43-2026-07-07.md`.

This is a runtime/process incident, not business REWORK. Do not redispatch, retry, claim, promote, unblock, reparent, delete, archive or reuse rev43 cards/keys. Do not create Reviewer/HANDOFF or publish continuation until Hermes runtime owner ACKs this terminal verdict and provides fresh diagnostic evidence.

## 2026-07-07 T4-002 Unit C3 Revision 43 Publication

Human Owner 要求快速推进 T4-002 后，PMC 发布 fresh bounded remediation revision `phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`。Formal authorization: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV43-PUBLICATION-2026-07-07.md`.

Only `backend/tests/test_migration_tool.py` and rev43 PLAN/PROGRESS/REPORT are writable by the Executor. Rev43 must correct rev42's shared-lifecycle bypass and invalid failure grouping; it must stop at `UNIT_C3_SHARED_CLEANUP_LIFECYCLE_REPORT_READY_REV43`. Reviewer/HANDOFF and any automatic next revision are forbidden.

## 2026-07-07 T4-002 Unit C3 Revision 42 PMC Blocked

Revision 42 reached REPORT_READY, but PMC source and test-semantics audit found explicit Hard Gate failures. Two required regressions bypass the shared cleanup lifecycle, the actual multi-failure aggregation raises `ValueError`, resource-close failures remain discarded, and real AC4 does not assert its recorder. Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV42-BLOCKED-2026-07-07.md`.

Revision 42 is terminal `PMC_BLOCKED` with fingerprint `REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`. Independent REVIEW, HANDOFF, retry, redispatch, card reuse and automatic business rework are forbidden. Hermes may only ACK the exact terminal verdict and stop.

Hermes-owned status currently retains malformed double-leading-pipe tables and a future-dated `Last updated = 2026-07-07T12:22:00+08:00` relative to the PMC read at `2026-07-07T02:26:49+08:00`. Hermes must use the actual write time while performing terminal canonicalization; the future timestamp is not valid ordering evidence.

Fresh deterministic status check exits `2` with `expected one section starting with '## Active Queue', found 2` because archived rev41r7 is still labeled as a second Active Queue. Hermes must relabel rev41r7 as historical while preserving its terminal PASS evidence and keep rev42 as the sole Active Queue section in terminal/non-executable form.

## 2026-07-07 T4-002 Unit C3 Revision 42 Publication

Rev41r7 terminal STOP reconciliation is complete. PMC publishes fresh bounded revision `phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-07-42` with fresh Dispatcher/Executor keys. Formal authorization: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV42-PUBLICATION-2026-07-07.md`.

Only `backend/tests/test_migration_tool.py` and rev42 PLAN/PROGRESS/REPORT are writable by the Executor. Stop at `UNIT_C3_FAILURE_LIFECYCLE_REPORT_READY_REV42`; Reviewer/HANDOFF and any automatic next revision are forbidden.

## 2026-07-06 T4-010 PMC PASS

Rev41r7 Reviewer and HANDOFF reached PASS/HANDOFF_READY. PMC fresh build、diff、line-count、protected hashes and artifact SHA256 verification passed. Formal verdict: `ai/reviews/REVIEW-T4-010-PMC-PASS-2026-07-06.md`.

This Queue is terminal and non-executable. Hermes must ACK `PMC_PASS / ACK_TERMINAL_VERDICT_AND_STOP`; do not create any additional T4-010 card.

## 2026-07-06 Revision 41r7 Final HANDOFF Closure

Rev41r6 Reviewer completed PASS_REATTESTED; its HANDOFF failed closed on missing read-only `search_files`. HANDOFF_ONLY now permits bounded search only for card-specified project evidence plus workspace-bounded `file_sha256`; terminal remains forbidden. Formal authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R6-SEARCH-POLICY-AND-REV41R7-AUTHORIZATION-2026-07-06.md`.

Rev41r7 is the only executable Queue and performs no business/browser work.

## 2026-07-06 Revision 41r5 Review PASS / Revision 41r6 HANDOFF Closure

Rev41r5 Reviewer `t_26fc11ff` run #177 completed PASS in 524s. HANDOFF `t_b4e90e51` then failed closed because its SHA256 contract had no permitted hash tool and terminal remained forbidden. Installed Hermes now provides workspace-bounded read-only `file_sha256`, authorized only for `HANDOFF_ONLY`; terminal remains forbidden. Formal authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R5-HANDOFF-POLICY-AND-REV41R6-AUTHORIZATION-2026-07-06.md`.

The only executable Queue is rev41r6. Its Reviewer only re-attests the existing consolidated PASS without browser/build rerun or REVIEW overwrite. The dependent HANDOFF uses `file_sha256` and writes the canonical artifact. All rev41r1-r5 cards/runs/keys remain terminal/non-reusable.

## 2026-07-06 Revision 41r4 Terminal / Revision 41r5 Browser Review Closure

Revision 41r4 closed normally: Reviewer `t_eb522d66` wrote a provisional REVIEW and terminalized BLOCKED in 397s, proving the no-verdict timeout fixed. Its static/build/hash/source/REPORT consistency and 1440x900 checks passed; fingerprint `REV41R4_MISSING_VIEWPORT_920X900_AND_375X812_BROWSER_VERIFICATION` identifies the remaining browser-only scope.

Reviewer verification cap is now 48 calls while the independent 1200s soft deadline and 600s finalization reserve remain unchanged. Installed targeted `6 passed`, project runtime `37 passed`, `ROLE_CONTRACTS_OK`, durable patch `APPLIED`, Gateway PID `27328` healthy, cron active. Formal authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R4-BROWSER-CAP-AND-REV41R5-AUTHORIZATION-2026-07-06.md`.

The only executable Queue is rev41r5. It may verify only the missing 920x900、375x812、zero-request and NButton console evidence plus one batched freshness guard, then consolidate the final REVIEW. Rev41r4 cards `t_f2f5ea0d`, `t_eb522d66`, `t_eab42144` and all earlier cards/runs/keys are terminal/non-reusable.

## 2026-07-06 Revision 41r3 Closure / Revision 41r4 Deadline-Safe Review Continuation

Human Owner directed PMC to resolve the timeout and resume Hermes scheduling. Revision 41r3 remains terminal infrastructure evidence; its Coordinator `t_7ab33875`, Reviewer `t_2c2f6842`, HANDOFF `t_588bd58e`, runs, sessions and keys must not be retried, claimed, promoted, unblocked, reparented, deleted or reused.

Deadline-aware Reviewer finalization is deployed and freshly verified: installed targeted tests `5 passed`, project runtime tests `37 passed`, `ROLE_CONTRACTS_OK`, patch classifier `HERMES_RUNTIME_PATCH_APPLIED`, and Gateway PID `31496` healthy. Formal decision: `ai/reviews/REVIEW-T4-010-PMC-REV41R3-RECOVERY-AND-REV41R4-AUTHORIZATION-2026-07-06.md`.

The only executable Queue is fresh revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-06-41r4`. It authorizes review lifecycle only, inherits all rev41r1/rev41r2/rev41r3 fingerprints, forbids business writes/re-execution, and must use fresh Coordinator/Reviewer/HANDOFF cards and idempotency keys.

## 2026-07-05 Revision 41r3 Reviewer Runtime Block

Revision 41r3 Coordinator `t_7ab33875` run #172 completed the exact-parent lifecycle dispatch. Reviewer `t_2c2f6842` run #173 then exceeded its `1800s` budget at 1814s, entered `gave_up`, and produced no Independent REVIEW. HANDOFF `t_588bd58e` remains blocked by the absent verdict. Formal advisory: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV41R3-2026-07-05.md`.

Revision 41r3 is terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`, fingerprint `REV41R3_REVIEWER_TIMEOUT_WITHOUT_REVIEW`. No executable Queue exists. Do not retry, claim, promote, unblock, reparent, delete or reuse its cards/runs/keys; do not create replacement Reviewer/HANDOFF, business attempt 2 or automatic rev41r4.

## 2026-07-05 Revision 41r2 Runtime Block / Revision 41r3 Exact-Parent Continuation

Revision 41r2 Coordinator `t_c2180c46` is terminal: run #170 timed out at 182s and run #171 timed out at 181s with zero children. Raw run #171 payloads omitted the required Reviewer `parents`; runtime correctly returned `REVIEW_DISPATCH_CHILD_CONTRACT_INVALID`. Formal verdict: `ai/reviews/REVIEW-T4-010-PMC-REV41R2-RUNTIME-BLOCK-AND-REV41R3-AUTHORIZATION-2026-07-05.md`.

PMC publishes one fresh bounded continuation `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r3`. It inherits both rev41r1 and rev41r2 fingerprints. The Coordinator must explicitly pass `parents: [current rev41r3 Coordinator card ID]` for the Reviewer child and use the persisted Reviewer ID as the sole HANDOFF parent. No business execution or write is authorized.

Revision 41r1/rev41r2 cards, runs and keys are terminal immutable evidence. Do not retry, claim, promote, unblock, reparent, delete or reuse them.

## 2026-07-05 Revision 41r2 Review Lifecycle Deadlock Resolution

Human Owner directed PMC to restore progress. PMC confirmed a circular gate: rev41r1 required fresh same-profile child-creation proof before continuation, while the runtime diagnostic correctly stated that producing that proof required a fresh PMC-authorized lifecycle chain.

PMC therefore publishes one fresh bounded continuation: `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r2`. It inherits `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION` and authorizes only one `revid-pm / REVIEW_DISPATCH_ONLY` Coordinator, one Independent Reviewer and one Reviewer-dependent HANDOFF stage. Formal decision: `ai/reviews/REVIEW-T4-010-PMC-REV41R2-LIFECYCLE-DEADLOCK-RESOLUTION-2026-07-05.md`.

Revision 41r1 remains terminal immutable evidence. Do not retry, claim, promote, unblock, reparent, delete or reuse its cards/runs/keys. Rev41r2 must fail closed on any deploy, policy, action, profile, persisted-card or dependency mismatch. No business re-execution, business write, attempt 2 or automatic rev41r3 is authorized.

## 2026-07-05 Revision 41r1 Partial Terminal Reconciliation Conflict

Hermes corrected the rev41r1 current header, runtime fingerprint, diagnostic fields, PMC action marker and terminal STOP confirmation. The rewrite remains non-canonical: Task/Queue SHA256 values are stale, the reconciliation table omits `Queue Status`, and the embedded update time predates the actual status write. Formal verdict: `ai/reviews/REVIEW-T4-010-PMC-REV41R1-PARTIAL-TERMINAL-RECONCILIATION-CONFLICT-2026-07-05.md`.

Revision 41r1 remains terminal/non-executable. Hermes must only run the project-owned deterministic reconciler against the current Queue, Task and status files. No card creation, retry, Reviewer, HANDOFF, business execution or replacement revision is authorized.

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_STOP
Runtime Diagnostic SLA: SATISFIED — diagnostic verdict STILL_INFRA_BLOCKED
Resume Condition: fresh runtime evidence with verdict READY_FOR_CONTINUATION proves bounded revid-pm REVIEW_DISPATCH_ONLY can create the exact Reviewer and Reviewer-dependent HANDOFF children without business writes or historical card reuse
```

## 2026-07-05 Revision 41r1 Post-Diagnostic Status Conflict

Hermes rewrote `HERMES-EXECUTION-STATUS.md` after the latest PMC diagnostic verdict, but the new status SHA256 `C22D0D19621B3315F7EE512438538D11C907B7514734D35C0FD6616F46855558` still reports revision 41 as current `REPORT_READY`, retains the rev40 business fingerprint and stale `PMC Action Required = YES / RUNTIME_ADVISORY`, and confirms only the earlier diagnostic-start action. It also retains malformed canonical-table rows. Formal verdict: `ai/reviews/REVIEW-T4-010-PMC-REV41R1-POST-DIAGNOSTIC-STATUS-CONFLICT-2026-07-05.md`.

Revision 41r1 remains terminal/non-executable. The signal below is the only active reconciliation contract. Hermes must only canonicalize its owned status; no card creation, retry, Reviewer, HANDOFF, business execution or replacement revision is authorized.

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION
Expected Hermes Action: ACK_DIAGNOSTIC_REVIEW_AND_CANONICALIZE_TERMINAL_STATUS
Runtime Diagnostic SLA: SATISFIED — diagnostic verdict STILL_INFRA_BLOCKED
Resume Condition: fresh runtime evidence with verdict READY_FOR_CONTINUATION proves bounded revid-pm REVIEW_DISPATCH_ONLY can create the exact Reviewer and Reviewer-dependent HANDOFF children without business writes or historical card reuse
```

## 2026-07-05 Revision 41r1 Diagnostic Reviewed

Hermes has ACKed the exact rev41r1 terminal verdict and produced diagnostic `ai/reports/DIAGNOSTIC-T4-010-REV41R1-RUNTIME-HEALTH-2026-07-05.md`, SHA256 `4E9F5AFD7139FE5A48636AD77BDC24356346F3B4852A7FFE9410BA794F5F77B9`.

The diagnostic verdict is `STILL_INFRA_BLOCKED`: policy checks pass, but the required fresh same-profile proof of the complete Reviewer/HANDOFF child-creation contract is absent. PMC rejects a fresh lifecycle continuation. Revision 41r1 remains terminal/non-executable; canonical REVIEW and HANDOFF remain missing. Hermes must canonicalize its current execution header, which still reports revision 41 as active `REPORT_READY` with stale action/fingerprint fields. Formal decision: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV41R1-2026-07-05.md`.

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION
Expected Hermes Action: ACK_DIAGNOSTIC_REVIEW_AND_CANONICALIZE_TERMINAL_STATUS
Runtime Diagnostic SLA: SATISFIED — diagnostic verdict STILL_INFRA_BLOCKED
Resume Condition: fresh runtime evidence with verdict READY_FOR_CONTINUATION proves bounded revid-pm REVIEW_DISPATCH_ONLY can create the exact Reviewer and Reviewer-dependent HANDOFF children without business writes or historical card reuse
```

## 2026-07-05 Revision 41r1 revid-pm Policy Remediation

Human Owner authorized bounded `search_files` for `revid-pm / REVIEW_DISPATCH_ONLY`. Canonical and deployed policy now include exactly that read-only discovery tool; `HANDOFF_ONLY` and write/terminal/process/browser/web capabilities remain unchanged. Targeted `17 passed`, full runtime `34 passed`, `ROLE_CONTRACTS_OK`, deployed resolver smoke `REVID_PM_POLICY_SMOKE_OK`, and Gateway clean restart PID `2308` are recorded in `ai/reviews/REVIEW-T4-010-PMC-REV41R1-REVID-PM-POLICY-REMEDIATION-2026-07-05.md`.

This remediation does not authorize reuse of rev41r1 cards or a new lifecycle chain. Active Wave remains terminal/non-executable until Hermes ACKs the same revision/fingerprint and submits a fresh diagnostic proving the complete bounded Reviewer/HANDOFF child-creation contract.

## 2026-07-05 Revision 41r1 Queue Action Correction

PMC canonicalized the Active Wave action from `NONE — terminal runtime evidence only` to the project-wide terminal contract `NONE — terminal evidence only`. This removes the Queue-string-only reconciler exit `2`; it does not authorize execution or clear the runtime fingerprint. Formal decision: `ai/reviews/REVIEW-T4-010-PMC-REV41R1-QUEUE-ACTION-CORRECTION-2026-07-05.md`.

Revision 41r1 remains terminal `PMC_BLOCKED / RUNTIME_OWNER_STALLED`. Queue read-back now passes the Action and reconciliation-revision checks; the next deterministic error is the missing rev41r1 Runtime Advisory section in Hermes-owned status. Hermes must reconcile that initial ACK state and provide the overdue fresh diagnostic under the existing revision/fingerprint. If its current gate cannot represent the initial ACK state, the runtime owner must provide bounded reconciler remediation evidence. No replacement revision, policy expansion, Reviewer, HANDOFF or Kanban action is authorized.

```text
PMC Reconciliation Required: NO — SUPERSEDED BY DIAGNOSTIC REVIEW
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION
Expected Hermes Action: NONE — DIAGNOSTIC PRODUCED AND REVIEWED
Runtime Diagnostic SLA: SATISFIED — diagnostic verdict STILL_INFRA_BLOCKED
Resume Condition: fresh diagnostic verdict READY_FOR_CONTINUATION proves bounded revid-pm REVIEW_DISPATCH_ONLY policy can complete Reviewer/HANDOFF child creation without unrestricted fallback
```

## 2026-07-05 Revision 41r1 Runtime Owner Stalled

Hermes runtime owner did not ACK the rev41r1 terminal verdict or produce a matching diagnostic across the `2026-07-05T09:04:38+08:00` and `2026-07-05T12:02:20+08:00` PMC checkpoints. The `2026-07-05T10:02:59+08:00` diagnostic SLA is expired. PMC records the one-time `RUNTIME_OWNER_STALLED / DIAGNOSTIC_SLA_MISSED` event in `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-OWNER-STALLED-REV41R1-2026-07-05.md`.

The existing rev41r1 reconciliation signal below remains the only active signal. Queue execution remains forbidden. Hermes runtime owner must ACK the exact revision/fingerprint and provide fresh diagnostic evidence; no replacement revision, Reviewer or HANDOFF is authorized.

## 2026-07-05 Revision 41r1 Runtime Block

Revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1` is terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`. Coordinator `t_08bb42c8` run `#168` timed out at 181s; process retry run `#169` was blocked by `ROLE_BOUNDARY_VIOLATION` because `search_files` was not allowed for the persisted `revid-pm / REVIEW_DISPATCH_ONLY` task. No Independent Reviewer or HANDOFF card exists. Formal advisory: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV41R1-2026-07-05.md`.

Do not redispatch, retry, claim, promote, unblock, reparent, delete or reuse `t_08bb42c8`; do not create Reviewer/HANDOFF outside a fresh PMC-authorized continuation. This is a runtime/tool-policy incident, not business REWORK. No executable Queue exists.

## 2026-07-05 Revision 41 REPORT Gate / Revision 41r1 Review Lifecycle Publication（terminal historical）

Revision 41 business execution reached `REPORT_READY`. PMC audited the Task, REPORT, actual diff, fresh build, protected hashes and PNG dimensions/hashes and found no explicit Acceptance Criterion failure that must be closed before Independent Review. Formal authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41-REVIEW-LIFECYCLE-AUTHORIZATION-2026-07-05.md`.

Revision 41 business cards and artifacts are retained evidence and must not be retried, claimed, promoted, unblocked, reparented, deleted or reused. The fresh lifecycle revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1` authorizes only Independent Review and a Reviewer-dependent HANDOFF. It does not authorize business re-execution, code changes, attempt 2 or another Task.

```text
PMC Reconciliation Required: NO — SUPERSEDED BY REV41R1 RUNTIME VERDICT
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-responsive-remediation-2026-07-05-41
PMC Verdict: PMC_CONTINUATION_APPROVED
Failure Fingerprint: NONE — inherits REV40_RESPONSIVE_DRAWER_PROMPT_OVERLAP_AND_INTERACTION_EVIDENCE_INCOMPLETE
Expected Hermes Action: NONE — REV41R1 WAS ACKNOWLEDGED AND IS NOW TERMINAL
Resume Condition: Independent Reviewer completes fresh verification and dependent HANDOFF reaches T4_010_HANDOFF_READY_REV41
```

## 2026-07-05 Revision 40 Rework / Revision 41 Responsive Remediation Publication

Revision 40 closes the exact-viewport/PNG evidence gap but fails Unit B acceptance. At `920x900` and `375x812`, the bottom Inspector drawer overlaps the fixed Prompt Dock; keyboard/reduced-motion/state/network evidence is incomplete; source audit also identifies a missing `project_id` generation guard and unresolved `NButton` registration. Formal verdict: `ai/reviews/REVIEW-T4-010-PMC-REV40-REWORK-AND-REV41-AUTHORIZATION-2026-07-05.md`.

PMC publishes one bounded business REWORK revision `phase4-wave3-workspace-shell-unit-b-responsive-remediation-2026-07-05-41`. Only `Workspace.vue` and `WorkspacePromptDock.vue` are writable business files. Revision 40 and all earlier cards/runs/keys/sessions/artifacts remain terminal and non-reusable.

```text
PMC Reconciliation Required: NO — SUPERSEDED BY REV41
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-exact-browser-evidence-2026-07-05-40
PMC Verdict: PMC_REWORK
Failure Fingerprint: REV40_RESPONSIVE_DRAWER_PROMPT_OVERLAP_AND_INTERACTION_EVIDENCE_INCOMPLETE
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_ACK_REV41
Resume Condition: fresh revision 41 chain completes bounded fixes and exact browser interaction evidence
```

## 2026-07-05 Revision 39 Block / Revision 40 Exact-Tool Evidence Publication

Revision 39 is terminal `PMC_BLOCKED`. It repeated fingerprint `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`: only `1264x625` was real, CSS transform simulated the target viewport, and the revision 39 evidence directory contains zero files. The REPORT's all-gates-pass conclusion is rejected. Formal verdict: `ai/reviews/REVIEW-T4-010-PMC-REV39-BLOCKED-AND-REV40-AUTHORIZATION-2026-07-05.md`.

The exact browser tools were deployed and activated only after revision 39 became terminal. Under the Human Owner's explicit remediation authorization, PMC publishes one final bounded evidence continuation: `phase4-wave3-workspace-shell-unit-b-exact-browser-evidence-2026-07-05-40`. It must use `browser_set_viewport` and `browser_screenshot`; simulation or fallback is forbidden.

```text
PMC Reconciliation Required: NO — SUPERSEDED BY REV40
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-browser-evidence-correction-2026-07-04-39
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_ACK_REV40
Resume Condition: fresh revision 40 chain proves exact tool visibility, target/actual viewport equality and real PNG evidence
```

## 2026-07-04 Revision 38 Closure / Revision 39 Evidence Correction Publication

PMC 已接受 revision 38 的 canonical terminal ACK。Hermes execution status 现以同 revision、同 fingerprint `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING` 记录 `PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`、`ACK_TERMINAL_VERDICT_AND_STOP` 与 `PMC Action Required = NO / NONE`。Revision 38 reconciliation 已关闭，不得再次修改或复用其 cards、runs、keys 与 artifacts。

PMC 现发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-b-browser-evidence-correction-2026-07-04-39`。该 revision 只补齐 exact `1440x900`、`920x900`、`375x812` browser evidence；五个 Workspace business files 全部 read-only。若真实 browser 发现 defect，Executor 必须准确写 REPORT 并停止，不得修改代码。正式授权：`ai/reviews/REVIEW-T4-010-PMC-REV38-CLOSURE-AND-REV39-AUTHORIZATION-2026-07-04.md`。

## 2026-07-04 T4-010 Revision 38 Reconciliation State Conflict（closed）

Hermes execution status 的首次 `Rev38 Reconciliation = COMPLETE` 曾与 current `Failure Fingerprint`、`REPORT_READY`、`PMC Action Required = YES` 互相冲突。Hermes 后续已 canonicalize 为同 revision/fingerprint 的 terminal STOP；该 conflict 由上方 rev39 authorization review 正式关闭。

## 2026-07-04 T4-010 Unit B Revision 38 Evidence Block

Revision `phase4-wave3-workspace-shell-unit-b-browser-continuation-2026-07-04-38` reached `REPORT_READY`, but the REPORT discloses only one actual browser viewport (`1264x625`) and the required `ai/evidence/T4-010/unit-b/` screenshots and per-viewport console/network/overflow artifacts do not exist. Fresh PMC build and scoped diff check pass, but they do not satisfy the exact `1440x900`、`920x900`、`375x812` real-browser Hard Gate. Formal verdict: `ai/reviews/REVIEW-T4-010-PMC-UNIT-B-REV38-BLOCKED-2026-07-04.md`.

Revision 38 is terminal `PMC_BLOCKED`; no Reviewer, HANDOFF, retry, redispatch or automatic business REWORK is authorized. No executable Queue exists.

```text
PMC Reconciliation Required: NO — ACKNOWLEDGED
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-browser-continuation-2026-07-04-38
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING
Expected Hermes Action: NONE FOR REV38 — ACK FRESH REV39 INSTEAD
Resume Condition: satisfied by fresh bounded revision 39 authorization
```

## 2026-07-04 Rev37 Smoke Pass / T4-010 Unit B Revision 38 Publication

Revision 37 runtime smoke 已通过：Dispatcher `t_95b6b112` run `#157` 与 Executor `t_9f86c667` run `#158` 均 terminal done；invalid byte `0xB4` 经 U+FFFD replacement 安全处理，process exit `0`，Executor 显式完成 `READY_FOR_CONTINUATION_RUNTIME_ONLY`。正式验收与授权：`ai/reviews/REVIEW-T4-010-PMC-REV37-PASS-AND-UNIT-B-REV38-AUTHORIZATION-2026-07-04.md`。

PMC 发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-b-browser-continuation-2026-07-04-38`。Hermes 必须 ACK exact revision，规范化 execution status 中 rev37 的 `PLACEHOLDER` hashes 与 stale blocked Queue summary，并只通过 project launcher 创建 fresh Dispatcher/Frontend chain。Executor 仅完成 Unit B Task 的 real-browser、responsive、keyboard、ARIA、console/network 与 visual closure，停止于 REPORT_READY；Reviewer、HANDOFF 与 T4-002 rev36 均未授权。

## 2026-07-04 Rev35 Runtime Root Fix / Frontend Terminal Smoke Revision 37 Publication

Human Owner 已授权修复 T4-010 Unit B 的全部 runtime blockers，并要求以发布 Unit B 为最终目标。Rev35 原始 worker log 已证明根因是 Windows background-process output strict UTF-8 decode：byte `0xB4` 触发 `subprocess._readerthread` `UnicodeDecodeError`，随后 agent 以 plain-text `[Acknowledged]` clean exit 且未调用 terminal Kanban tool。当前 Hermes baseline 已使用 `errors="replace"`；direct invalid-byte smoke exit `0`，targeted `8 passed`、full runtime `26 passed`、`ROLE_CONTRACTS_OK`。

T4-002 rev36 尚未 ACK、无 card、无 active worker，现按最新 Human priority override 在执行前 supersede；Task、authorization、fingerprints 与 Hard Gates 保留，未来必须 fresh revision/keys 才能重新发布。Revision `runtime-rev35-frontend-terminal-smoke-2026-07-04-37` 是唯一 executable Queue，只验证 fresh `revid-frontend` worker 的 invalid-byte background process 与显式 terminal transition。Unit B 尚未在本 revision 获得业务执行授权；smoke PASS 后由 PMC 发布 fresh Unit B continuation。正式授权：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-SMOKE-REV37-AUTHORIZATION-2026-07-04.md`。

## 2026-07-04 T4-002 Unit C3 Revision 36 Publication

PMC 发布唯一 executable Queue `phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-04-36`。Human authorization、rev35 STOP closure、`STATUS_OK`、Gateway、zero-active-board、runtime tests、`ROLE_CONTRACTS_OK`、Task hash、Allowed File ownership 与 exact launcher dry-run 均已通过。正式 publication review：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV36-PUBLICATION-2026-07-04.md`。

Hermes 必须 ACK exact revision，运行 project-owned deploy/verifier/status gates，并仅通过 launcher 创建一个 fresh `revid-dispatcher` card。Dispatcher 原子创建且只创建一个 `revid-backend / IMPLEMENT_AND_TEST_ONLY` child，然后立即完成。Executor 只修改 `backend/tests/test_migration_tool.py` 和 rev36 PLAN/PROGRESS/REPORT，停止于 `UNIT_C3_FAILURE_LIFECYCLE_REPORT_READY_REV36`。Reviewer、HANDOFF、下一 revision 与 T4-010 Unit B 均未授权。

## 2026-07-04 T4-010 Unit B Revision 35 Diagnostic Reviewed

Revision `phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35` remains terminal `PMC_BLOCKED / STILL_INFRA_BLOCKED`. Fresh diagnostic `ai/reports/DIAGNOSTIC-T4-010-REV35-RUNTIME-HEALTH-2026-07-04.md` has SHA256 `178F92872FBC86A58B85272A746A579F7E025E677CBC12EB9894903B5ED71931` and cannot identify the worker exit code、termination source、stdout/stderr、stack 或 exception；也没有 same-profile terminal smoke。PMC therefore rejects Unit B continuation. Formal review: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV35-2026-07-04.md`.

```text
PMC Reconciliation Required: NO — ACKNOWLEDGED
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION
Expected Hermes Action: NONE — TERMINAL VERDICT ACKNOWLEDGED
Runtime Diagnostic SLA: SATISFIED — diagnostic verdict STILL_INFRA_BLOCKED
Resume Condition: fresh runtime remediation captures worker exit/output/exception evidence and a bounded revid-frontend same-profile smoke reaches an explicit terminal transition
```

Hermes must ACK terminal STOP and must not retry, redispatch, claim, promote, unblock, reparent, delete or reuse revision 35 cards/keys. No Unit B continuation, business REWORK, Reviewer or HANDOFF is authorized. After STOP closure, the next business Queue is the already Human-authorized T4-002 Unit C3 revision 36.

## 2026-07-04 T4-010 Unit B Revision 35 Publication

PMC 已 stage-accept Unit A revision 34，并发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35`。Revision 31/32/33 cards 与 revision 34 cards/runs/artifacts 保持 terminal historical evidence，不得 retry、claim、promote、unblock、reparent、删除或复用。Revision 35 继承 rev31/rev32/rev33 failure fingerprints。正式审查与授权：`ai/reviews/REVIEW-T4-010-PMC-UNIT-A-REV34-ACCEPTANCE-AND-UNIT-B-REV35-AUTHORIZATION-2026-07-04.md`。

Hermes Supervisor 必须先 ACK exact revision，运行 project-owned deploy/verifier gate，然后仅通过 launcher 创建一个 fresh `revid-dispatcher` card。Dispatcher 只能创建一个 `revid-frontend` `IMPLEMENT_AND_TEST_ONLY` child；Executor 只执行 Unit B Task 规定的 browser、responsive、keyboard、ARIA、console/network 与 visual evidence closure，只有真实 browser defect 才允许在五个 Workspace Allowed Business Files 内做最小修复。完成后停止于 `T4_010_UNIT_B_BROWSER_REPORT_READY`；Independent Reviewer、HANDOFF 与任何下一 Queue 均未授权。

## 2026-07-04 T4-010 Unit A Revision 34 Publication（stage completed, not executable）

PMC 曾发布 executable Queue `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-04-34`；该 revision 已完成并由 PMC stage-accept，现不再 executable。Revision 31/32/33 及其 cards、runs、artifact paths 与 idempotency keys 保持 terminal historical evidence，不得 retry、claim、promote、unblock、reparent、删除或复用。Revision 34 继承全部三条 failure fingerprints。正式授权：`ai/reviews/REVIEW-T4-010-PMC-UNIT-A-REV34-AUTHORIZATION-2026-07-04.md`。

Hermes Supervisor 必须先 ACK exact revision，运行 project-owned deploy/verifier gate，然后仅通过 launcher 创建一个 fresh `revid-dispatcher` card。Exact child contract：`IMPLEMENT_AND_TEST_ONLY`、`revid-frontend`、`1800s`、`:execute:0`、Stop After `T4_010_UNIT_A_STATIC_BUILD_REPORT_READY`。Executor 只允许修改 Task 的五个 Allowed Business Files并写 Unit A PLAN/PROGRESS/REPORT；Browser、Reviewer、HANDOFF 与 Unit B 未授权。

## 2026-07-03 T4-010 Unit A Revision 33 Runtime Block

Revision `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33` is terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`. Dispatcher `t_24283338` completed, but Executor `t_6e1e84d0` inherited Dispatcher-only Stop After and dispatch idempotency and ran with `120s` rather than the authorized `1800s`. Runs `#150` and `#151` timed out at 121s; canonical Unit A PLAN/PROGRESS/REPORT, Independent REVIEW and HANDOFF are absent. Formal advisory: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV33-2026-07-03.md`.

```text
PMC Reconciliation Required: NO — ACKNOWLEDGED
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV33_EXECUTOR_CHILD_CONTRACT_INVALID_120S_DISPATCH_PAYLOAD
Expected Hermes Action: NONE — TERMINAL VERDICT ACKNOWLEDGED
Resume Condition: fresh Codex PMC revision with inherited fingerprints and corrected dispatcher child contract
```

Hermes submitted the `READY_FOR_CONTINUATION` addendum; PMC then fixed full-document status validation, rebuilt the canonical status and verified rev33 `STATUS_OK`. The former structure conflict is closed. Closure evidence: `ai/reviews/REVIEW-T4-010-PMC-UNIT-A-REV34-AUTHORIZATION-2026-07-04.md`.

## 2026-07-03 T4-010 Unit A Revision 33 Publication（terminal historical, not executable）

PMC 发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33`。Revision 31/32 及其 cards、runs、artifact paths 和 idempotency keys 保持 terminal historical evidence，不得 retry、claim、promote、unblock、reparent、删除或复用。正式授权：`ai/reviews/REVIEW-T4-010-PMC-UNIT-A-REV33-AUTHORIZATION-2026-07-03.md`。

Hermes Supervisor 必须先 ACK exact revision，并执行：

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

随后只允许通过 project launcher 创建一个 fresh `revid-dispatcher` card：

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33" \
  --task-id "T4-010-UNIT-A" \
  --task-path "ai/tasks/todo/TASK-T4-010-UNIT-A.md" \
  --executor-profile "revid-frontend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-010 Unit A: Dispatcher - static and build closure revision 33" \
  --idempotency-key "revid:phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33:T4-010-UNIT-A:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

Dispatcher 必须 atomically 创建且只创建一个 `revid-frontend` `IMPLEMENT_AND_TEST_ONLY` child，idempotency 为 `revid:phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33:T4-010-UNIT-A:execute:0`，max runtime `1800s`，at most one process retry。它必须 read-back 校验 assignee、parent、revision、Task path、body、runtime、retry 与 idempotency，然后立即完成。

Executor 只允许修改 Task 的五个 Allowed Business Files，并只写 Unit A PLAN、PROGRESS、REPORT。它必须使用 project-root artifact paths，禁止写 `frontend/ai/`；完成 static/build verification 后停止于 `T4_010_UNIT_A_STATIC_BUILD_REPORT_READY`。Browser、Reviewer、HANDOFF 与 Unit B 均未授权。

## 2026-07-03 T4-010 Revision 32 Runtime Block

Revision `phase4-wave3-workspace-shell-continuation-2026-07-03-32` is terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`. Executor `t_6837871b` exhausted the iteration budget in run `#147`, then entered `gave_up` in run `#148`. Hermes diagnostic verdict is `STILL_INFRA_BLOCKED`; it does not prove canonical artifact-root handling or bounded same-profile execution viability. Preserve all partial work for ownership audit, but do not treat it as `REPORT_READY`. Formal diagnostic review: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV32-2026-07-03.md`.

Hermes terminal confirmation 已通过 project-owned deterministic reconciler 收口：Active Queue 的 Task/Queue hash、terminal Action、Queue Status、diagnostic 与同 revision/fingerprint confirmation 原子一致。旧 ad-hoc verifier 与每轮 due refresh 已被禁止。正式 regression review：`ai/reviews/REVIEW-T4-010-PMC-REV32-EXECUTION-STATUS-REGRESSION-2026-07-03.md`；根因修复计划与进度：`ai/runtime/PLAN-PROGRESS-HERMES-STATUS-RECONCILIATION-2026-07-03.md`。

```text
PMC Reconciliation Required: NO — ACKNOWLEDGED
PMC Verdict Revision: phase4-wave3-workspace-shell-continuation-2026-07-03-32
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS
Runtime Diagnostic Verdict: STILL_INFRA_BLOCKED
Expected Hermes Action: NONE — TERMINAL VERDICT ACKNOWLEDGED
Resume Condition: fresh runtime remediation evidence proves canonical project-root artifact handling, bounded same-profile execution viability, no active rev32 worker, and a safe continuation design preserving rev31 and rev32 fingerprints
```

## 2026-07-03 T4-010 Revision 32 Fresh Continuation（terminal historical）

PMC 已独立复核真实 `revid-dispatcher / DISPATCH_ONLY` same-profile smoke、UTF-8-safe verifier、19 tests、旧 card terminal 状态与 Allowed Files ownership。Revision 31 保持 terminal evidence；现发布唯一 fresh continuation `phase4-wave3-workspace-shell-continuation-2026-07-03-32`。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-CONTINUATION-AUTHORIZATION-REV32-2026-07-03.md`。

The former continuation reconciliation was ACKed and is superseded by the revision 32 runtime-block signal above. It is historical authorization only and is not executable.

## 2026-07-02 T4-010 Revision 31 Runtime Block

Revision `phase4-wave3-workspace-shell-2026-07-02-31` 已被 Hermes ACK，但 Coordinator `t_2e03b521` run `#141` 在创建 Executor 前因 `ROLE_BOUNDARY_VIOLATION` terminal。Stable fingerprint：`REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`。本 Queue 现为 `BLOCKED / NOT EXECUTABLE`；不得 retry、重派、复用旧 card/idempotency key 或创建 replacement revision。正式 advisory：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV31-2026-07-02.md`。

Hermes 于 2026-07-03 提交 fresh diagnostic 并声明 `READY_FOR_CONTINUATION`。PMC 接受 direct `kanban_create` 的 least-privilege 方向，但报告没有 source remediation、regression、部署 verifier 或实际 same-profile smoke，因此 continuation 结论不成立。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV31-2026-07-03.md`。下一证据必须证明修复已实际实现、部署并完成 smoke，而不是只描述预期做法。

Hermes 后续声明 fix 已实现且 verifier 全部通过。PMC fresh rerun 结果为 19 tests pass、deploy/verifier exit `1`、实际 same-profile smoke 缺失；status 还改写 stable fingerprint、使用非 canonical owner state/action type，并要求 PMC 删除 terminal card。结论为 `PMC_BLOCKED — FIX VERIFICATION FAILED / STATE_CONFLICT`。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-FIX-VERIFICATION-REV31-2026-07-03.md`。

```text
PMC Reconciliation Required: NO — SUPERSEDED BY REV32 CONTINUATION
PMC Verdict Revision: phase4-wave3-workspace-shell-2026-07-02-31
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED
Remediation Authorized: YES — runtime evidence/remediation only; business execution remains forbidden
Runtime Diagnostic Verdict: FIX_VERIFICATION_FAILED
Runtime Remediation Authorized: YES — direct kanban_create path, terminal remains forbidden
Expected Hermes Action: NONE FOR REV31 — ACK FRESH REV32 INSTEAD
Resume Condition: UTF-8-safe verifier exit 0, real entry-point fail-closed regressions, and actual same-profile synthetic smoke
```

## 2026-07-02 T4-010 Revision 31 Publication（historical）

T4-002 revision `-30` terminal reconciliation 已由 Hermes 确认，`PMC Action Required = NO`。PMC 当时发布 revision `phase4-wave3-workspace-shell-2026-07-02-31`。该授权现已被上方 runtime block 取代，不再 executable。

## 2026-07-02 Unit C3 Revision 30 Terminal Reconciliation

Revision `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30` 保持 terminal `PMC_BLOCKED`，且没有 executable T4-002 authorization。Hermes execution status 已设置 `PMC Action Required = NO`；正式 reconciliation：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-RECONCILIATION-2026-07-02.md`。

```text
PMC Reconciliation Required: NO — ACKNOWLEDGED
PMC Verdict Revision: phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED
Remediation Authorized: NO
Expected Hermes Action: NONE — TERMINAL VERDICT ACKNOWLEDGED
Resume Condition: fresh Human Owner authorization for a new bounded remediation that preserves all inherited fingerprints and existing hard gates
```

Hermes 已完成 terminal verdict confirmation。不得把 revision `-30` ACK 为 executable、创建新 card、进入 Independent Review/HANDOFF、重试或复用旧 chain。

## 2026-07-01 Unit C3 Revision 30 Publication

Human Owner 批准的 bounded correction revision `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30` 已执行并进入 terminal `PMC_BLOCKED`。PMC audit 证明 FK-restoration-equivalent state 未被 regression 观察，helper 不能保证 failure path 恢复 FK checks，resource-close failures 仍被静默吞掉。Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-BLOCKED-2026-07-01.md`。当前没有 executable authorization。

## 2026-07-01 Unit C3 Revision 29 PMC Blocked

Revision `-29` reached `REPORT_READY`, but PMC source/diff audit found that orphan deletion remains after validation/assertion inside the main `try` body; the `finally` block closes resources without deleting `q-orphan`. The new non-MySQL regression observes mocked resource closure rather than the actual deletion cleanup lifecycle/state. Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`. The revision is terminal and there is no executable authorization.

## 2026-07-01 Unit C3 Rework and Remediation Publication

Unit C3 revision `-27` is terminal `PMC_REWORK`: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV27-REWORK-2026-07-01.md`. Revision `-28` reached `REPORT_READY`, but PMC source audit found that AC4 orphan cleanup still does not execute when migration, validation or assertion fails. Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV28-BLOCKED-2026-07-01.md`. Both revisions' cards and keys are immutable evidence and must not be reused. There is currently no executable authorization.

## 2026-06-30 Credential Rotation and 26r2 Publication（completed）

Human Owner completed the shared Agnes/APIHub credential rotation. All five profile fields are non-empty, internally matching and share a new fingerprint; `revid-pm` live probe returned `CREDENTIAL_OK`. Runtime deploy/verifier and update durability gates pass. Revision `26r2` completed and is now historical evidence.

## 2026-06-30 Update Durability Blocker

Runtime `PMC_PASS` is temporarily superseded by `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-BLOCKED-2026-06-30.md`. Hermes update autostashed the local runtime enforcement and a stale Desktop bundle conflict prevented clean restoration. The Active Wave remains `BLOCKED / NOT EXECUTABLE`; no Hermes schedule or replacement revision is authorized until conflict resolution, repeatable post-update deployment, fresh tests/smokes, Gateway reload, and credential rotation all pass.

Resolution: update durability is `PMC_PASS` in `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-PASS-2026-06-30.md`; 34 invalid/obsolete cards were archived under Human Owner authorization. The Queue remains non-executable only until shared Agnes/APIHub credential rotation is confirmed. Archive does not clear any failure fingerprint.

## 2026-06-30 Runtime Remediation Verdict

Hermes role-contract hardening is `PMC_PASS` and runtime status is `READY_FOR_CONTINUATION`: `ai/reports/REPORT-HERMES-ROLE-CONTRACT-HARDENING-2026-06-30.md` and `ai/reviews/REVIEW-T4-002-PMC-HERMES-ROLE-CONTRACT-HARDENING-PASS-2026-06-30.md`.

Historical note: at the time of revision `26r1`, the Active Wave remained `BLOCKED / NOT EXECUTABLE`. Revision `26r1` and card `t_f46c8d6e` remain terminal evidence. This historical text is not current authorization.

T4-010 Unit B revision `-41r1` 与 `-40`/`-39`/`-38`/`-35`、revision `-34`/`-33`/`-32`/`-31`、runtime revision 37、T4-002 revision `-30`/`-29` 均为 terminal historical evidence；Hermes scheduled mode 不得 retry、claim、promote、unblock、reparent、删除或复用任何历史 chain。T4-002 revision 36 已在 ACK 前 supersede。当前授权只来自下方唯一 `## Active Wave` 表。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2` |
| Status | `BLOCKED - NOT EXECUTABLE / RUNTIME OWNER STALLED` |
| Approved By | `Codex Project Master Controller` |
| Approval Source | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-FINALIZATION-REMEDIATION-REV47R1-2026-07-09.md` |
| Approval Time | `2026-07-09T23:59:00+08:00` |
| Task ID | `T4-003` |
| Project Task File | `ai/tasks/todo/TASK-T4-003.md` |
| Task SHA256 | `A78FBB1C5E26561BEFF9118482C1F3FCE5A33612051AC6AD983396D29E0B605B` |
| Action | `NONE — terminal evidence only` |
| Executor Profile | `revid-backend` |
| Review Profile | `NONE - not authorized in rev47r2` |
| Dispatch Profile | `revid-dispatcher` |
| Parallel Group | `serial-phase4-wave2-t4-003-rev47r2` |
| Attempt Policy | `terminal runtime diagnostic reviewed and runtime owner stalled; no redispatch; no further automatic rework; no Reviewer/HANDOFF until runtime action-injection remediation returns fresh proof` |
| Previous Failure Fingerprint | `REV47_MYSQL_ENGINE_REFERENCE_AND_ACCEPTANCE_GATES_FAILED; REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT; REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED` |
| Hard Gates | `do not redispatch rev47r2; do not reuse rev47/rev47r1/rev47r2 cards; do not modify business code; no .env reads; no secret output; no destructive revid_db operation; return fresh runtime remediation proof only` |
| Coordinator Budget | `300s` |
| Executor Budget | `1800s` |
| Dispatcher Idempotency Key | `revid:phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2:T4-003:dispatch` |
| Executor Idempotency Key | `revid:phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2:T4-003:execute:1` |
| Allowed Report Output | `ai/reports/REPORT-T4-003-REV47R2.md` |
| Stop After | `REV47R2_ACTION_INJECTION_REMEDIATION_DIAGNOSTIC_READY_OR_STALLED` |
| Expected Hermes Action | `ACK_RUNTIME_OWNER_STALLED_OR_RETURN_FRESH_REMEDIATION_DIAGNOSTIC` |
| Runtime Diagnostic | `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-2026-07-10.md` |
| Runtime Diagnostic SHA256 | `B54D120B5680083CE1797290FA0ECF4E20669870BEBA80C5795C52E38DD83271` |
| Runtime Diagnostic Verdict | `STILL_INFRA_BLOCKED` |
| Expected Fresh Diagnostic | `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-REMEDIATION-2026-07-10.md` |
| PMC Review | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R2-2026-07-10.md` |
| PMC Review SHA256 | `C21260B304C1DB12BCE3B44C2601992D5E4DA4B6B6E58B6BA9229918FBD27E30` |
| PMC Diagnostic Review | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R2-2026-07-10.md` |
| PMC Diagnostic Review SHA256 | `D8B5034156A8F0CBE2C2C4884D630EEDEDA33F652ED5A2EED896DC0F2DA70A6F` |
| PMC Stalled Review | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-OWNER-STALLED-REV47R2-2026-07-10.md` |
| PMC Stalled Review SHA256 | `FDEAC65DD0141E99149567AD49EF63BB19BDD197945A0D090183A0009C5669D2` |
## Revision 32 Workspace Shell Continuation Authorization（terminal historical, not executable）

Before ACK, Hermes must normalize `HERMES-EXECUTION-STATUS.md` to canonical state/action fields, preserve the exact inherited fingerprint, and remove the stale `→ FIXED` claim. Before card creation, Supervisor must run:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one fresh `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave3-workspace-shell-continuation-2026-07-03-32" \
  --task-id "T4-010" \
  --task-path "ai/tasks/todo/TASK-T4-010.md" \
  --executor-profile "revid-frontend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-010: Dispatcher - Workspace shell continuation revision 32" \
  --idempotency-key "revid:phase4-wave3-workspace-shell-continuation-2026-07-03-32:T4-010:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

Dispatcher must directly use `kanban_create` and atomically create exactly one `revid-frontend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave3-workspace-shell-continuation-2026-07-03-32:T4-010:execute:0`, max runtime `1800s`, `max_retries=2`, and the exact Task contract. `terminal` remains forbidden. It must read-back validate child assignee, parent, revision, body, runtime, retry and idempotency, then complete immediately.

Executor may modify only Task Allowed Files, write only REV32 PLAN/PROGRESS/REPORT and `ai/evidence/T4-010/rev32/`, run the required build and real-browser checks, and stop at `T4_010_WORKSPACE_SHELL_REPORT_READY_REV32`. Reviewer/HANDOFF creation is not authorized.

## Revision 31 Workspace Shell Authorization（terminal historical）

Before ACK or card creation, Supervisor must run:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one fresh `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave3-workspace-shell-2026-07-02-31" \
  --task-id "T4-010" \
  --task-path "ai/tasks/todo/TASK-T4-010.md" \
  --executor-profile "revid-frontend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-010: Dispatcher - Workspace shell revision 31" \
  --idempotency-key "revid:phase4-wave3-workspace-shell-2026-07-02-31:T4-010:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

Dispatcher atomically creates exactly one `revid-frontend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave3-workspace-shell-2026-07-02-31:T4-010:execute:0`, max runtime `1800s`, `max_retries=2`, and the exact Task contract. It must read-back validate child assignee、parent、revision、body、runtime、retry 与 idempotency，随后立即完成。

Executor 只修改 Task Allowed Files，完成 build、1440/920/375 browser interaction、console/network/overflow 检查与 screenshot evidence，写 REV31 PLAN、PROGRESS、REPORT，并停止于 `T4_010_WORKSPACE_SHELL_REPORT_READY_REV31`。不得修改 Canvas/API/backend contract，不得创建 Reviewer/HANDOFF 或下一 Task。

Historical publication verification: exactly one Active Wave had `Status = APPROVED — WAITING_FOR_HERMES_ACK`; Task/revision/action/profile/idempotency/Stop After markers matched; launcher `--dry-run` exit `0` and produced exact `Action: DISPATCH_ONLY`, `revid-frontend`, `120s`, `max-retries=2`, fresh idempotency and `--json` command without creating a card; `git diff --check` passed.

## Revision 30 Bound AC4 Failure Cleanup Authorization（terminal PMC_BLOCKED, not executable）

Revision `-29` and revision `-30` are terminal evidence and must not be reused. The historical contract below must not be ACKed or executed again:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one fresh `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C3-REV30.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C3 revision 30 bound AC4 failure cleanup" \
  --idempotency-key "revid:phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

The Dispatcher atomically creates exactly one `revid-backend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30:T4-002:execute:0`, max runtime `1800s`, `max_retries=2`, and the exact revision `-30` Task contract. It validates persisted parent/profile/revision/body/runtime/retry/idempotency and completes immediately.

Executor may modify only `backend/tests/test_migration_tool.py` and create only the revision `-30` PLAN、PROGRESS、REPORT. The real AC4 test and non-MySQL regression must call the same cleanup lifecycle; the injected failure must prove deletion-equivalent state, FK restoration and visible cleanup failure semantics. After the five real-MySQL selectors, stop at `UNIT_C3_AC4_FAILURE_CLEANUP_REPORT_READY_REV30`.

Any deploy/verifier/Action/profile/evidence/database/cleanup/security mismatch is `BLOCKED` without fallback. Do not reuse revision `-27`/`-28`/`-29` cards or keys, modify `backend/scripts/migrate_sqlite_to_mysql.py`, create Reviewer/HANDOFF, or dispatch another revision.

## Revision 29 AC4 Cleanup Correction Authorization（terminal PMC_BLOCKED, not executable）

Dispatcher `t_6e210cce` and Executor `t_77c46dc4` completed the authorized execution stage. The REPORT's six passing commands do not satisfy the failure-path cleanup Hard Gate. Do not ACK again, dispatch, retry, claim, promote, unblock, reparent, create Reviewer/HANDOFF or reuse revision `-29` cards/keys. The original authorization below is retained only as historical contract evidence.

Before ACK or card creation, Supervisor must run:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one fresh `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C3-REV29.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C3 revision 29 AC4 cleanup correction" \
  --idempotency-key "revid:phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

The Dispatcher atomically creates exactly one `revid-backend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29:T4-002:execute:0`, max runtime `1800s`, and the exact revision `-29` Task contract. It validates persisted parent/profile/revision/body/runtime/idempotency and completes immediately.

Executor may modify only `backend/tests/test_migration_tool.py` and create only the revision `-29` PLAN、PROGRESS、REPORT. It must run the non-MySQL failure-path cleanup regression before the five real-MySQL selectors and stop at `UNIT_C3_AC4_CLEANUP_REPORT_READY_REV29`.

Any deploy/verifier/Action/profile/evidence/database/cleanup/security mismatch is `BLOCKED` without fallback. Do not reuse revision `-27`/`-28` cards or keys, modify `backend/scripts/migrate_sqlite_to_mysql.py`, create Reviewer/HANDOFF, or dispatch another revision.

Publication verification: exactly one Active Wave has `Status = APPROVED — WAITING_FOR_HERMES_ACK`; Task/revision/action/profile/idempotency/retry/Stop After markers match; revision `-29` REPORT、Independent REVIEW 与 HANDOFF 尚不存在；launcher `--dry-run` produced the exact Dispatcher body and created no card.

## Revision 28 Unit C3 Remediation Authorization（terminal PMC_BLOCKED, not executable）

Dispatcher `t_d11673a6` and Executor `t_670af729` completed the authorized business stage. The REPORT's five passing selectors do not satisfy final evidence requirements because AC4 cleanup remains outside an outer failure-safe `try/finally`. Do not ACK again, dispatch, retry, claim, promote, unblock, reparent, create Reviewer/HANDOFF or reuse revision `-28` cards/keys. The original authorization below is retained only as historical contract evidence.

Before ACK or card creation, Supervisor must run:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C3-REV28.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C3 revision 28 integrity remediation" \
  --idempotency-key "revid:phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

The Dispatcher atomically creates exactly one `revid-backend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28:T4-002:execute:0`, validates persisted parent/profile/revision/body/runtime, and completes immediately. It must not run tests, access the database, write artifacts, wait for the Executor, reuse any old card/key or create Reviewer/HANDOFF.

Executor follows the exact revision 28 Task, modifies only the two Allowed business files, runs the required targeted checks and five real-MySQL selectors, writes only revision 28 PLAN/PROGRESS/REPORT and stops at `UNIT_C3_REMEDIATION_REPORT_READY_REV28`. Any deploy/verifier/Action/profile/evidence/database/cleanup/security mismatch blocks without fallback.

## Revision 27 Unit C3 Verification（terminal PMC_REWORK, not executable）

Dispatcher `t_ff560e29` and Executor `t_d97dcb15` completed the authorized read-only stage. The five selectors returned `1 PASS / 4 FAIL / 1 ERROR`; formal verdict and stable fingerprint are recorded in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV27-REWORK-2026-07-01.md`. Do not ACK, dispatch, retry, claim, promote, unblock, reparent, delete or reuse revision `-27` cards/keys. Do not create its Independent Reviewer or HANDOFF.

## Revision 26r2 Review Lifecycle Authorization（completed, not executable）

Coordinator `t_ec30ad12`, Reviewer `t_bcbc25b7` and HANDOFF `t_c481b6ad` completed. Codex PMC verdict is `PMC_PASS` in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-PASS-2026-07-01.md`. The former authorization below is retained only as historical contract evidence and must not be ACKed or executed again.

## Revision 26r1 Review Lifecycle Authorization（terminal, not executable）

Coordinator `t_f46c8d6e` run `#126` persisted `Action: DISPATCH_ONLY` instead of the authorized `REVIEW_DISPATCH_ONLY`, then timed out at `121s > 120s`, exhausted process retry `1/1` and created no Reviewer/HANDOFF child. Revision `-26r1` is terminal `INFRASTRUCTURE_BLOCKED`; do not ACK again, redispatch, retry, claim, promote, unblock, reparent, delete, archive or reuse its card/key.

Formal PMC verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV26R1-2026-06-30.md`. The authorization below is retained as historical contract evidence only and must not be executed. No replacement revision is approved until fresh role-contract tests, profile deployment, isolated smokes and a runtime owner `READY_FOR_CONTINUATION` report satisfy the advisory.

Revision `-26` business execution reached `REPORT_READY`. Dispatcher `t_c14aa473` and Executor `t_9f24648e` are evidence inputs only and must not be retried, claimed, promoted, unblocked, reparented or reused.

PMC inspected the Task, REPORT and actual Allowed Files diff in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-REVIEW-LIFECYCLE-2026-06-29.md`. The implementation is eligible for Independent Review; this is not PMC PASS.

Hermes Supervisor must ACK this exact Queue revision, then create exactly one fresh `revid-pm` stage card with:

- standalone `Action: REVIEW_DISPATCH_ONLY`;
- revision `phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1`;
- Task path `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md`;
- Executor evidence card `t_9f24648e` and REPORT `ai/reports/REPORT-T4-002-UNIT-C2-REV26.md`;
- idempotency `revid:phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1:T4-002:review-dispatch`;
- max runtime `120s`, at most one process retry.

The stage reads only the named evidence and creates exactly:

1. One `revid-reviewer` card with idempotency `revid:phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1:T4-002:review:0`, max runtime `1800s`, and the review contract in the Task.
2. One dependent `revid-pm` card with standalone `Action: HANDOFF_ONLY`, idempotency `revid:phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1:T4-002:handoff:0`, max runtime `120s`, and the Reviewer as its parent dependency.

After persisted ID, assignee, parent, revision, body and idempotency checks, the review-dispatch stage completes immediately. It must not run tests, write REVIEW/HANDOFF, modify business or Executor files, wait for workers, or create any additional card.

The Reviewer independently runs the Task's four unit selectors and four real disposable-MySQL selectors, audits REPORT/diff/test semantics and writes only `ai/reviews/REVIEW-T4-002-UNIT-C2-REV26.md`. It must distinguish mocked unit tests from real MySQL verification, prove cleanup and database identity, inspect stale-same/stale-diff/rollback/report-field semantics, and return exactly PASS, REWORK or BLOCKED.

The `HANDOFF_ONLY` stage writes only `ai/handoffs/HANDOFF-T4-002-UNIT-C2-REV26-POST-REVIEW.md`, and only after Reviewer PASS plus revision/attempt/card/evidence consistency checks. Any non-PASS verdict or evidence mismatch blocks the stage without HANDOFF_READY.

No Unit C3, Units D-E, T4-003, T4-010, business re-execution, code change or new revision is authorized. Stop at `UNIT_C2_HANDOFF_READY_REV26` for Codex PMC final acceptance.

Historical publication verification: at publication time exactly one Active Wave had `Status = APPROVED`; Queue/Task/revision/action/profile/idempotency/Stop After markers were consistent; expected Independent REVIEW and canonical HANDOFF were absent before execution; `git diff --check` passed.

## Revision 26 Atomic Dispatch Authorization（historical, REPORT_READY, not executable）

Revision `-25` remains terminal infrastructure evidence. Dispatcher `t_cc15e296` and child `t_25ac2145` must not be retried, claimed, promoted, unblocked, reparented, deleted, archived or reused.

PMC accepted the future-chain runtime remediation in `ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md` and authorized this continuation in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-CONTINUATION-APPROVAL-2026-06-29.md`.

Hermes Supervisor must ACK this exact Queue revision before creating any card. It then creates exactly one fresh `revid-dispatcher` card through:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --revision "phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C2 revision 26 AC3 remediation (atomic)" \
  --idempotency-key "revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

No direct `hermes kanban create`, old card reuse, alternate idempotency key, shell-composed body or fallback launcher is authorized. Launcher non-zero exit or persisted-body mismatch means `INFRASTRUCTURE_BLOCKED` without creating another card.

The Dispatcher reads only `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md` and creates exactly one `revid-backend` child with its current card as the only parent, idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26:T4-002:execute:0`, max runtime `1800s` and at most one process retry.

The installed runtime must atomically commit child create/link, Dispatcher completion and child promotion. The Dispatcher must exit after the durable terminal transition without a follow-up model call. Any timeout, contract mismatch, duplicate/extra child, non-atomic topology or unexpected state is `INFRASTRUCTURE_BLOCKED`; no automatic revision `-27`, budget increase or alternate chain is authorized.

The Executor may modify only the two business files and create only the three rev26 artifacts listed in the Task. It must run the Task's exact verification in order and stop after REPORT_READY. Reviewer and HANDOFF creation are forbidden until a new PMC lifecycle decision.

Publication verification: launcher `--dry-run` returned the exact standalone `Action: DISPATCH_ONLY`, revision, Task path, profile, fresh idempotency key, `120s` budget and `--max-retries 1`; no card was created. Queue/Task consistency and `git diff --check` passed before this final Queue write.

## Revision 25 Dedicated Dispatcher History（terminal, not executable）

Revision `-24` is terminal infrastructure evidence. Coordinator `t_53630896` and run `#121` must not be retried, unblocked, deleted, archived or reused.

Revision `-25` is now terminal infrastructure evidence. Dispatcher `t_cc15e296` run `#122` timed out at `121s > 120s`, exhausted process retry `1/1` and `gave_up`. It created child `t_25ac2145`, but did not complete required read-back validation; the child remains `todo` with no run and cannot continue through its blocked parent. Rev25 PLAN, PROGRESS, REPORT, Independent REVIEW and HANDOFF are absent.

Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV25-2026-06-29.md`. This Queue entry is historical and non-executable. Do not retry, claim, promote, unblock, reparent, delete or reuse either card. At that incident checkpoint no revision `-26` or budget increase was authorized; this statement is superseded only by the fresh revision `-26` authorization above. The original revision `-25` authorization below is retained only as incident evidence and must not be executed.

Subsequent runtime remediation is accepted in `ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md`: future `DISPATCH_ONLY` child creation, parent completion and child promotion commit atomically, and the agent loop exits after the durable terminal transition. This does not reactivate revision `-25` and does not make this Queue executable. A continuation requires a fresh PMC revision, Task and keys.

Supervisor creates exactly one fresh `revid-dispatcher` card through the project launcher using `--coordinator-profile "revid-dispatcher"`, idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25:T4-002:dispatch` and max runtime `120`.

The Dispatcher reads only `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV25.md`, creates and read-back validates exactly one `revid-backend` child, then completes immediately. It must not run tests, inspect broad project state, write files, wait for Executor or perform Reviewer/HANDOFF lifecycle work.

The Executor child uses idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25:T4-002:execute:0` and max runtime `1800s`. Any Dispatcher timeout or contract mismatch returns `INFRASTRUCTURE_BLOCKED`; no automatic rev26 or budget increase is authorized.

## Revision 24 Transport-Fixed Authorization

Revision `-23` is terminal infrastructure evidence. Coordinator `t_1dea37a2` and run `#120` must not be deleted, archived, retried, unblocked or reused. Raw cron tool-call evidence shows the Supervisor explicitly passed `--body "@...REV23.md"` after an unsafe Bash→PowerShell command failed; the active cause is not CLI truncation of a complete body.

Formal runtime verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV23-2026-06-29.md`.

Supervisor must create the rev24 Coordinator only with:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --revision "phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C2-REV24.md" \
  --executor-profile "revid-backend" \
  --title "T4-002: Coordinator — Unit C2 revision 24 AC3 remediation" \
  --idempotency-key "revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24:T4-002:coordinate" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

No direct `hermes kanban create`, nested PowerShell, shell multiline `--body`, or task-reference-only fallback is authorized. Launcher non-zero exit or persisted-body mismatch means `INFRASTRUCTURE_BLOCKED` without creating another card/key.

The Coordinator may create exactly one `revid-backend` child with idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24:T4-002:execute:0`, max runtime `1800s`, and the exact rev24 Task contract.

## Revision 23 AC3 Remediation History（terminal, not executable）

Revision `-22` completed its authorized verification and is terminal `PMC_REWORK`: AC1/AC2/AC5 passed, AC3 failed with fingerprint `AC3_STALE_SAME_DUPLICATE_INSERT`. Formal closure: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV22-REWORK-2026-06-29.md`.

Revision `-23` originally authorized one fresh `revid-pm` Coordinator and one `revid-backend` child with the following contract; the authorization is now terminal historical evidence and must not be executed:

- Parent: current rev23 Coordinator.
- Max runtime: `1800s`.
- Idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23:T4-002:execute:0`.
- Allowed business files: `backend/scripts/migrate_sqlite_to_mysql.py`, `backend/tests/test_migration_tool.py`.
- Required outcome: bounded fix, targeted unit evidence and real disposable-MySQL AC1/AC2/AC3/AC5 results.
- Persisted body must explicitly say business files are writable only within the bounded rev23 scope, list the three allowed Executor artifacts, require the Task verification commands and forbid Reviewer/HANDOFF.

Coordinator idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23:T4-002:coordinate`.

Coordinator must read the child back and verify assignee, parent, revision, body, idempotency and max runtime before completion. A mismatch is `COORDINATOR_CHILD_CONTRACT_INVALID`; block rather than execute or report success.

Revision `-22` cards `t_971a76d5` and `t_4f178d0c` are terminal evidence. Do not redispatch, retry, claim, promote, unblock or reuse them.

## Revision 22 Child Contract Correction

Revision `-21` Coordinator `t_14b8871f` 已证明 exact policy handoff 修复生效，但 child `t_689f993e` body 错误禁止 required tests，persisted runtime 也未固定为 1800s。该 child run `#116` 已回收并以 `COORDINATOR_CHILD_CONTRACT_INVALID` block；rev21 chain terminal，不得复用。

Revision `-22` 使用 `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV22.md` 的 exact child payload contract 与全新 idempotency keys。Coordinator 必须在完成前复核 child persisted body/runtime/retry/parent；不允许仅凭预期值写成功 summary。

## Revision 21 Publication

Supervisor body contract、runtime fail-closed 与 Windows multiline transport 已修复。Targeted regression `6 passed`；isolated positive Coordinator `t_11db1342` run `#2` 在 84s 内只创建 child `t_0896a51e` 并完成；missing-marker negative runs 在 0s、`worker_pid=null` 下 fail-closed。正式证据：`ai/reports/REPORT-HERMES-POLICY-HANDOFF-FIX-2026-06-29.md`。

Revision `-21` 曾发布并执行，现已 terminal。Human Owner 于 2026-06-29 确认旧 credential 已撤销并完成四个 Revid profiles 更新；Codex 以不读取 secret 的方式确认四个配置均在本轮更新且 credential fingerprint 一致，`revid-pm` live probe 返回 `CREDENTIAL_OK`。

## Revision 20 Terminal Evidence

Coordinator `t_1617a921` run `#114` 在 Executor dispatch 前 121s timeout，process retry `1/1` exhausted。Children 为空；Unit C2 PLAN、PROGRESS、REPORT、Independent REVIEW 与 HANDOFF 均不存在。

直接证据证明 Supervisor 创建的 card body 只有 Task path 引用，缺少 standalone `Action: DISPATCH_ONLY`。Hermes runtime 的 `_resolve_worker_allowed_tools()` 只解析 card body，不读取引用文件，因此未选择 exact policy；worker log 随后执行 `git status`、`hermes profile list`、`ls` 等 allowlist 外工具。

Revision `-20` 不得重派、复用、claim、promote、unblock 或 retry。本 Queue 不授权 revision `-21`。

正式 verdict：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV20-2026-06-28.md`。

## Revision 19 Terminal History

Coordinator `t_b493a47f` run `#113` 在 Executor dispatch 前因 `pid 30648 not alive` crash，process retry `1/1` exhausted。Executor、PLAN、PROGRESS、REPORT、Independent REVIEW 与 HANDOFF 均不存在。

Revision `-19` 不得重派、复用、claim、promote、unblock 或 retry。Fresh diagnostic 已由 PMC 审阅；后续 escalation 又因复用旧 smoke、未执行新 remediation 而在 `ai/reviews/REVIEW-T4-002-PMC-ESCALATION-REV19-2026-06-28.md` 被驳回。该历史 chain 保持 terminal；revision `-20` 使用新的 card 与 idempotency key。

## Runtime Remediation Update

PMC 已在 `ai/reviews/REVIEW-T4-002-PMC-HERMES-WORKER-FINALIZATION-FIX-PASS-2026-06-28.md` 验收 worker in-process finalization、retained-handle watcher、targeted tests 与 isolated 3+1 runtime evidence，结论为 `READY_FOR_CONTINUATION`。

PMC 已通过 `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV20-CONTINUATION-APPROVAL-2026-06-28.md` 发布 revision `-20`。Runtime PASS 不清零任何历史 fingerprint；Hermes 不得自行重派或复用旧 card。

Revision `-20` 暴露了新的 Supervisor → worker-policy handoff defect：runtime remediation 修复了 terminal finalization，但未覆盖 Supervisor 丢失 action marker 后的 unrestricted fallback。下一 revision 的前置条件是 Supervisor body contract 修复、missing/unknown action fail-closed regression、fresh scheduled-path smoke、execution status reconciliation 和 credential rotation confirmation。

## Historical Revision 20 Coordinator Contract（not executable）

Hermes Supervisor 只创建一个新的 `revid-pm` Coordinator，card body 必须包含独立一行：

```text
Action: DISPATCH_ONLY
```

Coordinator 必须读取精确 Task 文件，创建且只创建一个 `revid-backend` Executor child：

- Assignee：`revid-backend`
- Idempotency：`revid:phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20:T4-002:execute:0`
- Parent：本 Coordinator card
- Max runtime：1800s
- Scope：只执行 Task 指定的 four selectors，业务文件 read-only

完成真实 card ID、assignee、parent 与 revision 校验后立即完成 Coordinator。禁止运行 tests、访问 database、写 artifact、创建 Reviewer/HANDOFF、等待 Executor、复用旧 card 或修改 business files。

## Historical Revision 20 Executor Contract（not executable）

Executor 必须按 Task 顺序执行：

1. `test_ac1_dry_run_no_changes`
2. `test_ac2_full_migration_succeeds`
3. `test_ac3_idempotency`
4. `test_ac5_source_immutable`

只允许创建 Unit C2 PLAN、PROGRESS、REPORT。测试必须使用 runtime `REVID_TEST_MYSQL_ADMIN_URL` 和唯一 `revid_test_t4_002`；禁止读取 `.env`、输出 credential、触碰 `revid_db` 或修改 business files。任一 secret、identity、permission、cleanup 或 test-order hard gate 失败立即 BLOCKED。

Executor 完成 REPORT 后进入 terminal review-required 并停止。不得创建 REVIEW、HANDOFF 或其他 worker。

## Historical Review Lifecycle Gate

原 contract 约定在 `UNIT_C2_REPORT_READY_REV20` 后由 PMC 核对 REPORT，再决定是否发布 `REVIEW_DISPATCH_ONLY` lifecycle continuation。Revision `-20` 未到达该状态且已 terminal，本段仅作历史记录，不构成执行授权。

## Historical Chain Rules

- Unit C1 revision `-18` 与 lifecycle continuation `-18r1` 已 PMC PASS；cards `t_3bfbe611`、`t_b3cfb6ce`、`t_bd6172b7`、`t_8f3b60ff`、`t_b918a49e` 均不得复用或修改。
- `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18.md` 继续作为 premature/non-canonical evidence 保留。
- Revision `-19` chain 已 terminal；revision `-20` 是同一 business attempt 1 的 bounded continuation，不是 attempt 2，并继承 `REV19_COORDINATOR_CRASH`。

## Human Decision

Runtime 路线决策为 `NO`：不需要改变产品、schema contract 或 destructive authorization。安全事项为 `YES`：诊断 transcript 中出现的 credential 必须由 Human Owner 轮换并确认旧值失效。

*最后更新：2026-07-05；T4-010 Unit B revision `-39` terminal `PMC_BLOCKED`。唯一 executable Queue 为 revision `-40`，等待 Hermes ACK rev39 terminal verdict 与 fresh rev40。*
