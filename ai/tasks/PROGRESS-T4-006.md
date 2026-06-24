# PROGRESS-T4-006: 暗色 design system 与 Naive UI provider REWORK (wave2)

## Timeline

### 2026-06-23

- **[x]** 读取 task body, worker_context, 相关 skill (revid-project-workflow, project-management-workflow, kanban-worker)
- **[x]** 检查现有 SmokeTest.vue — composable 已在 setup 顶层获取
- **[x]** 检查 App.vue — 4 个 provider 嵌套完整
- **[x]** 检查 naive-theme.ts — 品牌色 #6347C2, 暗色主题 overrides 完整
- **[x]** 检查 router/index.ts — /smoke route 已定义
- **[x]** `npm run build` — 4622 modules, 0 errors, 874ms ✓
- **[x]** 浏览器访问 http://localhost:9099/smoke — 页面正常加载
- **[x]** 点击 Trigger Message — 消息触发，console 零错误
- **[x]** 点击 Trigger Dialog — dialog 触发（info → warning chain）
- **[x]** 点击 Trigger Notification — notification 触发
- **[x]** 点击 Toggle Loading Bar — loading bar start/finish 动画
- **[x]** 验证 DOM: loading bar container 存在，bar 元素存在
- **[x]** 验证 overflow: scrollWidth=1247 === clientWidth=1247, 无溢出
- **[x]** 验证品牌色: 按钮 bg=#6347C2, borderRadius=8px
- **[x]** 验证 focus: Input/Select 可聚焦
- **[x]** 验证 console: 零错误
- **[x]** 编写 REPORT-T4-006.md
- **[x]** 编写 PROGRESS-T4-006.md
