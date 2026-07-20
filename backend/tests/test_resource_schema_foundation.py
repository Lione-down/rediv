from __future__ import annotations

import json
import sys
import unittest
from datetime import UTC, datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from pydantic import ValidationError
from sqlalchemy import inspect, text
from sqlalchemy.exc import DBAPIError, IntegrityError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import init_engine
from schemas.asset import AssetListItem
from schemas.generation_task import GenerationTaskItem
from schemas.template import TemplateResponse
from tests.mysql_test_database import MySQLTestDatabase, assert_selected_database


class ResourceSchemaFoundationTestCase(unittest.TestCase):
    schema_name = "revid_test_resource_schema_foundation"
    user_id = "10000000-0000-0000-0000-000000000071"
    project_id = "20000000-0000-0000-0000-000000000071"
    canvas_id = "30000000-0000-0000-0000-000000000071"
    asset_node_id = "40000000-0000-0000-0000-000000000071"
    task_node_id = "40000000-0000-0000-0000-000000000072"
    asset_id = "50000000-0000-0000-0000-000000000071"
    task_id = "60000000-0000-0000-0000-000000000071"
    template_id = "70000000-0000-0000-0000-000000000071"

    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase(cls.schema_name, revision="f0a1b2c3d4e5")
        cls.mysql_database.start()
        cls._seed_legacy_resources()
        cls.mysql_database.upgrade_to_head()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    @classmethod
    def _seed_legacy_resources(cls) -> None:
        engine = init_engine()
        assert_selected_database(engine, cls.schema_name)
        timestamp = datetime.now(UTC).replace(microsecond=0)
        legacy_nodes = [{
            "id": "legacy-node", "node_type": "text", "content": {"text": "Opening"},
            "position_x": 40, "position_y": 80, "parent_node_id": None,
        }]
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO users (
                        id, nickname, avatar_url, role, status, generation_status,
                        created_at, updated_at, last_login_at, username, email, password_hash
                    ) VALUES (
                        :id, 'Resource Owner', '', 'user', 'active', 'enabled',
                        :created_at, :updated_at, :last_login_at, NULL, NULL, NULL
                    )
                    """
                ),
                {"id": cls.user_id, "created_at": timestamp, "updated_at": timestamp, "last_login_at": timestamp},
            )
            connection.execute(
                text(
                    "INSERT INTO projects (id, user_id, name, created_at, updated_at) "
                    "VALUES (:id, :user_id, 'Resource Project', :created_at, :updated_at)"
                ),
                {"id": cls.project_id, "user_id": cls.user_id, "created_at": timestamp, "updated_at": timestamp},
            )
            connection.execute(
                text(
                    """
                    INSERT INTO canvases (
                        id, project_id, name, sort_order, status, viewport_x, viewport_y,
                        viewport_zoom, graph_revision, created_at, updated_at, deleted_at
                    ) VALUES (
                        :id, :project_id, 'Origin Canvas', 0, 'active', 0, 0, 1, 0,
                        :created_at, :updated_at, NULL
                    )
                    """
                ),
                {"id": cls.canvas_id, "project_id": cls.project_id, "created_at": timestamp, "updated_at": timestamp},
            )
            for node_id in (cls.asset_node_id, cls.task_node_id):
                connection.execute(
                    text(
                        """
                        INSERT INTO canvas_nodes (
                            id, project_id, canvas_id, node_type, content, position_x, position_y,
                            width, height, z_index, parent_node_id, is_locked, is_collapsed,
                            status, created_at, updated_at
                        ) VALUES (
                            :id, :project_id, :canvas_id, 'text', :content, 0, 0,
                            300, 200, 0, NULL, 0, 0, 'active', :created_at, :updated_at
                        )
                        """
                    ),
                    {
                        "id": node_id,
                        "project_id": cls.project_id,
                        "canvas_id": cls.canvas_id,
                        "content": "{}",
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    },
                )
            connection.execute(
                text(
                    """
                    INSERT INTO templates (id, user_id, name, node_data, node_count, created_at)
                    VALUES (:id, :user_id, 'Legacy Graph', :node_data, 1, :created_at)
                    """
                ),
                {
                    "id": cls.template_id,
                    "user_id": cls.user_id,
                    "node_data": json.dumps(legacy_nodes),
                    "created_at": timestamp,
                },
            )
            connection.execute(
                text(
                    """
                    INSERT INTO assets (
                        id, user_id, project_id, canvas_node_id, type, url, content_text,
                        source, source_model, source_task_id, status, created_at, updated_at
                    ) VALUES (
                        :id, :user_id, :project_id, :canvas_node_id, 'image', '/legacy.png', NULL,
                        'upload', NULL, NULL, 'active', :created_at, :updated_at
                    )
                    """
                ),
                {
                    "id": cls.asset_id,
                    "user_id": cls.user_id,
                    "project_id": cls.project_id,
                    "canvas_node_id": cls.asset_node_id,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                },
            )
            connection.execute(
                text(
                    """
                    INSERT INTO generation_tasks (
                        id, user_id, project_id, canvas_node_id, media_type, provider, model,
                        provider_request_id, status, duration_ms, result_asset_id, error_code,
                        error_message, created_at, updated_at
                    ) VALUES (
                        :id, :user_id, :project_id, :canvas_node_id, 'text', 'mock', NULL,
                        NULL, 'queued', NULL, NULL, NULL, NULL, :created_at, :updated_at
                    )
                    """
                ),
                {
                    "id": cls.task_id,
                    "user_id": cls.user_id,
                    "project_id": cls.project_id,
                    "canvas_node_id": cls.task_node_id,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                },
            )

    def test_01_schema_exposes_commented_resource_contract(self) -> None:
        inspector = inspect(init_engine())
        required_columns = {
            "assets": {"origin_canvas_id"},
            "generation_tasks": {"origin_canvas_id"},
            "templates": {"schema_version", "graph_data"},
        }
        for table_name, column_names in required_columns.items():
            columns = {column["name"]: column for column in inspector.get_columns(table_name)}
            for column_name in column_names:
                self.assertIn(column_name, columns)
                self.assertTrue(columns[column_name].get("comment"))

        asset_fks = {item["name"]: item for item in inspector.get_foreign_keys("assets")}
        self.assertEqual(["project_id", "origin_canvas_id"], asset_fks["fk_assets_origin_canvas"]["constrained_columns"])
        self.assertEqual(["canvas_node_id"], asset_fks["fk_assets_canvas_node"]["constrained_columns"])
        self.assertEqual("SET NULL", asset_fks["fk_assets_canvas_node"]["options"]["ondelete"].upper())

        task_fks = {item["name"]: item for item in inspector.get_foreign_keys("generation_tasks")}
        self.assertEqual(
            ["project_id", "origin_canvas_id"],
            task_fks["fk_generation_tasks_project_origin_canvas"]["constrained_columns"],
        )
        self.assertEqual(
            ["origin_canvas_id", "canvas_node_id"],
            task_fks["fk_generation_tasks_origin_node"]["constrained_columns"],
        )
        self.assertEqual("RESTRICT", task_fks["fk_generation_tasks_origin_node"]["options"]["ondelete"].upper())

        ledger_fks = {item["name"]: item for item in inspector.get_foreign_keys("quota_ledger")}
        self.assertEqual(
            ["related_task_id"],
            ledger_fks["fk_quota_ledger_generation_task"]["constrained_columns"],
        )
        self.assertEqual(
            "RESTRICT",
            ledger_fks["fk_quota_ledger_generation_task"]["options"]["ondelete"].upper(),
        )

        indexes = {
            table_name: {item["name"] for item in inspector.get_indexes(table_name)}
            for table_name in ("assets", "generation_tasks")
        }
        self.assertIn("ix_assets_origin_canvas_id", indexes["assets"])
        self.assertIn("ix_generation_tasks_origin_canvas_id", indexes["generation_tasks"])
        self.assertIn(
            "ix_quota_ledger_related_task_id",
            {item["name"] for item in inspector.get_indexes("quota_ledger")},
        )

        checks = {
            table_name: {item["name"] for item in inspector.get_check_constraints(table_name)}
            for table_name in ("assets", "generation_tasks", "templates")
        }
        self.assertIn("ck_assets_origin_requires_project", checks["assets"])
        self.assertIn("ck_generation_tasks_origin_scope", checks["generation_tasks"])
        self.assertIn("ck_templates_graph_schema_version", checks["templates"])
        self.assertIn("ck_templates_graph_data_shape", checks["templates"])

    def test_02_legacy_rows_backfill_origin_and_versioned_graph_without_id_loss(self) -> None:
        engine = init_engine()
        with engine.connect() as connection:
            asset = connection.execute(
                text("SELECT id, project_id, origin_canvas_id, canvas_node_id FROM assets WHERE id = :id"),
                {"id": self.asset_id},
            ).one()
            task = connection.execute(
                text("SELECT id, project_id, origin_canvas_id, canvas_node_id FROM generation_tasks WHERE id = :id"),
                {"id": self.task_id},
            ).one()
            template = connection.execute(
                text("SELECT schema_version, graph_data, node_data, node_count FROM templates WHERE id = :id"),
                {"id": self.template_id},
            ).one()

        graph_data = json.loads(template.graph_data) if isinstance(template.graph_data, str) else template.graph_data
        node_data = json.loads(template.node_data) if isinstance(template.node_data, str) else template.node_data
        expected_nodes = [{
            "id": "legacy-node", "node_type": "text", "content": {"text": "Opening"},
            "position_x": 40, "position_y": 80, "parent_node_id": None,
        }]
        self.assertEqual((self.asset_id, self.project_id, self.canvas_id, self.asset_node_id), tuple(asset))
        self.assertEqual((self.task_id, self.project_id, self.canvas_id, self.task_node_id), tuple(task))
        self.assertEqual(1, template.schema_version)
        self.assertEqual({"schema_version": 1, "nodes": expected_nodes, "connections": []}, graph_data)
        self.assertEqual(expected_nodes, node_data)
        self.assertEqual(1, template.node_count)

    def test_03_asset_node_delete_clears_link_but_retains_origin_and_task_node_is_restricted(self) -> None:
        engine = init_engine()
        with self.assertRaises(IntegrityError):
            with engine.begin() as connection:
                connection.execute(text("DELETE FROM canvas_nodes WHERE id = :id"), {"id": self.task_node_id})

        with engine.begin() as connection:
            connection.execute(
                text("UPDATE generation_tasks SET canvas_node_id = NULL WHERE id = :id"),
                {"id": self.task_id},
            )
            connection.execute(text("DELETE FROM canvas_nodes WHERE id = :id"), {"id": self.task_node_id})
            connection.execute(text("DELETE FROM canvas_nodes WHERE id = :id"), {"id": self.asset_node_id})
        with engine.connect() as connection:
            asset = connection.execute(
                text("SELECT origin_canvas_id, canvas_node_id FROM assets WHERE id = :id"),
                {"id": self.asset_id},
            ).one()
            task = connection.execute(
                text("SELECT origin_canvas_id, canvas_node_id FROM generation_tasks WHERE id = :id"),
                {"id": self.task_id},
            ).one()
        self.assertEqual((self.canvas_id, None), tuple(asset))
        self.assertEqual((self.canvas_id, None), tuple(task))

    def test_04_database_rejects_cross_scope_resource_attribution(self) -> None:
        other_project_id, other_canvas_id, other_node_id = self._ensure_other_scope()
        engine = init_engine()
        timestamp = datetime.now(UTC).replace(microsecond=0)

        with self.assertRaises(IntegrityError):
            with engine.begin() as connection:
                connection.execute(
                    text(
                        """
                        INSERT INTO assets (
                            id, user_id, project_id, origin_canvas_id, canvas_node_id, type,
                            url, content_text, source, source_model, source_task_id, status,
                            created_at, updated_at
                        ) VALUES (
                            '80000000-0000-0000-0000-000000000071', :user_id, :project_id,
                            :origin_canvas_id, NULL, 'image', '/invalid.png', NULL, 'upload',
                            NULL, NULL, 'active', :created_at, :updated_at
                        )
                        """
                    ),
                    {
                        "user_id": self.user_id,
                        "project_id": self.project_id,
                        "origin_canvas_id": other_canvas_id,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    },
                )

        for invalid_graph in (
            {"schema_version": 1, "nodes": []},
            {"schema_version": 1, "nodes": {}, "connections": []},
        ):
            with self.assertRaises(DBAPIError):
                with engine.begin() as connection:
                    connection.execute(
                        text("UPDATE templates SET graph_data = :graph_data WHERE id = :id"),
                        {"graph_data": json.dumps(invalid_graph), "id": self.template_id},
                    )

        with self.assertRaises(IntegrityError):
            with engine.begin() as connection:
                connection.execute(
                    text(
                        """
                        INSERT INTO generation_tasks (
                            id, user_id, project_id, origin_canvas_id, canvas_node_id,
                            media_type, provider, model, provider_request_id, status,
                            duration_ms, result_asset_id, error_code, error_message,
                            created_at, updated_at
                        ) VALUES (
                            '90000000-0000-0000-0000-000000000071', :user_id, :project_id,
                            :origin_canvas_id, :canvas_node_id, 'image', 'mock', NULL, NULL,
                            'queued', NULL, NULL, NULL, NULL, :created_at, :updated_at
                        )
                        """
                    ),
                    {
                        "user_id": self.user_id,
                        "project_id": self.project_id,
                        "origin_canvas_id": self.canvas_id,
                        "canvas_node_id": other_node_id,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    },
                )

        with self.assertRaises(DBAPIError):
            with engine.begin() as connection:
                connection.execute(
                    text(
                        """
                        INSERT INTO generation_tasks (
                            id, user_id, project_id, origin_canvas_id, canvas_node_id,
                            media_type, provider, model, provider_request_id, status,
                            duration_ms, result_asset_id, error_code, error_message,
                            created_at, updated_at
                        ) VALUES (
                            '90000000-0000-0000-0000-000000000072', :user_id, :project_id,
                            NULL, :canvas_node_id, 'image', 'mock', NULL, NULL, 'queued',
                            NULL, NULL, NULL, NULL, :created_at, :updated_at
                        )
                        """
                    ),
                    {
                        "user_id": self.user_id,
                        "project_id": other_project_id,
                        "canvas_node_id": other_node_id,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    },
                )

    def test_05_schema_and_backfilled_resources_survive_runtime_restart(self) -> None:
        revision = self.mysql_database.restart_runtime()
        self.assertTrue(revision["match"])
        self.assertEqual(revision["head"], revision["current"])
        engine = init_engine()
        assert_selected_database(engine, self.schema_name)
        with engine.connect() as connection:
            origin_canvas_id = connection.execute(
                text("SELECT origin_canvas_id FROM generation_tasks WHERE id = :id"),
                {"id": self.task_id},
            ).scalar_one()
        self.assertEqual(self.canvas_id, origin_canvas_id)

    def test_06_downgrade_refuses_to_drop_non_legacy_template_graphs(self) -> None:
        engine = init_engine()
        graph_data = {
            "schema_version": 1,
            "nodes": [{"id": "source"}, {"id": "target"}],
            "connections": [{"id": "edge", "source_node_id": "source", "target_node_id": "target"}],
        }
        with engine.begin() as connection:
            connection.execute(
                text("UPDATE templates SET graph_data = :graph_data WHERE id = :id"),
                {"graph_data": json.dumps(graph_data), "id": self.template_id},
            )

        backend_dir = Path(__file__).resolve().parents[1]
        config = Config(str(backend_dir / "alembic.ini"))
        config.set_main_option("script_location", str((backend_dir / "migrations").resolve()))
        with self.assertRaisesRegex(RuntimeError, "resource origin or template graph connections"):
            command.downgrade(config, "f0a1b2c3d4e5")

        with engine.connect() as connection:
            revision = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        self.assertEqual("a6b7c8d9e0f1", revision)
        inspector = inspect(init_engine())
        self.assertIn("origin_canvas_id", {item["name"] for item in inspector.get_columns("assets")})
        self.assertIn("origin_canvas_id", {item["name"] for item in inspector.get_columns("generation_tasks")})
        self.assertIn("graph_data", {item["name"] for item in inspector.get_columns("templates")})
        self.assertIn(
            "fk_generation_tasks_origin_node",
            {item["name"] for item in inspector.get_foreign_keys("generation_tasks")},
        )

    @classmethod
    def _ensure_other_scope(cls) -> tuple[str, str, str]:
        other_project_id = "20000000-0000-0000-0000-000000000072"
        other_canvas_id = "30000000-0000-0000-0000-000000000072"
        other_node_id = "40000000-0000-0000-0000-000000000073"
        timestamp = datetime.now(UTC).replace(microsecond=0)
        engine = init_engine()
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO projects (id, user_id, name, created_at, updated_at) "
                    "VALUES (:id, :user_id, 'Other Project', :created_at, :updated_at)"
                ),
                {"id": other_project_id, "user_id": cls.user_id, "created_at": timestamp, "updated_at": timestamp},
            )
            connection.execute(
                text(
                    """
                    INSERT INTO canvases (
                        id, project_id, name, sort_order, status, viewport_x, viewport_y,
                        viewport_zoom, graph_revision, created_at, updated_at, deleted_at
                    ) VALUES (
                        :id, :project_id, 'Other Canvas', 0, 'active', 0, 0, 1, 0,
                        :created_at, :updated_at, NULL
                    )
                    """
                ),
                {"id": other_canvas_id, "project_id": other_project_id, "created_at": timestamp, "updated_at": timestamp},
            )
            connection.execute(
                text(
                    """
                    INSERT INTO canvas_nodes (
                        id, project_id, canvas_id, node_type, content, position_x, position_y,
                        width, height, z_index, parent_node_id, is_locked, is_collapsed,
                        status, created_at, updated_at
                    ) VALUES (
                        :id, :project_id, :canvas_id, 'text', :content, 0, 0,
                        300, 200, 0, NULL, 0, 0, 'active', :created_at, :updated_at
                    )
                    """
                ),
                {
                    "id": other_node_id,
                    "project_id": other_project_id,
                    "canvas_id": other_canvas_id,
                    "content": "{}",
                    "created_at": timestamp,
                    "updated_at": timestamp,
                },
            )
        return other_project_id, other_canvas_id, other_node_id


class ResourceSchemaResponseContractTestCase(unittest.TestCase):
    def test_response_models_expose_origin_and_versioned_graph_metadata(self) -> None:
        self.assertIn("origin_canvas_id", AssetListItem.model_fields)
        self.assertIn("origin_canvas_id", GenerationTaskItem.model_fields)
        self.assertIn("schema_version", TemplateResponse.model_fields)
        self.assertIn("graph_data", TemplateResponse.model_fields)
        graph_model = TemplateResponse.model_fields["graph_data"].annotation
        graph = graph_model.model_validate({"schema_version": 1, "nodes": [], "connections": []})
        self.assertEqual(1, graph.schema_version)
        with self.assertRaises(ValidationError):
            graph_model.model_validate({"schema_version": 1, "nodes": []})
        with self.assertRaises(ValidationError):
            graph_model.model_validate({"schema_version": 0, "nodes": [], "connections": []})
        with self.assertRaises(ValidationError):
            graph_model.model_validate({"schema_version": 1, "nodes": {}, "connections": []})


if __name__ == "__main__":
    unittest.main()
