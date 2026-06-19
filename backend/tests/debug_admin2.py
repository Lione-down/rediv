import sys, os
sys.path.insert(0, r"D:\works\codexWorks\project_revid\backend")
os.environ["REVID_USE_SQLITE"] = "false"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# POST with admin_key as query param (since it's not annotated as Body)
r = client.post("/admin/dev-login", params={"admin_key": "dev-admin-key"})
print("POST with query param:")
print("  Status:", r.status_code)
print("  Body:", r.json())

# Also check what FastAPI expects
print("\nRoute methods:", [m for m in app.routes if hasattr(m, 'methods') and 'dev-login' in str(m.path)])
for route in app.routes:
    if hasattr(route, 'path') and '/dev-login' in route.path:
        print(f"  Route: {route.methods} {route.path}")
