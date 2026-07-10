# Task: 完整 E2E、视觉 QA 与文档收口

## Task ID
T4-013

## Phase
Phase 4D — Canvas 与最终联调

## Category
QA / Integration / Documentation

## Priority
P0

## Assigned To
Codex Project Lead Engineer

## Objective
验证账号、MySQL、Canvas、Agnes 和资产的完整个人工作流，收口事实源、运行文档和已知风险。

## Chosen Technology and Components
- backend：现有 unittest + FastAPI TestClient + MySQL integration test profile。
- frontend：production build；新增 Playwright browser E2E 时只引入 `@playwright/test`，由 lockfile 固定版本。
- 视觉：真实浏览器截图，目标 1440×900、920px、375px。

## Scope
- 允许新增：跨端 E2E tests、QA scripts、截图清单、最终报告。
- 允许修改：仅由失败测试证明必要的最小 bug fix、README、CURRENT、ROADMAP、pitfalls。
- 禁止进行：无证据重构、功能扩展、删除 SQLite/MySQL 数据、真实 secret 提交。
- 若修复涉及超过 5 个业务文件，停止并创建独立返工任务，不在 QA 任务中扩大范围。

## Dependencies
T4-005、T4-007、T4-008、T4-009、T4-012 已审查通过。

## End-to-End Scenarios
1. Admin 账号登录并恢复 session。
2. 创建项目并进入 Workspace。
3. 创建文本/图片/视频节点并建立连接。
4. 调用 Agnes；默认自动测试使用 mock，真实 smoke 由显式 env flag 控制。
5. 生成成功后 asset、generation_task、quota ledger 写入 MySQL。
6. 刷新和重启服务后项目、节点、连接、资产恢复。
7. API/provider 失败时额度、任务状态、UI 提示和日志一致。
8. Home、Space、Workspace 在三个 viewport 完成视觉回归。

## Acceptance Criteria
- [ ] backend 全量 tests 和 MySQL integration tests 通过。
- [ ] frontend build 和 browser E2E 通过。
- [ ] 完整 happy path 与失败 path 均有证据。
- [ ] Navicat 验收表列、备注、foreign keys 和业务记录一致。
- [ ] `.gitignore`、`git ls-files` 和暂存区敏感信息检查通过。
- [ ] CURRENT、ROADMAP、任务进度、报告与源码一致。
- [ ] SQLite 未删除，MySQL 未执行未经批准的 destructive cleanup。

## Verification Commands
```powershell
cd backend
python -m unittest discover -s tests -p "test_*.py"
cd ..\frontend
npm run build
npx playwright test
git status --short
git ls-files ".env" ".env.*" "*.pem" "*.key" "*.p12" "*.pfx"
```

## Manual Acceptance
提供一组不含 secret 的截图/记录：Login、Home、Workspace 默认态、生成中、生成成功、生成失败、Space 资产，以及 Navicat 对应项目/节点/连接/任务/资产/额度记录。

## Deliverables
- E2E/QA artifacts 和必要的最小修复。
- `ai/tasks/doing/TASK-T4-013-PLAN.md`
- `ai/tasks/doing/TASK-T4-013-PROGRESS.md`
- `ai/reports/REPORT-T4-013.md`
- `ai/reviews/REVIEW-PHASE4-COMPLETE.md`

## Codex Prompt
本任务是验证与收口，不是功能开发。先读取所有 T4 reports，编码前创建 PLAN/PROGRESS。任何失败先定位责任任务；超过 5 个业务文件的修复必须拆成返工任务。完成安全、Navicat、browser 和全量测试后提交 REPORT，再执行一次 fresh diff/test self-review 后收口 Phase 4。
