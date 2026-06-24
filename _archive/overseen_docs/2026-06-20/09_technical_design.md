# Revid 技术设计文档

## 技术分层

第一版采用 Web 前端 + FastAPI 后端 + 后续数据库持久化的结构。

- 前端：Vue 项目结构，画布使用 Leafer UI。
- 后端：FastAPI，按 api、controllers、core、schemas、settings 拆分。
- 模型：Agnes 三模型通过 provider 层接入。
- 认证：微信 OAuth 为主，开发阶段使用 mock provider。
- 存储：当前 MVP 使用内存存储，后续替换为数据库和对象存储。

---

## 后端模块

### 1. Auth

接口：

- `GET /auth/wechat/authorize`
- `POST /auth/wechat/mock`
- `POST /auth/wechat/callback`
- `POST /auth/guest`
- `GET /me`

职责：

- 生成微信授权地址。
- 处理微信回调。
- 首次登录自动创建用户。
- 绑定 `provider + openid`。
- 创建 JWT/session。
- 创建游客 session。

### 2. Admin

接口：

- `POST /admin/dev-login`
- `GET /admin/dashboard`
- `GET /admin/users`
- `POST /admin/users/:id/ban`
- `POST /admin/users/:id/freeze-generation`
- `GET/PUT /admin/registration-settings`
- `GET/POST /admin/invitation-codes`
- `PATCH /admin/invitation-codes/:code/disable`
- `GET /admin/users/:id/quotas`
- `POST /admin/users/:id/quotas/grant`
- `GET /admin/quota-ledger`
- `GET /admin/assets`

职责：

- 内部管理平台生命体征。
- 控制注册模式和微信登录开关。
- 创建、禁用邀请码。
- 查看和派发额度。
- 管理用户状态和生成权限。

### 3. Assets

接口：

- `GET /assets`
- `POST /assets/upload`

职责：

- 管理当前用户资产。
- 记录 prompt、图片、视频。
- 后续接入生成任务后，生成结果自动入库。

---

## 核心数据模型

### user

- id
- nickname
- avatar_url
- role
- status
- generation_status
- created_at
- updated_at
- last_login_at

### auth_identity

- id
- user_id
- provider
- provider_user_id
- unionid
- raw_profile
- created_at
- updated_at

### invitation_code

- id
- code
- status
- max_uses
- used_count
- expires_at
- quota_package_id
- created_by_admin_id
- created_at

### quota_ledger

- id
- user_id
- quota_type
- change_amount
- reason
- related_task_id
- admin_id
- created_at

### asset

- id
- user_id
- project_id
- canvas_node_id
- type
- url
- content_text
- source
- source_model
- source_task_id
- status
- created_at
- updated_at

---

## 安全规则

- `.env`、密钥、token、证书文件禁止提交到 git。
- `.gitignore` 必须包含 `.env`、`.env.*`、`*.pem`、`*.key`、`*.p12`、`*.pfx`、`secrets.*` 等敏感文件规则。
- 真实密钥只通过环境变量或部署平台 secret 管理。
- Admin 路由只能由 admin 访问。
- 普通用户不能修改 role、额度、账号状态和生成权限。
- 用户只能访问自己的资产。

---

## 当前实现状态

已实现：

- FastAPI 后端 MVP。
- 微信 mock 登录自动注册。
- 邀请码注册控制。
- 默认额度发放。
- Admin 派发额度。
- 额度流水。
- 游客 session。
- 基础资产接口。

待实现：

- 真实微信 OAuth token exchange。
- 数据库持久化。
- Agnes 真实模型调用。
- 生成任务队列和失败返还额度。
- Admin 前端页面。
- Vue + Leafer UI 画布前端。
