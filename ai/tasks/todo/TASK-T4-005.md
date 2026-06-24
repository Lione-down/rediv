# Task: 真实 Agnes API 联调与诊断信息

## Task ID
T4-005

## Phase
Phase 4B — 认证与真实 API

## Category
Backend / External API Integration

## Priority
P0

## Assigned To
Backend Executor

## Objective
用真实 Agnes 配置分别调通文本、图片、视频生成，并将可诊断的任务状态和生成结果持久化到 MySQL，供 API、日志和 Navicat 检查。

## Chosen Technology
现有 `AgnesProvider` + `httpx.AsyncClient` + FastAPI async endpoints + SQLAlchemy/Alembic。

## Scope
- 允许修改：`backend/core/agnes_provider.py`、三个 generate router、对应 schemas/settings/tests。
- 允许新增：`GenerationTask` model、Alembic revision、任务查询 API、`scripts/smoke_agnes.py`。
- 禁止修改：前端视觉、Auth、MySQL 基础连接、额度产品规则。

## Dependencies
T4-003 已审查通过。Agnes endpoint 已确认可达；真实 key 由本地 env 提供。

## Implementation Requirements
1. HTTP client 统一为 httpx，明确 connect/read/total timeout；不新增 requests。
2. 新增 generation_tasks 表，至少记录 id、user/project/node、media_type、provider、model、provider_request_id、status、duration_ms、result_asset_id、error_code、脱敏 error_message、created_at、updated_at，并补齐表/字段备注。
3. 标准状态限定为 queued/running/succeeded/failed/timed_out。
4. 文本、图片、视频失败时保持既有额度一致性语义并记录任务失败。
5. smoke script 默认不调用付费接口；必须显式选择 media type 和 `--execute`。
6. standard tests mock Agnes；真实调用只作为受 env flag 控制的 smoke，不进入默认 CI。
7. 禁止记录 Authorization header、完整请求图片 base64、API key 或 token。

## Acceptance Criteria
- [ ] 文本、图片、视频各完成一次真实 smoke，provider request ID 和结果可追踪。
- [ ] generation_tasks 与 assets 在 Navicat 中可关联。
- [ ] 网络失败、provider 失败、超时、资产落库失败均有 mock tests。
- [ ] 真实 smoke 未配置 key 时安全退出且不扣额度。
- [ ] 全量 backend tests 通过。

## Verification Commands
```powershell
cd backend
python -m unittest discover -s tests -p "test_*generate*.py"
python -m unittest discover -s tests -p "test_*.py"
python ..\scripts\smoke_agnes.py --media text --execute
```

## Manual Acceptance
Navicat 查看一次成功和一次受控失败任务；核对状态、模型、耗时、错误摘要和 asset 关联，无 secret。

## Deliverables
- Generation task persistence、API、smoke、tests、migration。
- `ai/tasks/doing/TASK-T4-005-PLAN.md`
- `ai/tasks/doing/TASK-T4-005-PROGRESS.md`
- `ai/reports/REPORT-T4-005.md`

## Codex Prompt
复用现有 AgnesProvider，不重写 provider。真实调用可能产生额度成本，只有在本地 env 完整且显式 `--execute` 时执行。编码前维护 PLAN/PROGRESS；报告必须区分 mock tests 与真实 smoke 证据。

