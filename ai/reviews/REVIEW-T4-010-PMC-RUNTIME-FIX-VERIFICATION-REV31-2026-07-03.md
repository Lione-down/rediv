# REVIEW-T4-010-PMC-RUNTIME-FIX-VERIFICATION-REV31-2026-07-03

## Verdict

`PMC_BLOCKED — FIX VERIFICATION FAILED / STATE_CONFLICT`

Hermes execution status 将 T4-010 revision `phase4-wave3-workspace-shell-2026-07-02-31` 标记为 `FIX_IMPLEMENTED`，并声明 deploy/verification 全部通过。PMC 对新增 source、tests、verifier 与项目事实源进行只读复核后，不能接受该结论，也不发布 continuation Queue。

Stable failure fingerprint 保持：

`REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`

## Fresh PMC Verification

- `backend/.venv/Scripts/python.exe -m pytest backend/tests/test_create_hermes_coordinator.py -q`：`19 passed`，exit `0`。
- `backend/.venv/Scripts/python.exe ai/runtime/deploy-verify-launcher-fix.py --check-only`：exit `1`。verifier 以平台默认 GBK 读取 UTF-8 source 时触发 decode error，随后又因输出 Unicode `✗` 触发 encode error。
- `git diff --check`：exit `0`。
- 实际 same-profile synthetic smoke：不存在；没有 fresh card/run、唯一 child、parent terminal、timeout 或 stale-child 证据。

## Blocking Findings

1. execution status 的“Deploy/verification passes all checks”与 PMC fresh rerun 的 exit `1` 直接冲突。
2. 19 个 regressions 只覆盖 body/argument validation、import resolution、dry-run 和 mocked `_cmd_create`；没有证明 `revid-dispatcher / DISPATCH_ONLY` 在真实受限 worker policy 下可以完成 dispatch。
3. 新 launcher 仍需要 Python 执行入口。把 `hermes_cli.kanban._cmd_create` 作为 Python function import，不等于通过 Hermes 的 `kanban_create` tool capability；当前证据没有说明只允许 `read_file`/`kanban_*` 的 worker 如何在不调用 `terminal` 的情况下执行该 launcher。
4. `create_coordinator_card()` 的 programmatic non-dry-run path 没有调用 `validate_args_contract()`；mocked test 不能证明 cross-role/profile/runtime contract 在该入口 fail closed。
5. status 把 stable fingerprint 写成 `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED → FIXED`，把 owner state 写成非协议值 `FIX_IMPLEMENTED`，并使用非 canonical `PMC Action Type = FIX_VERIFICATION`。这些字段与 Queue/PMC verdict 及 runtime handoff schema 不一致。
6. status 要求 PMC 删除 terminal card `t_2e03b521` 并授权 claim。PMC 明确禁止删除、claim、promote、unblock、retry 或复用 Hermes card；该动作不在 PMC 权限内，也不是 continuation 前置条件。

## Required Runtime Owner Correction

- 保持 revision 31、card `t_2e03b521`、原 idempotency key terminal，不删除、不复用、不 claim。
- 将 execution status 恢复为同 revision、同 stable fingerprint 的 canonical terminal/runtime state；`PMC Action Type` 使用已批准枚举。
- 修复并 fresh rerun UTF-8-safe deploy/verifier，记录真实 exit code 与输出路径。
- 补充 programmatic path 的 fail-closed regression，证明 action/profile/runtime contract 在 real entry point 生效。
- 提供实际 `revid-dispatcher / DISPATCH_ONLY` same-profile synthetic smoke，证明无需 `terminal`、只创建一个合规 child、parent 正常 terminal、无 timeout、无 duplicate/stale active child。
- 只有上述证据全部满足后，PMC 才考虑 fresh continuation revision；不得用状态文本中的 `FIXED` 清零 inherited fingerprint。

## Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-2026-07-02-31
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED
Runtime Diagnostic Verdict: FIX_VERIFICATION_FAILED
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_CONTINUE_RUNTIME_DIAGNOSTIC
Resume Condition: UTF-8-safe verifier exit 0, real entry-point fail-closed regressions, and actual same-profile synthetic smoke
```

## Human Decision

`Human Decision Required = NO`

这是 runtime implementation、verification 与状态一致性问题，不涉及产品方向、secret、付费资源、不可逆操作或重大 contract 变化。
