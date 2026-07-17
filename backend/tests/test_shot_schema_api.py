from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.shot_schemas import router
from controllers import canvases as canvas_controller
from core.security import current_user


def request_payload() -> dict:
    return {
        "contract_version": 1,
        "provider": "mock",
        "source_script_node_id": "script-a",
        "script": "人物走入黄昏海岸。海浪在身后翻涌。",
        "requested_shot_count": 2,
    }


class ShotSchemaApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        app = FastAPI()
        app.include_router(router)
        self.app = app
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()

    def test_route_requires_authentication_before_mock_work(self) -> None:
        with patch("api.shot_schemas.generate_mock_shot_schema") as generate:
            response = self.client.post(
                "/api/projects/project-a/canvases/canvas-a/shot-schema",
                json=request_payload(),
            )

        self.assertEqual(401, response.status_code)
        generate.assert_not_called()

    def test_route_verifies_canvas_scope_and_returns_strict_mock_document(self) -> None:
        self.app.dependency_overrides[current_user] = lambda: {"id": "user-a"}
        with patch.object(canvas_controller, "get_canvas", return_value={"id": "canvas-a"}) as owned:
            first = self.client.post(
                "/api/projects/project-a/canvases/canvas-a/shot-schema",
                json=request_payload(),
            )
            second = self.client.post(
                "/api/projects/project-a/canvases/canvas-a/shot-schema",
                json=request_payload(),
            )

        self.assertEqual(200, first.status_code)
        self.assertEqual(first.json(), second.json())
        owned.assert_any_call("project-a", "canvas-a", "user-a")
        self.assertEqual({
            "contract_version": 1,
            "schema_id": "revid.shot-sequence",
            "provider": "mock",
            "model": "revid-shot-mock-v1",
            "project_id": "project-a",
            "canvas_id": "canvas-a",
            "source_script_node_id": "script-a",
            "aspect_ratio": "16:9",
            "shot_count": 2,
            "shots": [
                {
                    "shot_id": "shot-01",
                    "index": 1,
                    "title": "镜头 01",
                    "narrative": "人物走入黄昏海岸。",
                    "image_prompt": "人物走入黄昏海岸。",
                },
                {
                    "shot_id": "shot-02",
                    "index": 2,
                    "title": "镜头 02",
                    "narrative": "海浪在身后翻涌。",
                    "image_prompt": "海浪在身后翻涌。",
                },
            ],
        }, first.json())

    def test_route_maps_foreign_canvas_and_rejects_extra_payload_fields(self) -> None:
        self.app.dependency_overrides[current_user] = lambda: {"id": "user-a"}
        with patch.object(
            canvas_controller,
            "get_canvas",
            side_effect=canvas_controller.CanvasForbiddenError,
        ):
            forbidden = self.client.post(
                "/api/projects/project-a/canvases/canvas-a/shot-schema",
                json=request_payload(),
            )
        invalid = self.client.post(
            "/api/projects/project-a/canvases/canvas-a/shot-schema",
            json={**request_payload(), "unexpected": True},
        )

        self.assertEqual(403, forbidden.status_code)
        self.assertEqual(422, invalid.status_code)


if __name__ == "__main__":
    unittest.main()
