from __future__ import annotations

import sys
from copy import deepcopy
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import get_session
from models.canvas_node import CanvasNode
from models.workflow_template import WorkflowTemplateVersion
from tests.workflow_template_instantiation_support import (
    WorkflowTemplateInstantiationSupport,
)


class WorkflowTemplateInstanceLifecycleSupport(
    WorkflowTemplateInstantiationSupport
):
    @staticmethod
    def _node_patch_payload(node: CanvasNode | dict) -> dict:
        def value(key: str):
            return node[key] if isinstance(node, dict) else getattr(node, key)

        return {
            "id": value("id"),
            "node_type": value("node_type"),
            "content": deepcopy(value("content")),
            "position_x": value("position_x"),
            "position_y": value("position_y"),
            "width": value("width"),
            "height": value("height"),
            "z_index": value("z_index"),
            "parent_node_id": value("parent_node_id"),
            "is_locked": value("is_locked"),
            "is_collapsed": value("is_collapsed"),
        }

    def _instance_node_payloads(self, instance: dict) -> list[dict]:
        with get_session() as session:
            nodes = list(
                session.scalars(
                    select(CanvasNode).where(
                        CanvasNode.id.in_(instance["node_id_map"].values())
                    )
                ).all()
            )
            return [
                self._node_patch_payload(node)
                for node in sorted(nodes, key=lambda item: item.id)
            ]

    def _instance_with_v2(self) -> tuple[dict, dict]:
        captured, template_id, _, request = self._published_preflight()
        instantiated = self._instantiate(request)
        self.assertEqual(201, instantiated.status_code, instantiated.text)
        draft = self.client.post(
            f"/api/workflow-templates/{template_id}/versions",
            json={"source_version": 1},
            headers=self.headers,
        )
        self.assertEqual(201, draft.status_code, draft.text)
        target_manifest = deepcopy(draft.json()["manifest"])
        target_manifest["metadata"]["description"] = "Compatible V2 metadata"
        target_manifest["variables"].append(
            {
                "key": "campaign_note",
                "type": "text",
                "required": False,
                "label": "Campaign note",
                "default": "",
                "max_length": 120,
            }
        )
        target_manifest["override_policy"]["allowed_fields"].append(
            "variables.campaign_note"
        )
        updated = self.client.patch(
            f"/api/workflow-templates/{template_id}/versions/2",
            json={"manifest": target_manifest},
            headers=self.headers,
        )
        self.assertEqual(200, updated.status_code, updated.text)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/2/publish",
            headers=self.headers,
        )
        self.assertEqual(200, published.status_code, published.text)
        return instantiated.json(), captured

    def _instance_path(self, instance_id: str, suffix: str) -> str:
        return (
            f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
            f"/workflow-template-instances/{instance_id}/{suffix}"
        )

    def _local_script_override(self, instance: dict) -> tuple[str, dict]:
        node_id = instance["node_id_map"]["node-002"]
        with get_session() as session:
            node = session.get(CanvasNode, node_id)
            content = deepcopy(node.content)
            content["script_document"] = {
                "contract_version": 1,
                "title": "Local protected title",
            }
            payload = self._node_patch_payload(node)
            payload["content"] = content
        response = self.client.patch(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/document"
            ),
            json={
                "base_revision": self._current_revision(),
                "client_mutation_id": f"local-override-{uuid4()}",
                "node_upserts": [payload],
                "node_deletes": [],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, response.status_code, response.text)
        return node_id, content
