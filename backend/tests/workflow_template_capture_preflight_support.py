from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.canvas_revision import CanvasRevision
from models.generation_task import GenerationTask
from models.quota import Quota, QuotaLedger
from models.workflow_run import WorkflowRun
from models.workflow_template import WorkflowTemplateInstance
from models.workflow_template_lineage import (
    WorkflowTemplateBinding,
    WorkflowTemplateInstanceStep,
)
from tests.mysql_test_database import MySQLTestDatabase


class WorkflowTemplateCapturePreflightSupport(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase(
            "revid_test_workflow_template_capture_preflight"
        )
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.app = FastAPI()
        include_routers(self.app)
        self.client = TestClient(self.app)
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"capture-owner-{suffix}")
        self.other_user = self._register_user(f"capture-other-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.other_headers = self._auth_headers(self.other_user["id"])
        self.project = store.create_project(
            self.user["id"],
            f"Capture Project {suffix}",
        )
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.asset = store.create_asset(
            self.user["id"],
            "image",
            "https://assets.example.test/reference.png",
            None,
            project_id=self.project["id"],
        )
        self.other_project = store.create_project(
            self.other_user["id"],
            f"Foreign Project {suffix}",
        )
        self.other_asset = store.create_asset(
            self.other_user["id"],
            "image",
            "https://assets.example.test/foreign.png",
            None,
            project_id=self.other_project["id"],
        )
        self._set_quota(text=50, image=50, video=50)
        self.graph = self._seed_canvas_graph()

    def tearDown(self) -> None:
        self.client.close()

    def _capture(
        self,
        *,
        asset_promotions: list[dict] | None = None,
        template_id: str | None = None,
    ):
        promotions = (
            [
                {
                    "asset_id": self.asset["id"],
                    "slot": {
                        "slot_id": "reference_image",
                        "media_type": "image",
                        "role": "reference",
                        "required": True,
                        "minimum_items": 1,
                        "maximum_items": 1,
                        "revision_policy": "exact",
                    },
                }
            ]
            if asset_promotions is None
            else asset_promotions
        )
        payload = self._capture_payload(
            asset_promotions=promotions,
            template_id=template_id,
        )
        return self.client.post(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/workflow-template-captures"
            ),
            json=payload,
            headers=self.headers,
        )

    def _capture_payload(
        self,
        *,
        asset_promotions: list[dict] | None = None,
        template_id: str | None = None,
    ) -> dict:
        return {
            "template_id": template_id or self._template_id("capture"),
            "metadata": {
                "name": "Portable capture",
                "category": "commercial",
                "tags": ["capture"],
                "description": "Provider-free portable capture fixture",
            },
            "variables": [
                {
                    "key": "shot_count",
                    "type": "integer",
                    "required": True,
                    "label": "Shot count",
                    "default": 2,
                    "minimum": 1,
                    "maximum": 25,
                }
            ],
            "asset_promotions": (
                [
                    {
                        "asset_id": self.asset["id"],
                        "slot": {
                            "slot_id": "reference_image",
                            "media_type": "image",
                            "role": "reference",
                            "required": True,
                            "minimum_items": 1,
                            "maximum_items": 1,
                            "revision_policy": "exact",
                        },
                    }
                ]
                if asset_promotions is None
                else asset_promotions
            ),
            "steps": [
                {
                    "step_id": "create-images",
                    "node_local_id": "node-002",
                    "intent": "shot-image",
                    "model_policy": "agnes-image-quality-default",
                    "input_bindings": ["shot_count", "reference_image"],
                    "depends_on": [],
                    "capability_requirements": ["image.text_or_single_image"],
                }
            ],
            "override_policy": {
                "allowed_fields": ["variables.shot_count"],
                "locked_fields": [
                    "schema_id",
                    "schema_version",
                    "graph.connections",
                    "security",
                ],
            },
            "result_policy": {
                "same_card": True,
                "image_batch_siblings": True,
                "ingest_provider_media": True,
            },
            "security": {
                "arbitrary_code": False,
                "auto_execute": False,
                "cross_project_lookup": False,
            },
        }

    def _seed_canvas_graph(self) -> dict:
        asset_node_id = str(uuid4())
        generation_node_id = str(uuid4())
        connection_id = str(uuid4())
        response = self.client.patch(
            f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}/document",
            json={
                "base_revision": 0,
                "client_mutation_id": f"seed-capture-{uuid4()}",
                "node_upserts": [
                    {
                        "id": asset_node_id,
                        "node_type": "asset",
                        "content": {
                            "asset_id": self.asset["id"],
                            "result_url": "https://provider.example.test/result.png",
                            "result_base64": "data:image/png;base64,c2FuaXRpemVk",
                            "job_id": "job-runtime-only",
                            "provider_task_id": "provider-task-runtime-only",
                            "quota_ledger_id": "quota-ledger-runtime-only",
                        },
                        "position_x": 100,
                        "position_y": 120,
                        "width": 320,
                        "height": 240,
                        "z_index": 0,
                        "parent_node_id": None,
                        "is_locked": False,
                        "is_collapsed": False,
                    },
                    {
                        "id": generation_node_id,
                        "node_type": "generation",
                        "content": {"subtype": "image"},
                        "position_x": 500,
                        "position_y": 120,
                        "width": 320,
                        "height": 240,
                        "z_index": 1,
                        "parent_node_id": None,
                        "is_locked": False,
                        "is_collapsed": False,
                    },
                ],
                "node_deletes": [],
                "connection_upserts": [
                    {
                        "id": connection_id,
                        "source_node_id": asset_node_id,
                        "source_port": "out",
                        "target_node_id": generation_node_id,
                        "target_port": "media",
                        "metadata": {},
                    }
                ],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, response.status_code, response.text)
        return {
            "asset_node_id": asset_node_id,
            "generation_node_id": generation_node_id,
            "connection_id": connection_id,
        }

    def _replace_asset_node_content(self, content: dict) -> None:
        with get_session() as session:
            from models.canvas_node import CanvasNode

            node = session.get(CanvasNode, self.graph["asset_node_id"])
            node.content = content
            session.commit()

    def _persist_capture(self, captured: dict) -> str:
        return self._persist_manifest(captured["manifest"])

    def _persist_manifest(self, manifest: dict) -> str:
        response = self.client.post(
            "/api/workflow-templates",
            json={"manifest": manifest},
            headers=self.headers,
        )
        self.assertEqual(201, response.status_code, response.text)
        return manifest["template_id"]

    def _preflight_request(self, captured: dict) -> dict:
        candidate = captured["binding_candidates"][0]
        return {
            "project_id": self.project["id"],
            "canvas_id": self.canvas_id,
            "variable_bindings": {"shot_count": 2},
            "asset_bindings": {
                "reference_image": [
                    {
                        "asset_id": candidate["asset_id"],
                        "source_revision": candidate["source_revision"],
                    }
                ]
            },
            "cost_confirmed": True,
        }

    def _set_quota(self, *, text: int, image: int, video: int) -> None:
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            quota.text_quota = text
            quota.image_quota = image
            quota.video_quota = video
            session.commit()

    def _side_effect_counts(self) -> tuple[int, ...]:
        with get_session() as session:
            return (
                session.scalar(select(func.count()).select_from(CanvasRevision)),
                session.scalar(
                    select(func.count()).select_from(WorkflowTemplateInstance)
                ),
                session.scalar(
                    select(func.count()).select_from(WorkflowTemplateBinding)
                ),
                session.scalar(
                    select(func.count()).select_from(WorkflowTemplateInstanceStep)
                ),
                session.scalar(select(func.count()).select_from(WorkflowRun)),
                session.scalar(select(func.count()).select_from(GenerationTask)),
                session.scalar(select(func.count()).select_from(QuotaLedger)),
            )

    @staticmethod
    def _template_id(label: str) -> str:
        return f"user.{label}.{uuid4().hex}"

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
        self.assertEqual(200, response.status_code, response.text)
        return response.json()["user"]

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}
