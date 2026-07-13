from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.project import Project
from models.template import Template
from tests.mysql_test_database import MySQLTestDatabase


class TemplateProjectUseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_template_project_use")
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
        self.user = self._register_user(f"template-use-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.project = store.create_project(self.user["id"], f"Template Source {suffix}")
        self.source_canvas_id = store.get_first_canvas_id(self.project["id"])
        self._seed_source_graph()

    def tearDown(self) -> None:
        self.client.close()

    def test_legacy_use_preserves_complete_graph_with_compatible_response(self) -> None:
        template = self._capture_template()

        response = self.client.post(
            f"/templates/{template['id']}/use",
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(template["id"], payload["template"]["id"])
        self.assertEqual("Connected Scene", payload["project_name"])
        self.assertEqual(2, payload["nodes_created"])
        document = self._project_document(payload["project_id"])
        self.assertEqual(2, len(document["nodes"]))
        self.assertEqual(1, len(document["connections"]))
        self.assertEqual(1, document["revision"])
        nodes_by_type = {node["node_type"]: node for node in document["nodes"]}
        group = nodes_by_type["group"]
        child = nodes_by_type["asset"]
        self.assertEqual(group["id"], child["parent_node_id"])
        self.assertEqual(2, group["z_index"])
        self.assertTrue(group["is_collapsed"])
        self.assertTrue(child["is_locked"])
        connection = document["connections"][0]
        self.assertEqual(group["id"], connection["source_node_id"])
        self.assertEqual(child["id"], connection["target_node_id"])
        self.assertEqual({"asset_id": "shared-asset"}, connection["metadata"])

    def test_invalid_graph_legacy_use_creates_no_partial_project(self) -> None:
        template = self._capture_template()
        with get_session() as session:
            row = session.get(Template, template["id"])
            invalid_graph = deepcopy(row.graph_data)
            invalid_graph["connections"][0]["target_node_id"] = str(uuid4())
            row.graph_data = invalid_graph
            project_count_before = session.scalar(select(func.count()).select_from(Project))
            session.commit()

        response = self.client.post(
            f"/templates/{template['id']}/use",
            headers=self.headers,
        )

        self.assertEqual(422, response.status_code)
        with get_session() as session:
            project_count_after = session.scalar(select(func.count()).select_from(Project))
        self.assertEqual(project_count_before, project_count_after)

    def test_legacy_use_keeps_empty_template_project_compatibility(self) -> None:
        empty_project = store.create_project(self.user["id"], "Empty Source")
        empty_template = store.create_template(
            self.user["id"], "Empty Template", empty_project["id"]
        )

        response = self.client.post(
            f"/templates/{empty_template['id']}/use",
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(0, payload["nodes_created"])
        document = self._project_document(payload["project_id"])
        self.assertEqual([], document["nodes"])
        self.assertEqual([], document["connections"])
        self.assertEqual(0, document["revision"])

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

    def _project_document(self, project_id: str) -> dict:
        canvases = self.client.get(
            f"/api/projects/{project_id}/canvases",
            headers=self.headers,
        ).json()["items"]
        response = self.client.get(
            f"/api/projects/{project_id}/canvases/{canvases[0]['id']}/document",
            headers=self.headers,
        )
        self.assertEqual(200, response.status_code)
        return response.json()

    def _seed_source_graph(self) -> None:
        group_id = str(uuid4())
        child_id = str(uuid4())
        connection_id = str(uuid4())
        with get_session() as session:
            session.add(
                CanvasNode(
                    id=group_id,
                    project_id=self.project["id"],
                    canvas_id=self.source_canvas_id,
                    node_type="group",
                    content={"label": "Scene"},
                    position_x=100,
                    position_y=200,
                    width=640,
                    height=480,
                    z_index=2,
                    parent_node_id=None,
                    is_locked=False,
                    is_collapsed=True,
                    status="active",
                )
            )
            session.flush()
            session.add(
                CanvasNode(
                    id=child_id,
                    project_id=self.project["id"],
                    canvas_id=self.source_canvas_id,
                    node_type="asset",
                    content={"asset_id": "shared-asset"},
                    position_x=430,
                    position_y=260,
                    width=320,
                    height=240,
                    z_index=3,
                    parent_node_id=group_id,
                    is_locked=True,
                    is_collapsed=False,
                    status="active",
                )
            )
            session.flush()
            session.add(
                CanvasConnection(
                    id=connection_id,
                    project_id=self.project["id"],
                    canvas_id=self.source_canvas_id,
                    source_node_id=group_id,
                    source_port="out",
                    target_node_id=child_id,
                    target_port="in",
                    status="active",
                    metadata_={"asset_id": "shared-asset"},
                )
            )
            session.commit()

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
