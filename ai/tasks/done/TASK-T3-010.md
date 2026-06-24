# Task: Agnes 图片/视频端到端测试

## Task ID
T3-010

## Phase
Phase 3

## Objective
为 Agnes 图片生成和视频生成编写完整的端到端测试，覆盖创建 → 轮询 → 结果保存 → 额度扣减/返还全流程。

## Scope
- 新增文件：`backend/tests/test_image_e2e.py`（图片生成端到端测试）
- 新增文件：`backend/tests/test_video_e2e.py`（视频生成端到端测试）
- 不涉及前端代码修改

## Constraints
- 使用 unittest.TestCase + TemporaryDirectory 管理临时 SQLite
- Agnes API 调用使用 mock 模拟（不依赖真实网络）
- 测试必须复用现有 `_auth_headers` 等辅助方法
- 保持与 T3-009 相同的代码风格和测试结构

## Acceptance Criteria
- [ ] 图片生成 e2e 测试覆盖：文生图成功路径、图生图成功路径、额度扣减验证、资产入库验证、持久化验证
- [ ] 视频生成 e2e 测试覆盖：视频任务创建成功路径、轮询成功路径、额度预扣+返还逻辑、资产入库验证、持久化验证
- [ ] 所有测试用例通过（`python backend/tests/test_image_e2e.py` 和 `python backend/tests/test_video_e2e.py`）
- [ ] `python -m compileall backend/tests/test_image_e2e.py` 和 `python -m compileall backend/tests/test_video_e2e.py` 编译通过
- [ ] 测试报告包含每个步骤的断言结果

## Deliverables
- `backend/tests/test_image_e2e.py` — 图片生成端到端测试
- `backend/tests/test_video_e2e.py` — 视频生成端到端测试
- 完成报告：`ai/reports/REPORT-T3-010.md`

## Codex Prompt
你是 Revid 项目的 Codex Executor。

请执行以下任务：

1. 阅读 `backend/api/image_generate.py` 和 `backend/api/video_generate.py` 了解现有的图片/视频生成接口实现
2. 阅读 `ai/reports/REPORT-T3-009.md` 和 `backend/tests/test_e2e_workflow.py` 了解现有 e2e 测试的结构和风格
3. 创建 `backend/tests/test_image_e2e.py`，覆盖以下场景：
   - 文生图成功路径（POST /api/images → 额度扣减 → asset 入库）
   - 图生图成功路径
   - Agnes 图片生成失败时的额度返还
   - 额度不足时拒绝图片生成
4. 创建 `backend/tests/test_video_e2e.py`，覆盖以下场景：
   - 视频任务创建成功路径（POST /api/videos → 额度预扣 → 轮询 → 结果保存）
   - 视频生成失败时的额度返还
   - 轮询超时/失败处理
5. 所有测试使用 TemporaryDirectory + SQLite，mock Agnes API
6. 运行测试确保全部通过
7. 创建完成报告到 `ai/reports/REPORT-T3-010.md`

注意：
- 测试风格要与 T3-009 保持一致
- 每个测试用例都要有清晰的断言和注释
- 不要修改任何非测试文件
