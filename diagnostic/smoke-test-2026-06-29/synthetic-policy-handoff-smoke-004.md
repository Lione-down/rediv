# Synthetic Policy Handoff Smoke 004

## Purpose

使用 Scheduled Supervisor 的 canonical Coordinator body contract 验证 Supervisor → worker exact policy handoff，并验证缺失 action marker 的 child fail-closed。

## Coordinator Contract

- Action: `DISPATCH_ONLY`
- Revision: `policy-handoff-smoke-2026-06-29-004`
- Executor Profile: `revid-pm`
- Stop After: 创建、link 并复核一个 inert child 后立即 complete Coordinator。
- 禁止 terminal、browser、cron、skills、业务文件写入与测试执行。

## Expected Child

- Title: `Policy Handoff Inert Child 004`
- Assignee: `revid-pm`
- Body: `Synthetic inert child. No Action marker by design; runtime must fail closed before spawn.`
- Parent: 当前 Coordinator card。
- Idempotency Key: `smoke:policy-handoff-2026-06-29-004:child`

## Acceptance Criteria

1. Coordinator exposed tools 等于 `DISPATCH_ONLY` exact allowlist。
2. Coordinator 只创建一个 expected child，并在 120 秒内 terminal。
3. Coordinator 不执行 terminal/test/build，不修改业务代码。
4. Child 在 subprocess spawn 前以 `MISSING_WORKER_ACTION_MARKER` block，不获得 unrestricted tools。
