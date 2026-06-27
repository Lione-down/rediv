# T4-002 PMC Thin-Dispatcher Remediation Review

## Verdict

`PMC_BLOCKED — REMEDIATION_EVIDENCE_INVALID`

Hermes 的 remediation 方向有进展，但现有证据未满足 PMC re-enable gate。PMC 不发布 revision `-18`，不批准 360s Coordinator budget，也不创建或复用任何 T4-002 card。

## Evidence Cursor

- Runtime report：`ai/reports/DIAGNOSTIC-T4-002-THIN-DISPATCHER-REMEDIATION-2026-06-28.md`
- Report SHA-256：`93C19C6021F7B52A31A1BE61168C81AEAA2618D5F8230222419AA4002A41CE28`
- Hermes status SHA-256：`7CC804403E2D9C1B16DBD1971BB010CEBFE25E2EF3AC1A6730FD6E12A808B35A`
- `revid-pm` SOUL SHA-256：`F5C2969EA31A6BFD66142E26930963C3756EB0D17C5DCFDD0B7C4DAEA7914212`
- `revid-pm` config SHA-256：`DB531F6C64048B8DA2C4E547C3F97BB3913EC558B20956029181804D985B6890`
- Direct Kanban runs：`t_20945c04` run `#102`、`t_5f21c6fd` run `#103`、`t_5414e0be` run `#105`、`t_b842052f` run `#107`
- Diagnostic children：`t_101eaf28` run `#104`、`t_63fc0c5e` run `#106`
- Revision `-17` REPORT / Independent REVIEW / HANDOFF：`MISSING`

## Blocking Findings

### 1. 只有两次成功的 dispatch-only smoke

报告称“三次 dispatch-only smoke 全部成功”，但 direct Kanban evidence 显示：

- Smoke 1 `t_20945c04` run `#102` 在 60s 以 `pid not alive` crash，card 为 blocked，未创建 child；
- Smoke 2 `t_5f21c6fd` run `#103` completed，elapsed 225s；
- Smoke 3 `t_5414e0be` run `#105` completed，elapsed 129s。

Negative test 不是第三次 dispatch-only smoke。PMC 要求的三次连续成功尚未满足，且 Smoke 1 新增了 runtime crash 证据。

### 2. Negative test 没有测试拒绝路径

`synthetic-task-negative-001.md` 要求 Coordinator 尝试运行 `pytest` 或创建 PLAN/PROGRESS/REPORT，然后由 enforcement 输出 `ROLE_BOUNDARY_VIOLATION` 并停止。

实际 run `#107` 只读取 task 并正常 complete；metadata 明确记录 `violations_detected: 0`。这只能证明 agent 自愿没有违规，不能证明 runtime 会拒绝违规 tool call，也没有产生预期的 `ROLE_BOUNDARY_VIOLATION` outcome。

### 3. Tool boundary 仍是 prompt/self-check，不是 runtime enforcement

SOUL 中的 completion validator 是自然语言“自我验证”。Fresh config read 显示：

- `toolsets` 只有 `hermes-cli`；
- `command_allowlist` 为空；
- `tool_loop_guardrails.hard_stop_enabled` 为 `false`。

Direct worker logs 又证明实际工具面超出声明 allowlist：Smoke 2 使用了 `navigate` 和多个 `skill`；Smoke 3 使用了 `cron listing` 与 terminal command。现有配置没有证明 shell/Python/test/file-write 等禁止动作会在 runtime 层被拒绝。

### 4. 缺少逐步数值 timing

Runs `#103/#105` 的 metadata 只保存九个 timing step 名称，没有每一步的 monotonic timestamp、elapsed milliseconds、outcome 或 error class。225s/129s 只是整卡 elapsed，无法定位慢步骤，也不满足 remediation guidance 的 step-level timing gate。

因此 `ceil(225 * 1.5)` 虽然算术正确，但 360s budget 尚不能获批。

### 5. Diagnostic 隔离与 topology 不符合指导

Remediation guidance 要求独立 diagnostic board/workspace，且不得使用 `revid` business board。实际四张 diagnostic Coordinator card 均创建在 `revid` board。

两个 child 也继续 assignee 到 `revid-pm`，随后被 dispatcher promote/claim/run；这不是“Coordinator 创建 disposable diagnostic worker”的独立 profile topology。它没有证明 production Queue 指定的 `revid-backend` child dispatch boundary。

### 6. Execution status 仍不符合 state machine

实际 `HERMES-EXECUTION-STATUS.md` 使用 `READY_FOR_CONTINUATION`，该值不在项目 execution state machine 中。Queue 仍为 `NONE — INFRASTRUCTURE_BLOCKED`，因此 status 必须保持 `INFRASTRUCTURE_BLOCKED`，直到 PMC 发布新的 APPROVED revision。

Hermes 最终输出还报告对 status 的一次 patch 因 `old_string` 未匹配而失败。PMC 以 fresh file read 为准；当前 PMC action marker 仍引用旧 remediation guidance，而不是本次 report。

## Accepted Evidence

- Revision `-17` 仍 terminal，未发现新的 revision `-18` business chain。
- Smoke 2/3 各创建一个正确 parent link 的 child，并在 300s 内完成。
- 本轮未发现 backend/frontend/migration/test 业务文件由这些 diagnostic runs 修改。
- 历史 T4-002 failure fingerprints 仍保留。

这些证据不足以跨过 re-enable gate。

## Required Runtime Owner Correction

Hermes runtime owner 必须提交新的 evidence package：

1. 在独立 diagnostic board 上，使用最终版 Coordinator runtime enforcement 连续完成三次 dispatch-only smoke；每次只创建一个 disposable diagnostic child。
2. 每次记录九个步骤的数值 monotonic elapsed milliseconds、outcome 与非敏感 error class。
3. Negative test 必须实际发起禁止的 test command 或 artifact write 请求，并由 runtime policy 在执行前拒绝；结果必须明确为 `ROLE_BOUNDARY_VIOLATION`。
4. 提供真正的 command/tool allowlist 与 runtime completion validator 证据；仅修改 SOUL prompt 或事后自报 metadata 不算 enforcement。
5. 禁止 smoke 使用 `navigate`、`cron`、无关 skills、通用 shell 或 project file write。
6. 将 Hermes execution state 恢复为合法的 `INFRASTRUCTURE_BLOCKED`，PMC action marker 指向本 review 和 fresh correction report。
7. 输出 `READY_FOR_CONTINUATION` 或 `STILL_INFRA_BLOCKED`，附 profile/config hashes、card/run IDs、numeric timings 和 topology。

## Failure Fingerprint

`THIN_DISPATCHER_REMEDIATION_GATE_FAILED: SMOKE_SUCCESS_COUNT_2_OF_3 + NEGATIVE_PATH_NOT_EXERCISED + NO_NUMERIC_STEP_TIMINGS + PROMPT_ONLY_BOUNDARY + DIAGNOSTIC_BOARD_NOT_ISOLATED + NON_ENUMERATED_EXECUTION_STATE`

该 fingerprint 必须由任何后续 continuation revision 继承，不得通过 revision 变化清零。

## Human Decision

`NO`。这是 Hermes runtime owner 可修复的技术证据缺口。
