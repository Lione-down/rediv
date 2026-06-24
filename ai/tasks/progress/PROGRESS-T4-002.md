# PROGRESS-T4-002: SQLite → MySQL 数据迁移工具

## 执行记录

### 阶段 1: 环境检查
- [x] 确认 Alembic migration `a1b2c3d4e5f6` 已创建 12 张 InnoDB/utf8mb4 表
- [x] 确认 MySQL 8.0.43 可达（密码 `root123`）
- [x] 确认 `revid.db` 源文件存在且未被修改
- [x] 确认 Python venv 可用

### 阶段 2: 代码审查与修复
- [x] 审查 `migrate_sqlite_to_mysql.py` 完整性
- [x] 审查 `test_migration_tool.py` 覆盖度
- [x] 发现并修复 FK 孤儿检测 bug（ref_col 解析）

### 阶段 3: 单元测试
- [x] 18/18 测试通过
- [x] `compileall` 通过

### 阶段 4: Dry-run 集成验证
- [x] 连接到 MySQL（密码遮蔽正常）
- [x] 读取 12 张表，34 行数据
- [x] 无写入 MySQL

### 阶段 5: Execute 集成验证
- [x] 第一次 execute: 34 rows inserted, validation passed
- [x] 第二次 execute: 34 rows skipped (idempotent), validation passed
- [x] MySQL row count 前后一致（无重复插入）
- [x] 原始 revid.db 未被修改

### 阶段 6: 文档
- [x] 创建 `ai/reports/REPORT-T4-002.md`
- [x] 创建 `ai/tasks/progress/PROGRESS-T4-002.md`

## 发现的问题
1. FK 孤儿检测中 `ref.split("(")` 无法正确解析 `users(id)` 格式 → 已修复
2. 测试中缺少 execute 模式的集成测试（MySQL 需要可达）→ 已手动验证

## 下一步
- 提交代码审查
- T4-003 可以继续（依赖 T4-002）
