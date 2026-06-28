# Hermes Revid Role Deployment Map

| Hermes Target | Project Template | Description Source |
|---|---|---|
| `default/SOUL.md` | `ai/prompts/hermes_system_prompt.md` | 本文件中的主体身份摘要 |
| `default` cron | `ai/prompts/hermes-scheduled-supervisor.md` | 不适用 |
| `revid-pm/SOUL.md` | `ai/prompts/hermes-revid-pm-soul.md` | 模板顶部 Profile description |
| `revid-backend/SOUL.md` | `ai/prompts/hermes-revid-backend-soul.md` | 模板顶部 Profile description |
| `revid-frontend/SOUL.md` | `ai/prompts/hermes-revid-frontend-soul.md` | 模板顶部 Profile description |
| `revid-reviewer/SOUL.md` | `ai/prompts/hermes-revid-reviewer-soul.md` | 模板顶部 Profile description |

## 部署顺序

1. 暂停 Hermes Revid cron，避免部署中读取半套配置。
2. 备份 `default` 与四个 profiles 的现有 SOUL。
3. 将对应模板以 UTF-8 写入目标 SOUL。
   - 必须验证 default 与四个 profiles 的实际 SOUL 均包含精确 marker `面向 Human Owner 的最终回复、执行总结、blocked/escalation 说明和 delivery 必须使用中文`。
4. 使用 `hermes profile describe` 为四个 profiles 设置英文 description。
5. 将主体 cron prompt 替换为 scheduled supervisor 模板，schedule 改为 `15,45 * * * *`。
   - Windows PowerShell 5 调用 `hermes cron edit --prompt` 时，多行变量可能只保存第一行；部署脚本应将模板折叠为语义等价的单行参数，再从 `jobs.json` 验证 prompt length 和关键标记。
   - 必须验证实际 cron prompt 包含 `语言与交付硬规则`、`PMC Action Required`、`Human Decision Candidate`、`【Hermes 执行事件】` 和 `[SILENT]` 静默规则；只修改项目模板不会改变已经存在的 Desktop cron。
6. 将 delivery 改为仅事件通知；无事件 `[SILENT]`。
7. 运行 `hermes profile show/describe`、`hermes cron list` 和一次手动 dry scheduled cycle；分别对 default 与四个 profiles 做不触碰项目状态的中文 sample-output 验证。
8. 确认没有重复 card、没有业务文件修改，恢复 cron。

项目内模板不会自动同步到 Hermes Desktop。由于实际 SOUL 位于项目工作区外，部署必须由 Human Owner 明确授权或在 Hermes Desktop 中人工复制。

禁止因为部署语言规则而自动恢复原本 paused 的 cron；恢复属于独立运行状态变更，必须沿用部署前状态或由 Human Owner 明确要求。
