from __future__ import annotations

import sys
import threading
import unittest
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import controllers.canvas_documents as canvas_documents_module
from controllers.canvas_document_mutations import patch_document
from controllers.canvas_documents import create_node, delete_node
from controllers.canvas_revisions import restore_revision
from controllers.store import DatabaseStore, InMemoryStore, configure_store, store
from models.asset import Asset
from models.base import get_session
from models.generation_task import GenerationTask
from tests.mysql_test_database import MySQLTestDatabase


class ResourceNodeLinkMemoryTestCase(unittest.TestCase):
    def test_origin_canvas_infers_owned_project(self) -> None:
        memory_store = InMemoryStore()
        user = memory_store.create_user("resource-origin-memory", "")
        project = memory_store.create_project(user["id"], "Resource Origin Memory")
        canvas_id = memory_store.get_first_canvas_id(project["id"])

        asset = memory_store.create_asset(
            user["id"],
            "image",
            "/uploads/origin.png",
            None,
            origin_canvas_id=canvas_id,
        )

        self.assertEqual(project["id"], asset["project_id"])
        self.assertEqual(canvas_id, asset["origin_canvas_id"])

    def test_inmemory_delete_clears_resource_node_links(self) -> None:
        memory_store = InMemoryStore()
        user = memory_store.create_user("resource-link-memory", "")
        project = memory_store.create_project(user["id"], "Resource Link Memory")
        canvas_id = memory_store.get_first_canvas_id(project["id"])
        node = memory_store.create_node(
            project["id"], user["id"], "text", {"text": "linked"}, 0, 0, 300, 200
        )
        asset = memory_store.create_asset(
            user["id"],
            "text",
            None,
            "linked",
            project_id=project["id"],
            canvas_node_id=node["id"],
        )
        task = memory_store.create_generation_task(
            user["id"],
            "text",
            "mock",
            None,
            project_id=project["id"],
            canvas_node_id=node["id"],
        )

        memory_store.delete_node(node["id"], user["id"])

        self.assertIsNone(asset["canvas_node_id"])
        self.assertIsNone(task["canvas_node_id"])
        self.assertEqual(canvas_id, asset["origin_canvas_id"])
        self.assertEqual(canvas_id, task["origin_canvas_id"])


class ResourceNodeLinkTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_resource_node_links")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.user = store.create_user(f"resource-link-{uuid4()}", "")
        self.project = store.create_project(self.user["id"], f"Resource Link {uuid4()}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.assertIsNotNone(self.canvas_id)

    def test_legacy_store_delete_clears_resource_node_links(self) -> None:
        node = store.create_node(
            self.project["id"],
            self.user["id"],
            "text",
            {"text": "legacy"},
            0,
            0,
            300,
            200,
        )
        resource_ids = self._link_resources(node["id"])

        deleted = store.delete_node(node["id"], self.user["id"])

        self.assertIsNotNone(deleted)
        self._assert_links_cleared(resource_ids)

    def test_document_delete_clears_resource_node_links(self) -> None:
        node = self._create_document_node()
        resource_ids = self._link_resources(node["id"])

        delete_node(
            self.project["id"],
            self.canvas_id,
            node["id"],
            self.user["id"],
        )

        self._assert_links_cleared(resource_ids)

    def test_document_mutation_delete_clears_resource_node_links(self) -> None:
        node = self._create_document_node()
        resource_ids = self._link_resources(node["id"])

        patch_document(
            self.project["id"],
            self.canvas_id,
            self.user["id"],
            {
                "base_revision": 0,
                "client_mutation_id": str(uuid4()),
                "node_upserts": [],
                "node_deletes": [node["id"]],
                "connection_upserts": [],
                "connection_deletes": [],
            },
        )

        self._assert_links_cleared(resource_ids)

    def test_revision_restore_clears_links_for_nodes_absent_from_snapshot(self) -> None:
        anchor_id = str(uuid4())
        linked_node_id = str(uuid4())
        patch_document(
            self.project["id"],
            self.canvas_id,
            self.user["id"],
            self._mutation_payload(0, [self._node_upsert(anchor_id)]),
        )
        patch_document(
            self.project["id"],
            self.canvas_id,
            self.user["id"],
            self._mutation_payload(1, [self._node_upsert(linked_node_id)]),
        )
        resource_ids = self._link_resources(linked_node_id)

        restored = restore_revision(
            self.project["id"],
            self.canvas_id,
            1,
            self.user["id"],
        )

        self.assertEqual(3, restored["revision"])
        self._assert_links_cleared(resource_ids)

    def test_resource_create_cannot_relink_node_during_document_delete(self) -> None:
        node = self._create_document_node()
        clear_reached = threading.Event()
        release_delete = threading.Event()
        create_finished = threading.Event()
        delete_errors: list[Exception] = []
        create_errors: list[Exception] = []
        created_assets: list[dict] = []
        original_clear = canvas_documents_module.clear_resource_node_links

        def paused_clear(session, node_ids) -> None:
            original_clear(session, node_ids)
            clear_reached.set()
            if not release_delete.wait(timeout=5):
                raise RuntimeError("Timed out waiting to release document delete")

        def delete_target() -> None:
            try:
                canvas_documents_module.delete_node(
                    self.project["id"], self.canvas_id, node["id"], self.user["id"]
                )
            except Exception as error:
                delete_errors.append(error)

        def create_linked_asset() -> None:
            try:
                created_assets.append(store.create_asset(
                    self.user["id"],
                    "image",
                    "/uploads/race.png",
                    None,
                    project_id=self.project["id"],
                    canvas_node_id=node["id"],
                ))
            except Exception as error:
                create_errors.append(error)
            finally:
                create_finished.set()

        canvas_documents_module.clear_resource_node_links = paused_clear
        delete_thread = threading.Thread(target=delete_target)
        create_thread = threading.Thread(target=create_linked_asset)
        try:
            delete_thread.start()
            self.assertTrue(clear_reached.wait(timeout=5))
            create_thread.start()
            self.assertFalse(create_finished.wait(timeout=0.2))
            release_delete.set()
            delete_thread.join(timeout=5)
            create_thread.join(timeout=5)
        finally:
            release_delete.set()
            canvas_documents_module.clear_resource_node_links = original_clear

        self.assertFalse(delete_thread.is_alive())
        self.assertFalse(create_thread.is_alive())
        self.assertEqual([], delete_errors)
        self.assertEqual([], created_assets)
        self.assertEqual(1, len(create_errors))
        self.assertIsInstance(create_errors[0], KeyError)

    def _create_document_node(self) -> dict:
        return create_node(
            self.project["id"],
            self.canvas_id,
            self.user["id"],
            node_type="text",
            content={"text": "linked"},
            position_x=0,
            position_y=0,
            width=300,
            height=200,
        )

    def _link_resources(self, node_id: str) -> tuple[str, str]:
        asset = store.create_asset(
            self.user["id"],
            "text",
            None,
            "linked",
            project_id=self.project["id"],
            canvas_node_id=node_id,
        )
        task = store.create_generation_task(
            self.user["id"],
            "text",
            "mock",
            None,
            project_id=self.project["id"],
            canvas_node_id=node_id,
            status="succeeded",
        )
        return asset["id"], task["id"]

    def _assert_links_cleared(self, resource_ids: tuple[str, str]) -> None:
        asset_id, task_id = resource_ids
        with get_session() as session:
            asset = session.get(Asset, asset_id)
            task = session.get(GenerationTask, task_id)
            self.assertIsNotNone(asset)
            self.assertIsNotNone(task)
            self.assertIsNone(asset.canvas_node_id)
            self.assertIsNone(task.canvas_node_id)
            self.assertEqual(self.canvas_id, asset.origin_canvas_id)
            self.assertEqual(self.canvas_id, task.origin_canvas_id)
        self.assertIsNone(store.get_asset(asset_id)["canvas_node_id"])
        self.assertIsNone(store.get_generation_task(task_id)["canvas_node_id"])

    @staticmethod
    def _node_upsert(node_id: str) -> dict:
        return {
            "id": node_id,
            "node_type": "text",
            "content": {"text": node_id},
            "position_x": 0,
            "position_y": 0,
            "width": 300,
            "height": 200,
            "z_index": 0,
            "parent_node_id": None,
            "is_locked": False,
            "is_collapsed": False,
        }

    @classmethod
    def _mutation_payload(cls, base_revision: int, node_upserts: list[dict]) -> dict:
        return {
            "base_revision": base_revision,
            "client_mutation_id": str(uuid4()),
            "node_upserts": node_upserts,
            "node_deletes": [],
            "connection_upserts": [],
            "connection_deletes": [],
        }


if __name__ == "__main__":
    unittest.main()
