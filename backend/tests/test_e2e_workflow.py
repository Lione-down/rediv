from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from controllers.store import DatabaseStore, configure_store, store
from tests.mysql_test_database import MySQLTestDatabase


class E2EWorkflowTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_e2e_workflow")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        store.registration_settings["registration_mode"] = "open"
        self.client = TestClient(backend_main.app)

    def tearDown(self) -> None:
        self.client.close()

    @patch.object(backend_main, "_agnes")
    def test_full_workflow_persists_generated_asset_and_deducts_quota(self, mock_agnes) -> None:
        generated_text = "Scene 1: Creator opens the workspace and drafts a hook."
        mock_agnes.chat = AsyncMock(
            return_value={"choices": [{"message": {"content": generated_text}}]},
        )

        login_response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": "e2e-openid",
                "nickname": "e2e-user",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.assertEqual(200, login_response.status_code)
        login_payload = login_response.json()
        user = login_payload["user"]
        token = login_payload["token"]
        original_text_quota = login_payload["quotas"]["text"]

        project_response = self.client.post(
            "/projects",
            json={"name": "E2E Workflow Project"},
            headers=self._auth_headers(token),
        )
        self.assertEqual(201, project_response.status_code)
        project = project_response.json()
        self.assertEqual(user["id"], project["user_id"])

        node_response = self.client.post(
            f"/projects/{project['id']}/nodes",
            json={
                "node_type": "text",
                "content": {"text": "Need a short launch storyboard"},
                "position_x": 120,
                "position_y": 80,
                "width": 360,
                "height": 220,
            },
            headers=self._auth_headers(token),
        )
        self.assertEqual(201, node_response.status_code)
        node = node_response.json()
        self.assertEqual(project["id"], node["project_id"])

        generate_response = self.client.post(
            "/api/text-generate",
            json={
                "project_id": project["id"],
                "node_id": node["id"],
                "prompt": "Write a creator-friendly storyboard opening",
            },
            headers=self._auth_headers(token),
        )
        self.assertEqual(200, generate_response.status_code)
        generate_payload = generate_response.json()
        asset = generate_payload["asset"]
        self.assertEqual(generated_text, generate_payload["content"])
        self.assertEqual("prompt", asset["type"])
        self.assertEqual("generation", asset["source"])
        self.assertEqual("agnes-2.0-flash", asset["source_model"])
        self.assertEqual(project["id"], asset["project_id"])
        self.assertEqual(node["id"], asset["canvas_node_id"])

        assets_response = self.client.get(
            f"/assets?project_id={project['id']}&asset_type=prompt",
            headers=self._auth_headers(token),
        )
        self.assertEqual(200, assets_response.status_code)
        assets_payload = assets_response.json()
        self.assertEqual(1, assets_payload["total"])
        self.assertEqual(1, len(assets_payload["items"]))
        self.assertEqual(asset["id"], assets_payload["items"][0]["id"])
        self.assertEqual(generated_text, assets_payload["items"][0]["content_text"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        remaining_text_quota = me_response.json()["quotas"]["text"]
        self.assertEqual(original_text_quota - 1, remaining_text_quota)

        quota_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user["id"] and record["reason"] == "text_generate"
        ]
        self.assertEqual(1, len(quota_records))
        self.assertEqual(-1, quota_records[0]["change_amount"])

        persisted_asset = store.get_asset(asset["id"])
        self.assertIsNotNone(persisted_asset)
        self.assertEqual(generated_text, persisted_asset["content_text"])

        mock_agnes.chat.assert_awaited_once_with(
            model="agnes-2.0-flash",
            messages=[{"role": "user", "content": "Write a creator-friendly storyboard opening"}],
        )

    @staticmethod
    def _auth_headers(token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
