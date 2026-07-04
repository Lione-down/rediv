# DISPATCH_ONLY Smoke Test Report

**Date**: 2026-07-03T01:30Z
**Verifier**: Hermes Agent (default profile)
**Purpose**: Verify that `revid-dispatcher` profile can create an Executor child via `kanban_create` tool (not terminal), respecting DISPATCH_ONLY tool policy.

---

## Results

### ✅ PASS — All Checks Verified

| Check | Result |
|---|---|
| Parent card created with `Action: DISPATCH_ONLY` | ✅ `t_0f9c7dac` |
| Dispatcher used only allowed tools | ✅ `kanban_show`, `read_file`, `kanban_create` — NO `terminal` |
| Exactly one Executor child created | ✅ `t_413f6846` |
| Child Action = `IMPLEMENT_AND_TEST_ONLY` | ✅ Verified in body |
| Child Revision matches parent | ✅ `smoke-test-dispatch-only-2026-07-03-99` |
| Child assignee matches parent's Executor Profile | ✅ `revid-backend` |
| Child parent link correct | ✅ `parents: ["t_0f9c7dac"]` |
| Parent completed with DISPATCH_COMPLETE | ✅ `atomic_dispatch: true` |
| No ROLE_BOUNDARY_VIOLATION | ✅ No violations in event log |
| No timeout | ✅ Parent ran 74s, child ran 29s |
| No duplicate children | ✅ Exactly 1 child |
| No residual cards | ✅ Only 2 T4-SMOKE cards on board |
| Old card t_2e03b521 untouched | ✅ Still `blocked`, same body, same fingerprint |

---

## Card Details

### Parent Card
- **Card ID**: `t_0f9c7dac`
- **Title**: `T4-SMOKE: Dispatcher - smoke test DISPATCH_ONLY`
- **Assignee**: `revid-dispatcher`
- **Status**: `done`
- **Result**: `DISPATCH_COMPLETE: child created and parent committed atomically`
- **Created**: 2026-07-03T01:22:18Z (epoch 1783012938)
- **Started**: 2026-07-03T01:23:13Z (epoch 1783012993)
- **Completed**: 2026-07-03T01:24:27Z (epoch 1783013067)
- **Duration**: 74 seconds
- **Run ID**: 144
- **Session**: `20260703_012322_767f57`
- **Tool calls**: 8 total (1 user, 6 tool calls)
  - `kanban_show` — read card
  - `read_file` — read TASK-T4-SMOKE.md
  - `kanban_create` — created child executor
  - `kanban_complete` — completed parent

### Child Card
- **Card ID**: `t_413f6846`
- **Title**: `T4-SMOKE: Executor - smoke test IMPLEMENT_AND_TEST_ONLY`
- **Assignee**: `revid-backend`
- **Status**: `done`
- **Created by**: `revid-dispatcher`
- **Created**: 2026-07-03T01:24:27Z (epoch 1783013067)
- **Started**: 2026-07-03T01:25:14Z (epoch 1783013114)
- **Completed**: 2026-07-03T01:25:43Z (epoch 1783013143)
- **Duration**: 29 seconds
- **Run ID**: 145
- **Parent link**: `["t_0f9c7dac"]`
- **Body**: Contains `Role: Executor`, `Action: IMPLEMENT_AND_TEST_ONLY`, `Revision: smoke-test-dispatch-only-2026-07-03-99`

---

## Effective Tool Policy (DISPATCH_ONLY)

Source: `~/.hermes/profiles/revid-dispatcher/config.yaml` → `kanban.worker_tool_policies.DISPATCH_ONLY.allowed_tools`

| Tool | Allowed | Used in Smoke Test |
|---|---|---|
| `read_file` | ✅ | ✅ |
| `kanban_show` | ✅ | ✅ |
| `kanban_create` | ✅ | ✅ |
| `kanban_link` | ✅ | ❌ (auto-linked by atomic dispatch) |
| `kanban_complete` | ✅ | ✅ |
| `kanban_block` | ✅ | ❌ |
| `kanban_comment` | ✅ | ❌ |
| `kanban_heartbeat` | ✅ | ❌ |
| `terminal` | ❌ | ❌ (NOT used — this is the key verification) |
| `browser` | ❌ | ❌ |
| `web` | ❌ | ❌ |
| `cron` | ❌ | ❌ |
| `skills` | ❌ | ❌ |
| `memory` | ❌ | ❌ |
| `delegation` | ❌ | ❌ |

---

## Board State After Smoke Test

- **Total cards**: 32 (26 done + 6 blocked)
- **By assignee**:
  - `revid-dispatcher`: 1 blocked (`t_2e03b521`), 6 done (including `t_0f9c7dac`)
  - `revid-backend`: 5 blocked, 5 done (including `t_413f6846`)
  - `revid-pm`: 10 done
  - `revid-reviewer`: 5 done
- **Old card `t_2e03b521`**: UNTOUCHED — still `blocked` with `ROLE_BOUNDARY_VIOLATION: tool 'terminal' is not allowed`

---

## Conclusion

The `revid-dispatcher` profile's `DISPATCH_ONLY` tool policy works correctly:

1. **`kanban_create` is the correct tool** for the dispatcher to use — it successfully created the Executor child card with proper body, revision, and parent linkage.
2. **No `terminal` calls were needed** — the dispatcher used only `kanban_show`, `read_file`, `kanban_create`, and `kanban_complete`.
3. **Atomic dispatch works** — the parent completed with `atomic_dispatch: true` and the child was correctly linked.
4. **No ROLE_BOUNDARY_VIOLATION** — the dispatcher stayed within its tool policy boundaries.
5. **No timeout or duplicate children** — clean single-child lifecycle.

The existing blocked card `t_2e03b521` (T4-010, revision 31) was NOT affected by this smoke test. It remains blocked with the same `ROLE_BOUNDARY_VIOLATION` error.

---

## Status

**DIAGNOSTIC_READY / READY_FOR_CONTINUATION**

PMC can now verify the evidence above and publish a new Queue revision / idempotency key if desired. The `kanban_create` tool is confirmed working for `revid-dispatcher` DISPATCH_ONLY cards.
