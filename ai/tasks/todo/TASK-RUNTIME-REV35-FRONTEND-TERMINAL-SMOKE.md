# Task: Rev35 Frontend Terminal Transition Smoke

## Metadata

- Task ID: `RUNTIME-REV35-FRONTEND-TERMINAL-SMOKE`
- Planned Revision: `runtime-rev35-frontend-terminal-smoke-2026-07-04-37`
- Status: `APPROVED — WAITING FOR HERMES ACK`
- Category: `Runtime / Infrastructure`
- Executor: `revid-frontend`
- Action: `IMPLEMENT_AND_TEST_ONLY`
- Previous Failure Fingerprint: `REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`

## Objective

使用 fresh `revid-frontend` Kanban chain 验证 Windows invalid-byte background output 不再使 reader thread 崩溃，并证明 worker 能在写出 canonical smoke report 后显式调用 terminal lifecycle tool。

## Allowed Read

- 本 Task 文件。
- Installed `tools/process_registry.py` 中 `spawn_local()` 的 `encoding="utf-8"` / `errors="replace"` guard，仅作只读确认。

## Allowed Write

- `ai/reports/SMOKE-RUNTIME-REV35-FRONTEND-TERMINAL-2026-07-04.md`

## Exact Procedure

1. 只读本 Task；不得读取 CURRENT、ROADMAP、T4-010、T4-002、业务源码或 skills。
2. 使用 background process rail 执行：`python -c "import os; os.write(1, bytes([180,10]))"`。
3. Poll/wait 至 process exit；确认 exit code `0`，output 中出现 Unicode replacement character `�`，且没有 `_readerthread` / `UnicodeDecodeError`。
4. 写入唯一 Allowed Write，记录 revision、profile、exact command、process id、exit code、sanitized output semantics、worker session、verdict 与 stop marker；不得包含 secret 或环境变量值。
5. Read back report 后，显式调用 `kanban_complete`，result 必须包含 `READY_FOR_CONTINUATION_RUNTIME_ONLY` 与 report path。不得以 plain text 结束。

## Hard Gates

- Fresh Dispatcher 与 Executor card/idempotency keys；不得复用、retry、unblock、claim、promote、reparent 或删除 rev35 chain。
- Dispatcher budget `120s`；Executor budget `300s`；one smoke attempt，runtime policy最多两次 process retry；禁止 business REWORK。
- 不启动 browser、dev server、build、tests、database 或 network。
- 不修改任何业务文件、Queue、CURRENT、ROADMAP、execution status、profile 或 runtime source。
- 任一 decode、process、artifact、tool-policy 或 terminal-call failure 必须显式 `kanban_block`，不得 clean-exit plain text。

## Acceptance Criteria

- Background process exit `0`，invalid byte 被 replacement character 安全表示。
- Report 位于 project-root `ai/reports/`，且业务 diff 前后不变。
- Executor card/run 由 worker 自身显式进入 `done` 或带精确 smoke fingerprint 的 `blocked`，不得再次出现 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`。
- PASS report 包含 `Verdict: READY_FOR_CONTINUATION_RUNTIME_ONLY`。
- PASS report 包含 `Stop Marker: RUNTIME_REV35_FRONTEND_TERMINAL_SMOKE_READY`。

## Stop After

`RUNTIME_REV35_FRONTEND_TERMINAL_SMOKE_READY`。不创建 Reviewer、HANDOFF、Unit B 或其他 child；等待 Codex PMC 验收并决定 Unit B continuation。
