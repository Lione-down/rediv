# DIAGNOSTIC-T4-002-REV45-DISPATCHER-LIST-FILES-BOUNDARY-2026-07-09

## 结论

`STILL_INFRA_BLOCKED`

Hermes runtime owner 已确认 rev45 Coordinator `t_d6f567bb` 的阻塞不是业务 REWORK，而是 `revid-dispatcher / DISPATCH_ONLY` 运行时工具策略与实际 Dispatcher 行为不一致导致的基础设施阻塞。当前证据不足以证明 least-privilege dispatch 已修复，因此不得 continuation、redispatch、创建 Executor、创建 Reviewer/HANDOFF、访问数据库或读取 secret。

## 范围

- Queue Revision: `phase4-wave2-unit-d-final-report-consolidation-2026-07-08-45`
- Task ID: `T4-002`
- Task Path: `ai/tasks/todo/TASK-T4-002-UNIT-D-REV45.md`
- Coordinator: `t_d6f567bb`
- Coordinator Run: `#201`
- Failure Fingerprint: `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION`
- Runtime Advisory: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV45-2026-07-09.md`

## 只读证据

| Evidence | Result |
|---|---|
| `hermes gateway status` | Gateway UP，PID `30476` |
| `hermes kanban --board revid stats --json` | `0 ready`, `0 running`, `0 review`, `3 todo`, `24 blocked`, `58 done` |
| `hermes kanban --board revid show t_d6f567bb` | card status `blocked`; latest summary 为 `ROLE_BOUNDARY_VIOLATION: tool 'list_files' is not allowed for Kanban task t_d6f567bb.` |
| `hermes kanban --board revid runs t_d6f567bb --json` | run `#201` status/outcome `blocked`; started `1783538245`; ended `1783538286`; duration `41s`; summary 同一 role-boundary violation |
| `python ai/runtime/verify-hermes-role-contracts.py` | `ROLE_CONTRACTS_OK` |
| Unit D REPORT | `ai/reports/REPORT-T4-002-UNIT-D-REV45.md` 不存在；Executor child 未创建 |

## 工具策略事实

`ai/runtime/verify-hermes-role-contracts.py` 中 `revid-dispatcher / DISPATCH_ONLY` 的 expected allowlist 为：

```text
read_file
kanban_show
kanban_create
kanban_link
kanban_complete
kanban_block
kanban_comment
kanban_heartbeat
```

该 allowlist 不包含 `list_files`。因此 run `#201` 的阻塞说明 Worker 实际尝试调用了未授权的 `list_files`，而不是已授权的 `read_file` 或专用 Kanban capability。当前 `ROLE_CONTRACTS_OK` 只证明 canonical policy 与 verifier 一致，不证明实际 Dispatcher prompt/tool-use 路径已经避免 `list_files`。

## 运行时根因判断

1. Coordinator `t_d6f567bb` body 与 rev45 DISPATCH_ONLY contract 匹配，且 Gateway 成功 claim/spawn。
2. 失败发生在 Executor child 创建前；无 Executor card、无 PLAN/PROGRESS/REPORT。
3. run `#201` 没有 process crash/timeout 证据，而是 capability fail-closed：`ROLE_BOUNDARY_VIOLATION`。
4. `revid-dispatcher / DISPATCH_ONLY` policy intentionally excludes `list_files`；least-privilege 方向应优先让 Dispatcher 使用已授权 `read_file`/Kanban 专用能力或通过 launcher/direct `kanban_create` 路径完成 child creation，而不是默认扩大到通用 discovery tool。
5. 本轮未执行 same-profile smoke，因为安全 dry-run/synthetic proof 需要明确 runtime harness；当前 contract 禁止真实 card mutation、历史 card operation 和业务写入。

## Verdict

`STILL_INFRA_BLOCKED`

原因：虽然当前 role contract verifier 返回 `ROLE_CONTRACTS_OK`，但没有 fresh proof 证明 `revid-dispatcher / DISPATCH_ONLY` 的实际 Worker 路径已不再调用 `list_files`，也没有安全 non-mutating same-profile smoke 证明可以完成 child creation。继续 dispatch 会重复同一 fingerprint 或造成 duplicate/unauthorized card 风险。

## Required Fix（least privilege）

1. 修复 `revid-dispatcher / DISPATCH_ONLY` 的实际执行路径，使其不调用 `list_files`。
2. 优先使用已授权的 `read_file` 与 Kanban 专用 capability，或项目 launcher/direct `kanban_create` 路径；不要默认授予通用 `terminal`。
3. 若确需 discovery 能力，应由 Codex PMC 明确批准最窄 capability，并同步更新 deployed/resolved policy、SOUL、verifier 和 regression。
4. 修复后必须提供 non-destructive same-profile proof：不复用/不修改 `t_d6f567bb`，不创建真实 T4-002 Executor，不访问数据库/secret，不触碰业务文件。

## 禁止事项确认

本 diagnostic 未执行以下动作：未 redispatch、未创建 duplicate Coordinator、未创建 Executor、未创建 Reviewer/HANDOFF、未修改 business code/tests/migrations/schema/frontend/runtime code、未读取 `.env`、未访问数据库、未触碰 `revid_db`、未操作历史 card。

## 返回 PMC

Hermes runtime owner 已完成本轮 diagnostic evidence。PMC 可基于 `STILL_INFRA_BLOCKED` 决定后续 runtime remediation 或 continuation policy；当前 Queue 仍为 terminal/non-executable。
