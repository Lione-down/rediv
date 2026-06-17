# 用户系统模块（User System）

## 🎯 实现目标

实现以微信扫码登录为主的用户认证系统，支持微信 OAuth 自动注册、游客体验、JWT 鉴权、用户角色控制、默认免费额度发放。

第一版不做 SMS、email、用户名密码注册和找回密码。

---

## 🧠 功能需求

### 1. 微信登录入口

GET /auth/wechat/authorize

- 返回微信开放平台扫码登录地址。
- 携带 state，用于防 CSRF 和回跳页面识别。
- 如果微信开放平台未完成审核，开发环境允许使用 mock provider。

### 2. 微信回调

GET /auth/wechat/callback

- 接收微信返回的 code 和 state。
- 后端用 code 换取微信用户身份。
- 根据 provider + openid 查找用户。
- 首次登录自动创建用户。
- 首次创建用户后发放默认免费额度。
- 返回 JWT token 或写入登录 session。

### 3. 游客模式

POST /auth/guest

- 创建临时游客 session。
- 游客可进入画布预览。
- 游客不能保存个人资产库、导出视频、领取正式额度。
- 游客登录微信后，可将本地画布草稿绑定到正式账号。

### 4. 当前用户

GET /me

- 返回当前登录用户信息。
- 返回角色、账号状态、微信绑定信息摘要、额度余额。

### 5. 鉴权中间件

- verifyJWT：从 header 解析 token。
- requireUser：仅正式用户可访问。
- requireAdmin：仅 admin 可访问。
- requireGenerationEnabled：用户未被冻结生成权限时才允许调用模型。

---

## 🧱 数据结构

### user

- id
- nickname
- avatar_url
- role: user | admin
- status: active | banned
- generation_status: enabled | frozen
- created_at
- updated_at
- last_login_at

### auth_identity

- id
- user_id
- provider: wechat_open
- provider_user_id: openid
- unionid
- raw_profile JSON
- created_at
- updated_at

### guest_session

- id
- session_id
- local_project_snapshot JSON
- created_at
- expires_at
- converted_user_id

---

## 🔐 账号规则

- 微信登录成功即注册，不再要求手机号或邮箱。
- 同一个 provider + openid 只能绑定一个用户。
- unionid 预留给未来公众号、小程序、网站多端统一。
- 禁止普通用户直接设置 role。
- admin 账号只能由数据库初始化或后台内部配置创建。

---
