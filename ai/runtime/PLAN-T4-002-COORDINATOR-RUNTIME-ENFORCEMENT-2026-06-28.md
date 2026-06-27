# T4-002 Coordinator Runtime Enforcement Plan

## Objective

把 `revid-pm` 从依赖 SOUL 自律的通用 Agent 收窄为 runtime-enforced thin dispatcher，消除 Coordinator role collapse 和无关工具导致的长耗时。

## Root Cause

`hermes_cli/kanban_db.py::_resolve_worker_cli_toolsets()` 使用 profile 的 `platform_toolsets.cli` 生成 worker `--toolsets`。`revid-pm` 未配置该字段，因而回退到完整 CLI 工具集；顶层 `toolsets: [hermes-cli]` 本身也是全工具集合。SOUL 中的 allowlist 只是 prompt，不能阻止 terminal/browser/cron/skills 被 runtime 暴露。

## Scope

- Hermes runtime：支持 profile-scoped、mode-specific `kanban.worker_tool_policies.DISPATCH_ONLY.allowed_tools` exact allowlist。
- Worker spawn：把 allowlist 作为内部 worker policy 传入子进程。
- Tool schema：Kanban worker 只暴露 exact allowlist 中的工具。
- Invalid tool call：policy 下的越界调用立即以 `ROLE_BOUNDARY_VIOLATION` 终止，不进行三次自纠重试。
- `revid-pm` profile：配置 read-only file + Kanban lifecycle 所需的最小工具。
- Tests：覆盖 worker policy 传递、schema 收窄和拒绝判定。

## Non-goals

- 不修改 Revid backend/frontend/migration/tests。
- 不访问数据库或 secret。
- 不复用、claim、promote、unblock 或修改现有 T4-002 card。
- 不发布 revision `-18`；runtime fix 通过独立验证后再由 PMC 决策。

## Files

- Hermes source：`hermes_cli/kanban_db.py`
- Hermes source：`model_tools.py`
- Hermes source：`agent/conversation_loop.py`
- Hermes tests：`tests/hermes_cli/test_kanban_worker_spawn_toolsets.py`
- Hermes tests：`tests/tools/test_kanban_tools.py`
- Local profile：`C:/Users/mkd/AppData/Local/hermes/profiles/revid-pm/config.yaml`
- 本计划与进度文档。

## Success Criteria

1. 明确声明 `Action: DISPATCH_ONLY` 的 `revid-pm` worker effective schema 只包含：`read_file`、`kanban_show`、`kanban_create`、`kanban_link`、`kanban_complete`、`kanban_block`、`kanban_comment`、`kanban_heartbeat`。
2. `terminal`、`process`、`write_file`、`patch`、browser、cron、skills、execute_code、delegate 均不在 schema。
3. 尝试调用任何非 allowlist 工具时立即返回 `ROLE_BOUNDARY_VIOLATION`。
4. 新回归测试先在旧实现失败，修复后通过。
5. Hermes targeted tests 与 `git diff --check` 通过。
6. 使用独立 diagnostic board 完成 3 次成功 dispatch-only smoke 和 1 次真实拒绝路径验证后，才可建议 continuation budget。

## Risks

- 工具过窄可能阻断 Coordinator 读取 Task；保留 `read_file` 与 `kanban_show`。
- `revid-pm` 后续 HANDOFF 需要文件写入；exact policy 必须仅作用于 `DISPATCH_ONLY`，不能全 profile 生效。
- 通用 Kanban worker 不应被全局收窄；policy 仅在 profile 明确配置时生效。
- Hermes repo 已有 unrelated desktop WIP；必须保持不动。
