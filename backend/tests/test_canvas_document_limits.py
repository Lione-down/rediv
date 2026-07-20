from __future__ import annotations

import asyncio
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.json_budget import (
    CANVAS_CONNECTION_METADATA_MAX_BYTES,
    CANVAS_DOCUMENT_MAX_BODY_BYTES,
    CANVAS_NODE_CONTENT_MAX_BYTES,
)
from core.security import create_token
from models.base import get_session
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision
from tests.mysql_test_database import MySQLTestDatabase


class CanvasDocumentLimitTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_document_limits")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.user = store.create_user(f"limit-user-{uuid4()}", "")
        self.project = store.create_project(self.user["id"], f"Limit Project {uuid4()}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.path = f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}/document"
        self.headers = {
            "Authorization": f"Bearer {create_token({'sub': self.user['id'], 'role': 'user'})}",
            "Content-Type": "application/json",
        }
        app = FastAPI()
        include_routers(app)
        self.app = app
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()

    def test_exact_body_boundary_is_accepted_and_one_byte_over_is_rejected(self) -> None:
        payload = self._payload(node_upserts=[self._node("body-boundary", {"text": "ok"})])
        compact = self._encode(payload)
        exact_body = compact + b" " * (CANVAS_DOCUMENT_MAX_BODY_BYTES - len(compact))

        accepted = self.client.patch(self.path, content=exact_body, headers=self.headers)
        before_reject = self._database_snapshot()
        rejected = self.client.patch(self.path, content=exact_body + b" ", headers=self.headers)

        self.assertEqual(CANVAS_DOCUMENT_MAX_BODY_BYTES, len(exact_body))
        self.assertEqual(200, accepted.status_code)
        self.assertEqual(413, rejected.status_code)
        self.assertEqual(before_reject, self._database_snapshot())

    def test_node_content_exact_boundary_is_accepted_and_one_byte_over_is_rejected(self) -> None:
        accepted_content = self._sized_object("text", CANVAS_NODE_CONTENT_MAX_BYTES)
        accepted_payload = self._payload(
            node_upserts=[self._node("content-boundary", accepted_content)]
        )
        accepted = self.client.patch(self.path, json=accepted_payload, headers=self.headers)
        before_reject = self._database_snapshot()
        rejected_payload = self._payload(
            base_revision=1,
            node_upserts=[
                self._node(
                    "content-over",
                    self._sized_object("text", CANVAS_NODE_CONTENT_MAX_BYTES + 1),
                )
            ],
        )
        rejected = self.client.patch(self.path, json=rejected_payload, headers=self.headers)

        self.assertEqual(200, accepted.status_code)
        self.assertEqual(422, rejected.status_code)
        self.assertEqual(before_reject, self._database_snapshot())

    def test_connection_metadata_exact_boundary_is_accepted_and_one_byte_over_is_rejected(self) -> None:
        source = self._node("source", {})
        target = self._node("target", {})
        connection = self._connection(
            "metadata-boundary",
            source["id"],
            target["id"],
            self._sized_object("note", CANVAS_CONNECTION_METADATA_MAX_BYTES),
        )
        accepted_payload = self._payload(
            node_upserts=[source, target],
            connection_upserts=[connection],
        )
        accepted = self.client.patch(self.path, json=accepted_payload, headers=self.headers)
        before_reject = self._database_snapshot()
        connection["metadata"] = self._sized_object(
            "note",
            CANVAS_CONNECTION_METADATA_MAX_BYTES + 1,
        )
        rejected = self.client.patch(
            self.path,
            json=self._payload(base_revision=1, connection_upserts=[connection]),
            headers=self.headers,
        )

        self.assertEqual(200, accepted.status_code)
        self.assertEqual(422, rejected.status_code)
        self.assertEqual(before_reject, self._database_snapshot())

    def test_depth_over_limit_is_rejected_without_mutation(self) -> None:
        content: dict = {}
        cursor = content
        for _index in range(13):
            cursor["child"] = {}
            cursor = cursor["child"]
        before_reject = self._database_snapshot()

        rejected = self.client.patch(
            self.path,
            json=self._payload(node_upserts=[self._node("deep", content)]),
            headers=self.headers,
        )

        self.assertEqual(422, rejected.status_code)
        self.assertEqual(before_reject, self._database_snapshot())

    def test_one_thousand_individually_valid_nodes_over_aggregate_budget_are_rejected(self) -> None:
        payload = self._payload(
            node_upserts=[
                self._node(f"aggregate-{index}", {"text": "x" * 1900})
                for index in range(1000)
            ]
        )
        encoded = self._encode(payload)
        self.assertGreater(len(encoded), CANVAS_DOCUMENT_MAX_BODY_BYTES)
        before_reject = self._database_snapshot()

        with patch(
            "controllers.canvas_document_mutations.patch_document",
            side_effect=AssertionError("oversized payload reached persistence"),
        ):
            rejected = self.client.patch(self.path, content=encoded, headers=self.headers)

        self.assertEqual(413, rejected.status_code)
        self.assertEqual(before_reject, self._database_snapshot())

    def test_chunked_body_without_content_length_is_limited_before_persistence(self) -> None:
        payload = self._payload(node_upserts=[self._node("chunked", {"text": "ok"})])
        compact = self._encode(payload)
        oversized = compact + b" " * (CANVAS_DOCUMENT_MAX_BODY_BYTES + 1 - len(compact))
        before_reject = self._database_snapshot()

        async def send_chunked() -> httpx.Response:
            async def chunks():
                midpoint = len(oversized) // 2
                yield oversized[:midpoint]
                yield oversized[midpoint:]

            transport = httpx.ASGITransport(app=self.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                return await client.patch(
                    self.path,
                    content=chunks(),
                    headers=self.headers,
                )

        with patch(
            "controllers.canvas_document_mutations.patch_document",
            side_effect=AssertionError("chunked oversized payload reached persistence"),
        ):
            rejected = asyncio.run(send_chunked())

        self.assertNotIn("content-length", rejected.request.headers)
        self.assertEqual(413, rejected.status_code)
        self.assertEqual(before_reject, self._database_snapshot())

    def test_aggregate_key_string_and_string_byte_budgets_fail_before_persistence(self) -> None:
        base_payload = self._payload(node_upserts=[self._node("aggregate-budget", {})])
        payloads = {
            "keys": {**base_payload, **{f"k{index}": 0 for index in range(50_001)}},
            "strings": {**base_payload, "extra_strings": ["x"] * 75_001},
            "string_bytes": {**base_payload, "extra_text": "x" * (1536 * 1024 + 1)},
        }
        before_reject = self._database_snapshot()

        with patch(
            "controllers.canvas_document_mutations.patch_document",
            side_effect=AssertionError("aggregate overflow reached persistence"),
        ):
            for budget, payload in payloads.items():
                with self.subTest(budget=budget):
                    encoded = self._encode(payload)
                    self.assertLess(len(encoded), CANVAS_DOCUMENT_MAX_BODY_BYTES)
                    rejected = self.client.patch(self.path, content=encoded, headers=self.headers)
                    self.assertEqual(413, rejected.status_code)

        self.assertEqual(before_reject, self._database_snapshot())

    def _payload(
        self,
        *,
        base_revision: int = 0,
        node_upserts: list[dict] | None = None,
        connection_upserts: list[dict] | None = None,
    ) -> dict:
        return {
            "base_revision": base_revision,
            "client_mutation_id": str(uuid4()),
            "node_upserts": node_upserts or [],
            "node_deletes": [],
            "connection_upserts": connection_upserts or [],
            "connection_deletes": [],
        }

    @staticmethod
    def _node(label: str, content: dict) -> dict:
        return {
            "id": str(uuid4()),
            "node_type": "note",
            "content": content,
            "position_x": 10,
            "position_y": 20,
            "width": 320,
            "height": 180,
            "z_index": 0,
            "parent_node_id": None,
            "is_locked": False,
            "is_collapsed": False,
        }

    @staticmethod
    def _connection(
        label: str,
        source_node_id: str,
        target_node_id: str,
        metadata: dict,
    ) -> dict:
        return {
            "id": str(uuid4()),
            "source_node_id": source_node_id,
            "source_port": "out",
            "target_node_id": target_node_id,
            "target_port": "in",
            "metadata": metadata,
        }

    @staticmethod
    def _sized_object(key: str, target_bytes: int) -> dict:
        empty_size = len(json.dumps({key: ""}, separators=(",", ":")).encode("utf-8"))
        value = "x" * (target_bytes - empty_size)
        payload = {key: value}
        actual_size = len(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
        if actual_size != target_bytes:
            raise AssertionError(f"Expected {target_bytes} bytes, got {actual_size}")
        return payload

    @staticmethod
    def _encode(payload: dict) -> bytes:
        return json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    def _database_snapshot(self) -> tuple[int, int, int, int]:
        with get_session() as session:
            canvas = session.get(Canvas, self.canvas_id)
            if canvas is None:
                raise AssertionError("Canvas not found")
            return (
                canvas.graph_revision,
                session.scalar(
                    select(func.count(CanvasNode.id)).where(CanvasNode.canvas_id == self.canvas_id)
                ) or 0,
                session.scalar(
                    select(func.count(CanvasConnection.id)).where(
                        CanvasConnection.canvas_id == self.canvas_id
                    )
                ) or 0,
                session.scalar(
                    select(func.count(CanvasRevision.id)).where(
                        CanvasRevision.canvas_id == self.canvas_id
                    )
                ) or 0,
            )


if __name__ == "__main__":
    unittest.main()
