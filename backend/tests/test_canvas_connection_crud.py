from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import inspect

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, InMemoryStore, configure_store, store
from core.security import create_token
from models import base as model_base
from models.canvas_connection import CanvasConnection
from tests.mysql_test_database import MySQLTestDatabase


class CanvasConnectionCrudTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_connection_crud")
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
        test_id = self._testMethodName
        self.user = self._register_user(f"connection-owner-{test_id}").json()["user"]
        self.other_user = self._register_user(f"connection-other-{test_id}").json()["user"]
        self.project = store.create_project(self.user["id"], "Connection Storyboard")
        self.other_project = store.create_project(self.other_user["id"], "Other Connection Storyboard")

    def tearDown(self) -> None:
        self.client.close()

    def test_create_list_update_delete_connection(self) -> None:
        source = self._create_node("source", 10)
        target = self._create_node("target", 220)

        response = self.client.post(
            f"/projects/{self.project['id']}/connections",
            json={
                "source_node_id": source["id"],
                "source_port": "out",
                "target_node_id": target["id"],
                "target_port": "in",
                "metadata": {"label": "draft"},
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(201, response.status_code)
        created = response.json()
        self.assertEqual(self.project["id"], created["project_id"])
        self.assertEqual(source["id"], created["source_node_id"])
        self.assertEqual("out", created["source_port"])
        self.assertEqual({"label": "draft"}, created["metadata"])
        self.assertIn("updated_at", created)

        listed = self.client.get(
            f"/projects/{self.project['id']}/connections",
            headers=self._auth_headers(self.user["id"]),
        )
        self.assertEqual(200, listed.status_code)
        self.assertEqual(1, listed.json()["total"])
        self.assertEqual(created["id"], listed.json()["items"][0]["id"])

        updated = self.client.put(
            f"/projects/{self.project['id']}/connections/{created['id']}",
            json={"source_port": "out:primary", "metadata": {"label": "final"}},
            headers=self._auth_headers(self.user["id"]),
        )
        self.assertEqual(200, updated.status_code)
        self.assertEqual("out:primary", updated.json()["source_port"])
        self.assertEqual({"label": "final"}, updated.json()["metadata"])

        deleted = self.client.delete(
            f"/projects/{self.project['id']}/connections/{created['id']}",
            headers=self._auth_headers(self.user["id"]),
        )
        self.assertEqual(204, deleted.status_code)
        self.assertIsNone(store.get_connection(created["id"]))

    def test_duplicate_connection_conflict(self) -> None:
        source = self._create_node("source", 10)
        target = self._create_node("target", 220)
        body = {
            "source_node_id": source["id"],
            "source_port": "out",
            "target_node_id": target["id"],
            "target_port": "in",
        }

        first = self.client.post(
            f"/projects/{self.project['id']}/connections",
            json=body,
            headers=self._auth_headers(self.user["id"]),
        )
        second = self.client.post(
            f"/projects/{self.project['id']}/connections",
            json=body,
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(201, first.status_code)
        self.assertEqual(409, second.status_code)
        self.assertEqual("Connection already exists", second.json()["detail"])

    def test_self_loop_rejected(self) -> None:
        node = self._create_node("self", 10)

        response = self.client.post(
            f"/projects/{self.project['id']}/connections",
            json={
                "source_node_id": node["id"],
                "source_port": "out",
                "target_node_id": node["id"],
                "target_port": "in",
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Self-loop connections are not allowed", response.json()["detail"])

    def test_cross_project_node_rejected(self) -> None:
        source = self._create_node("source", 10)
        target = store.create_node(self.other_project["id"], self.other_user["id"], "text", {"text": "other"}, 0, 0, 300, 200)

        response = self.client.post(
            f"/projects/{self.project['id']}/connections",
            json={
                "source_node_id": source["id"],
                "source_port": "out",
                "target_node_id": target["id"],
                "target_port": "in",
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Connection nodes must belong to project", response.json()["detail"])

    def test_project_permission_denied(self) -> None:
        source = self._create_node("source", 10)
        target = self._create_node("target", 220)

        response = self.client.post(
            f"/projects/{self.project['id']}/connections",
            json={
                "source_node_id": source["id"],
                "source_port": "out",
                "target_node_id": target["id"],
                "target_port": "in",
            },
            headers=self._auth_headers(self.other_user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_node_delete_removes_related_connections(self) -> None:
        left = self._create_node("left", 10)
        middle = self._create_node("middle", 220)
        right = self._create_node("right", 430)
        first = store.create_connection(self.project["id"], self.user["id"], left["id"], "out", middle["id"], "in")
        second = store.create_connection(self.project["id"], self.user["id"], middle["id"], "out", right["id"], "in")

        response = self.client.delete(
            f"/projects/{self.project['id']}/nodes/{middle['id']}",
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(204, response.status_code)
        self.assertIsNone(store.get_connection(first["id"]))
        self.assertIsNone(store.get_connection(second["id"]))
        self.assertEqual([], store.list_connections(self.project["id"], self.user["id"]))

    def test_connection_persistence_after_store_reload(self) -> None:
        source = self._create_node("source", 10)
        target = self._create_node("target", 220)
        created = store.create_connection(
            self.project["id"],
            self.user["id"],
            source["id"],
            "out",
            target["id"],
            "in",
            metadata={"persist": True},
        )

        reloaded_store = DatabaseStore()
        loaded = reloaded_store.get_connection(created["id"])

        self.assertIsNotNone(loaded)
        self.assertEqual(self.project["id"], loaded["project_id"])
        self.assertEqual({"persist": True}, loaded["metadata"])

    def test_directed_cycle_allowed(self) -> None:
        first = self._create_node("first", 10)
        second = self._create_node("second", 220)

        forward = store.create_connection(self.project["id"], self.user["id"], first["id"], "out", second["id"], "in")
        backward = store.create_connection(self.project["id"], self.user["id"], second["id"], "out", first["id"], "in")

        self.assertNotEqual(forward["id"], backward["id"])
        self.assertEqual(2, len(store.list_connections(self.project["id"], self.user["id"])))

    def test_mysql_schema_and_comments(self) -> None:
        self.assertIsNotNone(model_base._engine)
        inspector = inspect(model_base._engine)

        self.assertIn("canvas_connections", inspector.get_table_names())
        inspected_columns = inspector.get_columns("canvas_connections")
        columns = {column["name"] for column in inspected_columns}
        self.assertEqual(
            {
                "id",
                "project_id",
                "canvas_id",
                "source_node_id",
                "source_port",
                "target_node_id",
                "target_port",
                "status",
                "metadata",
                "created_at",
                "updated_at",
            },
            columns,
        )
        self.assertEqual(
            "Canvas node connection table",
            inspector.get_table_comment("canvas_connections")["text"],
        )
        for column in inspected_columns:
            self.assertTrue(column["comment"], f"missing database comment for {column['name']}")
        self.assertEqual("Canvas node connection table", CanvasConnection.__table__.comment)
        for column in CanvasConnection.__table__.columns:
            self.assertTrue(column.comment, f"missing comment for {column.name}")
        unique_names = {constraint["name"] for constraint in inspector.get_unique_constraints("canvas_connections")}
        self.assertIn("uq_canvas_connections_edge", unique_names)
        foreign_key_names = {constraint["name"] for constraint in inspector.get_foreign_keys("canvas_connections")}
        self.assertEqual(
            {"fk_canvas_connections_project_canvas", "fk_canvas_connections_source", "fk_canvas_connections_target"},
            foreign_key_names,
        )

    def test_inmemory_connection_crud(self) -> None:
        memory_store = InMemoryStore()
        user = memory_store.create_user("Memory User", "")
        project = memory_store.create_project(user["id"], "Memory Project")
        source = memory_store.create_node(project["id"], user["id"], "text", {"text": "source"}, 10, 20, 300, 200)
        target = memory_store.create_node(project["id"], user["id"], "text", {"text": "target"}, 200, 20, 300, 200)

        created = memory_store.create_connection(project["id"], user["id"], source["id"], "out", target["id"], "in")
        listed = memory_store.list_connections(project["id"], user["id"])
        updated = memory_store.update_connection(created["id"], user["id"], metadata={"mode": "memory"})
        deleted = memory_store.delete_connection(created["id"], user["id"])

        self.assertEqual(1, len(listed))
        self.assertEqual({"mode": "memory"}, updated["metadata"])
        self.assertEqual(created["id"], deleted["id"])
        self.assertIsNone(memory_store.get_connection(created["id"]))

    def _create_node(self, text: str, position_x: float) -> dict:
        return store.create_node(
            self.project["id"],
            self.user["id"],
            "text",
            {"text": text},
            position_x,
            20,
            300,
            200,
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
