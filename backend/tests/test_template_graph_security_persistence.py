from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from tests.mysql_test_database import MySQLTestDatabase


class TemplateGraphSecurityPersistenceTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_template_graph_security")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._new_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"template-owner-{suffix}")
        self.other_user = self._register_user(f"template-other-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.project = store.create_project(self.user["id"], f"Template Project {suffix}")
        self.target_canvas_id = store.get_first_canvas_id(self.project["id"])
        source = self.client.post(
            f"/api/projects/{self.project['id']}/canvases",
            json={"name": "Source", "base_order_revision": 0},
            headers=self.headers,
        )
        self.assertEqual(201, source.status_code)
        self.source_canvas_id = source.json()["item"]["id"]
        self._seed_source_graph()

    def tearDown(self) -> None:
        self.client.close()

    def test_template_and_target_canvas_require_authenticated_ownership(self) -> None:
        template = self._capture_template()
        foreign_project = store.create_project(self.other_user["id"], "Foreign Template Target")
        foreign_canvas_id = store.get_first_canvas_id(foreign_project["id"])
        foreign_template = store.create_template(
            self.other_user["id"], "Private Template", foreign_project["id"]
        )
        request_payload = {
            "base_revision": 0,
            "client_mutation_id": "foreign-template",
        }

        private_template = self.client.post(
            self._instantiate_path(foreign_template["id"]),
            json=request_payload,
            headers=self.headers,
        )
        foreign_target = self.client.post(
            (
                f"/api/projects/{foreign_project['id']}/canvases/{foreign_canvas_id}"
                f"/templates/{template['id']}/instantiate"
            ),
            json={**request_payload, "client_mutation_id": "foreign-target"},
            headers=self.headers,
        )

        self.assertEqual(403, private_template.status_code)
        self.assertEqual(403, foreign_target.status_code)
        self.assertEqual((0, 0, 0), self._graph_counts(self.target_canvas_id))
        self.assertEqual((0, 0, 0), self._graph_counts(foreign_canvas_id))

    def test_instantiated_graph_survives_backend_restart(self) -> None:
        template = self._capture_template()
        response = self.client.post(
            self._instantiate_path(template["id"]),
            json={
                "base_revision": 0,
                "client_mutation_id": "restart-template-graph",
            },
            headers=self.headers,
        )
        self.assertEqual(201, response.status_code)

        self.client.close()
        restart = self.mysql_database.restart_runtime()
        self.assertEqual("e1f2a3b4c5d6", restart["current"])
        from database import close_db
        from main import app as production_app
        from settings.config import settings

        close_db()
        try:
            with patch.object(settings, "jwt_secret", "template-restart-test-secret"):
                restarted_headers = self._auth_headers(self.user["id"])
                with TestClient(production_app) as restarted_client:
                    template_after_restart = restarted_client.get(
                        f"/templates/{template['id']}", headers=restarted_headers
                    )
                    document_after_restart = restarted_client.get(
                        (
                            f"/api/projects/{self.project['id']}/canvases/{self.target_canvas_id}"
                            "/document"
                        ),
                        headers=restarted_headers,
                    )

            self.assertEqual(200, template_after_restart.status_code)
            self.assertEqual(2, len(template_after_restart.json()["graph_data"]["nodes"]))
            self.assertEqual(200, document_after_restart.status_code)
            self.assertEqual(2, len(document_after_restart.json()["nodes"]))
            self.assertEqual(1, len(document_after_restart.json()["connections"]))
            self.assertEqual(1, document_after_restart.json()["revision"])
        finally:
            self.mysql_database.restart_runtime()
            configure_store(DatabaseStore())
            self.client = self._new_client()

    def _capture_template(self) -> dict:
        response = self.client.post(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.source_canvas_id}"
                "/templates"
            ),
            json={"name": "Connected Scene"},
            headers=self.headers,
        )
        self.assertEqual(201, response.status_code)
        return response.json()

    def _instantiate_path(self, template_id: str) -> str:
        return (
            f"/api/projects/{self.project['id']}/canvases/{self.target_canvas_id}"
            f"/templates/{template_id}/instantiate"
        )

    def _seed_source_graph(self) -> None:
        group_id = str(uuid4())
        child_id = str(uuid4())
        response = self.client.patch(
            f"/api/projects/{self.project['id']}/canvases/{self.source_canvas_id}/document",
            json={
                "base_revision": 0,
                "client_mutation_id": "seed-template-source",
                "node_upserts": [
                    {
                        "id": group_id,
                        "node_type": "group",
                        "content": {"label": "Scene"},
                        "position_x": 100,
                        "position_y": 200,
                        "width": 640,
                        "height": 480,
                        "z_index": 2,
                        "parent_node_id": None,
                        "is_locked": False,
                        "is_collapsed": True,
                    },
                    {
                        "id": child_id,
                        "node_type": "asset",
                        "content": {"asset_id": "shared-asset"},
                        "position_x": 430,
                        "position_y": 260,
                        "width": 320,
                        "height": 240,
                        "z_index": 3,
                        "parent_node_id": group_id,
                        "is_locked": True,
                        "is_collapsed": False,
                    },
                ],
                "node_deletes": [],
                "connection_upserts": [
                    {
                        "id": str(uuid4()),
                        "source_node_id": group_id,
                        "source_port": "out",
                        "target_node_id": child_id,
                        "target_port": "in",
                        "metadata": {"asset_id": "shared-asset"},
                    }
                ],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, response.status_code)

    @staticmethod
    def _graph_counts(canvas_id: str) -> tuple[int, int, int]:
        with get_session() as session:
            node_count = session.scalar(
                select(func.count()).select_from(CanvasNode).where(
                    CanvasNode.canvas_id == canvas_id,
                    CanvasNode.status != "deleted",
                )
            )
            connection_count = session.scalar(
                select(func.count()).select_from(CanvasConnection).where(
                    CanvasConnection.canvas_id == canvas_id,
                    CanvasConnection.status != "deleted",
                )
            )
            revision = session.get(Canvas, canvas_id).graph_revision
        return node_count, connection_count, revision

    @staticmethod
    def _new_client() -> TestClient:
        app = FastAPI()
        include_routers(app)
        return TestClient(app)

    def _register_user(self, openid: str) -> dict:
        response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": openid,
                "nickname": f"user-{openid}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.assertEqual(200, response.status_code)
        return response.json()["user"]

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
