# T4-002 Coordinator Runtime Enforcement Progress

## Status

`COMPLETE`

## Completed

- [x] 核对 direct Kanban runs/logs，确认 role collapse、tool overexposure 和 invalid negative test。
- [x] 定位 worker spawn 到 `hermes_cli/kanban_db.py::_resolve_worker_cli_toolsets()`。
- [x] 确认 `revid-pm` 缺少 `platform_toolsets.cli`，effective worker toolsets 为 browser/cron/file/skills/terminal/web 等完整集合。
- [x] 确认顶层 `toolsets: [hermes-cli]` 是全工具集合，不是 allowlist。
- [x] 确认 SOUL completion validator 未连接到 runtime tool dispatch。
- [x] 创建开发计划并定义成功标准。

## Pending

- [x] 添加 failing regression tests，并确认旧实现 3 个新增 checks 失败。
- [x] 实现 mode-specific exact worker tool allowlist。
- [x] 实现 `ROLE_BOUNDARY_VIOLATION` 快速失败。
- [x] 更新 `revid-pm` profile 配置与 SOUL contract。
- [x] 运行 compile、94 个 targeted tests、fresh AIAgent schema probe 和 diff checks。
- [x] 在独立 `revid-runtime-diagnostic` board 完成 final-config smokes 3/3 和 negative verification。
- [x] 更新 PMC verdict、revision `-18` Task、Queue、CURRENT、ROADMAP 和 parent Task。

## Final Evidence

- Tests：`94 passed, 2 deselected`；deselected tests 因开发 Python 缺 Windows logging dependency，未进入本 policy 断言。
- Schema：8 个 exact allowlist tools；terminal/write/browser/cron/skills 不可见。
- Smokes：41s、42s、40s；每次一个正确 child；allowed tools only。
- Negative：32s、0 child、无 terminal execution；direct policy probe 返回 `ROLE_BOUNDARY_VIOLATION`。
- Gateway：clean restart，PID `26268`。
- Queue：revision `-18` APPROVED，Coordinator 120s，Executor 1800s。
