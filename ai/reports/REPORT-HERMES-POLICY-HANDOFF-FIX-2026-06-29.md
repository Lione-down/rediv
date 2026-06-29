# Hermes Supervisor → Worker Policy Handoff Fix Report

## Verdict

`READY_FOR_CONTINUATION — ALL GATES PASSED`

## Root Cause

1. `hermes_cli/kanban_db.py::_resolve_worker_allowed_tools()` 在 profile 已配置 `worker_tool_policies`、但 card body 缺失或包含未知 standalone `Action:` 时返回 `None`；spawn 将其解释为 unrestricted。
2. Windows `hermes.cmd` shim 会截断 PowerShell multiline `--body` 参数；即使 Supervisor 构造了完整 body，card 也可能只保存第一行。

## Fix

- Runtime：missing action 抛出 `MISSING_WORKER_ACTION_MARKER`，unknown action 抛出 `UNKNOWN_WORKER_ACTION_MARKER`；均在 `Popen` 前 fail-closed。
- Supervisor contract：body 必须直接包含 action、revision、Task path、Executor profile、Stop After 和 idempotency key；创建后必须 `show` 复核。
- Windows transport：Supervisor 直接调用 `%LOCALAPPDATA%/hermes/hermes-agent/venv/Scripts/hermes.exe`，禁止通过 `hermes.cmd` 传 multiline body。

## Tests

- `tests/hermes_cli/test_kanban_worker_spawn_toolsets.py`: `6 passed in 2.41s`。
- 相邻 suite：`309 passed, 14 failed`；14 项为既有 Windows path、missing `concurrent_log_handler` 和 zombie-reaper 环境/平台失败，未命中本补丁 assertions。

## Fresh Runtime Evidence

| Evidence | Result |
|---|---|
| Truncated-body negative | `t_618cf250`, run `#1`, 0s `gave_up`, `MISSING_WORKER_ACTION_MARKER`, `worker_pid=null` |
| Canonical positive | `t_11db1342`, run `#2`, completed in 84s |
| Positive tools | worker log only `read` + Kanban show/create/complete surface；无 terminal/test/build |
| Child count | exactly one child `t_0896a51e` |
| Child fail-closed | `t_0896a51e`, run `#3`, 0s `spawn_failed`, `MISSING_WORKER_ACTION_MARKER`, `worker_pid=null` |

Isolated board：`revid-policy-handoff-smoke-20260629`。Business board、business code、database 与 secret 均未触碰。

## Security Confirmation

Human Owner 于 2026-06-29 确认旧 credential 已撤销并完成四个 Revid profiles 更新。Non-secret verification 显示四个 config 均在本轮更新、credential fingerprint 一致；`revid-pm` live probe 返回 `CREDENTIAL_OK`。Security gate 已解除。
