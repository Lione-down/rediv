import sys
import time
import os

print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"Platform: {sys.platform}")
print(f"CWD: {os.getcwd()}")

start = time.time()
time.sleep(2)
elapsed = time.time() - start
print(f"Smoke sleep OK: {elapsed:.2f}s")

# Verify we can write to the project workspace
test_artifact = os.path.join(os.getcwd(), ".hermes", "tmp_smoke_proof.txt")
with open(test_artifact, "w") as f:
    f.write(f"smoke_proof_ok at {time.strftime('%Y-%m-%dT%H:%M:%S%z')}\n")
    f.write(f"python: {sys.executable}\n")
    f.write(f"platform: {sys.platform}\n")

print(f"Artifact written to: {test_artifact}")
print("SMOKE_PROOF_OK")
