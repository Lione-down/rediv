# 管理员系统（Admin System）

## 🎯 实现目标

实现只对内部 admin 开放的平台控制台，用于管理用户、项目、资产、注册流量、免费额度、生成任务和服务器状态。

Admin 后台永远不对外开放，不做租户、不做客户后台、不做普通用户可见入口。

---

## 🧠 功能需求

### 1. 总览 Dashboard

GET /admin/dashboard

- 今日注册用户数。
- 今日活跃用户数。
- 今日生成任务数。
- 文本、图片、视频任务成功率。
- 排队任务数。
- Agnes API 状态。
- 服务器 CPU、内存、磁盘、带宽、队列长度。

### 2. 用户管理

GET /admin/users

- 用户列表。
- 微信 provider、openid、unionid 摘要。
- 注册时间、最近登录时间。
- 生成次数、资产数量、额度余额。
- 账号状态、生成权限状态。

POST /admin/users/:id/ban

- 封禁用户账号。

POST /admin/users/:id/freeze-generation

- 冻结用户生成权限，但保留资产和项目。

### 3. 注册控制

GET /admin/registration-settings

PUT /admin/registration-settings

- 微信登录开关。
- 注册模式：open | invite_only | closed。
- 默认额度配置。

### 4. 邀请码管理

GET /admin/invitation-codes

POST /admin/invitation-codes

PATCH /admin/invitation-codes/:id/disable

- 创建邀请码。
- 设置使用次数、过期时间、绑定额度包。
- 禁用邀请码。
- 查看使用记录。

### 5. 额度管理

GET /admin/users/:id/quotas

POST /admin/users/:id/quotas/grant

GET /admin/quota-ledger

- 查看用户文本、图片、视频额度。
- 手动派发额度。
- 查看额度流水。
- 所有管理员派发必须填写 reason。

### 6. 项目管理

GET /admin/projects

- 查看项目所属用户、创建时间、更新时间、资产数量。

### 7. 资产管理

GET /admin/assets

- 查看用户上传和生成的图片、视频、prompt。
- 查看资产来源任务、所属项目、所属画布节点。
- 隐藏违规资产。

### 8. 任务与模型监控

GET /admin/generation-tasks

POST /admin/generation-tasks/:id/retry

- 查看任务状态：pending | running | success | failed。
- 查看模型名、耗时、错误码、失败原因。
- 支持失败任务手动重试。

---

## 🧠 权限规则

- 仅 admin 可访问。
- Admin 后台入口独立于用户端。
- 所有 Admin 操作必须写入 admin_operation_log。
- 普通用户永远不能访问 /admin 路由。

---
