# REPORT-T3-006

## Status

DONE

## Task ID

TASK-T3-006

## Summary

完成 Agnes 视频生成后端接入，新增 `/api/video-generate` 接口，支持视频任务创建、轮询完成、video asset 保存，以及失败/保存异常场景下的额度一致性处理。

## Files Changed

- `backend/api/video_generate.py`
- `backend/api/router.py`
- `backend/tests/test_video_generate.py`
- `ai/tasks/doing/TASK-T3-006-PLAN.md`
- `ai/tasks/doing/TASK-T3-006-PROGRESS.md`
- `ai/reports/REPORT-T3-006.md`

## Tests Run

- `cd backend && python -m unittest tests.test_video_generate tests.test_text_generate tests.test_image_generate`
- `cd backend && python -m compileall .`
- `cd frontend && npm run build`

## Test Result

PASS

## Risks

None.

## Notes

- 视频接口当前按任务要求仅接收 `prompt`，未扩展 project/node 关联参数。
- 轮询采用 5 秒间隔、最多 120 次；超时返回明确错误，且不会扣减额度。
- 任务文件保留在 `ai/tasks/doing/`，等待 Hermes 审查。

## Need Hermes Review

YES
