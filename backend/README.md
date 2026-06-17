# Revid Backend MVP

## 功能范围

- 微信登录 mock provider。
- 微信扫码授权 URL 生成。
- 游客 session。
- Admin dev 登录。
- 注册开关：open / invite_only / closed。
- 邀请码管理。
- 默认额度发放。
- Admin 手动派发 text / image / video 额度。
- 用户资产列表和上传占位接口。

真实微信 OAuth token exchange、数据库持久化、Agnes 生成任务和 Admin 前端页面仍待开发。

## 本地启动

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

默认地址：

```text
http://localhost:8000
```

接口文档：

```text
http://localhost:8000/docs
```

## 开发流程示例

1. 获取 Admin token：

```bash
curl -X POST "http://localhost:8000/admin/dev-login?admin_key=dev-admin-key"
```

2. 使用 Admin token 创建邀请码：

```bash
curl -X POST "http://localhost:8000/admin/invitation-codes" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"TEST2026\",\"max_uses\":10}"
```

3. 使用微信 mock 登录：

```bash
curl -X POST "http://localhost:8000/auth/wechat/mock" \
  -H "Content-Type: application/json" \
  -d "{\"openid\":\"wx-openid-1\",\"nickname\":\"Test User\",\"invitation_code\":\"TEST2026\"}"
```

4. 查看当前用户：

```bash
curl "http://localhost:8000/me" \
  -H "Authorization: Bearer <USER_TOKEN>"
```

## 环境变量

所有配置使用 `REVID_` 前缀：

- `REVID_JWT_SECRET`
- `REVID_WECHAT_APP_ID`
- `REVID_WECHAT_APP_SECRET`
- `REVID_WECHAT_REDIRECT_URI`
- `REVID_WECHAT_MOCK_ENABLED`
- `REVID_DEV_ADMIN_KEY`

不要提交真实 `.env` 文件。
