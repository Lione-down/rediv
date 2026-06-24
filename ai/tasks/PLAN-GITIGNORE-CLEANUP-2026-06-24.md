# Git ignore 清理计划

## 目标

将当前工作区中确定不需要版本管理的本地产物和一次性诊断脚本加入根 `.gitignore`。

## 范围

- 本地 SQLite/database 文件。
- 项目根目录的一次性 check、run、test 脚本。
- backend 根目录的一次性 debug、verify、setup 与 test 脚本。
- Windows reserved-name 产物 `nul`。

## 非目标

- 不删除现有文件。
- 不忽略 `backend/tests/` 中的正式测试。
- 不修改业务源码、依赖或运行配置。

## 验收标准

1. 当前所有非版本管理 untracked 文件均被 `.gitignore` 覆盖。
2. `git status --short -uall` 不再显示这些本地产物。
3. 正式测试文件仍受 Git 管理，不被新规则误伤。
4. 忽略规则与经验同步记录到 `pitfalls.md`。
