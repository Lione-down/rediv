# PMC Plan — Revision 19 Escalation Review and Hermes Language Governance

## Objective

审查 Hermes 对 revision `-19` 的 escalation 是否满足上一轮 runtime remediation gate，并解决 Hermes 面向 Human Owner 持续使用英文的问题。

## Scope

- 审查 `ESCALATION-T4-002-REV19-WORKER-CRASH-2026-06-28.md`、execution status、直接 card/run/log 与既有 PMC review。
- 写入 PMC escalation verdict，同步 CURRENT 与 Queue hold。
- 为 default、revid-pm、revid-backend、revid-frontend、revid-reviewer 项目 SOUL 模板补齐中文输出硬规则。
- 更新部署验收，区分项目模板与实际 Desktop SOUL/cron。

## Non-goals

- 不修改 Hermes-owned execution status、Kanban card、profile、Gateway、cron 或外部实际 SOUL。
- 不重派 revision `-19`，不发布 continuation。
- 不修改业务代码、migration、tests，不访问数据库或 secret。

## Success Criteria

- 明确判定 Hermes 是否完成了新的 runtime 修复与 fresh verification。
- 下一次 runtime owner 输出必须有新 patch、新 tests 和新 smoke，不得复用 thin-dispatcher 历史证据。
- 五个项目 SOUL 模板统一要求 Human Owner 可见输出使用中文。
- 部署验收要求核对实际 SOUL marker、cron prompt 与中文 sample output。
- `git diff --check` 通过。
