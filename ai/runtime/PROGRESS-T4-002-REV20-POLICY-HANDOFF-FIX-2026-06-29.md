# T4-002 Rev20 Policy Handoff Fix Progress

## Status

`COMPLETE — REV21 EXECUTABLE`

## Checklist

- [x] 审计 Revid CURRENT、rev20 Task、Queue 与 PMC advisory。
- [x] 定位 Hermes runtime policy resolver 与 worker spawn 路径。
- [x] 确认根因：missing/unknown action 返回 `None`，被解释为 unrestricted。
- [x] 固化 Scheduled Supervisor body contract。
- [x] 实施 runtime fail-closed。
- [x] 增加并运行 regression tests（6 passed）。
- [x] 完成 fresh isolated smoke（positive 84s；negative 0s fail-closed）。
- [x] 发布 rev21 文档并同步 Queue。
- [x] Human Owner 确认旧 credential 已撤销；四 profiles 更新与 live model probe 通过；rev21 转 executable。

## Root Cause

`hermes_cli/kanban_db.py::_resolve_worker_allowed_tools()` 在 profile 已配置 `worker_tool_policies`、但 card body 缺失或包含未知 standalone `Action:` 时返回 `None`；`_default_spawn()` 将 `None` 当作不启用工具限制，导致 Coordinator 获得 unrestricted tool surface。Scheduled Supervisor prompt 同时没有把 `$body` 的必填字段固化为创建 contract，因而 rev20 只传入 Task 引用并触发该 fallback。
