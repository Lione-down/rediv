from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from tests.mysql_test_database import MySQLTestDatabase


class CanvasDocumentApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_document_api")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._create_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"document-owner-{suffix}").json()["user"]
        self.other_user = self._register_user(f"document-other-{suffix}").json()["user"]
        self.project = store.create_project(self.user["id"], f"Document Project {suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.canvas_path = f"/api/projects/{self.project['id']}/canvases"
        listed = self.client.get(self.canvas_path, headers=self.headers).json()
        self.first_canvas = listed["items"][0]
        second = self.client.post(
            self.canvas_path,
            json={"name": "Second", "base_order_revision": listed["order_revision"]},
            headers=self.headers,
        )
        self.assertEqual(201, second.status_code)
        self.second_canvas = second.json()["item"]

    def tearDown(self) -> None:
        self.client.close()

    def test_document_and_mutations_are_isolated_by_exact_canvas(self) -> None:
        first_left = self._create_node(self.first_canvas["id"], "first-left", -120.5)
        first_right = self._create_node(self.first_canvas["id"], "first-right", 240)
        second_node = self._create_node(self.second_canvas["id"], "second-only", 32)

        connection = self.client.post(
            self._resource_path(self.first_canvas["id"], "connections"),
            json={
                "source_node_id": first_left["id"],
                "source_port": "out",
                "target_node_id": first_right["id"],
                "target_port": "in",
            },
            headers=self.headers,
        )
        self.assertEqual(201, connection.status_code)
        self.assertEqual(self.first_canvas["id"], connection.json()["canvas_id"])

        first_document = self._get_document(self.first_canvas["id"])
        second_document = self._get_document(self.second_canvas["id"])

        self.assertEqual(self.first_canvas["id"], first_document["canvas"]["id"])
        self.assertEqual(first_document["canvas"]["graph_revision"], first_document["revision"])
        self.assertEqual({first_left["id"], first_right["id"]}, {node["id"] for node in first_document["nodes"]})
        self.assertEqual([connection.json()["id"]], [item["id"] for item in first_document["connections"]])
        self.assertEqual([second_node["id"]], [node["id"] for node in second_document["nodes"]])
        self.assertEqual([], second_document["connections"])
        self.assertEqual(-120.5, first_left["position_x"])

        wrong_canvas_update = self.client.put(
            f"{self._resource_path(self.second_canvas['id'], 'nodes')}/{first_left['id']}",
            json={"position_x": 999},
            headers=self.headers,
        )
        cross_canvas_connection = self.client.post(
            self._resource_path(self.second_canvas["id"], "connections"),
            json={
                "source_node_id": second_node["id"],
                "source_port": "out",
                "target_node_id": first_left["id"],
                "target_port": "in",
            },
            headers=self.headers,
        )

        self.assertEqual(404, wrong_canvas_update.status_code)
        self.assertEqual(400, cross_canvas_connection.status_code)
        self.assertEqual("Connection nodes must belong to canvas", cross_canvas_connection.json()["detail"])
        reloaded_nodes = {
            node["id"]: node for node in self._get_document(self.first_canvas["id"])["nodes"]
        }
        self.assertEqual(-120.5, reloaded_nodes[first_left["id"]]["position_x"])

        valid_update = self.client.put(
            f"{self._resource_path(self.first_canvas['id'], 'nodes')}/{first_left['id']}",
            json={"position_x": -333.25, "position_y": 88.5},
            headers=self.headers,
        )
        deleted_connection = self.client.delete(
            f"{self._resource_path(self.first_canvas['id'], 'connections')}/{connection.json()['id']}",
            headers=self.headers,
        )
        deleted_node = self.client.delete(
            f"{self._resource_path(self.first_canvas['id'], 'nodes')}/{first_right['id']}",
            headers=self.headers,
        )
        final_document = self._get_document(self.first_canvas["id"])

        self.assertEqual(200, valid_update.status_code)
        self.assertEqual(-333.25, valid_update.json()["position_x"])
        self.assertEqual(204, deleted_connection.status_code)
        self.assertEqual(204, deleted_node.status_code)
        self.assertEqual([first_left["id"]], [node["id"] for node in final_document["nodes"]])
        self.assertEqual([], final_document["connections"])
        self.assertEqual([second_node["id"]], [node["id"] for node in self._get_document(self.second_canvas["id"])["nodes"]])

    def test_viewport_is_normalized_without_advancing_graph_revision_and_survives_restart(self) -> None:
        viewport_path = self._resource_path(self.second_canvas["id"], "viewport")
        before = self._get_document(self.second_canvas["id"])
        response = self.client.patch(
            viewport_path,
            json={"x": 123.456, "y": -987.654, "zoom": 1.23456},
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual(123.46, response.json()["viewport_x"])
        self.assertEqual(-987.65, response.json()["viewport_y"])
        self.assertEqual(1.2346, response.json()["viewport_zoom"])
        self.assertEqual(before["revision"], response.json()["graph_revision"])

        self.client.close()
        configure_store(DatabaseStore())
        self.client = self._create_client()
        restarted = self._get_document(self.second_canvas["id"])
        self.assertEqual(123.46, restarted["canvas"]["viewport_x"])
        self.assertEqual(-987.65, restarted["canvas"]["viewport_y"])
        self.assertEqual(1.2346, restarted["canvas"]["viewport_zoom"])
        self.assertEqual(before["revision"], restarted["revision"])

        invalid = self.client.patch(
            viewport_path,
            json={"x": 0, "y": 0, "zoom": 8.01},
            headers=self.headers,
        )
        self.assertEqual(422, invalid.status_code)

    def test_document_requires_authentication_ownership_and_active_canvas(self) -> None:
        document_path = self._resource_path(self.second_canvas["id"], "document")
        unauthenticated = self.client.get(document_path)
        forbidden = self.client.get(document_path, headers=self._auth_headers(self.other_user["id"]))
        archived = self.client.patch(
            f"{self.canvas_path}/{self.second_canvas['id']}",
            json={"status": "archived", "base_order_revision": 1},
            headers=self.headers,
        )
        hidden = self.client.get(document_path, headers=self.headers)

        self.assertEqual(401, unauthenticated.status_code)
        self.assertEqual(403, forbidden.status_code)
        self.assertEqual(200, archived.status_code)
        self.assertEqual(404, hidden.status_code)

    def _create_node(self, canvas_id: str, title: str, position_x: float) -> dict:
        response = self.client.post(
            self._resource_path(canvas_id, "nodes"),
            json={
                "node_type": "text",
                "content": {"title": title, "text": title},
                "position_x": position_x,
                "position_y": -24,
                "width": 300,
                "height": 200,
            },
            headers=self.headers,
        )
        self.assertEqual(201, response.status_code)
        self.assertEqual(canvas_id, response.json()["canvas_id"])
        return response.json()

    def _get_document(self, canvas_id: str) -> dict:
        response = self.client.get(self._resource_path(canvas_id, "document"), headers=self.headers)
        self.assertEqual(200, response.status_code)
        return response.json()

    def _resource_path(self, canvas_id: str, resource: str) -> str:
        return f"{self.canvas_path}/{canvas_id}/{resource}"

    @staticmethod
    def _create_client() -> TestClient:
        app = FastAPI()
        include_routers(app)
        return TestClient(app)

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
        return {"Authorization": f"Bearer {create_token({'sub': user_id, 'role': 'user'})}"}


if __name__ == "__main__":
    unittest.main()
