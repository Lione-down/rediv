# REVIEW: T4-006 REWORK — 补齐全局 providers 与真实浏览器 smoke 独立审查

## Task ID
t_46214d7c (T4-006 REWORK)

## Reviewer
Independent Reviewer (revid-reviewer)

## Date
2026-06-23

## Verdict
PASS

---

## Scope Audit

Task scope: 在 App.vue 中补齐 NDialogProvider/NNotificationProvider/NLoadingBarProvider，验证 build，完成浏览器 smoke，不修改业务页面/Canvas。

实际修改范围:
- `frontend/src/App.vue` — 仅 provider 嵌套（已存在于 prior run，本次 REWORK 未新增改动）
- `frontend/src/assets/styles/naive-theme.ts` — 168 行，8 个组件 override（Button/Input/Drawer/Dropdown/Modal/Message/Notification/Dialog）， intact
- `frontend/src/style.css` — 无 #app width 约束（Vite 默认 demo styles 残留但不影响路由页面）
- `frontend/src/assets/styles/global.scss` — `#app { min-height: 100dvh }`，无 width 限制
- 其他前端文件（views/, components/, store/, api/）未被此任务修改

结论: Scope 清洁，无越权修改。

---

## Acceptance Criteria Evidence

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | npm run build 通过 | PASS | 独立复跑: 4622 modules, 606ms, exit 0, 0 errors, 0 warnings. vue-tsc type-check + Vite production build 双通过 |
| 2 | Naive UI 组件使用品牌 tokens 在暗色下 | PASS | naive-theme.ts: primaryColor=#6347C2, 8 个组件 override 完整（Button/Input/Drawer/Dropdown/Modal/Message/Notification/Dialog）。workspace 按钮渲染紫色 tint bg |
| 3 | 无 Vite #app 1126px 约束 | PASS | 独立搜索: 0 处 #app width 约束。DOM 验证: scrollWidth(1247) == clientWidth(1247)。global.scss 仅设 min-height: 100dvh |
| 4 | design-system 有完整 token 表 | PASS | ui/design-system.md 存在。naive-theme.ts 168 行覆盖 common + 8 组件 |
| 5 | 不修改业务页面/Canvas | PASS | App.vue 为唯一 provider 修改文件。views/ 和 components/ 不在本次 scope |
| 6 | NDialogProvider 存在 | PASS | App.vue L32: `<n-dialog-provider>` 在 template chain 中 |
| 7 | NNotificationProvider 存在 | PASS | App.vue L33: `<n-notification-provider>` 在 template chain 中 |
| 8 | NLoadingBarProvider 存在 | PASS | App.vue L31: `<n-loading-bar-provider>` 在 template chain 中 |
| 9 | Browser smoke 验证通过 | PASS | 独立验证: Home/Workspace/Space 三页面均渲染正常，暗色主题激活，0 console errors，无水平溢出 |

---

## Commands Rerun

```bash
# Build
$ cd frontend && npm run build
> vue-tsc -b && vite build
vite v8.0.16 building client environment for production...
transforming...
✓ 4622 modules transformed.
✓ built in 606ms
exit 0

# Scope check
$ grep -r "#app.*width" frontend/src/
# (no results — no #app width constraint)

# Provider presence
$ grep -c "n-dialog-provider\|n-notification-provider\|n-loading-bar-provider" frontend/src/App.vue
3
```

## Manual Evidence Checked

1. **Home Page** (http://localhost:9099): 暗色主题激活，body background transparent，NConfigProvider 存在，scrollWidth == clientWidth，0 console errors。
2. **Workspace Page** (http://localhost:9099/app/workspace): Canvas 渲染正常，工具按钮可见，tabs（Assets/Templates/Properties）正常，0 console errors。
3. **Space Page** (http://localhost:9099/app/space): 4 tabs（个人中心/个人资产/历史记录/结果页）正常，暗色主题，0 console errors。
4. **Lazy-mount 验证**: 0 个 provider container 元素挂载 — 符合 Naive UI 预期行为（仅在首次调用 $dialog/$notification/$loading/$message 时挂载）。
5. **App.vue 导入验证**: NDialogProvider, NNotificationProvider, NLoadingBarProvider, NMessageProvider, NConfigProvider, darkTheme 全部从 naive-ui 标准导出。

## Security/Data Findings

- 无 hardcoded secret/token/password。
- 无明文凭证泄露。
- naive-theme.ts 使用公开品牌色，无敏感信息。
- Provider 嵌套顺序正确（config-provider > loading-bar > dialog > notification > message），符合 Naive UI 官方文档推荐。

## Required Fixes

None. All Acceptance Criteria satisfied.

## Residual Risks

- **低风险**: style.css 中仍有 Vite 默认 demo styles（hero, #center, #next-steps 等），但这些样式仅在对应 DOM 元素存在时生效，当前路由页面不使用这些元素，无实际影响。建议后续清理以消除混淆。
- **低风险**: Provider container 未触发挂载 — 这是 Naive UI 的预期行为，但意味着首次调用时才会发现 provider 缺失问题（如果未来有人误删的话）。可在 SmokeTest 页面中加入显式 provider 存在性检查。

## PMC Handoff

T4-006 REWORK 审查通过。所有 9 条 Acceptance Criteria 均已独立验证满足。依赖 T4-006 的下游任务（T4-010 等）可解除 blocked。

---

*Reviewer: revid-reviewer | Date: 2026-06-23 | No business code modified | Independent verification completed*
