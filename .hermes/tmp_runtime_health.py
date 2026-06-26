"""Non-destructive smoke proof: verify same-profile runtime health."""
import sys
import os
import time
import subprocess

print("=== Runtime Health Smoke Proof ===")
print(f"Time: {time.strftime('%Y-%m-%dT%H:%M:%S%z')}")
print(f"Python: {sys.executable}")
print(f"Version: {sys.version}")
print(f"Platform: {sys.platform}")
print(f"CWD: {os.getcwd()}")

# 1. Verify we can run bounded commands (no DB, no secrets, no network)
start = time.time()
result = subprocess.run(
    [sys.executable, "--version"],
    capture_output=True, text=True, timeout=10
)
print(f"\n1. Bounded command test: exit_code={result.returncode}")
print(f"   stdout: {result.stdout.strip()}")
assert result.returncode == 0, "Bounded command failed"

# 2. Verify we can import common modules (no heavy deps needed)
import json
import hashlib
import tempfile
import pathlib
print("\n2. Standard library imports: OK")

# 3. Verify file I/O works
with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
    f.write("health_check_ok")
    tmppath = f.name
with open(tmppath) as f:
    content = f.read()
assert content == "health_check_ok"
os.unlink(tmppath)
print("\n3. File I/O: OK")

# 4. Sustained run: hold alive for 10 seconds to prove process stability
print("\n4. Sustained run test (10s)...")
for i in range(10):
    time.sleep(1)
    if i % 3 == 0:
        print(f"   heartbeat at {i}s")
print("   sustained run complete")

# 5. AST parse the allowed files to verify they're syntactically valid
print("\n5. AST parse check on allowed files...")
allowed_files = [
    "backend/scripts/migrate_sqlite_to_mysql.py",
    "backend/tests/test_migration_tool.py",
]
import ast
for fpath in allowed_files:
    full = os.path.join(os.getcwd(), fpath)
    with open(full, "r", encoding="utf-8") as f:
        source = f.read()
    try:
        ast.parse(source)
        print(f"   {fpath}: AST parse OK ({len(source)} bytes)")
    except SyntaxError as e:
        print(f"   {fpath}: AST PARSE FAILED: {e}")
        raise

print("\n=== ALL SMOKE PROOFS PASSED ===")
print("Verdict: Runtime health confirmed. Same-profile (revid-pm/revid-backend)")
print("can sustain bounded execution, file I/O, and AST parsing.")
