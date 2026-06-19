# TASK-T1-001 开发计划

## 目标

将 `backend/controllers/store.py` 的内存存储迁移为 SQLite 持久化存储，保持现有 API 路由与 schema 不变。

## 范围

- 新增 SQLAlchemy 模型与数据库初始化模块。
- 在 `store.py` 新增 `DatabaseStore`，保留 `InMemoryStore`。
- 通过配置切换 SQLite 与内存模式。
- 补充数据库存储层测试。
- 更新依赖与环境示例。

## 实施步骤

1. 梳理 `InMemoryStore` 的数据结构、router 对 `store` 的直接访问方式和兼容约束。
2. 新增 `models/` 与 `database.py`，定义 SQLite 表结构、引擎与建表逻辑。
3. 在 `store.py` 增加可切换的 store 代理与 `DatabaseStore`，保证：
   - 公共方法签名兼容。
   - `users`、`assets`、`invitation_codes`、`quotas`、`registration_settings` 等直接访问入口兼容。
4. 更新 `settings/config.py`、`main.py`、`requirements.txt`、`backend/.env.example`。
5. 编写 `backend/tests/test_database_store.py`，覆盖核心 CRUD 与重启后持久化。
6. 运行后端检查命令与测试，生成 `REPORT-T1-001.md`。

## 兼容策略

- 不修改 `backend/api/` 与 `backend/schemas/`。
- `DatabaseStore` 采用 SQLite 持久化 + 内存缓存兼容层。
- 对 router 直接修改的字典对象使用可持久化的 dict 包装，避免接口层改动。

## 验收标准

- SQLite 模式可创建数据库文件并正常启动。
- 现有 API 使用的 `store` 访问方式保持可用。
- 核心数据在重新实例化 `DatabaseStore` 后仍可读取。
- 相关测试和编译检查通过，或明确记录无法执行的原因。
