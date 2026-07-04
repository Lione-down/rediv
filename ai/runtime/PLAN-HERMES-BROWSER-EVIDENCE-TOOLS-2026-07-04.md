# Plan: Hermes Browser Evidence Tools

## Goal

为 `revid-frontend` 与 `revid-reviewer` 提供同一 browser session 内可验证的精确 viewport resize 与真实 PNG screenshot 工具，消除通过覆写 `window.innerWidth` 或 CSS transform 伪造 viewport evidence 的路径。

## Scope

- 在 Hermes `tools/browser_tool.py` 新增：
  - `browser_set_viewport(width, height)`：调用 agent-browser `set viewport`，随后 read-back `window.innerWidth/innerHeight`。
  - `browser_screenshot(full_page=False)`：写入 Hermes screenshot cache，返回真实 PNG path，不依赖 vision provider。
- 注册 tool schemas/handlers，并加入 legacy browser tool mapping。
- 为参数校验、session command、viewport read-back、screenshot path/result 添加 runtime tests。
- 将两个工具加入 Revid Frontend/Reviewer `IMPLEMENT_AND_TEST_ONLY` / `INDEPENDENT_REVIEW_ONLY` allowlist、verifier、tests 与 SOUL 约束。
- 重新生成 project-owned Hermes runtime patch，部署到当前 runtime，并完成 same-profile-compatible local smoke。

## Non-goals

- 不修改 T4-010 Workspace 业务代码。
- 不修改 rev39 REPORT、PLAN、PROGRESS 或 evidence。
- 不重试、unblock、claim、promote 或修改任何 Hermes card。
- 不引入 Playwright、付费 browser service、secret 或外部账号。

## Success Criteria

1. RED tests 在 production implementation 前因两个 tool 缺失而失败。
2. GREEN tests 证明 resize command 使用当前 task session，且真实 read-back 与请求尺寸一致。
3. Screenshot tool 生成可读取的 PNG cache path，且不要求 vision backend。
4. Revid role verifier 要求 Frontend/Reviewer 同时拥有两个工具。
5. Targeted Hermes tests、Revid runtime tests、role verifier、patch classifier 和 `git diff --check` 通过。
6. 独立 smoke 真实设置 `375x812`，read-back 精确匹配，并生成 PNG；smoke session 与临时文件清理完成。

## Deployment and Rollback

- 仅在 rev39 Executor terminal 后部署；当前已确认 card `t_744ce8af` done。
- 更新 project-owned patch 后通过 idempotent deployer 应用；不覆盖 Hermes runtime 既有 patch changes。
- 用户计划重启电脑；重启前完成部署与静态/本地 smoke。Gateway restart 由用户重启电脑自然完成。
- 若 smoke 失败，保持 rev39 terminal，不发布新 Queue；回滚仅移除本次新增 tool/policy patch，不触碰历史 runtime fixes。
