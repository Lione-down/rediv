import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.agent_skills import router
from controllers.canvases import CanvasForbiddenError
from core.security import current_user


class AgentSkillApiTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[current_user] = lambda: {"id": "user-1"}
        self.client = TestClient(app)
        self.path = "/api/projects/project-1/canvases/canvas-1/agent-skills"

    def tearDown(self):
        self.client.close()

    @patch("api.agent_skills.canvas_controller.get_canvas")
    def test_capabilities_require_owned_canvas_scope(self, get_canvas):
        get_canvas.return_value = {"id": "canvas-1"}
        response = self.client.get(self.path)

        self.assertEqual(200, response.status_code)
        get_canvas.assert_called_once_with("project-1", "canvas-1", "user-1")
        self.assertEqual("revid.canvas-context", response.json()["skills"][0]["id"])

    @patch("api.agent_skills.canvas_controller.get_canvas")
    def test_discovery_rejects_foreign_canvas_and_exposes_no_execute_route(self, get_canvas):
        get_canvas.side_effect = CanvasForbiddenError("forbidden")

        forbidden = self.client.get(self.path)
        execute = self.client.post(self.path + "/execute", json={})

        self.assertEqual(403, forbidden.status_code)
        self.assertEqual(404, execute.status_code)

    @patch("api.agent_skills.document_controller.get_document")
    @patch("api.agent_skills.canvas_controller.get_canvas")
    def test_preflight_uses_current_canvas_document_and_preserves_order(self, get_canvas, get_document):
        get_canvas.return_value = {"id": "canvas-1"}
        get_document.return_value = {"nodes": [
            {"id": "node-a", "node_type": "script", "content": {"serialization_version": 1, "subtype": "script"}},
            {"id": "node-b", "node_type": "generation", "content": {"serialization_version": 1, "subtype": "image"}},
        ]}
        response = self.client.post(self.path + "/preflight", json={
            "skill_id": "revid.canvas-context", "skill_version": 1,
            "selected_node_ids": ["node-b", "node-a"],
        })

        self.assertEqual(200, response.status_code)
        self.assertEqual([
            {"node_id": "node-b", "role": "canvas-node", "node_type": "generation", "subtype": "image"},
            {"node_id": "node-a", "role": "canvas-node", "node_type": "script", "subtype": "script"},
        ], response.json()["sources"])
        self.assertEqual("canvas-context", response.json()["skill"]["intent"])
        self.assertFalse(response.json()["task"]["available"])

    @patch("api.agent_skills.document_controller.get_document")
    @patch("api.agent_skills.canvas_controller.get_canvas")
    def test_preflight_rejects_foreign_source_before_mutation(self, get_canvas, get_document):
        get_canvas.return_value = {"id": "canvas-1"}
        get_document.return_value = {"nodes": [{"id": "node-a", "node_type": "script", "content": {"serialization_version": 1, "subtype": "script"}}]}
        response = self.client.post(self.path + "/preflight", json={
            "skill_id": "revid.canvas-context", "skill_version": 1,
            "selected_node_ids": ["foreign-node"],
        })

        self.assertEqual(422, response.status_code)
