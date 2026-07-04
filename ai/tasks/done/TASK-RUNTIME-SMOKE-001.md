# Task: Frontend Profile Artifact Root Smoke

## Metadata

- Task ID: `RUNTIME-SMOKE-001`
- Revision: `runtime-frontend-artifact-root-smoke-2026-07-03-01`
- Status: `DONE — RUNTIME GATE VERIFIED`
- Category: `Frontend Runtime / Infrastructure`
- Executor: `revid-frontend`
- Action: `IMPLEMENT_AND_TEST_ONLY`

## Objective

仅验证 `revid-frontend` profile 在 terminal cwd 切换到 `frontend/` 后，仍能使用 project-root 绝对路径写入 canonical evidence；不得读取或修改任何业务源码。

## Allowed Read

- 本 Task 文件。
- `git rev-parse --show-toplevel` 与 `pwd`/当前目录输出。

## Allowed Write

- `ai/reports/SMOKE-RUNTIME-FRONTEND-ARTIFACT-ROOT-2026-07-03.md`

## Exact Procedure

1. 记录 initial cwd，并运行 `git rev-parse --show-toplevel` 得到 project root。
2. 将 terminal cwd 切换到 `<project-root>/frontend`，记录 changed cwd。
3. 使用绝对路径写入唯一 Allowed Write，随后 read-back。报告只包含 profile、action、两个 cwd、project root、artifact absolute path、verdict 和 stop marker。

## Forbidden

- 不读取 `CURRENT`、ROADMAP、T4-010、design system、frontend 源码或任何其他项目文件。
- 不写 `frontend/ai/`、业务代码、PLAN/PROGRESS、Queue、CURRENT、cron、memory、skills 或 Kanban。
- 不运行 build、browser、tests、server 或长任务。
- 不读取或输出 secret。

## Success Criteria

- 唯一新增文件位于 project-root `ai/reports/`。
- `frontend/ai/` 与业务 diff 保持不变。
- 报告包含 `Verdict: READY_FOR_CONTINUATION_RUNTIME_ONLY`。
- 报告包含 `Stop Marker: FRONTEND_PROFILE_ARTIFACT_ROOT_SMOKE_READY`。
- Executor 在完成 read-back 后立即停止。

## Attempt History

- Attempt 1（带 T4-010 上下文）：超时并扩大为业务源码审计，无报告。
- Attempt 2（独立 Task，修复前）：超时；强制加载 project-management skills、CURRENT/ROADMAP 并枚举任务，无报告。
- Attempt 3（canonical/deployed SOUL 增加 `RUNTIME-SMOKE-` fast path 后）：15.7 秒退出，session `20260703_165209_783f5c` 仅包含 user prompt 与 assistant `...`，零 tool calls、零报告。

三种路径均未满足 Success Criteria；按 diagnostic hard stop 不再重试。解除条件是 Hermes runtime owner 提供可解释的 no-tool-call root cause、targeted runtime regression 和 fresh same-profile evidence。

## Attempt 4 — Runtime Guard Verification

- Root cause：non-empty punctuation-only output 绕过 empty-response 与 intent-ack guards，被当作正常 terminal text。
- Runtime regression：`95 passed`；project deploy/verifier tests：`6 passed`；`ROLE_CONTRACTS_OK`。
- Fresh session：`20260703_170448_3ce6cd`。
- Tool sequence：`read_file → terminal → write_file → read_file`。
- Evidence SHA256：`7EF5919F4BB0A11BBA3A57444323E405E4319A4EF5F1195BDF4B92FEDDF03B9F`。
- Business diff SHA256 before/after：`BC30FF84C71C46F75C2D45157CE1A6C2DFF43D0AF852CD360FDB9501222DA0A9`。
- Verdict：`READY_FOR_CONTINUATION_RUNTIME_ONLY`。
