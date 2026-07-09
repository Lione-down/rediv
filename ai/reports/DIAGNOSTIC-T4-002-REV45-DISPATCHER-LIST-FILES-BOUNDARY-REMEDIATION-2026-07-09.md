# DIAGNOSTIC-T4-002-REV45-DISPATCHER-LIST-FILES-BOUNDARY-REMEDIATION-2026-07-09

## 结论

`STILL_INFRA_BLOCKED`

Hermes runtime owner 已对 `revid-dispatcher / DISPATCH_ONLY` 的实际提示合同做 least-privilege remediation：`ai/prompts/hermes-revid-dispatcher-soul.md` 与已部署的 `C:/Users/mkd/AppData/Local/hermes/profiles/revid-dispatcher/SOUL.md` 均明确要求 Dispatcher 使用 card body 中的精确 `Task Path` 调用 `read_file`，并禁止使用 `list_files`、`search_files` 或任何 discovery/listing 工具查找文件。

本轮没有 redispatch、没有创建 duplicate Coordinator、没有创建 Executor/Reviewer/HANDOFF、没有修改业务代码、没有访问数据库、没有读取 `.env` 或 secret、没有操作历史 card。

## 范围

- Queue Revision: `phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45`
- Task ID: `T4-002`
- Coordinator: `t_d6f567bb`
- Coordinator Run: `#201`
- Failure Fingerprint: `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION`
- Runtime Advisory: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV45-2026-07-09.md`
- PMC Diagnostic Review: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV45-2026-07-09.md`

## 本轮执行的修复

1. 更新 `ai/prompts/hermes-revid-dispatcher-soul.md`：新增明确约束，读取 Task 时必须直接使用精确 `Task Path` 调用 `read_file`，禁止 `list_files` / `search_files` / discovery-listing 工具。
2. 同步更新已部署 profile 文件 `C:/Users/mkd/AppData/Local/hermes/profiles/revid-dispatcher/SOUL.md`。
3. 运行 `python ai/runtime/verify-hermes-role-contracts.py`，结果为 `ROLE_CONTRACTS_OK`。
4. 运行 `create-hermes-coordinator.py --dry-run` 构造 synthetic rev45-style `DISPATCH_ONLY` body，验证 launcher contract 能生成包含精确 Task Path、Executor Profile、Executor Action、Executor Idempotency Key、Executor Max Runtime、Executor Stop After 和 Coordinator Idempotency Key 的 body；该 dry-run 未创建 card。

## 只读 / 非破坏性证据

| Evidence | Result |
|---|---|
| `python ai/runtime/reconcile-hermes-execution-status.py --check` | `STATUS_OK` |
| `python ai/runtime/verify-hermes-role-contracts.py` | `ROLE_CONTRACTS_OK` |
| `hermes kanban --board revid show t_d6f567bb` | card 仍为 `blocked`；latest summary 仍为 `ROLE_BOUNDARY_VIOLATION: tool 'list_files' is not allowed for Kanban task t_d6f567bb.` |
| `hermes kanban --board revid runs t_d6f567bb --json` | run `#201` 仍为 `blocked`，duration `41s`，无 Executor child |
| `search_files REPORT-T4-002-UNIT-D-REV45.md` | 未发现 Unit D REPORT |
| `create-hermes-coordinator.py --dry-run` | synthetic body/command 生成成功，未创建 card |

## 为什么仍是 `STILL_INFRA_BLOCKED`

本轮已经修复并部署了 Dispatcher SOUL 的 least-privilege 指令，但 canonical contract 要求 fresh non-destructive same-profile proof 证明实际 `revid-dispatcher / DISPATCH_ONLY` worker path 可以完成 dispatch 且不调用 `list_files`。当前安全边界禁止 redispatch rev45、创建真实 T4-002 Executor、操作历史 card 或创建 duplicate Coordinator；本轮只完成了部署一致性验证与 launcher dry-run，尚未取得真正的 same-profile worker completion proof。

因此，本轮不能声明 `READY_FOR_CONTINUATION`。继续真实 dispatch 仍需 Codex PMC 明确发布安全的 synthetic smoke / continuation 授权，或提供不触碰真实 T4-002 card 的 same-profile proof harness。

## Required Fix / 下一步

- 若 Codex PMC 允许，应发布一个明确的 non-destructive synthetic smoke contract，用 fresh synthetic task/card/key 验证 `revid-dispatcher / DISPATCH_ONLY` 在 Gateway worker 中不再调用 `list_files`，并能完成 least-privilege child creation read-back。
- 在该 proof 完成前，rev45 仍保持 terminal/non-executable；不得 redispatch、不得创建 Executor/Reviewer/HANDOFF、不得访问数据库或 secrets。

## 返回 PMC

Hermes runtime owner 已完成本轮 remediation deployment 与非破坏性验证，但 fresh same-profile worker completion proof 仍缺失。结论保持 `STILL_INFRA_BLOCKED`，等待 Codex PMC 决定是否授权 synthetic smoke 或其他 least-privilege proof。