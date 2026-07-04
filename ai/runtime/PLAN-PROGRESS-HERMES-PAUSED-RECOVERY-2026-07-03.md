# Hermes Paused Recovery — Plan and Progress

## Objective

在不恢复 cron、不创建 Kanban card、不发布 revision 33 的前提下，完成事实源一致性、launcher 红测修复和 paused same-profile Supervisor smoke，为后续恢复调度建立可验证 gate。

## Scope

1. 统一 `ai/state/CURRENT.md` 的 Current Phase、Current Task、Ready / Running 与 Next Review Gate。
2. 恢复 `create-hermes-coordinator.py` 的单一 command-builder contract，使 direct `kanban_create` 重写继续 least-privilege，同时兼容既有 dry-run API。
3. 运行 targeted/full runtime tests、deterministic status gate 与 paused Supervisor smoke。
4. 保持 cron job `72a21342a164` paused；不操作业务 worker。

## Root Cause

Launcher 从 subprocess 改为 direct `kanban_create` 时删除了公共 `build_command`，却在 `create_coordinator_card(dry_run=True)` 中内联复制同一 argv 结构。旧兼容测试仍调用公共接口，因此出现两个稳定 `AttributeError`；内联副本也让 dry-run 与历史 transport contract 存在未来漂移风险。

## Success Criteria

- CURRENT 当前摘要不再声称 reconciliation pending。
- `ai/runtime/tests/test_create_hermes_coordinator.py` 全部通过。
- `backend/tests/test_create_hermes_coordinator.py` 与全部 `ai/runtime/tests` 通过。
- dry-run 保留 multiline body 为单一 argv element，direct runtime path仍调用 `_cmd_create`，不使用 subprocess。
- deterministic status check 为 `STATUS_OK`。
- paused Supervisor smoke 不创建 card、不修改 Queue/Task/业务代码，且给出可审计结果。
- `git diff --check` 通过，cron 最终仍为 paused。

## Authorized Frontend Profile Smoke

```text
Action: IMPLEMENT_AND_TEST_ONLY
Profile: revid-frontend
Mode: non-business runtime smoke
Allowed Output: ai/reports/SMOKE-T4-010-REV32-FRONTEND-PROFILE-ARTIFACT-ROOT-2026-07-03.md
Forbidden: business-file edits, frontend/ai writes, Kanban mutation, secret access, cron mutation
Procedure: resolve project root, switch terminal cwd to frontend/, then write the single allowed report through an absolute project-root path and read it back
Stop After: FRONTEND_PROFILE_ARTIFACT_ROOT_SMOKE_READY
```

## Progress

- [x] 确认 status reconciliation complete，cron paused，无 ready/running/review card。
- [x] 复现 launcher targeted tests：`7 passed / 2 failed`，均为缺失 `build_command`。
- [ ] 统一 CURRENT 当前摘要。
- [ ] 修复 launcher 单一 command builder。
- [ ] 完成 tests 和 paused smoke。

## Frontend Smoke Attempt 1

`revid-frontend` oneshot 在 180 秒内未完成且未写报告。Fresh session transcript 证明它把包含 T4-010 名称的 runtime smoke 扩大成业务审计，读取了 Workspace/CanvasStage 与组件目录；调用方终止了仅属于该 smoke 的 process tree，业务 diff、`frontend/ai/` 与 Kanban 均无新修改。该假设已废弃，不复用同一 prompt。

Attempt 2 使用独立 `RUNTIME-SMOKE-001`，移除全部 T4-010 业务上下文，只允许 cwd/root 检查与单一 evidence write。若仍越界或超时，停止重试并保持 continuation blocked。

## Final Progress

- [x] CURRENT 当前摘要已统一。
- [x] Launcher 恢复单一 `build_command`，dry-run 复用该 contract，真实执行仍 direct `_cmd_create`。
- [x] Launcher 两套 targeted tests `28 passed`；全部 `ai/runtime/tests` `17 passed`。
- [x] UTF-8 deploy verifier 修复并 `ALL CHECKS PASSED`；baseline frontend build 与 scoped diff check 通过。
- [x] Default Supervisor paused smoke：`PAUSED_SMOKE_OK STATUS_OK NO_MUTATION`；Queue/status/active cards 均不变。
- [x] Revid Supervisor cron 已恢复，schedule 保持 `15,45 * * * *`。
- [x] T4-010 拆为 Unit A static/build 与 Unit B browser/interaction 两个 bounded Tasks。
- [ ] Frontend profile runtime gate 未通过：两次最小 smoke 均超时且触发超范围 mandatory preflight；按 hard-stop 不再重试。

## Status

`REMEDIATION IN PROGRESS — FRONTEND RUNTIME-SMOKE FAST PATH ADDED`

## Frontend Profile Root Cause Remediation

Session `20260703_164549_2e3108` 证明 minimal Task 仍先加载 `revid-project-workflow`、`project-management-workflow`、CURRENT/ROADMAP 并枚举所有任务。根因是 deployed Frontend SOUL 对所有 `IMPLEMENT_AND_TEST_ONLY` 无条件使用完整业务 preflight，且没有声明 runtime smoke 下 skills 不相关。Canonical/deployed SOUL 现新增 `RUNTIME-SMOKE-` fast path：只读精确 Task、禁止 skills/项目状态/业务源码、最多 5 tool turns、只写唯一 evidence 并停止。下一步为 verifier + fresh post-remediation smoke。

Post-remediation regression `4 passed`、全部 runtime tests `18 passed`、`ROLE_CONTRACTS_OK`。Fresh session `20260703_165209_783f5c` 不再越界或超时，但只返回 `...`，没有 tool call、没有 report；business diff 与 `frontend/ai/` 保持不变。该结果证明 prompt-level scope drift 已 fail-closed，但不能证明 execution viability。

## Final Status

`BLOCKED — FRONTEND PROFILE NO TOOL CALLS AFTER FAST-PATH REMEDIATION`

三条不同假设均已验证失败，按 debugging hard stop 不再尝试第四个 prompt 变体。解除条件：Hermes runtime owner 定位 no-tool-call root cause、补 targeted runtime regression，并提供 fresh same-profile artifact-root smoke。T4-010 Unit A/B 计划保留但不发布 Queue。
