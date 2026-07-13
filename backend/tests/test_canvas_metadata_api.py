from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.canvas import Canvas
from models.project import Project
from tests.mysql_test_database import MySQLTestDatabase


class CanvasMetadataApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_metadata_api")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"canvas-owner-{suffix}").json()["user"]
        self.other_user = self._register_user(f"canvas-other-{suffix}").json()["user"]
        self.project = store.create_project(self.user["id"], f"Canvas Project {suffix}")
        self.path = f"/api/projects/{self.project['id']}/canvases"
        self.headers = self._auth_headers(self.user["id"])

    def tearDown(self) -> None:
        self.client.close()

    def test_canvas_routes_require_authentication_and_ownership(self) -> None:
        unauthenticated = self.client.get(self.path)
        forbidden = self.client.get(self.path, headers=self._auth_headers(self.other_user["id"]))

        self.assertEqual(401, unauthenticated.status_code)
        self.assertEqual(403, forbidden.status_code)

    def test_create_list_read_and_rename_canvas(self) -> None:
        created = self.client.post(
            self.path,
            json={"name": "画布 1", "base_order_revision": 0},
            headers=self.headers,
        )

        self.assertEqual(201, created.status_code)
        created_payload = created.json()
        self.assertEqual(1, created_payload["order_revision"])
        self.assertEqual("画布 1", created_payload["item"]["name"])
        self.assertEqual(1, created_payload["item"]["sort_order"])

        listed = self.client.get(self.path, headers=self.headers)
        self.assertEqual(200, listed.status_code)
        self.assertEqual(1, listed.json()["order_revision"])
        self.assertEqual([0, 1], [item["sort_order"] for item in listed.json()["items"]])

        canvas_id = created_payload["item"]["id"]
        loaded = self.client.get(f"{self.path}/{canvas_id}", headers=self.headers)
        renamed = self.client.patch(
            f"{self.path}/{canvas_id}",
            json={"name": "分镜"},
            headers=self.headers,
        )

        self.assertEqual(200, loaded.status_code)
        self.assertEqual(canvas_id, loaded.json()["id"])
        self.assertEqual(200, renamed.status_code)
        self.assertEqual("分镜", renamed.json()["item"]["name"])
        self.assertEqual(1, renamed.json()["order_revision"])

    def test_stale_create_returns_conflict_without_partial_write(self) -> None:
        first = self._create_canvas("Second", 0)
        stale = self.client.post(
            self.path,
            json={"name": "Stale", "base_order_revision": 0},
            headers=self.headers,
        )
        listed = self.client.get(self.path, headers=self.headers).json()

        self.assertEqual(201, first.status_code)
        self.assertEqual(409, stale.status_code)
        self.assertEqual("stale_order_revision", stale.json()["detail"]["code"])
        self.assertEqual(1, stale.json()["detail"]["current_order_revision"])
        self.assertEqual(2, len(listed["items"]))
        self.assertEqual(1, listed["order_revision"])

    def test_reorder_is_dense_atomic_and_persistent(self) -> None:
        second = self._create_canvas("Second", 0).json()["item"]
        third = self._create_canvas("Third", 1).json()["item"]
        initial = self.client.get(self.path, headers=self.headers).json()["items"]
        ordered_ids = [third["id"], initial[0]["id"], second["id"]]

        reordered = self.client.patch(
            f"{self.path}/order",
            json={"base_order_revision": 2, "ordered_canvas_ids": ordered_ids},
            headers=self.headers,
        )

        self.assertEqual(200, reordered.status_code)
        self.assertEqual(3, reordered.json()["order_revision"])
        self.assertEqual(ordered_ids, [item["id"] for item in reordered.json()["items"]])
        self.assertEqual([0, 1, 2], [item["sort_order"] for item in reordered.json()["items"]])

        with get_session() as session:
            rows = session.scalars(
                select(Canvas)
                .where(Canvas.project_id == self.project["id"], Canvas.status == "active")
                .order_by(Canvas.sort_order)
            ).all()
            project = session.get(Project, self.project["id"])
            self.assertEqual(ordered_ids, [canvas.id for canvas in rows])
            self.assertEqual([0, 1, 2], [canvas.sort_order for canvas in rows])
            self.assertEqual(3, project.canvas_order_revision)

    def test_stale_reorder_does_not_change_order(self) -> None:
        self._create_canvas("Second", 0)
        before = self.client.get(self.path, headers=self.headers).json()
        reversed_ids = list(reversed([item["id"] for item in before["items"]]))

        stale = self.client.patch(
            f"{self.path}/order",
            json={"base_order_revision": 0, "ordered_canvas_ids": reversed_ids},
            headers=self.headers,
        )
        after = self.client.get(self.path, headers=self.headers).json()

        self.assertEqual(409, stale.status_code)
        self.assertEqual("stale_order_revision", stale.json()["detail"]["code"])
        self.assertEqual(before, after)

    def test_reorder_rejects_non_permutations_without_write(self) -> None:
        second = self._create_canvas("Second", 0).json()["item"]
        before = self.client.get(self.path, headers=self.headers).json()
        first_id = before["items"][0]["id"]
        invalid_orders = [
            [first_id],
            [first_id, str(uuid4())],
            [second["id"], second["id"]],
        ]

        for ordered_ids in invalid_orders:
            response = self.client.patch(
                f"{self.path}/order",
                json={"base_order_revision": 1, "ordered_canvas_ids": ordered_ids},
                headers=self.headers,
            )
            self.assertEqual(422, response.status_code)

        self.assertEqual(before, self.client.get(self.path, headers=self.headers).json())

    def test_last_active_canvas_cannot_be_archived(self) -> None:
        canvas_id = self.client.get(self.path, headers=self.headers).json()["items"][0]["id"]
        response = self.client.patch(
            f"{self.path}/{canvas_id}",
            json={"status": "archived", "base_order_revision": 0},
            headers=self.headers,
        )

        self.assertEqual(409, response.status_code)
        self.assertEqual("last_active_canvas", response.json()["detail"]["code"])
        listed = self.client.get(self.path, headers=self.headers).json()
        self.assertEqual(1, len(listed["items"]))
        self.assertEqual(0, listed["order_revision"])

    def test_archive_compacts_remaining_order_and_hides_canvas(self) -> None:
        second = self._create_canvas("Second", 0).json()["item"]
        first = self.client.get(self.path, headers=self.headers).json()["items"][0]
        archived = self.client.patch(
            f"{self.path}/{first['id']}",
            json={"status": "archived", "base_order_revision": 1},
            headers=self.headers,
        )
        listed = self.client.get(self.path, headers=self.headers).json()
        hidden = self.client.get(f"{self.path}/{first['id']}", headers=self.headers)

        self.assertEqual(200, archived.status_code)
        self.assertEqual("archived", archived.json()["item"]["status"])
        self.assertEqual(2, archived.json()["order_revision"])
        self.assertEqual([second["id"]], [item["id"] for item in listed["items"]])
        self.assertEqual([0], [item["sort_order"] for item in listed["items"]])
        self.assertEqual(2, listed["order_revision"])
        self.assertEqual(404, hidden.status_code)

    def _create_canvas(self, name: str, base_order_revision: int):
        return self.client.post(
            self.path,
            json={"name": name, "base_order_revision": base_order_revision},
            headers=self.headers,
        )

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

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
