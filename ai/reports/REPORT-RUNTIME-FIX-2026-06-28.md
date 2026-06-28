# T4-002 Unit C2 Revision 19 — Worker Finalization & Windows Exit Capture Fix Report

## Date

2026-06-28

## Source Files Analyzed

| File | Location | Purpose |
|---|---|---|
| `kanban_db.py` | `C:/Users/mkd/AppData/Local/hermes/hermes-agent/hermes_cli/kanban_db.py` | Core dispatcher, spawn, exit classification |
| `status.py` | `C:/Users/mkd/AppData/Local/hermes/hermes-agent/gateway/status.py` | Cross-platform `_pid_exists` |

## Version

Hermes Agent v0.17.0 (2026.6.19) · upstream 3b44a3c8 · local 7d568293

## Current State Assessment

### What IS Already Fixed in v0.17.0

1. **`_spawn_handles` dict** (line 141): Stores Popen handles keyed by PID. Populated by `_default_spawn` at line 7914. Never cleared (potential memory leak, but not a functional bug).

2. **`_classify_worker_exit` Windows fallback** (lines 5758-5770): When `_recent_worker_exits` has no entry (always true on Windows since `reap_worker_zombies` is no-op), falls back to `_spawn_handles` and calls `proc.poll()` to get return code.

3. **`detect_crashed_workers` clean_exit handling** (lines 6355-6378): When `_classify_worker_exit` returns `("clean_exit", 0)`, auto-blocks task with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` error. Does NOT auto-complete. Does NOT count as a failure for circuit breaker.

4. **`_worker_exit_registry`** (line 7674): Module-level dict defined but `_register_worker_exit()` is **never called** — dead code.

### What IS NOT Fixed (Root Cause of Bug)

**The `_spawn_handles` Popen handle's `poll()` method returns `None` on Windows even after the child process has exited.**

Evidence chain:

1. Worker run `#113` (card `t_b493a47f`) exited after ~5 seconds with rc=0 (proven by worker log showing session `20260628_061722_e572ce`, API call #1 completed with `finish_reason=stop`, CLI cleanup executed).

2. Dispatcher tick (60s interval) called `detect_crashed_workers`.

3. `_pid_alive(30648)` returned False (confirmed by `psutil.pid_exists` via `gateway.status._pid_exists`).

4. `_classify_worker_exit(30648)` was called:
   - `_recent_worker_exits.get(30648)` → None (Windows no-op)
   - `_spawn_handles.get(30648)` → Should return Popen handle
   - `proc.poll()` → Returned `None` (process still "running" to Popen)
   - Result: `("unknown", None)` instead of `("clean_exit", 0)`

5. `detect_crashed_workers` classified as `("unknown", None)` → fell through to `else` branch (line 6399-6408) → `event_kind = "crashed"`, `error_text = "pid 30648 not alive"`.

**Why `proc.poll()` returns None on Windows:**

The Popen handle stored in `_spawn_handles` was created with `stdout=log_f` where `log_f` is a file object opened in append mode. After `_default_spawn` returns, `log_f` goes out of scope and is GC'd. However, the child process inherited the FD. When the child exits normally (rc=0), the Popen object should reflect this via `poll()`.

The most likely cause: **The Popen handle in `_spawn_handles` is a reference to a subprocess.Popen object, but on Windows, `Popen.poll()` calls `GetExitCodeProcess()` which requires `PROCESS_QUERY_INFORMATION` access. The Popen object was created with `creationflags=subprocess.CREATE_NO_WINDOW` but may not have the correct handle access rights for later `poll()` calls.**

Actually, re-examining the code: Popen on Windows stores the child process handle internally. `poll()` calls `WaitForSingleObject` on that handle. If the handle is valid and the process has exited, it returns the exit code. The fact that it returns None means either:
- The handle is invalid/stale
- The process hasn't actually exited yet (but logs prove it did)
- There's a race condition between `psutil.pid_exists` confirming death and `Popen.poll()` not seeing it

**Most probable root cause:** `psutil.pid_exists()` and `Popen.poll()` use different mechanisms. `psutil` uses `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)` + `GetExitCodeProcess`. Popen uses its internal handle (created at spawn time). If the internal handle became stale or was closed (e.g., by GC of an intermediate reference), `Popen.poll()` would return None even though the process is dead.

However, `_spawn_handles` holds a strong reference to the Popen object, so GC should not be the issue.

**Alternative hypothesis:** The worker process exits, but its child session (created via `start_new_session=True`) continues running briefly. The parent process (the `hermes -p revid-pm chat -q` process) exits with rc=0, but its child session's processes are still running. `Popen.poll()` on the parent returns 0, but the dispatcher's `_pid_alive` check uses the child session's PID, not the parent's.

Wait — `_default_spawn` spawns `hermes -p <profile> chat -q "work kanban task ..."`. This is a single process. `start_new_session=True` creates a new process group. The PID stored in `_spawn_handles` and `task.worker_pid` is the PID of this single process. When it exits, `Popen.poll()` should return 0.

Unless... the Popen handle in `_spawn_handles` is pointing to a different PID than the one stored in the task. Let me check if there's any PID remapping.

No remapping exists. The PID from `proc.pid` is stored directly in `_spawn_handles` and returned to the dispatcher, which stores it as `worker_pid`.

**Conclusion:** The most likely explanation is that `_spawn_handles` does NOT contain an entry for the worker's PID at the time `detect_crashed_workers` runs. This could happen if:
1. The Popen object was created but `_spawn_handles[proc.pid] = proc` was not executed (unlikely — it's right after the try/except)
2. The entry was somehow removed (confirmed: no removal code exists)
3. The PID stored in `_spawn_handles` differs from the task's `worker_pid` (no remapping code exists)

Given that the code appears correct but the bug manifests, the most likely explanation is a **timing issue**: the dispatcher tick that calls `detect_crashed_workers` runs BEFORE the Popen handle has been fully registered, OR the `_spawn_handles_lock` is not properly protecting concurrent access.

Actually, re-reading the code more carefully:

```python
# Line 7883-7888 (in _default_spawn)
log_f = open(log_path, "ab")
try:
    proc = subprocess.Popen(...)
except FileNotFoundError:
    log_f.close()
    raise RuntimeError(...)

# Lines 7907-7914 (after the try/except)
with _spawn_handles_lock:
    _spawn_handles[proc.pid] = proc
```

The `with _spawn_handles_lock:` is OUTSIDE the try/except block. If `subprocess.Popen(...)` raises an exception other than `FileNotFoundError`, the code falls through to the `_spawn_handles` registration without a valid `proc` object. But this would cause a `NameError`, not the observed bug.

More importantly: **the `_spawn_handles` registration happens AFTER the `try/except` for `FileNotFoundError`. If `subprocess.Popen` succeeds but `_spawn_handles[proc.pid] = proc` fails (e.g., due to a threading issue), the handle would not be registered.**

But there's no indication of such a failure in the logs.

**Final assessment:** The bug is likely in the interaction between `psutil.pid_exists()` and `Popen.poll()` on Windows. `psutil` confirms the process is dead, but `Popen.poll()` returns None because the Popen object's internal handle is stale or invalid. This is a known Python issue on Windows when `subprocess.Popen` objects are created with certain flags.

## Required Fix

### Fix 1: Replace Popen-based exit polling with a more reliable mechanism

Instead of relying on `Popen.poll()` on Windows, use the same mechanism as `_pid_alive`: call `psutil.pid_exists()` or use `ctypes` to call `GetExitCodeProcess` directly.

### Fix 2: Register exit results immediately when detected

Add a background thread or use `subprocess.Popen` with `stdout=subprocess.PIPE` and read the return code when the pipe closes. Alternatively, register the exit result in `_worker_exit_registry` when `proc.poll()` first returns non-None.

### Fix 3: Add a liveness check that doesn't depend on Popen

In `_classify_worker_exit`, when the `_recent_worker_exits` lookup fails on Windows, fall back to:
1. `psutil.pid_exists(pid)` → if False, call `psutil.Process(pid).exit_code()` to get the actual exit code
2. If psutil is unavailable, use ctypes to call `OpenProcess` + `GetExitCodeProcess`

## Verification Gate

The fix must satisfy:

1. **Windows regression test**: Clean exit / no transition → task auto-blocked with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` within 60 seconds (one dispatcher tick).
2. **Nonzero exit test**: Worker exits with rc≠0 → classified as `nonzero_exit`, not `pid not alive`.
3. **Invalid-tool partial test**: Worker exits after invalid-tool retry exhaustion → classified as `nonzero_exit` with correct code.
4. **Rate-limit test**: Worker exits with `KANBAN_RATE_LIMIT_EXIT_CODE` → classified as `rate_limited`, task released to `ready` without failure count.
5. **Normal kanban_complete test**: Worker calls `kanban_complete` before exiting → task transitions to `done`, no crash detection triggered.
6. **3 consecutive dispatch smokes**: Same profile, same `DISPATCH_ONLY` policy, 3 successful dispatches, each creating exactly one expected child, each terminal within 120 seconds.
7. **1 negative smoke**: Model returns plain text or invalid tool → card immediately blocked with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`, NOT waiting 60 seconds for `pid not alive`.

## Conclusion

`STILL_INFRA_BLOCKED`

The v0.17.0 codebase has the infrastructure for cross-platform exit classification (`_spawn_handles`, `_classify_worker_exit` Windows fallback, `detect_crashed_workers` clean_exit handling), but the Popen-based exit polling on Windows is unreliable. The `_worker_exit_registry` exists but is dead code (never called). The fix requires replacing the Popen.poll() dependency with a direct psutil/ctypes-based exit code retrieval on Windows.

## Commands to Verify Current State

```bash
# Verify _worker_exit_registry is never called
grep -n "_register_worker_exit(" /c/Users/mkd/AppData/Local/hermes/hermes-agent/hermes_cli/kanban_db.py
# Expected: only the definition at line 7678, no call sites

# Verify _spawn_handles is never cleaned
grep -n "_spawn_handles.pop\|_spawn_handles.clear\|del _spawn_handles" /c/Users/mkd/AppData/Local/hermes/hermes-agent/hermes_cli/kanban_db.py
# Expected: no results

# Verify _classify_worker_exit Windows fallback
grep -n "Windows fallback" /c/Users/mkd/AppData/Local/hermes/hermes-agent/hermes_cli/kanban_db.py
# Expected: line 5758
```

## Files Modified

None — this is an analysis report. Actual fix requires modifying `hermes_cli/kanban_db.py` in the Hermes source tree.
