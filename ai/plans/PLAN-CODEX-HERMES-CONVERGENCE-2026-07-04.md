# Codex / Hermes 项目收敛计划

## 目标

建立单一、可重复、fail-closed 的协同验证入口，阻止状态漂移、无证据 PASS 和 runtime 未验证即继续派发，随后再恢复业务任务。

## 范围

- 新增 project convergence verifier 及回归测试。
- 新增统一 PowerShell 验证入口。
- 先报告历史漂移，不自动移动、删除或覆盖任务与证据文件。
- 保留当前前端、runtime 和文档 WIP。

## 非目标

- 本任务不修改业务代码。
- 本任务不创建新的 T4-002/T4-010 revision。
- 本任务不清理 Git 工作区或提交现有变更。

## 阶段

1. 建立只读 verifier，检查任务目录语义、唯一 active Queue、Report evidence 引用。
2. 用 fixture 回归测试固定 fail-closed 行为。
3. 提供统一验证命令，串联 convergence、runtime tests、role contracts 和 frontend build。
4. 根据 verifier 输出另行批准历史归档；归档完成后恢复唯一业务任务。

## 验收标准

- `python -m pytest ai/runtime/tests -q` 通过。
- convergence verifier 对当前项目输出明确 findings，并用非零 exit 阻止错误推进。
- fixture 能证明 `COMPLETE` 留在 doing、已完成任务留在 todo、缺失 evidence 的 PASS report 会被拒绝。
- 根目录存在一个稳定、可发现的验证入口，任何子命令失败时立即停止。

## 风险与回滚

- 当前历史数据必然触发 verifier；这是预期的收敛清单，不是 verifier 故障。
- 新增文件均为独立控制面文件；回滚只需删除本计划新增文件，不触碰业务数据。

