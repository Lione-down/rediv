from __future__ import annotations

import sys
import unittest
from datetime import UTC, datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase, assert_selected_database


class MultiCanvasFoundationTestCase(unittest.TestCase):
    schema_name = "revid_test_multi_canvas_foundation"
    user_id = "10000000-0000-0000-0000-000000000001"
    project_id = "20000000-0000-0000-0000-000000000001"
    source_node_id = "30000000-0000-0000-0000-000000000001"
    target_node_id = "30000000-0000-0000-0000-000000000002"
    connection_id = "40000000-0000-0000-0000-000000000001"

    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase(cls.schema_name, revision="e9f1a2b3c4d5")
        cls.mysql_database.start()
        cls._seed_pre_canvas_schema()
        cls.mysql_database.upgrade_to_head()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    @classmethod
    def _seed_pre_canvas_schema(cls) -> None:
        engine = init_engine()
        assert_selected_database(engine, cls.schema_name)
        timestamp = datetime.now(UTC)
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO users (
                        id, nickname, avatar_url, role, status, generation_status,
                        created_at, updated_at, last_login_at, username, email, password_hash
                    ) VALUES (
                        :id, 'Migration User', '', 'user', 'active', 'enabled',
                        :created_at, :updated_at, :last_login_at, NULL, NULL, NULL
                    )
                    """
                ),
                {"id": cls.user_id, "created_at": timestamp, "updated_at": timestamp, "last_login_at": timestamp},
            )
            connection.execute(
                text(
                    "INSERT INTO projects (id, user_id, name, created_at, updated_at) "
                    "VALUES (:id, :user_id, 'Migrated Project', :created_at, :updated_at)"
                ),
                {"id": cls.project_id, "user_id": cls.user_id, "created_at": timestamp, "updated_at": timestamp},
            )
            for node_id, position_x in ((cls.source_node_id, -120.0), (cls.target_node_id, 180.0)):
                connection.execute(
                    text(
                        """
                        INSERT INTO canvas_nodes (
                            id, project_id, node_type, content, position_x, position_y,
                            width, height, status, created_at, updated_at
                        ) VALUES (
                            :id, :project_id, 'note', :content, :position_x, 0,
                            300, 200, 'active', :created_at, :updated_at
                        )
                        """
                    ),
                    {
                        "id": node_id,
                        "project_id": cls.project_id,
                        "content": "{}",
                        "position_x": position_x,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    },
                )
            connection.execute(
                text(
                    """
                    INSERT INTO canvas_connections (
                        id, project_id, source_node_id, source_port,
                        target_node_id, target_port, status, metadata, created_at, updated_at
                    ) VALUES (
                        :id, :project_id, :source_node_id, 'out',
                        :target_node_id, 'in', 'active', :metadata, :created_at, :updated_at
                    )
                    """
                ),
                {
                    "id": cls.connection_id,
                    "project_id": cls.project_id,
                    "source_node_id": cls.source_node_id,
                    "target_node_id": cls.target_node_id,
                    "metadata": "{}",
                    "created_at": timestamp,
                    "updated_at": timestamp,
                },
            )

    def setUp(self) -> None:
        configure_store(DatabaseStore())

    def test_backfill_preserves_graph_ids_and_creates_first_canvas(self) -> None:
        engine = init_engine()
        assert_selected_database(engine, self.schema_name)
        with engine.connect() as connection:
            canvas = connection.execute(
                text(
                    "SELECT id, name FROM canvases "
                    "WHERE project_id = :project_id AND status = 'active' ORDER BY sort_order, created_at, id"
                ),
                {"project_id": self.project_id},
            ).one()
            nodes = connection.execute(
                text("SELECT id, canvas_id FROM canvas_nodes WHERE project_id = :project_id ORDER BY id"),
                {"project_id": self.project_id},
            ).all()
            edge = connection.execute(
                text("SELECT id, canvas_id FROM canvas_connections WHERE id = :id"),
                {"id": self.connection_id},
            ).one()

        self.assertEqual("画布 1", canvas.name)
        self.assertEqual([self.source_node_id, self.target_node_id], [node.id for node in nodes])
        self.assertTrue(all(node.canvas_id == canvas.id for node in nodes))
        self.assertEqual((self.connection_id, canvas.id), (edge.id, edge.canvas_id))

    def test_new_project_atomically_creates_default_canvas(self) -> None:
        project = store.create_project(self.user_id, "New Project")
        engine = init_engine()
        with engine.connect() as connection:
            canvases = connection.execute(
                text("SELECT name, status, sort_order FROM canvases WHERE project_id = :project_id"),
                {"project_id": project["id"]},
            ).all()

        self.assertEqual([("画布 1", "active", 0)], [tuple(canvas) for canvas in canvases])

    def test_schema_comments_and_scope_constraints_exist(self) -> None:
        inspector = inspect(init_engine())
        for table_name in ("canvases", "canvas_revisions"):
            self.assertTrue(inspector.get_table_comment(table_name)["text"])
            self.assertTrue(all(column.get("comment") for column in inspector.get_columns(table_name)))

        for table_name, changed_columns in {
            "projects": {"canvas_order_revision"},
            "canvas_nodes": {"canvas_id", "z_index", "parent_node_id", "is_locked", "is_collapsed"},
            "canvas_connections": {"canvas_id"},
        }.items():
            comments = {column["name"]: column.get("comment") for column in inspector.get_columns(table_name)}
            self.assertTrue(all(comments[column_name] for column_name in changed_columns))

        node_foreign_keys = {foreign_key["name"] for foreign_key in inspector.get_foreign_keys("canvas_nodes")}
        edge_foreign_keys = {foreign_key["name"] for foreign_key in inspector.get_foreign_keys("canvas_connections")}
        self.assertIn("fk_canvas_nodes_project_canvas", node_foreign_keys)
        self.assertIn("fk_canvas_nodes_parent", node_foreign_keys)
        self.assertEqual(
            {"fk_canvas_connections_project_canvas", "fk_canvas_connections_source", "fk_canvas_connections_target"},
            edge_foreign_keys,
        )

    def _ensure_second_canvas(self) -> tuple[str, str]:
        engine = init_engine()
        timestamp = datetime.now(UTC)
        second_canvas_id = "50000000-0000-0000-0000-000000000002"
        second_node_id = "60000000-0000-0000-0000-000000000002"
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO canvases (
                        id, project_id, name, sort_order, status, viewport_x, viewport_y,
                        viewport_zoom, graph_revision, created_at, updated_at, deleted_at
                    ) VALUES (
                        :id, :project_id, 'Second', 1, 'active', 0, 0, 1, 0,
                        :created_at, :updated_at, NULL
                    )
                    ON DUPLICATE KEY UPDATE id = VALUES(id)
                    """
                ),
                {"id": second_canvas_id, "project_id": self.project_id, "created_at": timestamp, "updated_at": timestamp},
            )
            connection.execute(
                text(
                    """
                    INSERT INTO canvas_nodes (
                        id, project_id, canvas_id, node_type, content, position_x, position_y,
                        width, height, z_index, parent_node_id, is_locked, is_collapsed,
                        status, created_at, updated_at
                    ) VALUES (
                        :id, :project_id, :canvas_id, 'note', :content, 0, 0,
                        300, 200, 0, NULL, 0, 0, 'active', :created_at, :updated_at
                    )
                    ON DUPLICATE KEY UPDATE id = VALUES(id)
                    """
                ),
                {
                    "id": second_node_id,
                    "project_id": self.project_id,
                    "canvas_id": second_canvas_id,
                    "content": "{}",
                    "created_at": timestamp,
                    "updated_at": timestamp,
                },
            )
        return second_canvas_id, second_node_id

    def test_database_rejects_cross_canvas_connection(self) -> None:
        engine = init_engine()
        timestamp = datetime.now(UTC)
        first_canvas_id = store.get_first_canvas_id(self.project_id)
        _, second_node_id = self._ensure_second_canvas()

        with self.assertRaises(IntegrityError):
            with engine.begin() as connection:
                connection.execute(
                    text(
                        """
                        INSERT INTO canvas_connections (
                            id, project_id, canvas_id, source_node_id, source_port,
                            target_node_id, target_port, status, metadata, created_at, updated_at
                        ) VALUES (
                            '70000000-0000-0000-0000-000000000001', :project_id, :canvas_id,
                            :source_node_id, 'out', :target_node_id, 'in', 'active', :metadata,
                            :created_at, :updated_at
                        )
                        """
                    ),
                    {
                        "project_id": self.project_id,
                        "canvas_id": first_canvas_id,
                        "source_node_id": self.source_node_id,
                        "target_node_id": second_node_id,
                        "metadata": "{}",
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    },
                )

    def test_legacy_routes_expose_only_first_canvas(self) -> None:
        self._ensure_second_canvas()
        reloaded_store = DatabaseStore()
        configure_store(reloaded_store)
        first_canvas_id = store.get_first_canvas_id(self.project_id)
        second_node = next(node for node in store.canvas_nodes.values() if node["canvas_id"] != first_canvas_id)

        app = FastAPI()
        include_routers(app)
        with TestClient(app) as client:
            headers = {"Authorization": f"Bearer {create_token({'sub': self.user_id, 'role': 'user'})}"}
            listed = client.get(f"/projects/{self.project_id}/nodes", headers=headers)
            hidden = client.get(f"/projects/{self.project_id}/nodes/{second_node['id']}", headers=headers)

        self.assertEqual(200, listed.status_code)
        self.assertEqual([self.source_node_id, self.target_node_id], sorted(node["id"] for node in listed.json()["items"]))
        self.assertEqual(403, hidden.status_code)


if __name__ == "__main__":
    unittest.main()
