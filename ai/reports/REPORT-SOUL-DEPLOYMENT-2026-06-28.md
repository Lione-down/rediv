# SOUL 中文部署报告 — 2026-06-28

## 部署状态

`COMPLETED`

## 部署文件

| Profile | SOUL 路径 | 中文 Marker | Description 更新 |
|---|---|---|---|
| default | `C:/Users/mkd/AppData/Local/hermes/SOUL.md` | ✅ 存在 | ✅ 已更新 |
| revid-pm | `C:/Users/mkd/AppData/Local/hermes/profiles/revid-pm/SOUL.md` | ✅ 存在 | ✅ 已更新 |
| revid-backend | `C:/Users/mkd/AppData/Local/hermes/profiles/revid-backend/SOUL.md` | ✅ 存在 | ✅ 已更新 |
| revid-frontend | `C:/Users/mkd/AppData/Local/hermes/profiles/revid-frontend/SOUL.md` | ✅ 存在 | ✅ 已更新 |
| revid-reviewer | `C:/Users/mkd/AppData/Local/hermes/profiles/revid-reviewer/SOUL.md` | ✅ 存在 | ✅ 已更新 |

## 中文 Marker 验证

所有五个 SOUL 文件均包含精确 marker：
`面向 Human Owner 的最终回复、执行总结、blocked/escalation 说明和 delivery 必须使用中文`

## Profile Descriptions 更新

已按模板中的 Profile description 精确值更新：

- default: `Revid execution supervisor. Consumes only Codex-approved queue revisions, creates one coordinator chain, tracks execution transitions, and never makes project decisions or writes business code.`
- revid-pm: `Revid execution coordinator. Dispatches only approved tasks to the specified executor and reviewer, enforces one-chain/one-rework limits, and produces PMC handoffs. Never writes business code or makes project decisions.`
- revid-backend: `Revid backend executor. Implements one approved backend/database/migration/API task within allowed files, records PLAN/PROGRESS/REPORT, and never changes scope or self-approves.`
- revid-frontend: `Revid frontend executor. Implements one approved Vue/UI/Canvas task using the existing design system, proves build and real-browser behavior, and never changes backend contracts or self-approves.`
- revid-reviewer: `Revid independent reviewer. Re-runs acceptance checks for one revision/attempt, writes PASS/REWORK/BLOCKED with a stable failure fingerprint, and never fixes code or advances project state.`

## 备份

原始 SOUL 已备份至 `D:/works/codexWorks/project_revid/ai/prompts/_backup_soul_20260628/`

## Sample Output 验证

- default profile 验证：模型 Agnes-2.0-Flash 的身份回答由系统 prompt 控制（英文），SOUL 中的中文规则对身份类问题不覆盖系统 prompt。对于执行总结、blocked/escalation 等场景，中文规则应在正常 tool-use 流程中生效。
- 四个 execution profile 的验证需要在实际 Kanban card 场景中观察（因为 profile 仅在特定 card 上下文中被激活）。

## Cron 状态

Revid cron 保持 paused，未自动恢复。

## 下一步

等待 worker finalization 修复完成后的 tests/smokes 验证。
