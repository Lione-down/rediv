# Codex / Hermes 项目收敛进度

## 状态

`GATE_IMPLEMENTED — CONVERGENCE_BLOCKED BY BROWSER CAPABILITY`

## 进度

- [x] 审计 CURRENT、Queue、doing/todo、runtime reports 与工作区状态。
- [x] 运行 runtime tests，baseline 为 `26 passed`。
- [x] 运行 health 深度检查，确认 verification entrypoint 缺失和任务/文档漂移。
- [x] 实现 convergence verifier 与 4 条回归测试。
- [x] 实现统一验证入口 `scripts/verify-project.ps1`。
- [x] 完成 runtime tests、role contracts、frontend build 和 scoped diff 验证。
- [x] 经用户批准后归档 5 个目录状态错位任务。
- [ ] 重新执行 T4-010 Unit B browser evidence，不接受补写或推测证据。
- [ ] 两项事实收口后重新运行统一验证入口并恢复唯一业务任务。

## 已确认根因

1. current state 在多个 Markdown 文档中重复持久化，更新不是原子的。
2. Task 的目录位置与文档状态脱节，Agent 每轮读取大量失效上下文。
3. browser acceptance 允许纯文本声明 PASS，缺少 artifact 存在性门禁。
4. Bash 与 PowerShell 的 Python 可用性不一致，检查器会静默降级。
5. runtime、prompt、业务和状态变更混在同一未收口工作区，无法稳定归因。

## 本轮验证结果

- `python -m pytest ai/runtime/tests -q`：`30 passed`。
- `python ai/runtime/verify-hermes-role-contracts.py`：`ROLE_CONTRACTS_OK`。
- `npm --prefix frontend run build`：通过。
- convergence verifier：按预期 exit `1`，报告 6 个阻塞事实。

## 当前阻塞事实

1. `REPORT-T4-010-UNIT-B.md` 声明 browser PASS，但没有 `ai/evidence/` artifact 引用。
2. 当前 Codex 会话已安装 Browser plugin，但其必需的 in-app JavaScript browser-control tool 未暴露；skill 禁止降级到外部 browser automation。

## Revision 38 reconciliation 修复

- [x] 修正 Queue Active Wave terminal action。
- [x] reconciler 支持无 Runtime Advisory 的 business evidence terminal STOP。
- [x] 保留 diagnostic-start 对 Runtime Advisory 的强制校验。
- [x] 新增 business block regression。
- [x] 真实状态完成 `STATUS_UPDATED`，read-back 为 `STATUS_OK`。
- [x] runtime tests `31 passed`，`ROLE_CONTRACTS_OK`。

## 恢复条件

- 在暴露 Browser plugin JavaScript control tool 的 Codex 会话中执行三个 viewport 验收并写入 `ai/evidence/T4-010/unit-b/`。
- 更新 REPORT 引用实际 artifacts 后，运行 `powershell -ExecutionPolicy Bypass -File scripts/verify-project.ps1`。
