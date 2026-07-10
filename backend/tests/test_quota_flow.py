from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token, hash_password
from database import close_db, init_db


class QuotaFlowTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(db_path)
        configure_store(DatabaseStore())
        self.admin_id = store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))["id"]

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"

    def tearDown(self) -> None:
        self.client.close()
        close_db()
        self.temp_dir.cleanup()

    def test_default_grant_on_registration(self) -> None:
        response = self._register_user("quota-default-user")

        self.assertEqual(200, response.status_code)
        payload = response.json()
        user_id = payload["user"]["id"]

        self.assertEqual({"text": 100, "image": 20, "video": 3}, payload["quotas"])
        self.assertEqual({"text": 100, "image": 20, "video": 3}, dict(store.quotas[user_id]))

        user_ledger = [record for record in store.quota_ledger if record["user_id"] == user_id]
        self.assertEqual(3, len(user_ledger))
        self.assertTrue(all(record["reason"] == "default_grant" for record in user_ledger))

    def test_admin_grant(self) -> None:
        user_id = self._register_user("quota-admin-grant").json()["user"]["id"]

        response = self.client.post(
            f"/admin/users/{user_id}/quotas/grant",
            json={"quota_type": "text", "amount": 50, "reason": "manual grant"},
            headers=self._admin_headers(),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(150, payload["quotas"]["text"])
        self.assertEqual(150, store.quotas[user_id]["text"])
        self.assertEqual("admin_grant", payload["ledger"]["reason"])
        self.assertEqual(self.admin_id, payload["ledger"]["admin_id"])
        self.assertEqual("manual grant", payload["ledger"]["note"])

    def test_quota_ledger_query(self) -> None:
        user_id = self._register_user("quota-ledger-query").json()["user"]["id"]
        grant_response = self.client.post(
            f"/admin/users/{user_id}/quotas/grant",
            json={"quota_type": "image", "amount": 2, "reason": "manual image grant"},
            headers=self._admin_headers(),
        )
        self.assertEqual(200, grant_response.status_code)

        response = self.client.get(
            f"/admin/users/{user_id}/quotas/ledger",
            headers=self._admin_headers(),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        ledger = payload["ledger"]

        self.assertEqual(user_id, payload["user_id"])
        self.assertEqual(4, len(ledger))
        self.assertEqual(
            sorted((record["created_at"] for record in ledger), reverse=True),
            [record["created_at"] for record in ledger],
        )
        self.assertEqual("admin_grant", ledger[0]["reason"])
        self.assertEqual("image", ledger[0]["quota_type"])

    def test_multiple_admin_grants(self) -> None:
        user_id = self._register_user("quota-multi-admin").json()["user"]["id"]

        for amount in (10, 15, 5):
            response = self.client.post(
                f"/admin/users/{user_id}/quotas/grant",
                json={"quota_type": "text", "amount": amount, "reason": f"grant-{amount}"},
                headers=self._admin_headers(),
            )
            self.assertEqual(200, response.status_code)

        self.assertEqual(130, store.quotas[user_id]["text"])
        user_text_grants = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user_id and record["quota_type"] == "text" and record["reason"] == "admin_grant"
        ]
        self.assertEqual(3, len(user_text_grants))

    def test_ledger_filter_by_user(self) -> None:
        first_user_id = self._register_user("quota-filter-first").json()["user"]["id"]
        second_user_id = self._register_user("quota-filter-second").json()["user"]["id"]

        first_grant = self.client.post(
            f"/admin/users/{first_user_id}/quotas/grant",
            json={"quota_type": "video", "amount": 1, "reason": "first-user-video"},
            headers=self._admin_headers(),
        )
        second_grant = self.client.post(
            f"/admin/users/{second_user_id}/quotas/grant",
            json={"quota_type": "text", "amount": 5, "reason": "second-user-text"},
            headers=self._admin_headers(),
        )
        self.assertEqual(200, first_grant.status_code)
        self.assertEqual(200, second_grant.status_code)

        response = self.client.get(
            f"/admin/users/{first_user_id}/quotas/ledger",
            headers=self._admin_headers(),
        )

        self.assertEqual(200, response.status_code)
        ledger = response.json()["ledger"]
        self.assertEqual(4, len(ledger))
        self.assertTrue(all(record["user_id"] == first_user_id for record in ledger))
        self.assertFalse(any(record["user_id"] == second_user_id for record in ledger))

    def test_quota_ledger_requires_admin(self) -> None:
        user_response = self._register_user("quota-non-admin")
        user_id = user_response.json()["user"]["id"]
        token = create_token({"sub": user_id, "role": "user"})

        response = self.client.get(
            f"/admin/users/{user_id}/quotas/ledger",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Admin only", response.json()["detail"])

    def test_quota_ledger_returns_404_for_missing_user(self) -> None:
        response = self.client.get(
            "/admin/users/missing-user/quotas/ledger",
            headers=self._admin_headers(),
        )

        self.assertEqual(404, response.status_code)
        self.assertEqual("User not found", response.json()["detail"])

    def _register_user(self, openid: str):
        return self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": openid,
                "nickname": f"user-{openid}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )

    def _admin_headers(self) -> dict[str, str]:
        token = create_token({"sub": self.admin_id, "role": "admin"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
