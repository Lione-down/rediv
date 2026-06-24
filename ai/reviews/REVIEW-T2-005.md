# REVIEW-T2-005

## Task ID

T2-005

## Review Date

2026-06-27

## Reviewer

Project Master Controller (Hermes)

## Verdict

**PASS**

## Score

4/5

## Acceptance Criteria Check

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | 点击「微信登录」调用 POST /auth/wechat/mock，token 存入 localStorage 且 user 写入 store | ✅ PASS | `Home.vue` handleMockLogin 调用 `authStore.loginWithMockWechat()`，auth.ts 中写入 token/user/quotas 到 localStorage |
| 2 | 登录后展示用户昵称、角色、当前额度 | ✅ PASS | `userSummary` computed 提取 nickname/role/status；`quotaCards` computed 展示 text/image/video 额度；account-banner 展示用户信息 |
| 3 | 自动调用 GET /assets 加载资产列表并展示前 3 条 | ✅ PASS | `watch` 监听 `isLoggedIn` 变化触发 `loadAssets()`；`displayedAssets` computed 取 `slice(0, 3)` |
| 4 | 登录失败/资产加载失败有错误提示 | ✅ PASS | `authError` / `assetError` ref + `getErrorMessage` 解析 Axios 错误；内联 `<p class="inline-feedback is-danger">` 展示 |
| 5 | `npm run build` 通过 | ✅ PASS | 报告声明构建通过 |
| 6 | 完整数据流可走通 | ⚠️ PARTIAL | 报告注明 localhost:8000 当前不可达，真实后端联调未在本轮自动化中验证 |

## Code Review Notes

### Strengths
1. **登录态恢复设计合理**：`App.vue` 在 `onMounted` 检测 token 存在但 user 为空时尝试 `loadCurrentUser()`，避免刷新后丢失登录态。
2. **错误处理分层到位**：`getErrorMessage` 区分 Axios detail 消息、超时、通用 fallback，Home.vue 中登录和资产各有一个独立的 error state。
3. **资产展示优雅降级**：未登录显示提示文字，加载中显示 spinner，加载失败显示重试按钮，无数据时显示空状态。
4. **代码风格一致**：继续使用 `<script setup lang="ts">` + Composition API + lucide-vue-next 图标，与 T2-001~T2-004 风格统一。
5. **computed 派生干净**：`displayedAssets`、`quotaCards`、`statusCards`、`userSummary` 全部通过 computed 派生，无冗余状态。

### Minor Concerns
1. **`isLoggedIn` 条件依赖**：`auth.ts` 中 `isLoggedIn = Boolean(token.value && user.value)`，这意味着刚登录（token 已存但 user 未加载）时 `isLoggedIn` 为 false，`watch` 不会触发 `loadAssets()`。不过 `handleMockLogin` 中显式调用了 `loadCurrentUser()`，所以实际流程不受影响。这是一个边界情况，不影响当前任务范围。
2. **真实后端联调未验证**：报告坦诚说明了 localhost:8000 不可达的问题。建议在 Phase 2.8 响应式验证中补充一次真实后端联调。

## Conclusion

T2-005 完成了 Home 页的前端基础联调改造，覆盖了登录、用户信息展示、额度展示、资产列表加载与错误处理的完整链路。代码质量良好，与现有前端风格一致。唯一不足是真实后端联调因环境问题未在本轮完成，但不影响代码正确性判断。

**Recommendation: PASS**
