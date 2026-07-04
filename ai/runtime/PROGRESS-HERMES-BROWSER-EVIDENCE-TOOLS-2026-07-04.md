# Progress: Hermes Browser Evidence Tools

## Status

`COMPLETE`

## Checklist

- [x] rev39 Executor terminal confirmed
- [x] Existing capability audit: agent-browser supports `set viewport` and `screenshot`
- [x] Development plan recorded
- [x] RED runtime tests written and observed failing (`4 failed` because tools/schemas were absent)
- [x] Runtime implementation GREEN (`4 passed` targeted)
- [x] Revid policies/verifier/tests updated
- [x] Durable patch regenerated and deployed
- [x] Exact viewport + PNG smoke passed (`375x812`, PNG `375x812`, 32923 bytes)
- [x] Full verification and progress closure

## Current Decision

使用 Hermes 当前 agent-browser session 的 first-class wrappers；不使用当前不可用的 `browser_cdp`，不安装 Playwright。

## Verification

- Hermes targeted browser/tool-policy tests: `10 passed`
- Project runtime tests: `33 passed`
- `ROLE_CONTRACTS_OK`
- Runtime patch classifier: `HERMES_RUNTIME_PATCH_APPLIED`
- Tool-definition probe: `browser_set_viewport` and `browser_screenshot` exposed
- Project and Hermes `git diff --check`: exit `0`
- Real smoke: requested/actual viewport `375x812`; PNG IHDR `375x812`; smoke session and PNG cleaned

## Deployment State

Runtime source、Frontend/Reviewer profile allowlists 与 SOUL 已更新。用户计划重启电脑；Gateway 重启后新 worker 才会加载新 tool definitions。Revision 39 旧 REPORT 不因本次 runtime fix 自动获得有效 evidence。
