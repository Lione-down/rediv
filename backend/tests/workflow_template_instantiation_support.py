from __future__ import annotations

import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.workflow_template_capture_preflight_support import (
    WorkflowTemplateCapturePreflightSupport,
)


class WorkflowTemplateInstantiationSupport(
    WorkflowTemplateCapturePreflightSupport
):
    def _published_preflight(self) -> tuple[dict, str, dict, dict]:
        captured = self._capture().json()
        template_id = self._persist_capture(captured)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        self.assertEqual(200, published.status_code, published.text)
        preflight_request = self._preflight_request(captured)
        preflight = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=preflight_request,
            headers=self.headers,
        )
        self.assertEqual(200, preflight.status_code, preflight.text)
        self.assertTrue(preflight.json()["executable"])
        instantiate_request = {
            "template_id": template_id,
            "template_version": 1,
            "base_revision": self._current_revision(),
            "client_mutation_id": f"instantiate-{uuid4()}",
            "anchor": {"x": 900, "y": 200},
            "variable_bindings": preflight_request["variable_bindings"],
            "asset_bindings": preflight_request["asset_bindings"],
            "cost_confirmed": preflight_request["cost_confirmed"],
            "preflight_fingerprint": preflight.json()["fingerprint"],
        }
        return captured, template_id, preflight.json(), instantiate_request

    def _instantiate(self, request: dict):
        return self.client.post(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/workflow-template-instances"
            ),
            json=request,
            headers=self.headers,
        )

    def _current_revision(self) -> int:
        response = self.client.get(
            f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}/document",
            headers=self.headers,
        )
        self.assertEqual(200, response.status_code, response.text)
        return response.json()["revision"]

    def _create_owner_asset(self) -> dict:
        from controllers.store import store

        return store.create_asset(
            self.user["id"],
            "image",
            "https://assets.example.test/reference-secondary.png",
            None,
            project_id=self.project["id"],
        )
