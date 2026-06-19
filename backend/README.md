# Revid Backend

## 项目简介

Revid Backend 是 Revid 项目的 FastAPI 后端，当前提供认证、Admin 管理、邀请码、额度流水、资产接口以及 Agnes provider 接入基础设施。

当前默认以 SQLite 作为本地持久化存储，便于开发环境直接启动和验证。

## 技术栈

- FastAPI
- Pydantic Settings
- SQLAlchemy
- SQLite / aiosqlite
- Uvicorn
- httpx

## 目录结构

```text
backend/
├── api/            # 路由注册与 API 入口
├── controllers/    # 业务控制与 store 实现
├── core/           # Agnes provider 等核心能力
├── models/         # SQLAlchemy 模型
├── schemas/        # 请求/响应 schema
├── settings/       # 配置读取
├── tests/          # 后端测试
├── database.py     # 数据库初始化
├── main.py         # FastAPI 应用入口
└── .env.example    # 环境变量示例
```

## 当前能力

- 微信 mock 登录与游客模式
- Admin dev 登录
- 注册开关与邀请码管理
- 默认额度发放与 Admin 手动发放额度
- 用户资产列表与上传占位接口
- Agnes API 配置与 provider 基础封装

## 环境准备

建议使用 Python 3.11 及以上版本。

1. 安装依赖：

```bash
pip install -r requirements.txt
```

2. 基于示例文件准备环境变量：

```bash
copy .env.example .env
```

3. 按需修改 `.env` 中的配置，尤其是 `REVID_JWT_SECRET`、微信配置和 Agnes API 配置。

## 启动方式

在 `backend/` 目录执行：

```bash
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

## 数据库配置

配置由 [`D:\works\codexWorks\project_revid\backend\settings\config.py`](D:\works\codexWorks\project_revid\backend\settings\config.py) 读取，环境变量前缀统一为 `REVID_`。

### 本地默认模式

默认启用 SQLite：

```env
REVID_USE_SQLITE=true
REVID_DB_PATH=revid.db
```

启动时 `main.py` 会先调用 `init_db(settings.db_path)` 创建数据库文件，再切换到 `DatabaseStore`。

### 非 SQLite 配置

当前配置层已预留以下变量：

```env
REVID_DB_HOST=localhost
REVID_DB_PORT=3306
REVID_DB_NAME=revid_db
REVID_DB_USER=root
REVID_DB_PASSWORD=
```

但当前代码路径仅在 `REVID_USE_SQLITE=false` 时回退为 `InMemoryStore`，并未接入其他持久化数据库实现。开发阶段请优先使用 SQLite。

## 常用环境变量

```env
REVID_APP_NAME=Revid API
REVID_CORS_ORIGINS=["http://localhost:5173","http://localhost:9099"]
REVID_JWT_SECRET=change-this-secret-in-production
REVID_WECHAT_APP_ID=
REVID_WECHAT_APP_SECRET=
REVID_WECHAT_REDIRECT_URI=http://localhost:8000/auth/wechat/callback
REVID_WECHAT_MOCK_ENABLED=true
REVID_DEV_ADMIN_KEY=dev-admin-key
REVID_AGNES_API_KEY=
REVID_AGNES_BASE_URL=https://apihub.agnes-ai.com
```

不要将真实 `.env`、密钥、token 或证书文件提交到 Git。

## 开发检查与测试

优先执行后端基础检查：

```bash
python -m compileall .
```

数据库存储相关测试：

```bash
python -m unittest discover -s tests -p "test_database_store.py"
```

如需快速验证应用是否可导入，可执行：

```bash
python -c "import main"
```

## 开发示例

1. 获取 Admin token：

```bash
curl -X POST "http://localhost:8000/admin/dev-login?admin_key=dev-admin-key"
```

2. 创建邀请码：

```bash
curl -X POST "http://localhost:8000/admin/invitation-codes" ^
  -H "Authorization: Bearer <ADMIN_TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"TEST2026\",\"max_uses\":10}"
```

3. 执行微信 mock 登录：

```bash
curl -X POST "http://localhost:8000/auth/wechat/mock" ^
  -H "Content-Type: application/json" ^
  -d "{\"openid\":\"wx-openid-1\",\"nickname\":\"Test User\",\"invitation_code\":\"TEST2026\"}"
```

4. 查询当前用户：

```bash
curl "http://localhost:8000/me" ^
  -H "Authorization: Bearer <USER_TOKEN>"
```
