# 微信登录、邀请码与额度系统开发计划

## 🎯 实现目标

实现微信 OAuth 登录作为第一版主注册方式，并通过邀请码、默认额度、后台额度派发控制免费平台的注册流量和模型资源消耗。

---

## 🧭 产品边界

- 做微信扫码登录自动注册。
- 做游客模式，但游客不领取正式额度。
- 做邀请码能力，用于测试期控制注册。
- 做默认额度发放和 Admin 手动派发额度。
- 不做 SMS、email、用户名密码注册、找回密码。
- 不做小程序登录、公众号关注登录、多 provider 合并。

---

## 🔐 微信登录流程

1. 用户点击微信登录。
2. 前端请求 GET /auth/wechat/authorize。
3. 后端生成 state，并返回微信扫码授权 URL。
4. 用户扫码授权后，微信回调 GET /auth/wechat/callback。
5. 后端用 code 换取 access_token、openid、unionid 和基础资料。
6. 后端按 provider + openid 查找 auth_identity。
7. 未找到则创建 user 和 auth_identity。
8. 如果注册模式为邀请码注册，则校验邀请码后再发放默认额度。
9. 生成 JWT/session，返回用户端。

---

## 🎟️ 注册模式

后台可配置 registration_mode：

- open：微信登录后直接注册并发放默认额度。
- invite_only：微信登录后必须填写有效邀请码，才发放默认额度。
- closed：关闭新用户注册，已有用户仍可登录。

邀请码 invitation_code：

- code
- status: active | disabled
- max_uses
- used_count
- expires_at
- quota_package_id
- created_by_admin_id
- created_at

---

## 🪙 额度系统

额度按模型类型拆分：

- text：Agnes-2.0-Flash
- image：Agnes Image 2.1 Flash
- video：Agnes-Video-V2.0

默认额度由后台配置，不写死在业务代码中。

推荐 MVP 默认值：

| 类型 | 默认额度 | 说明 |
|---|---:|---|
| text | 100 次/日 | prompt、脚本、分镜、标题 |
| image | 20 次/日 | 文生图、图生图、封面、素材 |
| video | 3 次/日 | 文生视频、图生视频、多图视频 |

额度流水 quota_ledger：

- id
- user_id
- quota_type: text | image | video
- change_amount
- reason: default_grant | admin_grant | consume | refund | expire | adjust
- related_task_id
- admin_id
- expires_at
- created_at

---

## 🧑‍💼 Admin 后台能力

- 微信登录开关。
- 注册模式配置：open / invite_only / closed。
- 默认额度配置。
- 邀请码创建、禁用、过期、使用次数查看。
- 用户微信身份查看：provider、openid、unionid、注册时间、最近登录。
- 用户额度详情：余额、今日消耗、历史流水。
- 手动派发额度：文本、图片、视频分开派发，必须填写原因。
- 异常注册监控：同 IP、同设备、短时间大量注册。
- 用户封禁和冻结生成权限。

---

## 🧪 验收标准

- 微信回调成功时，首次用户会自动创建账号。
- 已有微信用户再次登录不会重复创建账号。
- 注册关闭时，新用户不能注册，老用户可登录。
- 邀请码模式下，无有效邀请码不能领取默认额度。
- 新用户成功注册后获得后台配置的默认额度。
- Admin 手动派发额度后，用户余额立即变化并产生流水。
- 生成任务扣除对应模型额度，失败任务不扣除或自动返还。
- 游客可以进入画布，但不能保存资产、导出视频或调用正式生成额度。

---

## ⚠️ 风险与降级

- 微信开放平台审核未完成：开发环境使用 mock provider，不阻塞用户系统开发。
- 微信回调域名未就绪：先保留配置项 WECHAT_REDIRECT_URI。
- 垃圾注册领取额度：测试期默认 invite_only，并将 video 默认额度设低。
- Agnes API 限流：后台可临时冻结视频生成或进入维护模式。

---
