# REVIEW-T1-003

## Task ID
T1-003 — 后端邀请码注册控制

## Report
ai/reports/REPORT-T1-003.md

## Review Date
2026-06-22

## Review Checklist

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | 与 CURRENT.md 目标一致 | ✅ | 当前任务即为 T1-003 |
| 2 | 符合 ROADMAP.md 阶段规划 | ✅ | Phase 1.2 邀请码注册控制 |
| 3 | 符合 xq/ 需求文档 | ✅ | xq/progress.md 确认邀请码完善为待开发项 |
| 4 | `is_expired` 使用 `datetime` 对象比较 | ✅ | `parse_iso()` + `< now_utc()` 正确 |
| 5 | `open` 模式忽略邀请码验证 | ✅ | `use_invitation_code` 非 `invite_only` 直接返回 `True` |
| 6 | `invite_only` 缺失/无效邀请码拒绝注册 | ✅ | 测试覆盖 403 返回 |
| 7 | `closed` 模式拒绝新用户注册 | ✅ | 测试覆盖 403 + "Registration is closed" |
| 8 | 邀请码用尽被拒绝 | ✅ | `used_count >= max_uses` 检查存在 |
| 9 | 邀请码过期被拒绝 | ✅ | 使用带时区偏移的过期日期测试通过 |
| 10 | 测试文件覆盖所有场景 | ✅ | 8 个用例覆盖 open/invite_only/closed 全模式 |
| 11 | 测试使用 TemporaryDirectory 隔离 | ✅ | `setUp` 中创建临时 DB |
| 12 | 不修改业务逻辑代码 | ✅ | 仅修改 store 内部方法，未动 router |
| 13 | 未涉及 frontend | ✅ | 仅后端 Python 代码 |

## Quality Notes

- **过期修复精准**：新增 `is_expired()` 函数，使用 `parse_iso()` + `datetime` 比较，替代原来直接的字符串比较。`parse_iso` 处理 `None` 返回 `False`（不过期），符合业务语义。
- **测试设计完备**：8 个用例覆盖了三种注册模式 + 过期边界（带时区偏移的 ISO 字符串）、用尽场景。`DatabaseStore` 下的端到端测试确认了 auth 层与 store 层的完整联动。
- **代码风格一致**：新增的 `now_utc()`、`parse_iso()`、`datetime_to_iso()` 工具函数与现有 store.py 风格统一。

## Risks

- `store.py` 中 `is_expired()` 是新增函数，但仅被 `InMemoryStore.use_invitation_code` 内部调用（第 178 行），未影响 `DatabaseStore` 的 `use_invitation_code` 方法（`DatabaseStore` 未定义此方法，继承 `InMemoryStore` 的行为）。需要确认 `DatabaseStore` 确实通过继承获得了 `use_invitation_code` 的更新逻辑。经检查，`DatabaseStore` 未定义 `use_invitation_code` 方法，因此调用时会委托到 `InMemoryStore.use_invitation_code`（通过 `store` 全局实例的类方法），此行为正确。
- 仓库中存在较多未提交改动（非本次任务产生），本次未处理。

## Recommendation
**PASS** — 任务完成质量良好，过期比较修复精准，测试覆盖全面，可以进入下一阶段。
