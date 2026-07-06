import hashlib, sys
path = r"D:\works\codexWorks\project_revid\ai\reviews\REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV41R3-2026-07-05.md"
with open(path, "rb") as f:
    h = hashlib.sha256(f.read()).hexdigest().upper()
print(h)
