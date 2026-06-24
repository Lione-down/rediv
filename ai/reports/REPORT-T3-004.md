# REPORT-T3-004

## Status

DONE

## Task ID

TASK-T3-004

## Summary

完成 Agnes 文本生成后端接入，新增 `/api/text-generate` 接口，支持项目/节点归属校验、`agnes-2.0-flash` 文本生成、`text` 额度扣减、失败返还与 prompt 资产自动入库。

## Files Changed

- `backend/api/text_generate.py`
- `backend/api/router.py`
- `backend/tests/test_text_generate.py`
- `ai/tasks/doing/TASK-T3-004-PLAN.md`
- `ai/tasks/doing/TASK-T3-004-PROGRESS.md`
- `ai/reports/REPORT-T3-004.md`

## Tests Run

- `cd backend && python -m unittest tests.test_text_generate`
- `cd backend && python -m compileall .`
- `cd frontend && npm run build`
- `cd backend && python -`（内联 TestClient smoke，验证 `/api/text-generate` 成功路径）

## Test Result

PASS

## Risks

- `backend/api/text_generate.py` 通过 `sys.modules` 读取 `main` / `backend.main` 中的 Agnes 单例，依赖现有启动入口保持不变；若后续调整启动方式，需要同步验证 provider 注入路径。

## Notes

- 为满足“补充必要测试”，额外新增了 `backend/tests/test_text_generate.py`，覆盖成功、Agnes 失败、asset 入库失败返还、额度不足四条关键路径。
- 额外尝试执行现有 `backend/tests/smoke_test.py` 时，发现该脚本存在历史问题：先封禁用户再做后续项目检查，且在 Windows GBK 控制台打印 emoji 会触发 `UnicodeEncodeError`。本次任务未修改该历史脚本，文本生成验收以专项单测与一次性 smoke 为准。

## Need Hermes Review

YES
