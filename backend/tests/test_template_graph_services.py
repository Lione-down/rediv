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
from controllers.template_graphs import _stable_graph_id
from core.security import create_token
from models.base import get_session
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision
from models.template import Template
from tests.mysql_test_database import MySQLTestDatabase


class TemplateGraphServicesTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_template_graph_services")
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
        self.source_graph = self._seed_source_graph()

    def tearDown(self) -> None:
        self.client.close()

    def test_capture_preserves_exact_versioned_graph_and_source_canvas(self) -> None:
        template = self._capture_template()

        self.assertEqual(1, template["schema_version"])
        self.assertEqual(1, template["graph_data"]["schema_version"])
        self.assertEqual(2, template["node_count"])
        nodes = {node["id"]: node for node in template["graph_data"]["nodes"]}
        connections = template["graph_data"]["connections"]
        self.assertEqual(set(self.source_graph["nodes"]), set(nodes))
        self.assertEqual(1, len(connections))
        self.assertEqual(self.source_graph["connection_id"], connections[0]["id"])
        self.assertEqual(self.source_graph["group_id"], nodes[self.source_graph["child_id"]]["parent_node_id"])
        self.assertEqual(
            330,
            nodes[self.source_graph["child_id"]]["position_x"]
            - nodes[self.source_graph["group_id"]]["position_x"],
        )
        self.assertEqual(
            60,
            nodes[self.source_graph["child_id"]]["position_y"]
            - nodes[self.source_graph["group_id"]]["position_y"],
        )

    def test_capture_rejects_graph_beyond_document_batch_capacity(self) -> None:
        with get_session() as session:
            session.add_all(
                [
                    CanvasNode(
                        id=str(uuid4()),
                        project_id=self.project["id"],
                        canvas_id=self.source_canvas_id,
                        node_type="note",
                        content={"index": index},
                        position_x=index,
                        position_y=0,
                        width=300,
                        height=200,
                        z_index=0,
                        parent_node_id=None,
                        is_locked=False,
                        is_collapsed=False,
                        status="active",
                    )
                    for index in range(999)
                ]
            )
            template_count_before = session.scalar(select(func.count()).select_from(Template))
            session.commit()

        response = self.client.post(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.source_canvas_id}"
                "/templates"
            ),
            json={"name": "Too Large"},
            headers=self.headers,
        )

        self.assertEqual(422, response.status_code)
        self.assertIn("template_graph_capacity_exceeded", str(response.json()["detail"]))
        with get_session() as session:
            template_count_after = session.scalar(select(func.count()).select_from(Template))
        self.assertEqual(template_count_before, template_count_after)

    def test_instantiate_remaps_ids_atomically_and_is_idempotent(self) -> None:
        template = self._capture_template()
        request_payload = {
            "base_revision": 0,
            "client_mutation_id": "instantiate-graph-once",
            "anchor_x": 125,
            "anchor_y": 190,
        }

        response = self.client.post(
            self._instantiate_path(template["id"]),
            json=request_payload,
            headers=self.headers,
        )

        self.assertEqual(201, response.status_code)
        payload = response.json()
        self.assertEqual(1, payload["mutation"]["revision"])
        self.assertEqual(2, payload["nodes_created"])
        self.assertEqual(1, payload["connections_created"])
        self.assertEqual(set(self.source_graph["nodes"]), set(payload["node_id_map"]))
        self.assertEqual({self.source_graph["connection_id"]}, set(payload["connection_id_map"]))

        document = self._get_target_document()
        target_nodes = {node["id"]: node for node in document["nodes"]}
        mapped_group_id = payload["node_id_map"][self.source_graph["group_id"]]
        mapped_child_id = payload["node_id_map"][self.source_graph["child_id"]]
        mapped_connection_id = payload["connection_id_map"][self.source_graph["connection_id"]]
        self.assertTrue(set(payload["node_id_map"].values()).isdisjoint(self.source_graph["nodes"]))
        self.assertEqual(mapped_group_id, target_nodes[mapped_child_id]["parent_node_id"])
        self.assertEqual(125, target_nodes[mapped_group_id]["position_x"])
        self.assertEqual(190, target_nodes[mapped_group_id]["position_y"])
        self.assertEqual(455, target_nodes[mapped_child_id]["position_x"])
        self.assertEqual(250, target_nodes[mapped_child_id]["position_y"])
        connection = next(item for item in document["connections"] if item["id"] == mapped_connection_id)
        self.assertEqual(mapped_group_id, connection["source_node_id"])
        self.assertEqual(mapped_child_id, connection["target_node_id"])
        self.assertEqual({"asset_id": "shared-asset"}, connection["metadata"])

        replay = self.client.post(
            self._instantiate_path(template["id"]),
            json=request_payload,
            headers=self.headers,
        )
        self.assertEqual(201, replay.status_code)
        self.assertEqual(payload, replay.json())
        self.assertEqual(1, self._get_target_document()["revision"])
        self.assertEqual(1, self._target_revision_count())

    def test_structured_id_identity_prevents_delimiter_collisions(self) -> None:
        template = self._capture_template()
        with get_session() as session:
            row = session.get(Template, template["id"])
            graph = deepcopy(row.graph_data)
            graph["nodes"][0]["id"] = "node:b"
            graph["nodes"][1]["id"] = "b"
            for node in graph["nodes"]:
                node["node_type"] = "note"
                node["parent_node_id"] = None
            graph["connections"] = []
            row.graph_data = graph
            row.node_data = deepcopy(graph["nodes"])
            session.commit()

        first = self.client.post(
            self._instantiate_path(template["id"]),
            json={
                "base_revision": 0,
                "client_mutation_id": "a",
            },
            headers=self.headers,
        )
        second = self.client.post(
            self._instantiate_path(template["id"]),
            json={
                "base_revision": 1,
                "client_mutation_id": "a:node",
            },
            headers=self.headers,
        )

        self.assertEqual(201, first.status_code)
        self.assertEqual(201, second.status_code)
        self.assertTrue(
            set(first.json()["node_id_map"].values()).isdisjoint(
                second.json()["node_id_map"].values()
            )
        )
        document = self._get_target_document()
        self.assertEqual(4, len(document["nodes"]))
        self.assertEqual(0, len(document["connections"]))
        self.assertEqual(2, document["revision"])

    def test_preoccupied_deterministic_id_is_rejected_without_overwrite(self) -> None:
        template = self._capture_template()
        client_mutation_id = "planned-template-insert"
        occupied_id = _stable_graph_id(
            template["id"],
            self.target_canvas_id,
            client_mutation_id,
            "node",
            self.source_graph["group_id"],
        )
        marker = {
            "id": occupied_id,
            "node_type": "note",
            "content": {"marker": "must-survive"},
            "position_x": 0,
            "position_y": 0,
            "width": 300,
            "height": 200,
            "z_index": 0,
            "parent_node_id": None,
            "is_locked": False,
            "is_collapsed": False,
        }
        seeded = self.client.patch(
            f"/api/projects/{self.project['id']}/canvases/{self.target_canvas_id}/document",
            json={
                "base_revision": 0,
                "client_mutation_id": "seed-preoccupied-id",
                "node_upserts": [marker],
                "node_deletes": [],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, seeded.status_code)

        response = self.client.post(
            self._instantiate_path(template["id"]),
            json={
                "base_revision": 1,
                "client_mutation_id": client_mutation_id,
            },
            headers=self.headers,
        )

        self.assertEqual(422, response.status_code)
        self.assertIn("template_target_id_collision", str(response.json()["detail"]))
        document = self._get_target_document()
        self.assertEqual(1, len(document["nodes"]))
        self.assertEqual({"marker": "must-survive"}, document["nodes"][0]["content"])
        self.assertEqual(1, document["revision"])

    def test_exact_retry_survives_template_deletion(self) -> None:
        template = self._capture_template()
        request_payload = {
            "base_revision": 0,
            "client_mutation_id": "retry-after-template-delete",
            "anchor_x": 25,
            "anchor_y": 35,
        }
        first = self.client.post(
            self._instantiate_path(template["id"]),
            json=request_payload,
            headers=self.headers,
        )
        self.assertEqual(201, first.status_code)
        deleted = self.client.delete(
            f"/templates/{template['id']}",
            headers=self.headers,
        )
        self.assertEqual(204, deleted.status_code)

        replay = self.client.post(
            self._instantiate_path(template["id"]),
            json=request_payload,
            headers=self.headers,
        )
        changed_request = self.client.post(
            self._instantiate_path(template["id"]),
            json={**request_payload, "anchor_x": 30},
            headers=self.headers,
        )

        self.assertEqual(201, replay.status_code)
        self.assertEqual(first.json(), replay.json())
        self.assertEqual(409, changed_request.status_code)
        self.assertEqual(1, self._get_target_document()["revision"])

    def test_invalid_graph_rejection_rolls_back_the_complete_batch(self) -> None:
        template = self._capture_template()
        with get_session() as session:
            row = session.get(Template, template["id"])
            invalid_graph = deepcopy(row.graph_data)
            invalid_graph["connections"][0]["target_node_id"] = str(uuid4())
            row.graph_data = invalid_graph
            session.commit()
        before = self._target_graph_counts()

        response = self.client.post(
            self._instantiate_path(template["id"]),
            json={
                "base_revision": 0,
                "client_mutation_id": "invalid-template-graph",
            },
            headers=self.headers,
        )

        self.assertEqual(422, response.status_code)
        self.assertIn("template_connection_endpoint_missing", str(response.json()["detail"]))
        self.assertEqual(before, self._target_graph_counts())
        self.assertEqual(0, self._target_revision_count())

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

    def _seed_source_graph(self) -> dict:
        group_id = str(uuid4())
        child_id = str(uuid4())
        connection_id = str(uuid4())
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
                        "id": connection_id,
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
        return {
            "group_id": group_id,
            "child_id": child_id,
            "connection_id": connection_id,
            "nodes": {group_id, child_id},
        }

    def _get_target_document(self) -> dict:
        response = self.client.get(
            f"/api/projects/{self.project['id']}/canvases/{self.target_canvas_id}/document",
            headers=self.headers,
        )
        self.assertEqual(200, response.status_code)
        return response.json()

    def _target_graph_counts(self) -> tuple[int, int, int]:
        with get_session() as session:
            node_count = session.scalar(
                select(func.count()).select_from(CanvasNode).where(
                    CanvasNode.canvas_id == self.target_canvas_id,
                    CanvasNode.status != "deleted",
                )
            )
            connection_count = session.scalar(
                select(func.count()).select_from(CanvasConnection).where(
                    CanvasConnection.canvas_id == self.target_canvas_id,
                    CanvasConnection.status != "deleted",
                )
            )
            revision = self._canvas_revision(session)
        return node_count, connection_count, revision

    def _target_revision_count(self) -> int:
        with get_session() as session:
            return session.scalar(
                select(func.count()).select_from(CanvasRevision).where(
                    CanvasRevision.canvas_id == self.target_canvas_id
                )
            )

    def _canvas_revision(self, session) -> int:
        from models.canvas import Canvas

        return session.get(Canvas, self.target_canvas_id).graph_revision

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
