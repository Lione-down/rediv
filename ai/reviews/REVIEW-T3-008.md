# REVIEW-T3-008

## Task ID
T3-008

## Review Date
2026-07-02

## Status
REWORK

## Score
N/A — 任务拆分后重审

## Summary
Codex 提交的 REPORT-T3-008 标记为 BLOCKED，指出了三个阻塞点。经 PM 审查，**阻塞点的分析是正确的，但结论需要调整**。

### 审查发现

1. **后端 `wechat_callback` 的行为**：
   - `backend/api/auth.py:60-65`：当 `wechat_mock_enabled=True`（默认值）时，callback 走 mock 模式，用 `payload.code` 作为 openid 直接登录。**这个路径在当前配置下是可工作的。**
   - 当 `wechat_mock_enabled=False` 时，返回 501。这是预期行为——真实 OAuth 需要额外实现 code → access_token 的交换。

2. **前端缺少 WechatCallback.vue**：
   - 路由 `ai/router/index.ts:23` 引用了 `../views/app/WechatCallback.vue`，但该文件**不存在于磁盘上**。
   - 这是一个遗漏：之前的任务可能创建了路由但未创建页面。

3. **任务文档的矛盾**：
   - 任务标题："真实微信 OAuth 接入（替换 mock）"
   - 任务约束："不涉及后端代码修改"、"只涉及 frontend 模块"
   - 这两个陈述互相矛盾——真实的微信 OAuth 必须后端支持 code exchange。

### 审查结论

**当前任务范围不足以完成"真实微信 OAuth"，但在 mock 模式下完成前端 authorize/callback 流程改造是可以做的。**

PM 决定将 T3-008 拆分为两个子任务：

#### 子任务 A（前端改造 — 可在 mock 模式下工作）
- 前端调用 `GET /auth/wechat/authorize` 获取 authorize_url
- 创建 `WechatCallback.vue` 页面（目前缺失）
- 回调页读取 URL 参数，调用 `POST /auth/wechat/callback`
- 登录成功后跳转 Workspace
- 保持游客模式不变

#### 子任务 B（后端真实 OAuth 接入 — 需独立任务）
- 实现 `wechat_mock_enabled=False` 时的真实 code → access_token 交换
- 配置 `REVID_WECHAT_APP_ID`、`REVID_WECHAT_APP_SECRET`
- 统一 redirect_uri 契约

### 返工指令

将 REPORT-T3-008 标记为 REWORK，生成两个新 TASK 放入 `ai/tasks/todo/`：
- `TASK-T3-008-A`：前端微信 OAuth 流程改造（mock 模式兼容）
- `TASK-T3-008-B`：后端真实微信 OAuth token exchange

---

## Files Reviewed
- `ai/reports/REPORT-T3-008.md`
- `ai/tasks/doing/TASK-T3-008.md`
- `ai/tasks/doing/TASK-T3-008-PLAN.md`
- `backend/api/auth.py`
- `backend/settings/config.py`
- `frontend/src/api/auth.ts`
- `frontend/src/store/auth.ts`
- `frontend/src/views/app/Home.vue`
- `frontend/src/router/index.ts`
- `xq/08_wechat_auth_quota_plan.md`

## Notes for Codex
- 请先执行 T3-008-A（前端改造），完成后提交报告
- T3-008-B 将由 Hermes 在适当时机生成并下发
- `WechatCallback.vue` 文件不存在，需要从零创建
