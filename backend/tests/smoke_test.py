import sys, os
sys.path.insert(0, r"D:\works\codexWorks\project_revid\backend")
os.environ["REVID_USE_SQLITE"] = "false"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

passed = 0
failed = 0
results = []

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        results.append(("✅", name, detail))
    else:
        failed += 1
        results.append(("❌", name, detail))

# 1. Health
r = client.get("/health")
check("Health check", r.status_code == 200)

# 2. Guest
r = client.post("/auth/guest")
check("Guest creation", r.status_code == 200)

# 3. Admin dev-login
r = client.post("/admin/dev-login", params={"admin_key": "dev-admin-key"})
check("Admin dev-login", r.status_code == 200)
admin_token = r.json()["token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# 4. Set registration open
r = client.put("/admin/registration-settings", json={"registration_mode": "open"}, headers=admin_headers)
check("Set registration=open", r.status_code == 200)

# 5. Register user
r = client.post("/auth/wechat/mock", json={
    "nickname": "TestUser", "avatar_url": "", "openid": "test-openid-1", "invitation_code": ""
})
check("WeChat mock register", r.status_code == 200)
token = r.json()["token"]
user_headers = {"Authorization": f"Bearer {token}"}

# 6. Me
r = client.get("/auth/me", headers=user_headers)
check("GET /auth/me", r.status_code == 200)

# 7. Create project
r = client.post("/projects", json={"name": "Test Project"}, headers=user_headers)
check("POST /projects", r.status_code == 201)
project_id = r.json()["id"]

# 8. List projects
r = client.get("/projects", headers=user_headers)
check("GET /projects", r.status_code == 200)

# 9. Create node
r = client.post(f"/projects/{project_id}/nodes", json={
    "node_type": "text", "content": {"text": "Hello"},
    "position_x": 100, "position_y": 200, "width": 300, "height": 200
}, headers=user_headers)
check("POST /projects/{id}/nodes", r.status_code == 201)
node_id = r.json()["id"]

# 10. List nodes
r = client.get(f"/projects/{project_id}/nodes", headers=user_headers)
check("GET /projects/{id}/nodes", r.status_code == 200)

# 11. Update node
r = client.put(f"/projects/{project_id}/nodes/{node_id}", json={"content": {"text": "Updated"}}, headers=user_headers)
check("PUT /projects/{id}/nodes/{id}", r.status_code == 200)

# 12. Delete node
r = client.delete(f"/projects/{project_id}/nodes/{node_id}", headers=user_headers)
check("DELETE /projects/{id}/nodes/{id}", r.status_code == 204)

# 13. Upload asset
r = client.post("/assets/upload", json={
    "type": "prompt", "content_text": "test", "project_id": project_id
}, headers=user_headers)
check("POST /assets/upload", r.status_code == 200)
asset_id = r.json()["id"]

# 14. List assets
r = client.get("/assets", headers=user_headers)
check("GET /assets", r.status_code == 200)

# 15. Create template
r = client.post("/templates", json={"name": "Test Template", "project_id": project_id}, headers=user_headers)
check("POST /templates", r.status_code == 201)
template_id = r.json()["id"]

# 16. Use template
r = client.post(f"/templates/{template_id}/use", headers=user_headers)
check("POST /templates/{id}/use", r.status_code == 200)

# 17. Admin: list users
r = client.get("/admin/users", headers=admin_headers)
check("GET /admin/users", r.status_code == 200)
test_user_id = [u["id"] for u in r.json()["items"] if u["role"] == "user"][0]

# 18. Admin: grant quota
r = client.post(f"/admin/users/{test_user_id}/quotas/grant", json={
    "quota_type": "text", "amount": 100, "reason": "test"
}, headers=admin_headers)
check("POST /admin/users/{id}/quotas/grant", r.status_code == 200)

# 19. Admin: ban user
r = client.post(f"/admin/users/{test_user_id}/ban", headers=admin_headers)
check("POST /admin/users/{id}/ban", r.status_code == 200)

# 20. Admin: freeze generation
r = client.post(f"/admin/users/{test_user_id}/freeze-generation", headers=admin_headers)
check("POST /admin/users/{id}/freeze-generation", r.status_code == 200)

# 21. Admin: dashboard
r = client.get("/admin/dashboard", headers=admin_headers)
check("GET /admin/dashboard", r.status_code == 200)

# 22. Admin: logs
r = client.get("/admin/logs", headers=admin_headers)
check("GET /admin/logs", r.status_code == 200)

# 23. Admin: assets
r = client.get("/admin/assets", headers=admin_headers)
check("GET /admin/assets", r.status_code == 200)

# 24. Admin: projects
r = client.get("/admin/projects", headers=admin_headers)
check("GET /admin/projects", r.status_code == 200)

# 25. Admin: invitation codes
r = client.get("/admin/invitation-codes", headers=admin_headers)
check("GET /admin/invitation-codes", r.status_code == 200)

# 26. Admin: create invitation code
r = client.post("/admin/invitation-codes", json={
    "code": "TEST1234", "max_uses": 10, "expires_at": "2027-01-01T00:00:00+00:00"
}, headers=admin_headers)
check("POST /admin/invitation-codes", r.status_code == 200)

# 27. Admin: disable invitation code
r = client.patch("/admin/invitation-codes/TEST1234/disable", headers=admin_headers)
check("PATCH /admin/invitation-codes/{code}/disable", r.status_code == 200)

# 28. Closed registration blocks
r = client.put("/admin/registration-settings", json={"registration_mode": "closed"}, headers=admin_headers)
r2 = client.post("/auth/wechat/mock", json={
    "nickname": "BlockedUser", "avatar_url": "", "openid": "blocked-user", "invitation_code": ""
})
check("Closed registration blocks users", r2.status_code == 403)

# Restore
client.put("/admin/registration-settings", json={"registration_mode": "open"}, headers=admin_headers)

# 29. Non-admin blocked from admin
r = client.get("/admin/dashboard", headers=user_headers)
check("Non-admin blocked from /admin", r.status_code == 403)

# 30. Cross-project access denied
r = client.post("/projects", json={"name": "Other"}, headers=user_headers)
resp = r.json()
print("Create project response:", resp)
if "id" in resp:
    other_pid = resp["id"]
    r = client.get(f"/projects/{other_pid}/nodes", headers=user_headers)
    check("Cross-project access denied", r.status_code == 404)
else:
    check("Cross-project access denied", False, f"Unexpected response: {resp}")

# Summary
print(f"\n{'='*60}")
print(f"SMOKE TEST RESULTS: {passed}/{passed+failed} passed, {failed} failed")
print(f"{'='*60}")
for icon, name, detail in results:
    print(f"{icon} {name} — {detail}")
