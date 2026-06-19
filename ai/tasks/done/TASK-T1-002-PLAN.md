# TASK-T1-002 开发计划

## 目标

完善 `backend/.gitignore`，排除数据库文件、Python 缓存、环境变量文件和常见 IDE/运行产物；同步补全 `backend/README.md`，覆盖后端项目简介、技术栈、目录结构、启动步骤、数据库配置和测试命令。

## 范围

- 新增 `backend/.gitignore`
- 更新 `backend/README.md`
- 不修改任何业务代码、状态文件或评审文件

## 实施步骤

1. 阅读任务、当前状态、技术设计和后端现有配置，确认 README 需要反映的真实启动方式与数据库开关。
2. 对齐根目录 `.gitignore`，补充后端目录自身需要兜底的忽略规则，重点覆盖 `*.db`、`*.sqlite`、`__pycache__/`、`.env` 和 IDE 配置。
3. 重写 `backend/README.md`，明确：
   - 项目简介与当前能力边界
   - 技术栈和目录结构
   - 环境准备与启动命令
   - SQLite 与非 SQLite 配置说明
   - 检查与测试命令
4. 运行后端检查命令，记录结果并生成 `REPORT-T1-002.md`。

## 验收标准

- `backend/.gitignore` 覆盖数据库文件、Python 缓存和 `.env` 文件
- `backend/README.md` 包含任务要求的全部章节
- 检查命令已执行，或明确记录无法执行原因
