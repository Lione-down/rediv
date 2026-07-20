from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch
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


class CanvasRevisionApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_revision_api")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._create_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"revision-owner-{suffix}").json()["user"]
        self.other_user = self._register_user(f"revision-other-{suffix}").json()["user"]
        self.project = store.create_project(self.user["id"], f"Revision Project {suffix}")
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

    def test_revision_list_is_owned_canvas_scoped_and_marks_periodic_checkpoints(self) -> None:
        first_node_id = self._create_legacy_node(self.first_canvas["id"], "first")
        second_node_id = self._create_legacy_node(self.second_canvas["id"], "second")
        self._commit_positions(self.first_canvas["id"], first_node_id, 10)
        self._commit_positions(self.second_canvas["id"], second_node_id, 1)

        first = self.client.get(self._revisions_path(self.first_canvas["id"]), headers=self.headers)
        second = self.client.get(self._revisions_path(self.second_canvas["id"]), headers=self.headers)
        unauthenticated = self.client.get(self._revisions_path(self.first_canvas["id"]))
        forbidden = self.client.get(
            self._revisions_path(self.first_canvas["id"]),
            headers=self._auth_headers(self.other_user["id"]),
        )

        self.assertEqual(200, first.status_code)
        self.assertEqual(10, first.json()["current_revision"])
        self.assertEqual(list(range(10, 0, -1)), [item["revision"] for item in first.json()["items"]])
        self.assertEqual({1, 10}, {
            item["revision"] for item in first.json()["items"] if item["is_checkpoint"]
        })
        self.assertTrue(all("operations" not in item and "checkpoint_snapshot" not in item for item in first.json()["items"]))
        self.assertEqual([1], [item["revision"] for item in second.json()["items"]])
        self.assertEqual(401, unauthenticated.status_code)
        self.assertEqual(403, forbidden.status_code)

    def test_retention_keeps_reconstruction_bridge_and_restore_creates_checkpointed_head(self) -> None:
        node_id = self._create_legacy_node(self.first_canvas["id"], "legacy-before-r1")
        self._commit_positions(self.first_canvas["id"], node_id, 61)
        before_restore = self.client.get(
            self._revisions_path(self.first_canvas["id"]), headers=self.headers,
        ).json()

        self.assertEqual(61, before_restore["current_revision"])
        self.assertEqual(list(range(61, 9, -1)), [item["revision"] for item in before_restore["items"]])
        self.assertEqual(52, len(before_restore["items"]))
        with get_session() as session:
            target = session.query(CanvasRevision).filter_by(
                canvas_id=self.first_canvas["id"], revision_no=12,
            ).one()
            target_identity = (target.id, target.created_at, target.operations)

        restored = self.client.post(
            f"{self._revisions_path(self.first_canvas['id'])}/12/restore",
            headers=self.headers,
        )

        self.assertEqual(200, restored.status_code)
        self.assertEqual(62, restored.json()["revision"])
        self.assertEqual(12, restored.json()["restored_from_revision"])
        document = self.client.get(
            self._resource_path(self.first_canvas["id"], "document"), headers=self.headers,
        ).json()
        self.assertEqual(62, document["revision"])
        self.assertEqual([node_id], [node["id"] for node in document["nodes"]])
        self.assertEqual(12.0, document["nodes"][0]["position_x"])

        after_restore = self.client.get(
            self._revisions_path(self.first_canvas["id"]), headers=self.headers,
        ).json()
        self.assertEqual(62, after_restore["current_revision"])
        self.assertEqual(62, after_restore["items"][0]["revision"])
        self.assertTrue(after_restore["items"][0]["is_checkpoint"])
        self.assertEqual(12, after_restore["items"][0]["restored_from_revision"])
        self.assertIn(12, [item["revision"] for item in after_restore["items"]])
        with get_session() as session:
            unchanged_target = session.query(CanvasRevision).filter_by(
                canvas_id=self.first_canvas["id"], revision_no=12,
            ).one()
            restore_head = session.query(CanvasRevision).filter_by(
                canvas_id=self.first_canvas["id"], revision_no=62,
            ).one()
            self.assertEqual(target_identity, (
                unchanged_target.id, unchanged_target.created_at, unchanged_target.operations,
            ))
            self.assertIsNotNone(restore_head.checkpoint_snapshot)

        self.client.close()
        restart = self.mysql_database.restart_runtime()
        self.assertTrue(restart["match"])
        from database import close_db
        from main import app as production_app
        from settings.config import settings

        close_db()
        try:
            with patch.object(settings, "jwt_secret", "unit-test-canvas-restart-secret-minimum-32"):
                restarted_headers = self._auth_headers(self.user["id"])
                with TestClient(production_app) as restarted_client:
                    restarted = restarted_client.get(
                        self._resource_path(self.first_canvas["id"], "document"),
                        headers=restarted_headers,
                    )
                    restarted_history = restarted_client.get(
                        self._revisions_path(self.first_canvas["id"]),
                        headers=restarted_headers,
                    )
                    post_restart_restore = restarted_client.post(
                        f"{self._revisions_path(self.first_canvas['id'])}/61/restore",
                        headers=restarted_headers,
                    )
                    restored_again = restarted_client.get(
                        self._resource_path(self.first_canvas["id"], "document"),
                        headers=restarted_headers,
                    )

                    self.assertEqual(200, restarted.status_code)
                    self.assertEqual(62, restarted.json()["revision"])
                    self.assertEqual(12.0, restarted.json()["nodes"][0]["position_x"])
                    self.assertEqual(200, restarted_history.status_code)
                    self.assertEqual(62, restarted_history.json()["current_revision"])
                    self.assertIn(61, [item["revision"] for item in restarted_history.json()["items"]])
                    self.assertEqual(200, post_restart_restore.status_code)
                    self.assertEqual(63, post_restart_restore.json()["revision"])
                    self.assertEqual(61, post_restart_restore.json()["restored_from_revision"])
                    self.assertEqual(63, restored_again.json()["revision"])
                    self.assertEqual(61.0, restored_again.json()["nodes"][0]["position_x"])
        finally:
            restart = self.mysql_database.restart_runtime()
            self.assertTrue(restart["match"])
            configure_store(DatabaseStore())
            self.client = self._create_client()

    def test_restore_rejects_foreign_pruned_and_archived_targets_without_advancing_head(self) -> None:
        first_node_id = self._create_legacy_node(self.first_canvas["id"], "first")
        second_node_id = self._create_legacy_node(self.second_canvas["id"], "second")
        self._commit_positions(self.first_canvas["id"], first_node_id, 61)
        self._commit_positions(self.second_canvas["id"], second_node_id, 1)

        pruned = self.client.post(
            f"{self._revisions_path(self.first_canvas['id'])}/1/restore", headers=self.headers,
        )
        foreign = self.client.post(
            f"{self._revisions_path(self.first_canvas['id'])}/999/restore", headers=self.headers,
        )
        archived = self.client.patch(
            f"{self.canvas_path}/{self.second_canvas['id']}",
            json={"status": "archived", "base_order_revision": 1},
            headers=self.headers,
        )
        archived_restore = self.client.post(
            f"{self._revisions_path(self.second_canvas['id'])}/1/restore", headers=self.headers,
        )

        self.assertEqual(404, pruned.status_code)
        self.assertEqual(404, foreign.status_code)
        self.assertEqual(200, archived.status_code)
        self.assertEqual(404, archived_restore.status_code)
        document = self.client.get(
            self._resource_path(self.first_canvas["id"], "document"), headers=self.headers,
        ).json()
        self.assertEqual(61, document["revision"])
        self.assertEqual(61.0, document["nodes"][0]["position_x"])

    def test_restore_recreates_groups_children_connections_and_exact_entity_ids(self) -> None:
        group_id = str(uuid4())
        child_id = str(uuid4())
        target_id = str(uuid4())
        connection_id = str(uuid4())
        group = {**self._node_upsert(group_id, 0), "node_type": "group", "content": {"title": "Group"}}
        child = {**self._node_upsert(child_id, 100), "parent_node_id": group_id}
        target = self._node_upsert(target_id, 300)
        created = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json={
                "base_revision": 0,
                "client_mutation_id": str(uuid4()),
                "node_upserts": [group, child, target],
                "node_deletes": [],
                "connection_upserts": [{
                    "id": connection_id,
                    "source_node_id": child_id,
                    "source_port": "out",
                    "target_node_id": target_id,
                    "target_port": "in",
                    "metadata": {"label": "exact"},
                }],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, created.status_code, created.text)
        deleted = self.client.patch(
            self._resource_path(self.first_canvas["id"], "document"),
            json={
                "base_revision": 1,
                "client_mutation_id": str(uuid4()),
                "node_upserts": [],
                "node_deletes": [group_id, target_id],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, deleted.status_code, deleted.text)
        self.assertEqual([connection_id], deleted.json()["connection_deletes"])

        restored = self.client.post(
            f"{self._revisions_path(self.first_canvas['id'])}/1/restore",
            headers=self.headers,
        )
        self.assertEqual(200, restored.status_code, restored.text)
        document = self.client.get(
            self._resource_path(self.first_canvas["id"], "document"), headers=self.headers,
        ).json()
        nodes = {item["id"]: item for item in document["nodes"]}
        self.assertEqual({group_id, child_id, target_id}, set(nodes))
        self.assertEqual(group_id, nodes[child_id]["parent_node_id"])
        self.assertEqual([connection_id], [item["id"] for item in document["connections"]])
        self.assertEqual(child_id, document["connections"][0]["source_node_id"])
        self.assertEqual(target_id, document["connections"][0]["target_node_id"])
        self.assertEqual({"label": "exact"}, document["connections"][0]["metadata"])

    def _create_legacy_node(self, canvas_id: str, title: str) -> str:
        response = self.client.post(
            self._resource_path(canvas_id, "nodes"),
            json={
                "node_type": "text",
                "content": {"title": title, "text": title},
                "position_x": 0,
                "position_y": -24,
                "width": 300,
                "height": 200,
            },
            headers=self.headers,
        )
        self.assertEqual(201, response.status_code)
        return response.json()["id"]

    def _commit_positions(self, canvas_id: str, node_id: str, count: int) -> None:
        for revision in range(1, count + 1):
            response = self.client.patch(
                self._resource_path(canvas_id, "document"),
                json={
                    "base_revision": revision - 1,
                    "client_mutation_id": str(uuid4()),
                    "node_upserts": [self._node_upsert(node_id, revision)],
                    "node_deletes": [],
                    "connection_upserts": [],
                    "connection_deletes": [],
                },
                headers=self.headers,
            )
            self.assertEqual(200, response.status_code, response.text)

    @staticmethod
    def _node_upsert(node_id: str, position_x: float) -> dict:
        return {
            "id": node_id,
            "node_type": "text",
            "content": {"title": "retained", "text": f"revision-{position_x}"},
            "position_x": position_x,
            "position_y": -24,
            "width": 300,
            "height": 200,
            "z_index": 0,
            "parent_node_id": None,
            "is_locked": False,
            "is_collapsed": False,
        }

    def _revisions_path(self, canvas_id: str) -> str:
        return self._resource_path(canvas_id, "revisions")

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
