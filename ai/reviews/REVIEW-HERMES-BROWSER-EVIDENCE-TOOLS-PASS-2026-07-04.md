# PMC Review: Hermes Browser Evidence Tools

## Verdict

`PMC_PASS — READY_AFTER_GATEWAY_RESTART`

## Delivered Capability

- `browser_set_viewport(width, height)` 使用当前 task 的 agent-browser session 执行真实 `set viewport`，并 read-back `window.innerWidth/innerHeight`；尺寸不一致 fail-closed。
- `browser_screenshot(full_page=False)` 不依赖 vision provider，将真实 PNG 写入 Hermes managed screenshot cache 并返回 path。
- `revid-frontend` 与 `revid-reviewer` 对应 action allowlist 已授权两个工具。
- Frontend/Reviewer SOUL 明确禁止 JavaScript viewport override、CSS transform、zoom 或静态推断冒充真实 viewport。

## TDD Evidence

- RED: new Hermes tests returned `4 failed` because functions/schemas were absent.
- GREEN: targeted browser tests returned `4 passed`.
- Expanded Hermes browser/tool-policy tests: `10 passed`.
- Project runtime suite: `33 passed`.
- Role verifier: `ROLE_CONTRACTS_OK`.
- Durable patch: `HERMES_RUNTIME_PATCH_APPLIED`.
- Tool-definition probe exposed both tools.
- Real local smoke: requested/actual `375x812`; PNG dimensions `375x812`, size `32923` bytes; session and temporary PNG cleaned.
- Project/Hermes `git diff --check`: exit `0`.

## Integrity

- Installed `tools/browser_tool.py` SHA256: `4E4CBD206B6026581EF8330A3D2CF01BAFE0FEAB41EB6DFF5FC57DDA017CC8CD`
- Installed `model_tools.py` SHA256: `569F6931F00CF472F8408ACD8A07287808F8D76322CBC6CE853618BB08EEB666`
- Durable patch asset SHA256: `246DB93B4B9C5BEFC9A98F722E11C6064D6537645F5005B1C227C53559C35702`

## Activation Boundary

当前 rev39 worker 已 terminal；本次未修改任何 card。新 tool definitions 只对 Gateway restart 后启动的新 worker 生效。Revision 39 旧 REPORT 与模拟 viewport 证据仍不满足 Hard Gate，不能 retroactively PASS；必须由后续 fresh revision 使用新工具产生真实 screenshot evidence。
