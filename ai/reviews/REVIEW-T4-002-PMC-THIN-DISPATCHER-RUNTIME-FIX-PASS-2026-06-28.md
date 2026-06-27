# T4-002 PMC Thin-Dispatcher Runtime Fix Review

## Verdict

`PMC_PASS — RUNTIME_REMEDIATION_ONLY`

`revid-pm` Coordinator role collapse 已从 prompt-only 约束改为 runtime-enforced、mode-specific exact tool policy。该 verdict 只通过 Hermes runtime re-enable gate，不代表 T4-002 Unit C1 业务验收通过。

PMC 批准发布 revision `-18`，Coordinator budget 为 120s；Unit C1 仍需 Executor REPORT、Independent REVIEW、HANDOFF 和 PMC final acceptance。

## Root Cause

`hermes_cli/kanban_db.py::_resolve_worker_cli_toolsets()` 使用 profile 的 `platform_toolsets.cli` 生成 worker `--toolsets`。`revid-pm` 未配置该字段，因而回退到完整 CLI 工具集；顶层 `toolsets: [hermes-cli]` 本身也是全工具集合。SOUL allowlist 只是 prompt，不能阻止 terminal/browser/cron/skills 被 runtime 暴露。

## Runtime Fix

1. `hermes_cli/kanban_db.py`
   - 读取 profile 的 `kanban.worker_tool_policies.DISPATCH_ONLY.allowed_tools`；
   - 仅当 card body 含精确 `Action: DISPATCH_ONLY` 时注入内部 worker policy；
   - HANDOFF 等其他 lifecycle action 不受该 policy 影响。
2. `model_tools.py`
   - worker schema 与 exact allowlist 求交集；
   - cache key 包含实际 worker policy；
   - 提供 `ROLE_BOUNDARY_VIOLATION` 判定。
3. `agent/conversation_loop.py`
   - policy 下出现非 allowlist tool call 时立即停止，不执行工具，也不进行三次自纠重试。
4. `revid-pm/config.yaml`
   - DISPATCH_ONLY 只允许 `read_file`、`kanban_show/create/link/complete/block/comment/heartbeat`。
5. `revid-pm/SOUL.md`
   - 明确 exact action marker、单 Executor child 和 mode boundary；prompt 仅作为 runtime enforcement 的补充。

## Source Evidence

| File | SHA-256 |
|---|---|
| `hermes_cli/kanban_db.py` | `9CB04A60CA74A5989BFB1637822B0195FE420F97B6E4183D785AA4344CFFF2C3` |
| `model_tools.py` | `A07295E31B0B9076A0423D5325554C779F48F2D2B76B9713D2C6A2F29F520500` |
| `agent/conversation_loop.py` | `B7EE79B0DDA71BCD55A1EAA80E6FE5B3FE979EA80849DC8D7CF94456234C0E52` |
| `tests/hermes_cli/test_kanban_worker_spawn_toolsets.py` | `3F5522EAFA2D6BB742BB52E581C9F6B05CF56130DCDE564066376DF9E58F3DA1` |
| `tests/tools/test_kanban_tools.py` | `E720C7C1B9A1CDB022C12B3B2206CFC6A972455FF0D5DD91A8AE5473D910BF9C` |
| `revid-pm/config.yaml` before final SOUL-only edit | `9B0C7CA5D95FC3EF6C8D7F583AFD99EA86ADAE49A5D9CE649D8812E7248F0DC9` |

## Verification

- `python -m py_compile hermes_cli/kanban_db.py model_tools.py agent/conversation_loop.py`：PASS。
- Targeted Hermes tests：`94 passed, 2 deselected`。两个 deselected tests 依赖当前开发 Python 缺失的 Windows `concurrent_log_handler`，与 worker policy 无关；新增 policy tests 和其余 Kanban tool tests 全部通过。
- Fresh AIAgent probe 的真实 `valid_tool_names` 恰好为 8 个 allowlist tools；`terminal`、`process`、`write_file`、`patch`、browser、cron、skills、execute_code、delegate 均缺失。
- `kanban_worker_tool_policy_violation("terminal")` 返回 `ROLE_BOUNDARY_VIOLATION`。
- Gateway 已 clean restart，运行 PID `26268`。
- Hermes source `git diff --check`：PASS。既有 unrelated `apps/desktop/electron/main.cjs` WIP 未修改。

## Final-Config Isolated Smokes

Board：`revid-runtime-diagnostic`，不是 `revid` business board。

| Smoke | Coordinator / Run | Child | Start → Child | Child → Complete | Total | Tools observed |
|---|---|---|---:|---:|---:|---|
| A | `t_7c866043` / `#9` | `t_74cb48fe` / `revid-reviewer` | 21s | 20s | 41s | show/create/show/complete |
| B | `t_856fee5a` / `#11` | `t_513fedd1` / `revid-reviewer` | 24s | 18s | 42s | show/create/show/complete |
| C | `t_bc1573dc` / `#13` | `t_f048f830` / `revid-reviewer` | 28s | 12s | 40s | show/create/show/complete |

三次均创建恰好一个 child，parent/profile 正确，无 terminal/browser/cron/skills/file write/test/build/business board 操作。

Final negative card `t_58fe3293` run `#15`：32s、0 child、无 terminal execution。该 card 的自然语言 comment 错报了额外工具名，PMC 不采用自报；fresh AIAgent `valid_tool_names` probe 和 worker log 是 canonical runtime evidence。

## Budget

最大 successful dispatch elapsed = 42s。

`ceil(42 × 1.5) = 63s`。PMC 选择 120s Coordinator budget，提供额外启动与 provider 波动余量，但不覆盖 Executor tests 或 artifact generation。

## Remaining Conditions

- Revision `-18` Coordinator card body 必须包含精确 `Action: DISPATCH_ONLY`。
- Coordinator 只创建一个 `revid-backend` Executor child并立即完成。
- Revision `-18` 继承全部历史 fingerprints，包括旧 role collapse 和 remediation gate failure；不得清零。
- Unit C1 业务 hard gates、ADR-003、安全边界和 Executor 1800s budget 不变。

## Human Decision

`NO`。runtime 技术问题已修复并验证。
