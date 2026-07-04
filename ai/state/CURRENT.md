# Revid — 当前项目状态

## 2026-07-04 Hermes Exact Viewport and Screenshot Tools Deployed

Human Owner 授权 Codex 直接补齐 `revid-frontend` browser evidence capability。Hermes runtime 现新增 `browser_set_viewport(width,height)` 与非 vision-dependent `browser_screenshot(full_page=False)`；Frontend/Reviewer allowlist、SOUL、role verifier、tests 与 project-owned durable patch 已同步。真实 smoke 的 requested/actual viewport 与 PNG IHDR 均为 `375x812`；Hermes targeted tests `10 passed`、project runtime tests `33 passed`、`ROLE_CONTRACTS_OK`、patch classifier `APPLIED`、双 worktree diff check 通过。正式验收：`ai/reviews/REVIEW-HERMES-BROWSER-EVIDENCE-TOOLS-PASS-2026-07-04.md`。

用户计划重启电脑，Gateway restart 后新 worker 才加载新工具。Revision 39 已 terminal，但其旧 REPORT 使用 viewport override/CSS simulation 且缺少 screenshot files，不能因 runtime fix retroactively PASS；后续必须由 fresh revision 使用新工具生成三个精确 viewport 的真实证据。

## 2026-07-04 Revision 38 Closed / Revision 39 Browser Evidence Correction Published

PMC 已 read-back 接受 revision 38 terminal closure：Hermes status 使用精确 fingerprint `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`，状态为 `PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`，且 `PMC Action Required = NO / NONE`。此前 reconciliation state conflict 已关闭；revision 38 cards、runs、keys 与 artifacts 保持 terminal immutable。

缺口仅是 Unit B 三个精确 viewport 的真实 browser evidence，属于既有 Scope 内的普通证据质量问题，不需要 Human decision。PMC 发布 bounded evidence-only revision `phase4-wave3-workspace-shell-unit-b-browser-evidence-correction-2026-07-04-39`：五个 Workspace business files 全部 read-only，只允许 fresh PLAN/PROGRESS/REPORT 与 `ai/evidence/T4-010/unit-b/rev39/`。必须生成 `1440x900`、`920x900`、`375x812` screenshot 和结构化 viewport/overflow/console/network/geometry/interaction/accessibility/state evidence；发现真实 defect 时准确报告并停止，不在本 revision 修改代码。正式授权：`ai/reviews/REVIEW-T4-010-PMC-REV38-CLOSURE-AND-REV39-AUTHORIZATION-2026-07-04.md`。

## 2026-07-04 Revision 38 Full Terminal ACK Canonicalized

Codex PMC 发现首次 rev38 reconciliation 只更新 Action/hash/reconciliation row，仍残留 `State = REPORT_READY`、旧 inherited fingerprint、`PMC Action Required = YES / QUEUE_DECISION` 和失效 browser PASS 叙述，因此正确判为 `STATE_CONFLICT`。Reconciler 已补齐 business terminal STOP 的原子更新：`Execution State = PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`、failure fingerprint 为 `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`、PMC Action 为 `NO / NONE`，并规范化 status 表头、移除失效 PASS 叙述。

真实 read-back 为 `STATUS_OK`；targeted reconciler tests `10 passed`、全部 runtime tests `31 passed`、`ROLE_CONTRACTS_OK`。Revision 38 terminal closure 现与 Queue、PMC verdict 和 status 一致。下一次 Codex PMC checkpoint 应接受 closure，不得再次要求 Hermes 修改 rev38；后续仍需 fresh bounded Unit B browser-evidence revision。

## 2026-07-04 Revision 38 Reconciliation State Conflict

Hermes status 写入了 `Rev38 Reconciliation = ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`，但 current execution fingerprint 仍只有 rev31/rev32/rev33/rev35 历史值，同时继续保留 `REPORT_READY`、`PMC Action Required = YES / QUEUE_DECISION` 与 browser AC 全部通过的冲突声明；status 表头也不是有效 Markdown table。该 ACK 不满足同 revision、同 fingerprint、terminal STOP 的闭环要求。

PMC 维持 revision 38 terminal `PMC_BLOCKED`，fingerprint `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`，无 executable Queue。下方“Terminal Reconciliation Complete”记录已被本节 supersede。Hermes 只需纠正其 owned execution status；不得创建 card、retry、Reviewer、HANDOFF 或 replacement revision。正式审查：`ai/reviews/REVIEW-T4-010-PMC-REV38-RECONCILIATION-STATE-CONFLICT-2026-07-04.md`。

## 2026-07-04 Revision 38 Terminal Reconciliation Complete

Revision 38 的 Queue publication 缺陷已修复：canonical Active Wave `Action` 从 `DISPATCH_ONLY` 改为 `NONE — terminal evidence only`。Deterministic reconciler 现区分 runtime incident 与 business evidence block；terminal business block 无 Runtime Advisory 时可直接 STOP，runtime diagnostic-start 仍强制要求 advisory/diagnostic。真实状态已完成 `--check -> --apply -> --check`，结果为 `STATUS_MISMATCH -> STATUS_UPDATED -> STATUS_OK`；runtime tests `31 passed`，`ROLE_CONTRACTS_OK`。

Revision 38 当前 terminal `PMC_BLOCKED / NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`。不得创建 Reviewer、HANDOFF 或复用旧 card/key。项目仍缺少 T4-010 Unit B 三个指定 viewport 的真实 browser artifacts，因此 convergence gate 继续 blocked，等待 PMC 发布 fresh bounded evidence-only revision。

## 2026-07-04 Rev37 Runtime Smoke Passed / Unit B Revision 38 Published

Revision `runtime-rev35-frontend-terminal-smoke-2026-07-04-37` 已达到 `RUNTIME_REV35_FRONTEND_TERMINAL_SMOKE_READY`。Dispatcher `t_95b6b112` run `#157` completed；Frontend Executor `t_9f86c667` run `#158` 显式 completed `READY_FOR_CONTINUATION_RUNTIME_ONLY`。Invalid byte `0xB4` 被安全表示为 U+FFFD，process exit `0`，未出现 `_readerthread` crash 或 `UnicodeDecodeError`。正式验收与授权：`ai/reviews/REVIEW-T4-010-PMC-REV37-PASS-AND-UNIT-B-REV38-AUTHORIZATION-2026-07-04.md`。

PMC 现发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-b-browser-continuation-2026-07-04-38`。它继承 rev31/rev32/rev33/rev35 全部 fingerprints，只允许 fresh `revid-frontend` chain 完成 Unit B browser/interaction/visual closure，并停止于 `T4_010_UNIT_B_BROWSER_REPORT_READY`。Independent Reviewer、HANDOFF 与 T4-002 rev36 均未在本 revision 授权。Hermes ACK rev38 时必须纠正 rev37 status 中的 `PLACEHOLDER` hashes 和 stale blocked Queue summary。

## 2026-07-04 Rev35 Root Cause Fixed / Frontend Terminal Smoke Revision 37 Published

Human Owner 已明确授权修复全部 T4-010 Unit B runtime blockers，并将最终发布 Unit B 设为当前优先目标。PMC 从 rev35 原始 worker log 定位根因：Windows background process 输出 byte `0xB4`，旧 `ProcessRegistry.spawn_local()` strict UTF-8 reader 抛出 `UnicodeDecodeError`；agent 随后只返回 `[Acknowledged]` 并 clean exit 0，未调用 terminal Kanban tool，因而触发 `REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`。

当前 Hermes baseline 已使用 `encoding="utf-8", errors="replace"`。Fresh invalid-byte process smoke exit `0` 且输出 replacement character；Revid verifier 已增加 fail-closed guard，targeted tests `8 passed`、full runtime tests `26 passed`、`ROLE_CONTRACTS_OK`。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-SMOKE-REV37-AUTHORIZATION-2026-07-04.md`。

T4-002 rev36 尚未 Hermes ACK 且无任何 card/worker，现因最新 Human priority override 在执行前 supersede，所有 fingerprints/Hard Gates 保留。PMC 发布唯一 executable Queue `runtime-rev35-frontend-terminal-smoke-2026-07-04-37`；只允许 fresh `revid-frontend` worker 执行 invalid-byte background-process smoke、写唯一 report 并显式 `kanban_complete`/`kanban_block`。Unit B 在 smoke PASS 前仍 non-executable；PASS 后 PMC 立即发布 fresh Unit B continuation，继承 rev31/rev32/rev33/rev35 fingerprints。

## 2026-07-04 T4-002 Unit C3 Revision 36 Published

Rev35 terminal STOP 已确认，deterministic status `STATUS_OK`，Gateway PID `20128` running，Kanban `0 ready / 0 running / 0 review / 0 todo`。Runtime tests `24 passed`、`ROLE_CONTRACTS_OK`；`backend/tests/test_migration_tool.py` 无 unknown ownership diff；launcher exact dry-run 通过且未创建 card。

PMC 现发布唯一 executable Queue `phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-04-36`。仅允许 `revid-backend` 修改 `backend/tests/test_migration_tool.py`，完成 failure-safe cleanup lifecycle 与三条 non-MySQL regressions，再运行五个 real-MySQL selectors；一个 business attempt、最多一次 process retry，停止于 REPORT_READY。T4-010 Unit B 继续 `STILL_INFRA_BLOCKED`，不发布 continuation。正式授权：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV36-PUBLICATION-2026-07-04.md`。

## 2026-07-04 T4-010 Revision 35 Diagnostic Reviewed — Unit B Not Published

Hermes fresh diagnostic SHA256 `178F92872FBC86A58B85272A746A579F7E025E677CBC12EB9894903B5ED71931` 的 verdict 为 `STILL_INFRA_BLOCKED`。它确认 rev35 worker 在 594 秒后无 terminal transition 退出，但没有 exit code、termination source、stdout/stderr、stack 或 exception，也没有 fresh `revid-frontend` same-profile terminal smoke。Reconciler 修复只解除了 diagnostic handoff deadlock，不修复原始 worker finalization fault。

PMC verdict：`PMC_BLOCKED — UNIT B CONTINUATION REJECTED`。Queue 已推进为 `ACK_TERMINAL_VERDICT_AND_STOP`；Hermes 只应确认 STOP，不得重试或复用 rev35。STOP 闭环后，下一个 business Queue 是已获 Human authorization 的 T4-002 Unit C3 revision 36。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV35-2026-07-04.md`。

## 2026-07-04 T4-002 Unit C3 Fresh Remediation Authorized

Human Owner 已明确授权 T4-002 Unit C3 新的 bounded remediation，继承 revisions `-27` 至 `-30` 的全部 fingerprints 与安全 Hard Gates。PMC 已创建 `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV36.md`：唯一 business file 为 `backend/tests/test_migration_tool.py`，只修复 FK restoration observation、failure-safe restore 和 primary/close/delete/verify/restore multi-failure visibility；一个 business attempt，REPORT_READY 后停止。

当前 rev35 Queue 仍是唯一 terminal reconciliation signal；Hermes status 已 `STATUS_OK`，但 fresh diagnostic 尚未生成。因此 revision 36 已 authorized/ready，但 Queue publication 延后到 rev35 diagnostic 与 PMC decision 收口后，避免覆盖 unresolved terminal signal 或创建第二条 chain。正式授权：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV36-AUTHORIZATION-2026-07-04.md`。Preconditions 满足后 PMC 必须直接发布，不再重复请求 Human 授权。

## 2026-07-04 Rev35 Diagnostic Gate Runtime Fix Verified

Human Owner 已授权 Codex 直接修复 runtime。`reconcile-hermes-execution-status.py` 现正确区分 `ACKNOWLEDGED + diagnostic NONE` 与 `DIAGNOSTIC_READY + verified path/hash`：pending ACK 可 canonicalize 且保持 due `PENDING`，diagnostic produced 后才标记 `SATISFIED`。另一个 RED regression 证明真实 status 缺少当前 revision reconciliation row 时旧 apply 会 exit `2`；现只允许为当前动态 revision 插入该行，其他 canonical fields 仍严格要求唯一。Targeted `8 passed`、全部 runtime `23 passed`、`ROLE_CONTRACTS_OK`、全局 `git diff --check` 均通过。

真实 rev35 `--check` 已从 `STATUS_RECONCILIATION_ERROR` exit `2` 变为 `STATUS_MISMATCH` exit `1`，只剩 Task SHA256、Queue SHA256 与 rev35 pending reconciliation 三项可 deterministic apply 的差异。Codex 未修改 Hermes-owned status、Queue 或 Kanban。下一动作属于 Hermes：单次 `--apply`、read-back `--check`，随后生成 fresh rev35 diagnostic。原始 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` 尚未因此自动解决，仍不授权 revision 36 或 Unit B 重跑。报告：`ai/reports/REPORT-RUNTIME-REV35-DIAGNOSTIC-GATE.md`。

## 2026-07-04 T4-010 Revision 35 Runtime Owner Stalled

PMC 已确认 rev35 的阻塞不是 Unit B 业务失败，而是 deterministic gate 自锁：reconciler 在 `ai/runtime/reconcile-hermes-execution-status.py::validate_diagnostic()` 无条件要求 `DIAGNOSTIC_READY`，Supervisor 又在 gate exit `2` 时禁止生成 diagnostic/status，导致合法的 `ACKNOWLEDGED → DIAGNOSTIC_READY` 永远无法发生。现有 regression 只覆盖 diagnostic 已存在的 start phase，未覆盖 pending ACK。

09:02、12:03 与 13:35 三个 PMC checkpoint 的 revision/fingerprint/diagnostic cursor 均未推进，且 status due 使用错误未来时间，现记录一次性 `RUNTIME_OWNER_STALLED / DIAGNOSTIC_GATE_DEADLOCK`。Revision 35 与 Queue 继续 terminal/non-executable；不发布 revision 36。Runtime owner 的 bounded remediation Task 为 `ai/tasks/todo/TASK-RUNTIME-REV35-DIAGNOSTIC-GATE.md`，只允许修改 reconciler 与其测试，完成 pending/produced 双阶段 regression 后提交 fresh diagnostic。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-OWNER-STALLED-REV35-2026-07-04.md`。

## 2026-07-04 T4-010 Unit B Revision 35 Runtime Block

Revision `phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35` 已 terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`。Dispatcher `t_34e9113b` run `#155` 完成 atomic dispatch；Executor `t_7200189b` run `#156` 运行 594 秒后以 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` blocked，未调用 terminal Kanban action。Unit B PLAN、PROGRESS、REPORT、browser evidence、Independent REVIEW 与 HANDOFF 均不存在。该事件是 runtime/process fault，不是业务 REWORK；revision 35 不得 retry、claim、promote、unblock、reparent、复用或进入 review lifecycle。

Hermes-owned execution status 同时保留 stale Task/Queue hash、`WAITING_FOR_HERMES_ACK` reconciliation 和与 card epoch 不一致的 transition timestamp，因此 terminal reconciliation 尚未完成。正式 advisory：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV35-2026-07-04.md`。Hermes 下一动作是以 fingerprint `REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` ACK terminal verdict，规范化 status 并提交 fresh runtime diagnostic；无 revision 36 或 Human decision 授权。

## 2026-07-04 T4-010 Unit A Accepted / Unit B Revision 35 Published

PMC 已完成 revision 34 的 REPORT_READY queue-decision gate。Unit A 五个 Allowed Files ownership、line count、typed props、route/context/generation/quota/selected-node static contract、protected-file no-diff 与 REPORT scope 均一致；fresh `npm run build` exit `0`，scoped/full `git diff --check` exit `0`。该结论是 `UNIT_A_STAGE_ACCEPTED`，不是 T4-010 最终 `PMC_PASS`，因为 browser/visual、Independent Review 与 HANDOFF 尚未执行。

现发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35`，只执行 `1440x900`、`920x900`、`375x812` browser/interaction/accessibility/console/network/visual closure，并停止于 Unit B REPORT_READY。正式审查与授权：`ai/reviews/REVIEW-T4-010-PMC-UNIT-A-REV34-ACCEPTANCE-AND-UNIT-B-REV35-AUTHORIZATION-2026-07-04.md`。

## 2026-07-04 T4-010 Unit A Revision 34 Published

PMC 已修复 execution-status canonicalization 缺口：reconciler 现在全文件拒绝 malformed multi-pipe rows 与跨 section duplicate canonical fields；两条新 regression 在旧逻辑下 RED、修复后通过。Execution status 已重建为单一 113-line canonical document，rev33 `STATUS_OK`，targeted tests `6 passed`、全部 runtime tests `21 passed`、`ROLE_CONTRACTS_OK`、`git diff --check` exit `0`，Kanban 无 ready/running/review/todo card。现发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-04-34`，继承 rev31/rev32/rev33 fingerprints，只执行 Unit A static/build closure并停止于 REPORT_READY。正式授权：`ai/reviews/REVIEW-T4-010-PMC-UNIT-A-REV34-AUTHORIZATION-2026-07-04.md`。

## 2026-07-04 T4-010 Revision 33 Execution Status Structure Conflict

Hermes 已提交 rev33 `READY_FOR_CONTINUATION` addendum，且 rev33 subsection 写入 `ACK_TERMINAL_VERDICT_AND_STOP`；但完整 `HERMES-EXECUTION-STATUS.md` 仍混入旧 T4-002 revision 30 的 malformed canonical block。实际文件有 19 个 `|||`/`||||`/`|||||` rows，`PMC Action Required`、`PMC Action Type` 与 `Task ID` 等字段重复且互相冲突。Deterministic reconciler 对该结构仍误报 `STATUS_OK`，因此 terminal reconciliation 不成立。Revision 33 保持 terminal/non-executable，revision 34 不发布。Hermes 必须规范化其 owned status、补 duplicate/malformed-row fail-closed regression，并以同 fingerprint 重新确认 STOP。正式审查：`ai/reviews/REVIEW-T4-010-PMC-REV33-STATUS-STRUCTURE-CONFLICT-2026-07-04.md`。

## 2026-07-04 T4-010 Unit A Revision 33 Runtime Remediation Verified

PMC fresh verification 已确认 rev33 child-contract remediation：launcher/reconciler targeted tests `34 passed`，全部 `ai/runtime/tests` `19 passed`，role verifier 返回 `ROLE_CONTRACTS_OK`，deterministic reconciler 返回 `STATUS_OK`，`git diff --check` exit `0`，Kanban 为 `0 ready / 0 running / 0 review / 0 todo`。但 canonical rev33 diagnostic 仍明确为 `STILL_INFRA_BLOCKED`，不能被 PMC review 默认为 `READY_FOR_CONTINUATION`。Revision 33 继续 terminal/non-executable；不发布 revision 34。Hermes 下一动作是提交同 revision/fingerprint 的 fresh `READY_FOR_CONTINUATION` diagnostic/addendum，并确认 `ACK_TERMINAL_VERDICT_AND_STOP`。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-REMEDIATION-REV33-2026-07-04.md`。

## 2026-07-03 T4-010 Unit A Revision 33 Runtime Block

Revision `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33` 已 terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`。Dispatcher `t_24283338` 完成 atomic dispatch，但 Executor child `t_6e1e84d0` 的 persisted contract 与授权不一致：Queue 要求 `1800s`、`:execute:0` idempotency 和 Unit A REPORT_READY Stop After，实际 child 使用 `120s`、父级 `:dispatch` idempotency，并复制了 Dispatcher 的 child-creation Stop After。Runs `#150`、`#151` 均在 121s timeout 后进入 `gave_up`；Unit A PLAN、PROGRESS、REPORT、Independent REVIEW 和 HANDOFF 均不存在。

PMC 结论：`REV33_EXECUTOR_CHILD_CONTRACT_INVALID_120S_DISPATCH_PAYLOAD`。这属于 runtime/dispatcher incident，不是业务 REWORK。Revision 33 不得 retry、claim、promote、unblock、reparent 或复用；Queue 保持 non-executable，等待 Hermes 以同 revision/fingerprint ACK terminal verdict 并提交 fresh runtime diagnostic。正式 advisory：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV33-2026-07-03.md`。

## 2026-07-03 T4-010 Unit A Revision 33 Approved

PMC 已发布唯一 executable Queue `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33`。该 revision 只执行 T4-010 Unit A 的 partial-diff ownership、static contract、line-count、TypeScript build 与 scoped diff closure；不执行 browser/visual acceptance，不创建 Reviewer/HANDOFF，不扩大到 Canvas、router、API、backend 或 Unit B。Runtime gate、credential rotation、`ROLE_CONTRACTS_OK`、`STATUS_OK` 与无 active worker 前置条件均已通过。Revision 31/32 cards 和 keys 继续 terminal、不可复用；rev33 继承两条 failure fingerprints。正式授权：`ai/reviews/REVIEW-T4-010-PMC-UNIT-A-REV33-AUTHORIZATION-2026-07-03.md`。

## 2026-07-03 Frontend Runtime No-Tool Root Fix Verified

Hermes runtime 根因已修复：`agent/conversation_loop.py` 过去会把任何非空 no-tool response 当作正常 terminal text；provider 返回的 `...` 既非空、又不匹配 future-action intent-ack detector，因此以 `finish_reason=stop` 假成功退出。现已新增 narrow punctuation-placeholder detector、最多两次 tool-execution continuation，以及耗尽后 `completed=False / degenerate_no_tool_response_exhausted` 的 fail-closed 路径；修复已纳入 project-owned runtime patch 和 role-contract verifier。

验证结果：Hermes runtime 相关 regression `95 passed`；Revid deploy/verifier tests `6 passed`；`ROLE_CONTRACTS_OK`。Fresh same-profile session `20260703_170448_3ce6cd` 在 144.8 秒内依次调用 `read_file → terminal → write_file → read_file`，写入并 read-back `ai/reports/SMOKE-RUNTIME-FRONTEND-ARTIFACT-ROOT-2026-07-03.md`，最终 marker 为 `FRONTEND_PROFILE_ARTIFACT_ROOT_SMOKE_READY`。业务 diff SHA256 前后同为 `BC30FF84C71C46F75C2D45157CE1A6C2DFF43D0AF852CD360FDB9501222DA0A9`，无残留 smoke process。

PMC 结论：`RUNTIME_GATE_PASS — READY_FOR_CONTINUATION_RUNTIME_ONLY`。旧 rev31/rev32 execution chains 继续保持 terminal、不可复用；T4-010 Unit A 已解除 runtime gate，但仍需下一轮 PMC/Supervisor 按事实源发布唯一 fresh revision 33，不在本次 runtime repair 中直接创建 card。Human Owner 已于 17:25 完成 provider credential 轮换并重启 Hermes；fresh no-tool auth probe 返回 `ROTATION_PROBE_OK`，Gateway PID `12912` 正常，Revid Supervisor cron `72a21342a164` 已恢复，下一轮为 17:45。

## 2026-07-03 Frontend Runtime Smoke Hard Stop

`revid-frontend` bounded runtime gate 在三条可区分路径后仍未通过。前两次分别扩大为 T4-010 业务审计和 mandatory project preflight；PMC 随后在 canonical/deployed Frontend SOUL 中增加 `RUNTIME-SMOKE-` fast path，并以 regression tests 与 `ROLE_CONTRACTS_OK` 验证部署一致。Post-remediation session `20260703_165209_783f5c` 15.7 秒安全退出，business diff 与 `frontend/ai/` 未变，但 transcript 只有 user prompt 和 assistant `...`，没有任何 tool call 或 evidence report。

结论：`PMC_BLOCKED — FRONTEND PROFILE NO-TOOL-CALL AFTER BOUNDED FAST PATH`。不做第四次 prompt retry，不发布 T4-010 Unit A revision 33。Hermes runtime owner 下一步必须定位 no-tool-call root cause，提供 targeted runtime regression，并给出 fresh `revid-frontend` same-profile artifact-root evidence。Default Supervisor cron 已恢复，16:48 run `ok`，deterministic gate 为 `STATUS_OK`，无 active cards。

## 2026-07-03 T4-010 Bounded Continuation Planned / Frontend Profile Still Blocked

Hermes default Supervisor paused smoke 已返回 `PAUSED_SMOKE_OK STATUS_OK NO_MUTATION`，launcher targeted tests `28 passed`、全部 runtime tests `17 passed`、deploy verifier `ALL CHECKS PASSED`，Revid cron job `72a21342a164` 已恢复。T4-010 revision 32 partial diff 的 fresh PMC baseline build exit `0`，scoped `git diff --check` 通过。

但 `revid-frontend` profile 尚未满足 continuation runtime gate。两次 fresh non-business smoke 都在无报告状态下超时：attempt 1 将带 T4-010 名称的 smoke 扩大成业务源码审计；attempt 2 使用独立 `RUNTIME-SMOKE-001` 后仍强制加载 project-management skills、读取 CURRENT/ROADMAP 并枚举全部任务，未在 120 秒内执行最小 artifact-root procedure。两个 smoke process tree 均已终止，未新增报告、未改变 business diff、`frontend/ai/` 或 Kanban。相同症状已 hard-stop，不做第三次重试。

剩余 T4-010 已规划为 `TASK-T4-010-UNIT-A.md`（static/build closure）与 `TASK-T4-010-UNIT-B.md`（browser/interaction closure），继承 rev31/rev32 fingerprints；两者当前均 BLOCKED，无 executable Queue，不发布 revision 33。解阻条件是修复 `revid-frontend` mandatory preflight，使其能按精确 Task bounded 完成并使用 project-root artifact path。

## 2026-07-03 Hermes Terminal Reconciliation Root Fix Complete

T4-010 rev32 的重复 status regression 根因已修复：Supervisor 过去把 `DIAGNOSTIC_READY` 的 due 当作每轮需要刷新到未来 60 分钟的活 deadline，并依赖临时 LLM verifier，未原子校验 mutable Queue 的 hash、Task hash、terminal Action 与 Queue Status。现已新增 `ai/runtime/reconcile-hermes-execution-status.py`，同时覆盖 pending/acknowledged 两阶段 Queue，强制 `--check -> 单次 --apply -> --check`、diagnostic path/hash 校验与幂等 read-back；canonical Supervisor、PMC prompt、operating model 和实际 cron bootstrap 已同步。Current status 为 `STATUS_OK`，第二次 apply 为 `NO_CHANGES`；rev32 reconciliation complete，Queue 保持 terminal/non-executable。Revid cron job `72a21342a164` 继续 paused，未创建或操作任何 worker。计划与证据：`ai/runtime/PLAN-PROGRESS-HERMES-STATUS-RECONCILIATION-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 32 Reconciliation Attempt Still Invalid

Hermes 在 `2026-07-03T15:25:27+08:00` 再次声明 rev32 reconciliation complete，但 Active Queue 表仍保留旧 `Task SHA256 = 5770B447...`、旧 `Queue SHA256 = CA998DE4...`、`Action = DISPATCH_ONLY` 与 `AWAITING PMC CONTINUATION DECISION`。当前真实 Task/Queue SHA256 分别为 `BFCEE8FD...` 与 `6F69D842...`。Historical Notes 中写入正确 hash 不能替代 canonical 字段修复，因此该 checkpoint 仍是 `STATE_CONFLICT`，不构成有效 ACK 或 fresh runtime evidence。Revision 32 保持 terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`；不授权 revision 33、提高 budget、重派、retry、Reviewer 或 HANDOFF。正式审查继续使用：`ai/reviews/REVIEW-T4-010-PMC-REV32-EXECUTION-STATUS-REGRESSION-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 32 Execution Status Regression

Hermes 在 rev32 terminal reconciliation 闭环后再次改写 `HERMES-EXECUTION-STATUS.md`，但 Active Queue metadata 回退为旧 Task/Queue hash 与 `Action = DISPATCH_ONLY`，Reconciliation Status 又写成 `AWAITING PMC CONTINUATION DECISION`，同时出现失序 timestamp 与 malformed Markdown row。该变化是 `STATE_CONFLICT`，不是 fresh runtime evidence，也不授权 revision 33、提高 budget、重派、retry、Reviewer 或 HANDOFF。Revision 32 继续 terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`；Hermes 仅需规范化其 owned status 并再次确认同 revision/fingerprint 的 `ACK_TERMINAL_VERDICT_AND_STOP`。正式审查：`ai/reviews/REVIEW-T4-010-PMC-REV32-EXECUTION-STATUS-REGRESSION-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 32 Terminal Reconciliation Complete

Hermes 已按同 revision/fingerprint 完成 rev32 terminal reconciliation：`Runtime Owner State = DIAGNOSTIC_READY`、`PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`、`PMC Action Required = NO`。此前 false `STALLED` 与 malformed status 冲突已收口。Revision 32 继续 terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`，diagnostic verdict 保持 `STILL_INFRA_BLOCKED`；当前没有 executable Queue，也不授权 revision 33、提高 budget、重派、retry、Reviewer 或 HANDOFF。下一 gate 是 fresh runtime remediation evidence 满足既定 Resume Condition。正式 closure：`ai/reviews/REVIEW-T4-010-PMC-REV32-TERMINAL-RECONCILIATION-CLOSED-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 32 False Stalled Transition Rejected

Hermes 将 rev32 runtime owner state 改为 `STALLED`，理由是 `Runtime Diagnostic Due = 2026-07-03T09:18:05+08:00` 已过期；但同 revision/fingerprint 的 diagnostic 已于 `2026-07-03T07:18:00+08:00` 生成并由 PMC 审阅，不能被归类为“逾期且没有 diagnostic”。本次状态变化是 `STATE_CONFLICT`，不是新的 runtime failure，也不授权 revision 33、提高 iteration budget 或重派。Revision 32 继续 terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`。Hermes 只需规范化其 owned status：使用有效 Markdown table、设置 `Runtime Owner State = DIAGNOSTIC_READY`、保留 `ACK_TERMINAL_VERDICT_AND_STOP` 并清除 PMC action marker。正式审查：`ai/reviews/REVIEW-T4-010-PMC-REV32-STATE-CONFLICT-RECONCILIATION-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 32 Runtime Diagnostic Reviewed

Hermes 已提交 `ai/reports/DIAGNOSTIC-T4-010-REV32-RUNTIME-HEALTH-2026-07-03.md`，结论为 `STILL_INFRA_BLOCKED`。PMC 接受 iteration budget exhaustion、canonical REPORT/browser evidence 缺失和 artifact-root 越界事实，但 diagnostic 未提供 exit code/log tail、worker stack、Gateway/dispatcher log、resource limit 或 bounded same-profile smoke，不能证明 runtime 已恢复。`HERMES-EXECUTION-STATUS.md` 仍使用协议外 `DIAGNOSTIC_COMPLETE`、错误 terminal confirmation 和畸形 `||` table，构成 `STATE_CONFLICT`。Revision 32 保持 terminal/non-executable；不发布 revision 33。Hermes 下一动作是以同 revision/fingerprint 规范化 status，写 `Runtime Owner State = DIAGNOSTIC_READY`、`PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP` 并清除 PMC action marker。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV32-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 32 Executor Runtime Blocked

Revision `phase4-wave3-workspace-shell-continuation-2026-07-03-32` 已在 Executor 阶段 terminal。Dispatcher `t_5db600e6` 正常完成 atomic dispatch；Executor `t_6837871b` run `#147` 耗尽 90/90 iteration，retry run `#148` 随后 `gave_up`。Canonical PROGRESS 仍将实现与验证标为 TODO，`ai/reports/REPORT-T4-010-REV32.md` 缺失，`ai/evidence/T4-010/rev32/` 为空。Retry 还把 PLAN/PROGRESS 写入越界的 `frontend/ai/`，其 920/375 结论只是 CSS 推断，不满足 real-browser Hard Gate。结论为 `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`，stable fingerprint `REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS`。Partial frontend diff 保留等待 ownership audit；revision 32 不得重派、retry、claim、promote、unblock、复用或进入 Reviewer/HANDOFF。正式 advisory：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV32-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 32 Continuation Approved（historical）

PMC 独立复核 fresh same-profile smoke：`revid-dispatcher` parent `t_0f9c7dac` run `#144` 在 74 秒内仅使用 `kanban_show`、`read_file`、`kanban_create`、`kanban_complete`，没有调用 `terminal`，原子创建唯一 child `t_413f6846` 并正常完成；旧 card `t_2e03b521` 保持原 blocked 状态。UTF-8-safe verifier exit `0`，19 tests 通过，`git diff --check` 通过，且当前 worktree 没有触及 T4-010 frontend Allowed Files。PMC 因此发布唯一 fresh continuation `phase4-wave3-workspace-shell-continuation-2026-07-03-32`，继承 fingerprint `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`，business attempt 仍为 `0`。Hermes 必须先规范化其 owned execution status，再 ACK rev32；旧 rev31 card/key 不得删除、复用或重试。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-CONTINUATION-AUTHORIZATION-REV32-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 31 Runtime Fix Verification Failed

Hermes execution status 新增 `FIX_IMPLEMENTED` 声明，但 PMC fresh verification 只确认 19 个 mocked/unit regressions 通过；project-owned deploy/verifier 实际 exit `1`，且没有实际 `revid-dispatcher / DISPATCH_ONLY` same-profile smoke。新 launcher 将 Python import 描述为 `kanban_create` tool capability，却未证明受限 worker 可以在无 `terminal` 条件下执行该入口；programmatic path 也未调用完整 args contract validation。status 同时改写 stable fingerprint、使用非协议 owner state/action type，并要求 PMC 删除 terminal card，构成 `STATE_CONFLICT`。结论保持 `PMC_BLOCKED`；revision 31、card `t_2e03b521` 与原 idempotency key 继续 terminal/non-executable。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-FIX-VERIFICATION-REV31-2026-07-03.md`。

## 2026-07-03 T4-010 Revision 31 Fresh Diagnostic Rejected

Hermes runtime owner 提交 `DIAGNOSTIC-T4-010-REV31-FRESH-RUNTIME-HEALTH-EVIDENCE-2026-07-03.md` 并声明 `READY_FOR_CONTINUATION`。PMC 确认其 root-cause 方向正确：`terminal` 应继续禁止，runtime 应直接使用已批准的 `kanban_create` atomic path；但报告只描述 required fix 和 hypothetical smoke，没有 source remediation、targeted regressions、部署 verifier 或实际 same-profile smoke。结论为 `PMC_BLOCKED — READY_FOR_CONTINUATION REJECTED / REMEDIATION EVIDENCE INCOMPLETE`。Revision 31、card `t_2e03b521` 和原 idempotency key 继续 terminal/non-executable；不发布 continuation。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV31-2026-07-03.md`。

## 2026-07-02 T4-010 Revision 31 Infrastructure Blocked

Hermes 已 ACK revision `phase4-wave3-workspace-shell-2026-07-02-31`，但 `revid-dispatcher` card `t_2e03b521` run `#141` 在创建 Executor 前因 `ROLE_BOUNDARY_VIOLATION` terminal：`DISPATCH_ONLY` policy 不允许当前 flow 调用的 `terminal` tool。该事件是 runtime/tool-policy incident，不是业务 REWORK。Revision 31 现为 `INFRASTRUCTURE_BLOCKED / NOT EXECUTABLE`，fingerprint `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`；无 Executor、REPORT、Independent REVIEW 或 HANDOFF。PMC runtime advisory：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV31-2026-07-02.md`。

2026-07-02 18:09 Hermes 已确认 terminal verdict 与 stable fingerprint，但尚未提交 runtime diagnostic。Canonical expected action 已更新为 `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC`，diagnostic SLA 为下一 Hermes checkpoint、最迟 60 分钟。仅 terminal ACK 不构成 runtime handoff 闭环。

2026-07-02 18:26 Hermes 已提交 `STILL_INFRA_BLOCKED` diagnostic，证明 runtime advisory 不再停留在静默等待。PMC 接受阻塞证据，但驳回给 `revid-dispatcher` 增加通用 `terminal` 的 remediation 方向；canonical thin-dispatcher 必须继续只使用 `read_file`/`kanban_*`，并通过 `kanban_create` atomic path dispatch。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV31-2026-07-02.md`。

## 2026-07-02 T4-010 Workspace Shell Revision 31 Approved（historical）

发布时，Hermes 已确认 T4-002 revision `-30` terminal reconciliation，`PMC Action Required = NO`，旧 chain 无 active worker且不可复用。T4-010 的 T4-006 dependency 已 PMC PASS；当时 worktree 的已知修改均为 PMC/Hermes 治理文件，不触及 T4-010 frontend Allowed Files。PMC 因此发布 revision `phase4-wave3-workspace-shell-2026-07-02-31`，Action `DISPATCH_ONLY`，Executor `revid-frontend`。该授权现已被上方 runtime block 取代，不再 executable。授权证据：`ai/reviews/REVIEW-T4-010-PMC-AUTHORIZATION-2026-07-02.md`。

## 2026-07-02 Unit C3 Revision 30 Terminal Reconciliation

Revision `-30` 保持 terminal `PMC_BLOCKED`，fingerprint `REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`。其一次 Human-authorized bounded correction 已用尽，不授权 automatic T4-002 revision `-31`。Hermes 已执行 `ACK_TERMINAL_VERDICT_AND_STOP` 并设置 `PMC Action Required = NO`，terminal reconciliation 闭环。旧 revision、cards、runs 与 idempotency keys 均不可复用。

## 2026-07-01 Unit C3 Revision 30 PMC Blocked

Revision `-30` reached `REPORT_READY` and reported six passing verification commands. PMC source/diff audit found three Hard Gate failures: the SQLite regression skips all FK state operations and therefore does not observe FK-restoration-equivalent state; the shared helper does not guarantee `FOREIGN_KEY_CHECKS=1` after DELETE/verification failure; and real AC4/regression silently swallow resource-close failures. Verdict: `PMC_BLOCKED`, fingerprint `REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`. Revision `-30` is terminal, must not enter Independent Review, and there is no executable Queue.

## 2026-07-01 Unit C3 Revision 30 Approved

Human Owner 已明确批准新的 bounded correction。Revision `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30` 是唯一 executable Queue：只允许修改 `backend/tests/test_migration_tool.py`，使 real AC4 与 non-MySQL regression 绑定同一个 failure-safe cleanup lifecycle，并证明 orphan deletion、deletion verification、FK restoration 与 cleanup-failure visibility。Revision `-29` 保持 terminal `PMC_BLOCKED`，不得复用。当前状态：`WAITING_FOR_HERMES_ACK`。

## 2026-07-01 Unit C3 Revision 29 PMC Blocked

Revision `-29` reached `REPORT_READY` and reported six passing verification commands. PMC source/diff audit found that orphan deletion still executes inside the main `try` body after validation/assertion; the `finally` block only closes resources and therefore does not delete `q-orphan` on the required failure paths. The new non-MySQL regression observes mocked `close()` calls in a separate local lifecycle and is not bound to the actual AC4 deletion cleanup. Verdict: `PMC_BLOCKED`, fingerprint `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`. No Independent Review, HANDOFF or replacement Queue is authorized.

## 2026-07-01 Unit C3 Revision 28 PMC Blocked

Revision `-28` reached `REPORT_READY` and the Executor reported five passing real-MySQL selectors. PMC source audit nevertheless found that AC4 orphan deletion is still reached only after migration, validation and the failure-producing assertion; those paths are not enclosed by the cleanup `finally`. This violates the Task's failure-safe cleanup constraint and makes the REPORT cleanup claim inconsistent with source. Verdict: `PMC_BLOCKED` with fingerprint `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`. The Queue is `BLOCKED / NOT EXECUTABLE`; no Independent Review or HANDOFF is authorized.

## 2026-07-01 Unit C3 Revision 27 Rework and Revision 28 Queue

Unit C3 revision `-27` reached `REPORT_READY`, but required verification returned `4 failed, 1 passed, 1 error`. PMC source audit confirmed that explicit FK orphan validation reads source FK values rather than target child-table FK values, while AC4/AC6/AC10/AC12 also have deterministic isolation, patch-binding and resource-disposal defects. Revision `-27` is terminal `PMC_REWORK` with fingerprint `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`; it must not enter Independent Review or be reused. Revision `phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28` is the sole approved Queue for one bounded remediation continuation.

## 2026-07-01 Unit C2 Final Acceptance and Unit C3 Queue

Unit C2 revision `-26` / lifecycle `-26r2` is `PMC_PASS`. Executor `t_9f24648e`, Independent Reviewer `t_bcbc25b7` and canonical HANDOFF `t_c481b6ad` form a consistent evidence chain; Reviewer independently passed 4 unit and 4 real disposable-MySQL tests with 0 skip/mock substitution. Fresh PMC verification passed `py_compile`, 4 scoped unit selectors and `git diff --check`; PMC runtime had no MySQL credential and did not repeat CREATE/DROP-capable tests. Unit C3 revision `phase4-wave2-unit-c3-integrity-verification-2026-07-01-27` is now the sole approved Queue and covers only conflict, FK orphan, partial rollback, consistency and cleanup visibility.

## 2026-06-30 Revision 26r2 Review Continuation（completed）

Shared Agnes/APIHub credential rotation was verified across all five profiles; `revid-pm` live probe returned `CREDENTIAL_OK`. Revision `26r2` completed with Reviewer PASS and canonical HANDOFF, then received PMC final acceptance on 2026-07-01. It is historical evidence and no longer executable.

## 2026-06-30 Hermes Update Durability Blocker

The earlier runtime `PMC_PASS` is temporarily superseded. Hermes update reset the upstream checkout and preserved local runtime changes in `stash@{0}`, but an obsolete Desktop bundle conflict prevented automatic restoration. Python runtime changes are recovered and 107 affected tests pass; Chinese output rules are restored in all six SOULs; however Gateway has not been reloaded and the conflict/post-update deployment mechanism is not closed. Queue remains non-executable. See `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-BLOCKED-2026-06-30.md`.

Resolution: `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-PASS-2026-06-30.md`. The patch is project-owned/repeatable, deploy+verify is a pre-Queue hard gate, 107 Hermes + 14 project tests pass, Chinese SOUL checks pass, and Gateway PID `11888` is running. Human Owner authorized archiving 34 invalid/obsolete cards; 18 valid evidence cards remain and no active chain exists. Only credential rotation remains before a fresh review-only Queue decision.

## 2026-06-30 Hermes Runtime Contract Update

Hermes action/profile/tool contract remediation has `PMC_PASS` and `READY_FOR_CONTINUATION` runtime evidence: `ai/reports/REPORT-HERMES-ROLE-CONTRACT-HARDENING-2026-06-30.md`. Launcher, Supervisor, five profile policies/SOULs, child-card validation, retry semantics, and drift verification are aligned; 105 Hermes tests + 11 project tests + isolated positive/negative smokes passed; Gateway restarted cleanly.

Revision `26r1` remains terminal and archived. Credential rotation and `ROLE_CONTRACTS_OK` are complete; revision `26r2` is the sole approved review-only Queue. Do not repeat Executor revision 26.

> 更新时间：2026-07-04
> 状态来源：Codex PMC 自动治理、Hermes scheduled reports 与 fresh source/diff audit

## Current Phase

`Phase 4 - Personal Integration Edition（执行中，T4-002 Unit C3 rev36 授权保留但已 supersede；T4-010 Unit A revision 34 stage-accepted，Unit B revision 38 因 browser evidence 缺失 terminal PMC_BLOCKED）`

## Current Task

- `T4-010-UNIT-A`：revision 34 已 stage-accepted；该结论不是最终 `PMC_PASS`。
- `T4-010-UNIT-B`：revision 37 runtime smoke 已 PASS；revision 38 因精确 viewport 与 screenshot/console/network/overflow evidence 缺失 terminal `PMC_BLOCKED`，等待 Hermes ACK terminal verdict。
- `T4-010` revision `-32` 继续作为 terminal infrastructure evidence；不得复用旧 card、key 或 artifact path。
- `T4-002`：Unit C2 revision `-26` / lifecycle `-26r2` 已 PMC PASS。Unit C3 revisions `-29` 与 `-30` 均已 terminal `PMC_BLOCKED`，没有 executable T4-002 Queue。

## Latest PMC Verdicts

|| Task | Verdict | Evidence ||
|---|---|---|---|
| T4-001 | PASS，进入 done | MySQL 8.0.43；Alembic head；12/12 InnoDB + utf8mb4；12/12 table comments；90/90 column comments；97 tests |
| T4-006 | PMC PASS，进入 done | `ai/reviews/REVIEW-T4-006-PMC-2026-06-24.md` |
| T4-010 Unit B | **PMC BLOCKED — revision 38 required browser evidence missing** | `ai/reviews/REVIEW-T4-010-PMC-UNIT-B-REV38-BLOCKED-2026-07-04.md`；fingerprint `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`；不进入 Reviewer/HANDOFF |
| T4-002 | PMC REDISPATCH — Human approved | `ai/reviews/REVIEW-T4-002-PMC-REDISPATCH-2026-06-24.md`；Queue revision `phase4-wave2-manual-rework-2026-06-24-05` |
| T4-002 | PMC CHECKPOINT — Executor running，尚不可验收 | `ai/reviews/REVIEW-T4-002-PMC-CHECKPOINT-2026-06-24.md`；Executor `t_68c68e4e` |
| T4-002 | PMC BLOCKED — Executor retries exhausted，partial implementation unverified | `ai/reviews/REVIEW-T4-002-PMC-EXECUTOR-BLOCKED-2026-06-24.md` |
| T4-002 | PMC RECOVERY DISPATCH — 新 revision 已批准 | `ai/reviews/REVIEW-T4-002-PMC-RECOVERY-DISPATCH-2026-06-24.md`；Queue revision `phase4-wave2-recovery-dispatch-2026-06-24-07` |
| T4-002 | PMC REWORK — final business attempt 1 approved | `ai/reviews/REVIEW-T4-002-PMC-REWORK-2026-06-25.md`；Queue revision `phase4-wave2-final-rework-2026-06-25-08` |
| T4-002 | PMC BLOCKED — final attempt retry exhausted，无验收证据 | `ai/reviews/REVIEW-T4-002-PMC-FINAL-ATTEMPT-BLOCKED-2026-06-25.md`；Queue revision `phase4-wave2-final-attempt-blocked-2026-06-25-09` |
| T4-002 | PMC BLOCKED — runtime diagnostic 已审阅，但缺少 revid-backend 同 profile 证明 | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-2026-06-25.md`；不发布 continuation Queue |
| T4-002 | PMC CONTINUATION APPROVED — Human Owner clarified runtime owner；发布 continuation Queue | `ai/reviews/REVIEW-T4-002-PMC-CONTINUATION-APPROVAL-2026-06-25.md`；Queue revision `phase4-wave2-final-attempt-continuation-2026-06-25-10` |
| T4-002 | PMC RUNTIME ADVISORY — revision -10 parent-child runtime deadlock，等待 Hermes runtime diagnostics | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV10-2026-06-25.md` |
| T4-002 | **Runtime Owner Diagnostic — revision -10** | `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV10-2026-06-25.md`；`STILL_INFRA_BLOCKED — NEEDS_BOUNDED_WORK_UNIT_SPLIT` |
| T4-002 | **PMC Request — Bounded Work Unit Split** | `ai/reports/PMC-REQUEST-T4-002-BOUNDED-WORK-UNIT-SPLIT-2026-06-25.md`；已由 PMC 批准 Unit A |
| T4-002 | PMC APPROVED — bounded work unit split；Unit A static fixes dispatch | `ai/reviews/REVIEW-T4-002-PMC-BOUNDED-SPLIT-APPROVAL-2026-06-25.md`；Queue revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11` |
| T4-002 | PMC INFRA CONTINUATION — Unit A Coordinator timeout，批准一次受控 redispatch | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-COORDINATOR-TIMEOUT-2026-06-26.md`；Queue revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` |
| T4-002 | PMC REWORK — Unit A fresh verification failed missing-source secret gate and cleanup patch binding | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-REWORK-2026-06-26.md`；Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` |
| T4-002 | PMC BLOCKED — Unit A correction code fixed, but revision `-13` evidence chain is inconsistent | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-CORRECTION-BLOCKED-2026-06-26.md`；REPORT/HANDOFF still declare revision `-12`; handoff card missing |
| T4-002 | PMC PASS — Unit A correction revision `-13`; Unit B queued | `ai/reviews/REVIEW-T4-002-PMC-UNIT-A-CORRECTION-PASS-2026-06-26.md`；Queue revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14` |
| T4-002 | Runtime diagnostic — Unit B revision `-14` ready for bounded continuation decision | `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV14-2026-06-26.md`；Coordinator `t_bbbf72bd` timeout 302s；Executor `t_7275328d` timeout 847s/848s；Gateway restored PID 6692；local `TestUnitB` 7 passed |
| T4-002 | PMC APPROVED — Unit B fresh bounded continuation revision `-15` | `ai/reviews/REVIEW-T4-002-PMC-UNIT-B-BOUNDED-CONTINUATION-2026-06-26.md`；Queue revision `phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15` |
|| T4-002 | Unit B revision `-15` 验证链已完成 — Executor `t_1a9f1d32` done，Independent Review `t_6b4b7bc8` VERDICT = PASS，HANDOFF `t_67184ab2` done | 7/7 TestUnitB 通过，0.27s，HANDOFF_READY_REV15，等待 PMC 最终验收 |
|| T4-002 | **HANDOFF_READY_REV15 — 等待 Codex PMC 最终验收** | 全证据链完整：PLAN, PROGRESS, REPORT, REVIEW(PASS), HANDOFF |
| T4-002 | **PMC PASS — Unit B revision `-15`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-B-REV15-PASS-2026-06-26.md`；fresh PMC verification：`TestUnitB` 7 passed in 0.38s，allowed business diff empty |
| T4-002 | **PMC APPROVED — Unit C disposable MySQL integration revision `-16`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C-MYSQL-INTEGRATION-APPROVAL-2026-06-26.md`；Queue revision `phase4-wave2-unit-c-mysql-integration-2026-06-26-16` |
| T4-002 | **PMC RUNTIME ADVISORY — Unit C revision `-16` Coordinator retry exhausted** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV16-2026-06-26.md`；无 Executor/REPORT/REVIEW/HANDOFF |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C1 fixture/schema preflight revision `-17`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-BOUNDED-CONTINUATION-APPROVAL-2026-06-27.md`；精简 Task 与 120s Coordinator dispatch target |
| T4-002 | **PMC RUNTIME ADVISORY — Unit C1 revision `-17` Coordinator retry exhausted** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV17-2026-06-27.md`；无 Executor/PLAN/REPORT/REVIEW/HANDOFF，不发布 rev18 |
| T4-002 | **PMC BLOCKED — 选择重评 execution route** | `ai/reviews/REVIEW-T4-002-PMC-QUEUE-DECISION-REV17-2026-06-28.md`；不立即拆分 rev17，不单独提高 budget，不发布 rev18 |
| T4-002 | **PMC BLOCKED — rev17 runtime diagnostic 证据不足** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV17-2026-06-28.md`；未定位具体 pre-dispatch 步骤，未提供越过旧 boundary 的 same-profile sustained-run |
| T4-002 | **PMC BLOCKED — root-cause comparator 无效且 Hermes state 冲突** | `ai/reviews/REVIEW-T4-002-PMC-ROOT-CAUSE-REV17-2026-06-28.md`；run #96 包含 tests/artifacts，不证明 dispatch duration；rev17 仍 terminal |
| T4-002 | **PMC RUNTIME REMEDIATION GUIDANCE — thin dispatcher** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-REMEDIATION-GUIDANCE-2026-06-28.md`；要求 Coordinator mode tool boundary、step timings、3 次 isolated smoke 与 negative test |
| T4-002 | **PMC BLOCKED — thin-dispatcher remediation evidence invalid** | `ai/reviews/REVIEW-T4-002-PMC-THIN-DISPATCHER-REMEDIATION-2026-06-28.md`；仅 2 次成功 smoke，negative path 未执行，无 numeric step timings，status 仍使用非法 READY state |
| T4-002 | **PMC PASS — runtime remediation verified; revision -18 approved** | `ai/reviews/REVIEW-T4-002-PMC-THIN-DISPATCHER-RUNTIME-FIX-PASS-2026-06-28.md`；runtime exact policy + 94 tests + final smokes 3/3；Queue `phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18` |
| T4-002 | **PMC CONTINUATION APPROVED — revision -18 review-dispatch lifecycle stage** | `ai/reviews/REVIEW-T4-002-PMC-REV18-LIFECYCLE-GAP-2026-06-28.md`；Executor 2/2 PASS，Reviewer stage 缺失，Queue `phase4-wave2-unit-c1-rev18-review-dispatch-2026-06-28-18r1` |
| T4-002 | **PMC PASS — Unit C1 revision `-18`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-REV18-PASS-2026-06-28.md`；Executor 2/2 real MySQL tests PASS，Independent Reviewer 2/2 PASS，canonical post-review HANDOFF complete，business diff empty |
| T4-002 | **PMC APPROVED — Unit C2 migration core revision `-19`** | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV19.md`；Queue `phase4-wave2-unit-c2-migration-core-2026-06-28-19` |
| T4-002 | **PMC RUNTIME ADVISORY — Unit C2 revision `-19` Coordinator crash** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV19-2026-06-28.md`；`t_b493a47f` run `#113` `pid not alive`，retry `1/1` exhausted；无 Executor/REPORT/REVIEW/HANDOFF |
| T4-002 | **PMC BLOCKED — revision `-19` runtime diagnostic reviewed** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV19-2026-06-28.md`；direct logs 证明 worker text/partial exit 未写 terminal transition，Windows dispatcher 丢失 return code 并在下一 60 秒 tick 泛化为 `pid not alive` |
| T4-002 | **PMC BLOCKED — revision `-19` escalation rejected** | `ai/reviews/REVIEW-T4-002-PMC-ESCALATION-REV19-2026-06-28.md`；Hermes 复用了旧 94 tests/3+1 smoke，未实现 worker terminal finalization 或 Windows exit-code capture，也没有 fresh post-fix evidence |
| T4-002 | **PMC BLOCKED — runtime fix report remains analysis-only** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-FIX-REPORT-REV19-2026-06-28.md`；报告声明未修改 runtime，且没有 fresh tests/smokes；Popen handle/poll 根因仍缺直接证据 |
| T4-002 | **PMC RUNTIME FIX PASS — ready for bounded continuation** | `ai/reviews/REVIEW-T4-002-PMC-HERMES-WORKER-FINALIZATION-FIX-PASS-2026-06-28.md`；真实根因是 `chat -q` 缺少 terminal finalization；targeted tests 与 isolated 3+1 smokes 通过 |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C2 revision `-20`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV20-CONTINUATION-APPROVAL-2026-06-28.md`；原 four-selector scope，继承全部 fingerprints，等待 Hermes ACK |
| T4-002 | **PMC RUNTIME ADVISORY — revision `-20` terminal** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV20-2026-06-28.md`；card body marker 丢失导致 policy bypass；不提高 budget、不拆 business scope、不发布 rev21 |
| T4-002 | **PMC REWORK — Unit C2 revision `-22` AC3 failed** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV22-REWORK-2026-06-29.md`；fingerprint `AC3_STALE_SAME_DUPLICATE_INSERT` |
| T4-002 | **PMC APPROVED（historical）— Unit C2 AC3 remediation revision `-23`** | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV23.md`；已因 transport failure terminal |
| T4-002 | **PMC RUNTIME FIX PASS — revision `-23` terminal** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV23-2026-06-29.md`；raw cron trace disproves CLI truncation，launcher regression 4/4 PASS |
| T4-002 | **PMC APPROVED — transport-fixed revision `-24`** | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV24.md`；fresh cards/keys，business Scope unchanged |
| T4-002 | **PMC BLOCKED — revision `-25` Dispatcher timeout with unclaimable child** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV25-2026-06-29.md`；等待 fresh runtime diagnostics，不发布 rev26 |
| T4-002 | **PMC RUNTIME FIX PASS — atomic dispatch verified** | `ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md`；atomic parent/child transaction + terminal worker short-circuit，ready for bounded continuation |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C2 revision `-26`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-CONTINUATION-APPROVAL-2026-06-29.md`；fresh cards/keys，继承全部 fingerprints，等待 Hermes ACK |
| T4-002 | **PMC CONTINUATION APPROVED — Unit C2 revision `-26r1` review lifecycle** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-REVIEW-LIFECYCLE-2026-06-29.md`；Executor 8/8 自报 PASS，发布 `REVIEW_DISPATCH_ONLY`，等待 Hermes ACK |
| T4-002 | **PMC BLOCKED — revision `-26r1` review dispatch terminal** | `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV26R1-2026-06-30.md`；persisted `DISPATCH_ONLY` 与 Queue `REVIEW_DISPATCH_ONLY` 冲突，run `#126` timeout，未创建 Reviewer/HANDOFF |
| T4-002 | **PMC PASS — Unit C2 revision `-26` / lifecycle `-26r2`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-PASS-2026-07-01.md`；Reviewer 4 unit + 4 real MySQL PASS，canonical HANDOFF complete |
| T4-002 | **PMC APPROVED — Unit C3 revision `-27`** | `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV27.md`；read-only business files，等待 Hermes ACK |
| T4-002 | **PMC REWORK — Unit C3 revision `-27`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV27-REWORK-2026-07-01.md`；5 selectors = 1 PASS / 4 FAIL / 1 ERROR |
| T4-002 | **PMC APPROVED — Unit C3 remediation revision `-28`** | `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV28.md`；destination FK validation + deterministic test isolation/resource cleanup |
| T4-002 | **PMC BLOCKED — Unit C3 revision `-28` cleanup hard gate failed** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV28-BLOCKED-2026-07-01.md`；fingerprint `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`；不进入 Review lifecycle |
| T4-002 | **PMC REWORK AUTHORIZED（historical）— Unit C3 revision `-29`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-REWORK-AUTHORIZATION-2026-07-01.md`；Human Owner 明确授权的 bounded correction 已执行并进入 terminal review |
| T4-002 | **PMC BLOCKED — Unit C3 revision `-29` cleanup correction failed** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`；fingerprint `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`；不进入 Review lifecycle |
| T4-002 | **PMC BLOCKED — Unit C3 revision `-30` cleanup lifecycle hard gates failed** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-BLOCKED-2026-07-01.md`；fingerprint `REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`；无 Independent Review 或 replacement Queue |
| T4-002 | **PMC TERMINAL RECONCILIATION — revision `-30`** | `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-RECONCILIATION-2026-07-02.md`；`ACK_TERMINAL_VERDICT_AND_STOP`；不授权 revision `-31` |

## Verified Baseline

- T4-002 安全复验：排除 destructive `DisposableMySQLTests` 后 29 tests passed；源码内存语法检查 passed。
- frontend：`npm run build` passed，4622 modules transformed。
- MySQL：8.0.43；`revid_db` revision `a1b2c3d4e5f6`；12 张 app table 均为 InnoDB/utf8mb4，表与字段备注完整。
- 系统 Python 缺少 `annotated_doc`；backend 验证必须使用项目 `.venv` 或先修复环境。
- 工作区存在大量未提交修改，Executor 必须先核对目标文件 diff，不得覆盖其他任务或用户工作。

## Ready / Running

- 当前无 executable Queue。T4-010 Unit B revision `-38` terminal `PMC_BLOCKED`，等待 Hermes 以同 revision/fingerprint `ACK_TERMINAL_VERDICT_AND_STOP`；revision 35/37/38 cards 与 keys 均不可复用。
- T4-002 revision `-27`/`-28`/`-29`/`-30` Dispatcher/Executor/cards/keys 均为 terminal evidence，不可复用。
- Hermes 中文输出：`REPORT-SOUL-DEPLOYMENT-2026-06-28.md` 声明五个 SOUL 已部署并通过 marker 检查；execution profile 的实际 Kanban sample output 尚未验证。当前 paused cron 不得自动恢复。
- T4-010 — T4-006 dependency 已满足；Unit A revision 34 已 stage-accepted；rev37 已证明 runtime terminal-transition health，Unit B revision 38 已发布。
- Units D-E 仍仅为后续顺序计划，必须等待 Unit C3 获得 fresh authorization、完成 REPORT、Independent REVIEW/HANDOFF 与 PMC final PASS。

## Blockers

- T4-010 Unit B revision `-38`：REPORT 仅披露实际 viewport `1264x625`，未提供 Task 要求的 `1440x900`、`920x900`、`375x812` 三 viewport screenshots 与逐 viewport console/network/overflow artifacts；`ai/evidence/T4-010/unit-b/` 不存在。Fresh build 与 scoped diff check 通过但不能替代 browser Hard Gate。Attempt Policy 禁止 automatic business REWORK；等待 terminal ACK，未来 correction 需 fresh PMC authorization。

- T4-003 继续依赖完整 T4-002 完成与 PMC 验收；Unit C1 PASS 不单独解锁 T4-003。
- T4-002 Unit C1 revision `-18` 与 lifecycle continuation `-18r1`：PMC final acceptance 已通过；不得重复 dispatch 或复用该 chain。Executor 的 premature HANDOFF 为 non-canonical historical evidence。
- T4-002 Unit B revision `-15`：PMC final acceptance 已通过；不得重复 dispatch 或复用 rev15 chain。
- T4-002 Unit A revision `-11`：Coordinator `t_083a9aab` run `#84` 在 121s timeout，未创建 Executor/Reviewer；该 chain 已终止，不得复用。
- T4-002 revision `-10`：Coordinator `t_b788cdb9` run `#82` 在 908s timeout；Executor `t_3769f8ec` run `#83` `pid not alive` crash 后因 parent blocked 无法 claim retry；REPORT/Independent REVIEW/HANDOFF 均不存在。
- T4-002 Unit A revision `-12`：只允许修改 `backend/scripts/migrate_sqlite_to_mysql.py`、`backend/tests/test_migration_tool.py` 及 Unit A PLAN/PROGRESS/REPORT/REVIEW/HANDOFF；Coordinator dispatch budget 为 300s；禁止 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE 和 migration write。
- T4-002 Unit A revision `-12` 已 HANDOFF_READY 但 PMC 未通过：fresh missing-source check 仍先返回 `REVID_TEST_MYSQL_ADMIN_URL is not set`，AC12 cleanup failure injection patch 未命中实际 local callable binding，REPORT/Independent REVIEW 未准确覆盖 `backend/tests/test_migration_tool.py` diff。
- T4-002 Unit A correction revision `-13`：PMC final acceptance 已通过；不得重复 dispatch 或复用 revision `-13` chain。
- T4-002 Unit B revision `-14`：只允许修改 `backend/scripts/migrate_sqlite_to_mysql.py`、`backend/tests/test_migration_tool.py` 及 Unit B PLAN/PROGRESS/REPORT/REVIEW/HANDOFF；不允许 MySQL、secret、`.env`、CREATE/DROP/TRUNCATE/DELETE、migration write、Unit C 或 attempt 2。
- T4-002 Unit B revision `-14` 当前不可验收：REPORT 存在但 Executor card 未完成，Independent REVIEW 与 HANDOFF 缺失；Hermes Gateway 已恢复；local bounded verification shows Unit B tests are fast (`7 passed`), so blocker is runtime/dispatcher completion, not business-test duration。
- T4-002 Unit C revision `-16`：Coordinator `t_aeaefef4` 在 Executor dispatch 前 300s timeout，process retry `1/1` exhausted；没有 PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。该 chain 已终止，不得复用或重试。
- T4-002 Unit C1 revision `-17`：Coordinator dispatch target 为 120s；若再次 pre-dispatch timeout，转 infrastructure blocked，不自动发布 rev18。若 `REVID_TEST_MYSQL_ADMIN_URL` 缺失、权限不足或 identity 不明，必须 BLOCKED；禁止回退 `.env` 或触碰 `revid_db`。
- T4-002 Unit C1 revision `-17` 已触发上述 stop condition：Coordinator `t_3e1f6a06` run `#101` 在 Executor dispatch 前 120s timeout，process retry `1/1` exhausted；没有 Executor、PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。不得重复 dispatch 或自动发布 rev18。
- T4-002 Unit C2 revision `-19`：Coordinator `t_b493a47f` run `#113` 未创建 Executor；该旧 chain terminal 且不得复用。Hermes worker finalization 已由后续 PMC runtime fix 修复并通过 fresh tests/smokes；revision `-20` 是唯一获批 continuation。
- T4-002 Unit C2 revision `-20`：Coordinator `t_1617a921` run `#114` 的 card body 只有 Task path 引用，缺少 standalone `Action: DISPATCH_ONLY`；runtime 静默回退 unrestricted tools，日志出现 `git status`、`hermes profile list`、`ls`，121s timeout、retry `1/1` exhausted、Executor 未创建。Hermes execution status 文件仍停在 revision `-19`，与 direct card evidence 冲突，需由 Supervisor reconcile。
- T4-002 Unit C2 revision `-22`：Executor `t_4f178d0c` run `#119` 完成四项 verification，3 PASS / 1 FAIL。AC3 失败根因是 `migrate_table()` 统计 `stale_same` 后仍遍历全部 source rows 执行 INSERT。Revision 已 `PMC_REWORK` 收口，禁止 redispatch/retry/unblock/reuse。
- T4-002 Unit C2 revision `-23` 已 terminal：Coordinator `t_1dea37a2` run `#120` 在 spawn 前 `MISSING_WORKER_ACTION_MARKER`。禁止删除、archive、retry、unblock 或复用；无 business diff/artifacts。
|- T4-002 Unit C2 revision `-24`：Coordinator `t_53630896` run `#121` 在 Executor dispatch 前 timeout，旧 chain terminal 且不得复用。Revision `-25` 已改由专用 `revid-dispatcher` 承担初始 dispatch，使用 fresh key/card。
- T4-002 Unit C2 revision `-25`：Dispatcher `t_cc15e296` run `#122` 与 child `t_25ac2145` 保持 terminal evidence。后续 runtime fix 已将 child create/link、parent complete 和 child promote 合并为一个 transaction，并在 terminal transition 后跳过 follow-up model call；live Gateway smoke 已证明 parent/child 状态与 worker 退出。旧 child contract 仍不合格，因此不得释放或复用。
- T4-002 Unit C2 revision `-26` / lifecycle `-26r2`：PMC final acceptance 已通过；不得重复 dispatch 或复用任何 business/review/handoff card。Executor REPORT 的 command/cleanup wording 缺陷已在 PMC review 记录，后续 REPORT 不得复制。
- T4-002 Unit C3 revision `-27`：Executor `t_d97dcb15` 完成 5 个 real-MySQL selectors，但仅 AC11 PASS；AC4/AC6/AC10/AC12 FAIL 且 teardown ERROR。该 revision 已 `PMC_REWORK`，禁止进入 Review lifecycle、重派或复用；只允许 revision `-28` 的 bounded remediation。
- T4-002 Unit C3 revision `-28`：Executor `t_670af729` 自报 5/5 PASS，但 AC4 orphan cleanup 仍位于 assertion 之后，failure path 会跳过删除并污染 disposable database。由于 Queue 明确禁止进一步 automatic business rework，本轮 `PMC_BLOCKED` 且不发布 lifecycle/replacement Queue。
- T4-002 Unit C3 revision `-29`：Executor `t_77c46dc4` 自报 6 个 verification commands PASS，但 orphan deletion 仍未进入 failure-safe `finally`，non-MySQL regression 也未绑定实际 deletion cleanup state。该 revision 已 terminal `PMC_BLOCKED`，禁止进入 Review lifecycle、重派或复用。
- T4-002 review lifecycle revision `-26r1`：Coordinator `t_f46c8d6e` run `#126` action mismatch/timeout chain 保持 terminal historical evidence；后续 `-26r2` 已以 fresh keys 完成，不改变该历史 fingerprint。
- Hermes revision `-19` escalation 未通过 PMC：`94 tests + 3 positive smokes + 1 negative smoke` 属于旧 thin-dispatcher policy evidence，不证明新识别的 terminal-transition/Windows exit-status 缺陷已修复；card-body、board、OOM、segfault 推测没有直接证据。
- T4-002 thin-dispatcher remediation：Smoke 1 `t_20945c04` crash，只有 runs `#103/#105` 两次成功；run `#107` 未实际尝试违规操作；metadata 只有 timing step 名称而无数值 elapsed；worker logs 出现 allowlist 外的 navigate/skills/cron/terminal；当前不能证明 runtime tool boundary。
- 上述 Hermes 自报 remediation blocker 已由后续 Codex direct runtime fix supersede：mode-specific exact policy 已进入 worker spawn、schema filtering 和 invalid-call fast fail；旧 failure fingerprint 仍由 revision `-18` 继承，不得删除。
- T4-002 revision `-08`：Executor run `#78` timeout，retry run `#79` `pid not alive`；process retry `1/1` exhausted，REPORT/Independent REVIEW/HANDOFF 均不存在。
- 2026-06-25 12:10 runtime diagnostic 已说明 run `#78` 更像 900s budget timeout、run `#79` 为 process crash；Human Owner 已确认 `revid-pm` 即 Hermes runtime owner，并接受该 diagnostic 的 `READY_FOR_CONTINUATION` 结论作为解阻依据。
- historical partial diff 曾未通过真实 MySQL 13 tests；Unit A correction 已通过 fresh static verification 和同 revision/attempt evidence chain，但 full MySQL verification 仍未执行，需等 Unit C。
- continuation 条件：Hermes 应为 Executor 使用 1800s runtime budget；若 runtime 不支持该预算，则必须拆成适配现有限制的 bounded work units。禁止 attempt 2，禁止清零 failure fingerprint。
- T4-002 旧 Executor `t_68c68e4e` 的 run `#72`、`#73` 均因 `pid not alive` crash，旧 chain 已作废且禁止复用；该历史不再阻止 revision `-07` 创建新 chain。
- revision `-07` 只有 PLAN 和未完成 PROGRESS，没有 REPORT、Independent REVIEW 或 HANDOFF；execution 已终止，旧 chain 不再 active。
- 旧 Coordinator `t_d626b42d` 与 Executor child `t_4a89bb5e` 已作废；禁止手工恢复、claim、promote、unblock 或复用。
- PMC 已基于 Gateway UP、无 active worker 与 Human User 明确推进指令接受一次 recovery dispatch 风险；不再等待额外 worker stability 证明。
- 禁止在用户现有数据库执行 downgrade/drop/truncate；destructive 验证只能在专用测试库并获得明确授权。
- T4-002 historical fresh audit 曾发现 idempotency comparison、AC10、AC11、cleanup failure、missing-source coverage 与 test isolation 缺陷；Unit A/B 已通过对应 bounded verification，剩余真实 disposable MySQL 端到端验证进入 Unit C。

## Next Review Gate

- T4-010：下一 gate 是 Hermes 以 fingerprint `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING` ACK revision 38 terminal verdict；在 fresh PMC authorization 前不发布 browser correction、Reviewer 或 HANDOFF Queue。

- T4-002：revision `-29` 已 terminal `PMC_BLOCKED`；不发布 Review lifecycle 或 replacement revision。未来 fresh authorization 必须把 orphan deletion 绑定到 failure-safe cleanup，并以同一 lifecycle/helper 的 non-MySQL injected-failure test 证明 deletion-equivalent state。
- Hermes language：五个 SOUL 模板已部署（default + 4 execution profiles），中文 marker 验证通过，profile descriptions 已更新。Revid cron 保持 paused。
- T4-006：已完成并归档。依赖 T4-006 的 Task 仅视为该 dependency 已满足；是否执行仍由后续 Queue revision 决定。
