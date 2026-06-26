"""Check environment and resource limits relevant to executor runs."""
import os
import sys
import time
import platform

print("=== Environment & Resource Check ===")
print(f"Time: {time.strftime('%Y-%m-%dT%H:%M:%S%z')}")
print(f"Platform: {platform.platform()}")
print(f"Machine: {platform.node()}")
print(f"PID: {os.getpid()}")

# Check key env vars (values redacted for secrets)
env_vars = [
    'PATH', 'PYTHONPATH', 'HOME', 'USERPROFILE',
    'REVID_TEST_MYSQL_ADMIN_URL',
]
print("\nEnvironment variables:")
for var in env_vars:
    val = os.environ.get(var, '<NOT_SET>')
    if any(k in var.upper() for k in ['URL', 'SECRET', 'KEY', 'TOKEN', 'PASS']):
        val = '<REDACTED: secret/credential>'
    print(f"  {var}={val[:200]}")

# Memory: use ctypes to call Win32 API
import ctypes
try:
    class PROCESS_MEMORY_COUNTERS(ctypes.Structure):
        _fields_ = [
            ('cb', ctypes.c_size_t),
            ('PageFaultCount', ctypes.c_ulong),
            ('PeakWorkingSetSize', ctypes.c_size_t),
            ('WorkingSetSize', ctypes.c_size_t),
            ('QuotaPeakPagedPoolUsage', ctypes.c_size_t),
            ('QuotaPagedPoolUsage', ctypes.c_size_t),
            ('QuotaPeakNonPagedPoolUsage', ctypes.c_size_t),
            ('QuotaPagedPoolUsage', ctypes.c_size_t),
            ('PagefileUsage', ctypes.c_size_t),
            ('PeakPagefileUsage', ctypes.c_size_t),
            ('PrivateUsage', ctypes.c_size_t),
        ]
    GetCurrentProcess = ctypes.windll.kernel32.GetCurrentProcess
    GetProcessMemoryInfo = ctypes.windll.psapi.GetProcessMemoryInfo
    pids = PROCESS_MEMORY_COUNTERS()
    pids.cb = ctypes.sizeof(pids)
    handle = GetCurrentProcess()
    GetProcessMemoryInfo(handle, ctypes.byref(pids), ctypes.sizeof(pids))
    peak_ws_mb = pids.PeakWorkingSetSize / (1024 * 1024)
    current_ws_mb = pids.WorkingSetSize / (1024 * 1024)
    private_mb = pids.PrivateUsage / (1024 * 1024)
    print(f"\nMemory (Win32):")
    print(f"  Peak Working Set: {peak_ws_mb:.1f} MB")
    print(f"  Current Working Set: {current_ws_mb:.1f} MB")
    print(f"  Private Usage: {private_mb:.1f} MB")
except Exception as e:
    print(f"\nMemory check: {e}")

# Time limit info
print(f"\nCurrent Python: {sys.executable}")
print(f"Python version: {sys.version}")

# Check if MySQL client libraries are available
try:
    import pymysql
    print(f"MySQL driver: PyMySQL {pymysql.__version__}")
except ImportError:
    print("MySQL driver: PyMySQL NOT installed")

try:
    import mysql.connector
    print(f"MySQL driver: mysql.connector available")
except ImportError:
    print("MySQL driver: mysql.connector NOT installed")

print("\n=== Check Complete ===")
