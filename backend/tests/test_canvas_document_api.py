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
from models.base import get_session
from models.canvas_revision import CanvasRevision
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
        restart = self.mysql_database.restart_runtime()
        self.assertTrue(restart["match"])
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

    def test_group_fields_round_trip_and_parent_can_be_cleared(self) -> None:
        group_response = self.client.post(
            self._resource_path(self.first_canvas["id"], "nodes"),
            json={
                "node_type": "group",
                "content": {"title": "镜头组合"},
                "position_x": 40,
                "position_y": 60,
                "width": 640,
                "height": 360,
                "z_index": -1,
                "is_collapsed": False,
            },
            headers=self.headers,
        )
        self.assertEqual(201, group_response.status_code)
        group = group_response.json()
        self.assertEqual(-1, group["z_index"])
        self.assertIsNone(group["parent_node_id"])
        self.assertFalse(group["is_locked"])
        self.assertFalse(group["is_collapsed"])

        child = self._create_node(self.first_canvas["id"], "group-child", 120)
        attach = self.client.put(
            f"{self._resource_path(self.first_canvas['id'], 'nodes')}/{child['id']}",
            json={"parent_node_id": group["id"]},
            headers=self.headers,
        )
        self.assertEqual(200, attach.status_code)
        self.assertEqual(group["id"], attach.json()["parent_node_id"])
        grouped_document = self._get_document(self.first_canvas["id"])
        grouped_child = next(node for node in grouped_document["nodes"] if node["id"] == child["id"])
        self.assertEqual(group["id"], grouped_child["parent_node_id"])

        detach = self.client.put(
            f"{self._resource_path(self.first_canvas['id'], 'nodes')}/{child['id']}",
            json={"parent_node_id": None},
            headers=self.headers,
        )
        self.assertEqual(200, detach.status_code)
        self.assertIsNone(detach.json()["parent_node_id"])

    def test_document_patch_is_atomic_idempotent_and_survives_restart(self) -> None:
        first_node_id = str(uuid4())
        second_node_id = str(uuid4())
        connection_id = str(uuid4())
        mutation_id = str(uuid4())
        payload = {
            "base_revision": 0,
            "client_mutation_id": mutation_id,
            "node_upserts": [
                self._node_upsert(first_node_id, "left", -120.5),
                self._node_upsert(second_node_id, "right", 240),
            ],
            "node_deletes": [],
            "connection_upserts": [
                {
                    "id": connection_id,
                    "source_node_id": first_node_id,
                    "source_port": "out",
                    "target_node_id": second_node_id,
                    "target_port": "in",
                    "metadata": {"label": "flow"},
                }
            ],
            "connection_deletes": [],
        }

        committed = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json=payload,
            headers=self.headers,
        )
        self.assertEqual(200, committed.status_code)
        result = committed.json()
        self.assertEqual(1, result["revision"])
        self.assertEqual("saved", result["save_state"])
        self.assertEqual({first_node_id, second_node_id}, {item["id"] for item in result["node_upserts"]})
        self.assertEqual([connection_id], [item["id"] for item in result["connection_upserts"]])
        document = self._get_document(self.first_canvas["id"])
        self.assertEqual(1, document["revision"])
        self.assertEqual({first_node_id, second_node_id}, {item["id"] for item in document["nodes"]})

        self.client.close()
        restart = self.mysql_database.restart_runtime()
        self.assertTrue(restart["match"])
        configure_store(DatabaseStore())
        self.client = self._create_client()
        retried = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json=payload,
            headers=self.headers,
        )
        self.assertEqual(200, retried.status_code)
        self.assertEqual(result, retried.json())
        with get_session() as session:
            revisions = session.query(CanvasRevision).filter_by(canvas_id=self.first_canvas["id"]).all()
            self.assertEqual(1, len(revisions))

        reused = {**payload, "node_deletes": [second_node_id]}
        reused["node_upserts"] = [payload["node_upserts"][0]]
        mismatch = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json=reused,
            headers=self.headers,
        )
        self.assertEqual(409, mismatch.status_code)
        self.assertEqual("mutation_id_reused", mismatch.json()["detail"]["code"])
        self.assertEqual(1, mismatch.json()["detail"]["current_revision"])

        stale = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json={**payload, "client_mutation_id": str(uuid4())},
            headers=self.headers,
        )
        self.assertEqual(409, stale.status_code)
        self.assertEqual("stale_graph_revision", stale.json()["detail"]["code"])
        self.assertEqual(1, self._get_document(self.first_canvas["id"])["revision"])

    def test_document_patch_normalizes_deletes_and_rolls_back_invalid_batch(self) -> None:
        first_node_id = str(uuid4())
        second_node_id = str(uuid4())
        connection_id = str(uuid4())
        create_payload = {
            "base_revision": 0,
            "client_mutation_id": str(uuid4()),
            "node_upserts": [
                self._node_upsert(first_node_id, "left", -20),
                self._node_upsert(second_node_id, "right", 220),
            ],
            "node_deletes": [],
            "connection_upserts": [{
                "id": connection_id,
                "source_node_id": first_node_id,
                "source_port": "out",
                "target_node_id": second_node_id,
                "target_port": "in",
                "metadata": {},
            }],
            "connection_deletes": [],
        }
        created = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json=create_payload,
            headers=self.headers,
        )
        self.assertEqual(200, created.status_code)

        update_payload = {
            "base_revision": 1,
            "client_mutation_id": str(uuid4()),
            "node_upserts": [self._node_upsert(first_node_id, "left-updated", -333.25)],
            "node_deletes": [second_node_id],
            "connection_upserts": [],
            "connection_deletes": [],
        }
        updated = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json=update_payload,
            headers=self.headers,
        )
        self.assertEqual(200, updated.status_code)
        self.assertEqual(2, updated.json()["revision"])
        self.assertEqual([second_node_id], updated.json()["node_deletes"])
        self.assertEqual([connection_id], updated.json()["connection_deletes"])

        foreign_node = self._create_node(self.second_canvas["id"], "foreign", 0)
        invalid_payload = {
            "base_revision": 2,
            "client_mutation_id": str(uuid4()),
            "node_upserts": [self._node_upsert(str(uuid4()), "should-rollback", 10)],
            "node_deletes": [],
            "connection_upserts": [{
                "id": str(uuid4()),
                "source_node_id": first_node_id,
                "source_port": "out",
                "target_node_id": foreign_node["id"],
                "target_port": "in",
                "metadata": {},
            }],
            "connection_deletes": [],
        }
        invalid = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json=invalid_payload,
            headers=self.headers,
        )
        self.assertEqual(422, invalid.status_code)
        self.assertEqual("connection_endpoint_missing", invalid.json()["detail"])
        document = self._get_document(self.first_canvas["id"])
        self.assertEqual(2, document["revision"])
        self.assertEqual([first_node_id], [item["id"] for item in document["nodes"]])

    def test_document_patch_requires_ownership_and_rejects_overlapping_operations(self) -> None:
        node_id = str(uuid4())
        path = self._resource_path(self.first_canvas["id"], "document")
        payload = {
            "base_revision": 0,
            "client_mutation_id": str(uuid4()),
            "node_upserts": [self._node_upsert(node_id, "overlap", 0)],
            "node_deletes": [node_id],
            "connection_upserts": [],
            "connection_deletes": [],
        }
        valid_payload = {**payload, "node_deletes": []}
        forbidden = self.client.patch(
            path,
            json=valid_payload,
            headers=self._auth_headers(self.other_user["id"]),
        )
        overlap = self.client.patch(path, json=payload, headers=self.headers)

        self.assertEqual(403, forbidden.status_code)
        self.assertEqual(422, overlap.status_code)
        self.assertEqual(0, self._get_document(self.first_canvas["id"])["revision"])

    def test_document_patch_clears_children_when_deleting_a_group(self) -> None:
        group = self.client.post(
            self._resource_path(self.first_canvas["id"], "nodes"),
            json={**self._node_upsert(str(uuid4()), "group", 0), "node_type": "group"},
            headers=self.headers,
        ).json()
        child = self._create_node(self.first_canvas["id"], "child", 100)
        attached = self.client.put(
            f"{self._resource_path(self.first_canvas['id'], 'nodes')}/{child['id']}",
            json={"parent_node_id": group["id"]},
            headers=self.headers,
        )
        self.assertEqual(200, attached.status_code)

        deleted = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json={
                "base_revision": 0,
                "client_mutation_id": str(uuid4()),
                "node_upserts": [],
                "node_deletes": [group["id"]],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, deleted.status_code)
        normalized_child = next(item for item in deleted.json()["node_upserts"] if item["id"] == child["id"])
        self.assertIsNone(normalized_child["parent_node_id"])
        document = self._get_document(self.first_canvas["id"])
        self.assertEqual([child["id"]], [item["id"] for item in document["nodes"]])

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

    @staticmethod
    def _node_upsert(node_id: str, title: str, position_x: float) -> dict:
        return {
            "id": node_id,
            "node_type": "text",
            "content": {"title": title, "text": title},
            "position_x": position_x,
            "position_y": -24,
            "width": 300,
            "height": 200,
            "z_index": 0,
            "parent_node_id": None,
            "is_locked": False,
            "is_collapsed": False,
        }

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
