# Revid Backend

## 项目简介

Revid Backend 是 Revid 项目的 FastAPI 后端，当前提供认证、Admin 管理、邀请码、额度流水、资产接口以及 Agnes provider 接入基础设施。

默认以 SQLite 作为本地持久化存储；生产环境可切换至 MySQL。

## 技术栈

- FastAPI
- Pydantic Settings
- SQLAlchemy
- SQLite / aiosqlite (开发)
- MySQL + PyMySQL (生产)
- Alembic (数据库迁移)
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
- MySQL runtime 支持（通过 Alembic 管理 schema）

## 环境准备

建议使用 Python 3.11 及以上版本。

### 安装依赖

```bash
pip install -r requirements.txt
```

### 基于示例文件准备环境变量

```bash
cp .env.example .env
```

按需修改 `.env` 中的配置，尤其是 `REVID_JWT_SECRET`、微信配置和 Agnes API 配置。

## 启动方式

### SQLite 模式（默认）

```bash
uvicorn main:app --reload
```

默认地址：`http://localhost:8000`
接口文档：`http://localhost:8000/docs`

### MySQL 模式

```bash
# 确保 alembic migration 已执行
alembic upgrade head

# 启动
uvicorn main:app --reload
```

MySQL 模式下 `REVID_USE_SQLITE=false`，服务启动时不会调用 `create_all()`，而是通过 Alembic 校验 schema revision。

## 数据库配置

配置由 [`settings/config.py`](settings/config.py) 读取，环境变量前缀统一为 `REVID_`。

### SQLite 模式（默认）

```env
REVID_USE_SQLITE=true
REVID_DB_PATH=revid.db
```

启动时 `main.py` 会先调用 `init_db(settings.db_path)` 创建数据库文件，再切换到 `DatabaseStore`。

### MySQL 模式

```env
REVID_USE_SQLITE=false
REVID_DB_HOST=localhost
REVID_DB_PORT=3306
REVID_DB_NAME=revid_db
REVID_DB_USER=root
REVID_DB_PASSWORD=your_password
```

MySQL 模式下：
- 启动时不调用 `create_all()`，schema 由 Alembic 管理
- 启动时会检查 `alembic_version` 表确认当前 revision
- 连接池使用 `NullPool` 的替代方案（pymysql pool）
- `pool_recycle` 默认为 3600 秒

### Alembic 迁移

```bash
# 生成新迁移（自动检测模型变更）
alembic revision --autogenerate -m "description"

# 应用所有迁移到最新
alembic upgrade head

# 回退一个 revision
alembic downgrade -1

# 查看当前 revision
alembic current
```

## 切换与回滚

### SQLite → MySQL

1. 在 MySQL 中创建数据库
2. 配置 `.env` 中的 MySQL 连接信息
3. 设置 `REVID_USE_SQLITE=false`
4. 执行 `alembic upgrade head`
5. 运行 `python -c "import main"` 验证启动

### MySQL → SQLite（回滚）

1. 设置 `REVID_USE_SQLITE=true`
2. 删除或重命名 `.env` 中的 MySQL 相关配置
3. 重启服务

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

MySQL runtime cutover 专项测试：

```bash
python -m unittest tests.test_mysql_runtime_cutover
python -m unittest tests.test_health
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
curl -X POST "http://localhost:8000/admin/invitation-codes" \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST2026","max_uses":10}'
```

3. 执行微信 mock 登录：

```bash
curl -X POST "http://localhost:8000/auth/wechat/mock" \
  -H "Content-Type: application/json" \
  -d '{"openid":"wx-openid-1","nickname":"Test User","invitation_code":"TEST2026"}'
```

4. 查询当前用户：

```bash
curl "http://localhost:8000/me" \
  -H "Authorization: Bearer ***"
```

5. 查看健康状态（含数据库信息）：

```bash
curl "http://localhost:8000/health"
```
