# Task: Agnes 视频任务接入（创建 + 轮询 + 失败返还）

## Task ID
T3-006

## Phase
Phase 3

## Objective
在后端实现 Agnes 视频生成 API 接口，支持异步视频任务创建、轮询等待完成、结果保存为 video 类型资产，以及失败额度返还。

## Scope
- 新增文件：`backend/api/video_generate.py` — 视频生成路由
- 修改文件：`backend/api/router.py` — 注册新路由
- 不涉及：前端代码修改

## Constraints
- 基于已有 `AgnesProvider.generate_video()` 和 `AgnesProvider.poll_video_result()` 方法实现
- 使用 `agnes-video-v2.0` 模型
- 扣减用户 video_quota 额度，失败返还
- 生成结果保存为 video 类型 asset（source="generation"）
- 单任务 ≤ 4 小时工作量
- 只涉及 backend 模块
- 轮询间隔建议 5 秒，最大轮询次数 120（约 10 分钟超时）

## Acceptance Criteria
- [ ] 后端提供 POST `/api/video-generate` 接口，接收 prompt 参数
- [ ] 调用 AgnesProvider.generate_video(model="agnes-video-v2.0", prompt=prompt) 创建异步任务
- [ ] 轮询获取视频结果（使用 poll_video_result），直到 completed 或超时
- [ ] 成功后自动保存为 video 类型 asset（含 URL 引用）
- [ ] 扣减用户 video_quota 额度，失败时返还
- [ ] 前端 `npm run build` 不受影响
- [ ] 后端冒烟测试通过

## Deliverables
- `backend/api/video_generate.py`
- `ai/reports/REPORT-T3-006.md`

## Codex Prompt
你是一个 Revid 项目的 Codex Executor。请执行以下任务：

### 任务背景
Revid 是一个 AI 驱动的短视频创作平台。T3-004 已完成文本生成接入，T3-005 已完成图片生成接入。现在需要接入 Agnes 视频生成能力。

### 后端已有基础设施
1. `backend/core/agnes_provider.py` — AgnesProvider 类，已有 `generate_video()` 和 `poll_video_result()` 方法
2. `backend/main.py` — 全局 `_agnes` 单例，通过 `get_agnes()` 函数获取
3. `backend/controllers/store.py` — store 对象，已有 `create_asset()` 和 `grant_quota()` 方法
4. `backend/api/text_generate.py` — 文本生成路由，可参考其代码风格
5. `backend/api/image_generate.py` — 图片生成路由，可参考其代码风格

### 实现要求
1. 创建 `backend/api/video_generate.py`：
   - POST `/api/video-generate` 接口
   - 接收 JSON body：`{ "prompt": str }`
   - 使用 `Depends(current_user)` 认证
   - 先检查 video_quota ≥ 1，不足则返回 403
   - 调用 `get_agnes().generate_video(model="agnes-video-v2.0", prompt=prompt)` 创建异步视频任务
   - 从响应中提取 `video_id`
   - 轮询：每 5 秒调用 `get_agnes().poll_video_result(video_id)`，最多轮询 120 次（10 分钟超时）
   - 轮询结果为 completed 时，提取 `video_url`
   - 使用 `store.grant_quota(user_id, "video", -1, "video_generate", None)` 扣减 1 个额度
   - 使用 `store.create_asset()` 保存为 video 类型 asset（source="generation", source_model="agnes-video-v2.0"）
   - 如果 Agnes 调用失败或轮询超时，不扣额度，返回 500 错误
   - 如果 asset 保存失败，返还额度

2. 修改 `backend/api/router.py`：
   - 导入 video_generate 模块
   - 注册路由 `app.include_router(video_generate.router)`

### 注意事项
- 参考 `backend/api/image_generate.py` 的代码风格和认证模式
- 额度扣减使用 `grant_quota` 传入负数
- 错误处理要完善，确保额度一致性
- 轮询使用 `time.sleep(5)` 即可（同步阻塞等待，因为这是异步 API）
- 超时后应返回明确的超时错误信息
