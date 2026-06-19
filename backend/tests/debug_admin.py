import sys, os
sys.path.insert(0, r"D:\works\codexWorks\project_revid\backend")
os.environ["REVID_USE_SQLITE"] = "false"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Debug admin login with query param
r = client.get("/admin/dev-login", params={"admin_key": "dev-admin-key"})
print("Status:", r.status_code)
print("Body:", r.json())
