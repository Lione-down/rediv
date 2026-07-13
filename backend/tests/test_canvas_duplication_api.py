from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import event, select
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.project import Project
from tests.mysql_test_database import MySQLTestDatabase


class CanvasDuplicationApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_duplication_api")
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
        self.user = self._register_user(f"duplicate-owner-{suffix}").json()["user"]
        self.other_user = self._register_user(f"duplicate-other-{suffix}").json()["user"]
        self.project = store.create_project(self.user["id"], f"Duplicate Project {suffix}")
        self.path = f"/api/projects/{self.project['id']}/canvases"
        self.headers = self._auth_headers(self.user["id"])
        self.source_canvas_id = self.client.get(self.path, headers=self.headers).json()["items"][0]["id"]
        self.source_ids = self._seed_source_graph()

    def tearDown(self) -> None:
        self.client.close()

    def test_duplicate_remaps_graph_and_preserves_project_asset_references(self) -> None:
        response = self.client.post(
            f"{self.path}/{self.source_canvas_id}/duplicate",
            json={"base_order_revision": 0, "name": "画布 1"},
            headers=self.headers,
        )

        self.assertEqual(201, response.status_code)
        payload = response.json()
        duplicate_id = payload["item"]["id"]
        self.assertEqual("画布 1", payload["item"]["name"])
        self.assertEqual(1, payload["item"]["sort_order"])
        self.assertEqual(1, payload["order_revision"])
        self.assertEqual(12.5, payload["item"]["viewport_x"])
        self.assertEqual(-8.25, payload["item"]["viewport_y"])
        self.assertEqual(1.75, payload["item"]["viewport_zoom"])
        self.assertEqual(0, payload["item"]["graph_revision"])

        with get_session() as session:
            duplicate_nodes = session.scalars(
                select(CanvasNode).where(CanvasNode.canvas_id == duplicate_id)
            ).all()
            duplicate_connections = session.scalars(
                select(CanvasConnection).where(CanvasConnection.canvas_id == duplicate_id)
            ).all()
            project = session.get(Project, self.project["id"])

        self.assertEqual(2, len(duplicate_nodes))
        self.assertEqual(1, len(duplicate_connections))
        duplicate_by_key = {node.content["key"]: node for node in duplicate_nodes}
        group = duplicate_by_key["group"]
        child = duplicate_by_key["child"]
        connection = duplicate_connections[0]
        self.assertTrue(self.source_ids.isdisjoint({node.id for node in duplicate_nodes}))
        self.assertNotIn(connection.id, self.source_ids)
        self.assertEqual(group.id, child.parent_node_id)
        self.assertEqual(group.id, connection.source_node_id)
        self.assertEqual(child.id, connection.target_node_id)
        self.assertEqual("project-asset-1", child.content["asset_id"])
        self.assertEqual("project-asset-1", connection.metadata_["asset_id"])
        self.assertEqual(1, project.canvas_order_revision)

    def test_duplicate_defaults_name_and_requires_authentication_and_ownership(self) -> None:
        unauthenticated = self.client.post(
            f"{self.path}/{self.source_canvas_id}/duplicate",
            json={"base_order_revision": 0},
        )
        forbidden = self.client.post(
            f"{self.path}/{self.source_canvas_id}/duplicate",
            json={"base_order_revision": 0},
            headers=self._auth_headers(self.other_user["id"]),
        )
        duplicated = self.client.post(
            f"{self.path}/{self.source_canvas_id}/duplicate",
            json={"base_order_revision": 0},
            headers=self.headers,
        )

        self.assertEqual(401, unauthenticated.status_code)
        self.assertEqual(403, forbidden.status_code)
        self.assertEqual(201, duplicated.status_code)
        self.assertEqual("画布 1 副本", duplicated.json()["item"]["name"])

    def test_stale_duplicate_has_no_partial_write(self) -> None:
        self.assertEqual(
            201,
            self.client.post(
                self.path,
                json={"name": "Second", "base_order_revision": 0},
                headers=self.headers,
            ).status_code,
        )
        before = self._graph_counts()

        stale = self.client.post(
            f"{self.path}/{self.source_canvas_id}/duplicate",
            json={"base_order_revision": 0},
            headers=self.headers,
        )

        self.assertEqual(409, stale.status_code)
        self.assertEqual("stale_order_revision", stale.json()["detail"]["code"])
        self.assertEqual(before, self._graph_counts())

    def test_commit_failure_rolls_back_canvas_graph_and_order_revision(self) -> None:
        before = self._graph_counts()

        def fail_commit(session: Session) -> None:
            raise RuntimeError("forced duplicate commit failure")

        event.listen(Session, "before_commit", fail_commit)
        try:
            with self.assertRaisesRegex(RuntimeError, "forced duplicate commit failure"):
                self.client.post(
                    f"{self.path}/{self.source_canvas_id}/duplicate",
                    json={"base_order_revision": 0},
                    headers=self.headers,
                )
        finally:
            event.remove(Session, "before_commit", fail_commit)

        self.assertEqual(before, self._graph_counts())

    def _seed_source_graph(self) -> set[str]:
        group_id = str(uuid4())
        child_id = str(uuid4())
        connection_id = str(uuid4())
        with get_session() as session:
            canvas = session.get(Canvas, self.source_canvas_id)
            canvas.viewport_x = 12.5
            canvas.viewport_y = -8.25
            canvas.viewport_zoom = 1.75
            session.add(
                CanvasNode(
                    id=group_id,
                    project_id=self.project["id"],
                    canvas_id=self.source_canvas_id,
                    node_type="group",
                    content={"key": "group"},
                    position_x=-20,
                    position_y=30,
                    width=640,
                    height=480,
                    z_index=2,
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
                    content={"key": "child", "asset_id": "project-asset-1"},
                    position_x=40,
                    position_y=-50,
                    width=300,
                    height=200,
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
                    metadata_={"asset_id": "project-asset-1"},
                )
            )
            session.commit()
        return {group_id, child_id, connection_id}

    def _graph_counts(self) -> tuple[int, int, int, int]:
        with get_session() as session:
            canvas_count = len(
                session.scalars(select(Canvas).where(Canvas.project_id == self.project["id"])).all()
            )
            node_count = len(
                session.scalars(select(CanvasNode).where(CanvasNode.project_id == self.project["id"])).all()
            )
            connection_count = len(
                session.scalars(
                    select(CanvasConnection).where(CanvasConnection.project_id == self.project["id"])
                ).all()
            )
            order_revision = session.get(Project, self.project["id"]).canvas_order_revision
        return canvas_count, node_count, connection_count, order_revision

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
