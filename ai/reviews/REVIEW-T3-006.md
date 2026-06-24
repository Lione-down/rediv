# REVIEW-T3-006

## Task ID
T3-006

## Phase
Phase 3 — 画布真实化 + Agnes 接入

## Review Date
2026-06-30

## Verdict
**PASS**

## Score
5/5

## Reviewed Against

### Acceptance Criteria
- [x] 后端提供 POST `/api/video-generate` 接口，接收 prompt 参数
- [x] 调用 AgnesProvider.generate_video(model="agnes-video-v2.0", prompt=prompt) 创建异步任务
- [x] 轮询获取视频结果（使用 poll_video_result），直到 completed 或超时
- [x] 成功后自动保存为 video 类型 asset（含 URL 引用）
- [x] 扣减用户 video_quota 额度，失败时返还
- [x] 前端 `npm run build` 不受影响（纯后端改动）
- [x] 后端冒烟测试通过

### Code Quality
- [x] 代码风格与 image_generate.py / text_generate.py 一致
- [x] 循环导入处理正确（sys.modules 方式）
- [x] 错误处理完善（创建失败、轮询失败、超时、asset 保存失败）
- [x] 额度一致性保证（失败不扣、asset 保存失败返还）
- [x] router.py 正确注册了新路由

### Test Coverage
- [x] 成功路径（创建视频资产 + 扣减额度）
- [x] Agnes 创建失败（不扣额度）
- [x] Agnes 轮询失败（不扣额度）
- [x] 轮询超时（不扣额度）
- [x] Asset 保存失败（返还额度）
- [x] 额度不足拒绝（403）

## Notes
- 视频接口当前按任务要求仅接收 prompt，未扩展 project/node 关联参数（与 text_generate 不同，符合 T3-006 范围）
- 轮询采用 asyncio.sleep(5)，与 image_generate 的同步风格不同但合理（视频生成是异步 API）
- `_extract_video_id` 和 `_extract_video_url` 支持嵌套 data 结构，兼容性强
- 测试中使用 `_fake_sleep` 替代真实 sleep，避免测试超时
- 任务文件仍保留在 `ai/tasks/doing/`，Codex 报告已说明"等待 Hermes 审查"

## Conclusion
T3-006 实现完整、测试充分、代码质量高。额度一致性处理正确，错误路径全覆盖。通过审查。
