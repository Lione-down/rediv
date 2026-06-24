# REPORT-T3-005

## Status

DONE

## Task ID

TASK-T3-005

## Summary

完成 Agnes 图片生成后端接入，新增 `/api/image-generate` 接口，支持文生图与图生图输入、`image` quota 扣减与失败退款，并将生成结果保存为 `image` 类型 generation asset。

## Files Changed

- `backend/api/image_generate.py`
- `backend/api/router.py`
- `backend/tests/test_image_generate.py`
- `ai/tasks/doing/TASK-T3-005-PLAN.md`
- `ai/tasks/doing/TASK-T3-005-PROGRESS.md`
- `ai/reports/REPORT-T3-005.md`

## Tests Run

- `cd backend && python -m unittest tests.test_image_generate`
- `cd backend && python -m compileall .`
- `cd frontend && npm run build`

## Test Result

PASS

## Risks

- 当前图生图将 `image_ids` 解释为当前用户已有 `image` asset 的 ID，并解析其 URL 传给 Agnes；如果后续产品定义改成直接传外部 URL 或要求附带 project/node 归属，需要同步调整接口契约。

## Notes

- 路由实现沿用 `text_generate` 的现有风格，通过 `sys.modules` 获取 `main` / `backend.main` 中的 Agnes 单例，避免循环导入。
- 本次任务未改动前端业务代码，仅按流程执行 `npm run build` 做回归验证。

## Need Hermes Review

YES
