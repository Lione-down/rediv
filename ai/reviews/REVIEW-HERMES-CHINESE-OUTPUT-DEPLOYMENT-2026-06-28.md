# Hermes Chinese Output Deployment — PMC Review

## Verdict

`TEMPLATE_FIXED — DEPLOYMENT_REQUIRED`

项目内 scheduled supervisor prompt 已包含中文输出硬规则，实际 Revid cron prompt 也包含全部 marker；但 default 与四个 execution profile 的 SOUL 模板此前没有统一的 final-output language rule，实际 SOUL 也未包含精确强制语句。

## Current Runtime Evidence

- Revid cron：`72a21342a164`，当前 `paused`。
- 实际 cron prompt length：`9083`。
- 已包含：`语言与交付硬规则`、`最终回复必须使用中文`、`PMC Action Required`、`Human Decision Candidate`、`【Hermes 执行事件】`、`[SILENT]`。
- 因此 scheduled prompt 不是缺失；interactive/default/profile delivery 的 SOUL 约束不完整才是剩余部署缺口。

## Project Template Changes

以下模板已统一新增中文硬规则：

- `ai/prompts/hermes_system_prompt.md`
- `ai/prompts/hermes-revid-pm-soul.md`
- `ai/prompts/hermes-revid-backend-soul.md`
- `ai/prompts/hermes-revid-frontend-soul.md`
- `ai/prompts/hermes-revid-reviewer-soul.md`

## Deployment Gate

Hermes runtime owner 按 `ai/prompts/HERMES-ROLE-DEPLOYMENT.md` 部署时必须：

1. 备份实际 SOUL，并按 UTF-8 同步五个模板。
2. 验证五个实际 SOUL 都包含精确中文 marker。
3. 对五个 profile 分别运行不改变项目状态的 sample prompt，Human Owner 可见 final 必须为中文。
4. 不因语言部署自动恢复当前 paused 的 Revid cron。
5. 输出 deployment report，记录文件 hash、marker 检查与 sample result，不记录 secret。

PMC automation 不直接写外部 profile/SOUL/cron 状态；项目模板与部署验收已准备完成。

