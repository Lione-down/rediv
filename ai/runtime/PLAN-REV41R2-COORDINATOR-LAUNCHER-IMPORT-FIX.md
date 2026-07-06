# Plan: Revision 41r2 Coordinator Launcher Import Fix

## Objective

修复 `create-hermes-coordinator.py` 在非 Hermes Python 环境中导入 `_cmd_create` 后过早移除 Hermes source path，导致实际创建 card 时 lazy-import `hermes_state` 失败的问题。

## Scope

- `ai/runtime/create-hermes-coordinator.py`
- `ai/runtime/tests/test_create_hermes_coordinator.py`
- `ai/prompts/hermes-revid-pm-soul.md`
- `ai/runtime/tests/test_verify_hermes_role_contracts.py`
- 本 PLAN/PROGRESS

## Non-goals

- 不修改 Queue、Hermes execution status、业务代码或既有 card。
- 不改变 Action/profile/idempotency contract。

## Verification

1. Regression test 证明 successful resolver path 在 `_cmd_create` 调用期间保持可用。
2. `test_create_hermes_coordinator.py` 全部通过。
3. `verify-hermes-role-contracts.py` 返回 `ROLE_CONTRACTS_OK`。
4. `git diff --check` 通过。

## Follow-up Runtime Contract

Rev41r2 run #171 证明 Reviewer `kanban_create` payload 遗漏 `parents`。SOUL 必须明确规定 Reviewer child 的唯一 parent 是当前 `REVIEW_DISPATCH_ONLY` Coordinator card，并由 regression test 锁定该 marker。
