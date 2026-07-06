# Plan: Revision 41r3 Reviewer Deadline-Aware Finalization

## Root Cause

Run #173 在 1814 秒内完成 77 次 model API call 与 91 次 tool call；API latency 累计 1620.9 秒。Reviewer 在计划 7/9 时仍继续逐步 browser verification，runtime 只有 1800 秒 hard kill，没有 soft deadline、verification round cap 或 finalization-only mode，且 REVIEW 只在全量验证结束后写入。

## Objective

让 `INDEPENDENT_REVIEW_ONLY` worker 在固定 hard runtime 内必然提前停止扩展验证、写出可审计 verdict，并完成自身 terminal transition；同时减少串行 model-per-tool 浏览器操作。

## Scope

- Hermes worker spawn：向 Reviewer 注入 action、hard/soft deadline 与 verification API-call cap。
- Hermes conversation loop：到 soft deadline 或 call cap 时进入 finalization-only mode，只保留 REVIEW 写入和自身 terminal lifecycle 工具。
- Reviewer SOUL：先写 provisional `BLOCKED` REVIEW，再执行 bounded batched verification；禁止重复 Tab 遍历和无界 browser 探索。
- Project-owned runtime patch、role verifier 与 regression tests。

## Non-goals

- 不修改业务代码、Task acceptance criteria、REPORT、Independent REVIEW 或 HANDOFF。
- 不复用、retry、unblock 或修改 rev41r3 历史 cards。
- 不通过无限提高 hard timeout 解决问题。
- 不降低 Independent Review 的验证语义。

## Design

1. `INDEPENDENT_REVIEW_ONLY` 默认保留 600 秒 finalization window；hard runtime 1800 秒时 soft deadline 为启动后 1200 秒。
2. 正常 verification 最多 24 次 model API call；任一条件先达到即进入 finalization-only mode。
3. Finalization mode 注入强制指令并把可见 tools 收窄为 `write_file`、`kanban_block`、`kanban_complete`、`kanban_comment`。
4. Reviewer 在读取 Task/REPORT 后、执行昂贵验证前先写 provisional `BLOCKED / REVIEW_INCOMPLETE_PENDING_VERIFICATION`，成功时再原子覆盖为最终 PASS/REWORK/BLOCKED。
5. Static/build/hash/diff 使用单个 batched terminal command；每个 viewport 只允许一条 bounded interaction sequence，禁止逐个 Tab 循环。

## Files

- Installed Hermes runtime: `hermes_cli/kanban_db.py`, `agent/conversation_loop.py` and focused tests.
- `ai/prompts/hermes-revid-reviewer-soul.md`
- `ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64`
- `ai/runtime/verify-hermes-role-contracts.py`
- `ai/runtime/tests/test_verify_hermes_role_contracts.py`
- `ai/runtime/tests/test_deploy_hermes_runtime_contracts.py`

## Acceptance Criteria

1. RED tests prove current runtime lacks deadline env injection and finalization trigger/tool narrowing.
2. GREEN tests prove only Reviewer action receives the new control contract.
3. Soft deadline and call cap independently trigger finalization exactly once.
4. Finalization tool surface excludes browser、terminal、process、execute_code、search 与 read expansion。
5. Canonical/deployed Reviewer SOUL and project-owned patch contain durable markers。
6. Targeted runtime tests、project runtime tests、`ROLE_CONTRACTS_OK` 与 `git diff --check` pass。
7. Fresh same-profile smoke produces a REVIEW artifact and explicit terminal state before hard deadline without touching business files or secrets。
8. `kanban_block` 与 `kanban_complete` 都会触发 conversation loop terminal short-circuit，不再产生 post-terminal provider calls。

## Risks

- Provider latency may consume the finalization reserve；600 秒与 no-new-verification tool narrowing mitigate it。
- Provisional REVIEW may remain after process failure；its verdict is explicitly BLOCKED and cannot unlock HANDOFF。
- Runtime update may overwrite installed changes；project-owned patch and verifier must fail closed on drift。
