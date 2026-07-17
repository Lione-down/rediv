from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.asset import Asset
from models.base import get_session
from models.generation_task import GenerationTask
from models.quota import Quota
from tests.mysql_test_database import MySQLTestDatabase


class _Provider:
    def __init__(self, *, image_response: object = None, text_response: object = None) -> None:
        self.image_response = image_response
        self.text_response = text_response
        self.image_calls: list[dict] = []
        self.text_calls: list[dict] = []

    async def generate_image(self, **kwargs):
        self.image_calls.append(kwargs)
        return self.image_response

    async def chat(self, **kwargs):
        self.text_calls.append(kwargs)
        return self.text_response


class GenerationProviderValidationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_generation_provider_validation")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._new_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"provider-validation-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.project = store.create_project(self.user["id"], f"Provider Validation {suffix}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"], self.user["id"], "generation", {}, 0, 0, 320, 180
        )

    def tearDown(self) -> None:
        self.client.close()

    def test_invalid_image_provider_result_fails_before_asset_or_charge(self) -> None:
        provider = _Provider(image_response={"data": [{"url": None}]})
        original_quota = self._database_quota("image")

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post(
                "/api/image-generate",
                json=self._payload("Reject a missing image URL"),
                headers=self.headers,
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes image generation failed", response.json()["detail"])
        self._assert_failed_without_asset_or_charge("image", original_quota)

    def test_invalid_text_provider_result_fails_before_asset_or_charge(self) -> None:
        provider = _Provider(text_response={"choices": [{"message": {"content": 42}}]})
        original_quota = self._database_quota("text")

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post(
                "/api/text-generate",
                json=self._payload("Reject non-string text"),
                headers=self.headers,
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes text generation failed", response.json()["detail"])
        self._assert_failed_without_asset_or_charge("text", original_quota)

    def test_overlong_image_provider_id_fails_before_asset_or_charge(self) -> None:
        provider = _Provider(
            image_response={
                "id": "x" * 256,
                "data": [{"url": "https://example.com/out.png"}],
            }
        )
        original_quota = self._database_quota("image")

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post(
                "/api/image-generate",
                json=self._payload("Reject an overlong provider ID"),
                headers=self.headers,
            )

        self.assertEqual(500, response.status_code)
        self._assert_failed_without_asset_or_charge("image", original_quota)

    def test_overlong_text_provider_id_fails_before_asset_or_charge(self) -> None:
        provider = _Provider(
            text_response={
                "id": "x" * 256,
                "choices": [{"message": {"content": "Valid text"}}],
            }
        )
        original_quota = self._database_quota("text")

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post(
                "/api/text-generate",
                json=self._payload("Reject an overlong provider ID"),
                headers=self.headers,
            )

        self.assertEqual(500, response.status_code)
        self._assert_failed_without_asset_or_charge("text", original_quota)

    def test_image_ids_are_bounded_before_generation_work(self) -> None:
        provider = _Provider(image_response={"data": [{"url": "https://example.com/out.png"}]})
        payload = self._payload("Reject an unbounded input list")
        payload["image_ids"] = [str(uuid4()) for _ in range(9)]

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post("/api/image-generate", json=payload, headers=self.headers)

        self.assertEqual(422, response.status_code)
        self.assertEqual([], provider.image_calls)
        self.assertEqual(0, self._task_count())

    def test_generation_capabilities_require_authentication_and_are_backend_owned(self) -> None:
        unauthenticated = self.client.get("/api/generation-capabilities")
        authenticated = self.client.get(
            "/api/generation-capabilities",
            headers=self.headers,
        )

        self.assertEqual(401, unauthenticated.status_code)
        self.assertEqual(200, authenticated.status_code)
        payload = authenticated.json()
        self.assertEqual(3, payload["contract_version"])
        self.assertEqual("4:3", payload["image"]["default_aspect_ratio"])
        self.assertEqual(["region"], payload["image"]["operations"]["supported_operations"])
        self.assertEqual([], payload["image"]["operations"]["provider_operations"])
        self.assertEqual([], payload["image"]["shot_controls"]["supported_controls"])
        self.assertEqual([], payload["video"]["shot_controls"]["provider_controls"])
        self.assertEqual([81, 121, 241, 441], [item["num_frames"] for item in payload["video"]["duration_presets"]])

    def test_unsupported_image_operation_fails_before_task_quota_or_provider_mutation(self) -> None:
        source = store.create_asset(
            self.user["id"], "image", "https://example.com/source.png", None,
            project_id=self.project["id"], origin_canvas_id=self.canvas_id,
        )
        provider = _Provider(image_response={"data": [{"url": "https://example.com/out.png"}]})
        original_quota = self._database_quota("image")
        payload = {
            **self._payload("Replace the selected object"),
            "image_ids": [source["id"]],
            "image_operation": {
                "contract_version": 1,
                "id": "inpaint",
                "region": {
                    "contract_version": 1,
                    "coordinate_space": "source-normalized",
                    "x": 0.2,
                    "y": 0.2,
                    "width": 0.5,
                    "height": 0.5,
                },
                "mask": {
                    "contract_version": 1,
                    "kind": "region",
                    "feather": 0,
                    "invert": False,
                },
            },
        }

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post("/api/image-generate", json=payload, headers=self.headers)

        self.assertEqual(422, response.status_code)
        self.assertEqual([], provider.image_calls)
        self.assertEqual(0, self._task_count())
        self.assertEqual(original_quota, self._database_quota("image"))

    def test_crafted_shot_controls_fail_before_task_quota_or_provider_mutation(self) -> None:
        provider = _Provider(image_response={"data": [{"url": "https://example.com/out.png"}]})
        original_quota = self._database_quota("image")
        payload = {
            **self._payload("A wide exterior shot"),
            "shot_controls": {
                "contract_version": 1,
                "angle": "high-angle",
                "framing": "wide",
                "focus": "deep",
                "lighting": "natural",
                "temporal": "hold",
            },
        }

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post("/api/image-generate", json=payload, headers=self.headers)

        self.assertEqual(422, response.status_code)
        self.assertEqual([], provider.image_calls)
        self.assertEqual(0, self._task_count())
        self.assertEqual(original_quota, self._database_quota("image"))

    def test_invalid_parameter_combinations_fail_before_task_quota_or_provider_mutation(self) -> None:
        source = store.create_asset(
            self.user["id"],
            "image",
            "https://example.com/source.png",
            None,
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
        )
        original_image_quota = self._database_quota("image")
        original_video_quota = self._database_quota("video")
        cases = [
            (
                "/api/image-generate",
                {**self._payload("Unknown ratio"), "aspect_ratio": "5:4"},
            ),
            (
                "/api/image-generate",
                {
                    **self._payload(""),
                    "prompt": None,
                    "image_ids": [source["id"]],
                    "generation_recipe_id": "character-sheet",
                    "generation_recipe_version": 2,
                    "aspect_ratio": "4:3",
                },
            ),
            (
                "/api/video-generate",
                {
                    **self._payload("Invalid keyframes"),
                    "image_ids": [source["id"]],
                    "reference_mode": "keyframes",
                    "duration_seconds": 5,
                },
            ),
            (
                "/api/video-generate",
                {
                    **self._payload("Invalid duration"),
                    "reference_mode": "text-to-video",
                    "duration_seconds": 7,
                },
            ),
            (
                "/api/video-generate",
                {
                    **self._payload("Do not execute crafted shot direction"),
                    "image_ids": [source["id"]],
                    "reference_mode": "image-to-video",
                    "duration_seconds": 5,
                    "shot_controls": {
                        "contract_version": 1,
                        "angle": "low-angle",
                        "framing": "medium",
                        "focus": "deep",
                        "lighting": "natural",
                        "temporal": "advance",
                    },
                },
            ),
        ]
        for path, payload in cases:
            with self.subTest(path=path, payload=payload):
                response = self.client.post(path, json=payload, headers=self.headers)
                self.assertEqual(422, response.status_code)

        self.assertEqual(0, self._task_count())
        self.assertEqual(original_image_quota, self._database_quota("image"))
        self.assertEqual(original_video_quota, self._database_quota("video"))

    def test_frozen_guard_runs_before_input_asset_resolution(self) -> None:
        store.get_user(self.user["id"])["generation_status"] = "frozen"
        provider = _Provider(image_response={"data": [{"url": "https://example.com/out.png"}]})
        payload = self._payload("Do not resolve inputs while frozen")
        payload["image_ids"] = [str(uuid4())]

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post("/api/image-generate", json=payload, headers=self.headers)

        self.assertEqual(403, response.status_code)
        self.assertEqual("Generation is frozen", response.json()["detail"])
        self.assertEqual([], provider.image_calls)
        self.assertEqual(0, self._task_count())

    def test_duplicate_image_ids_are_resolved_once_in_request_order(self) -> None:
        source = store.create_asset(
            self.user["id"],
            "image",
            "https://example.com/source.png",
            None,
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
        )
        provider = _Provider(image_response={"data": [{"url": "https://example.com/out.png"}]})
        payload = self._payload("Deduplicate inputs")
        payload["image_ids"] = [source["id"], source["id"]]

        with patch.object(backend_main, "_agnes", provider):
            response = self.client.post("/api/image-generate", json=payload, headers=self.headers)

        self.assertEqual(200, response.status_code)
        self.assertEqual(["https://example.com/source.png"], provider.image_calls[0]["image"])

    def _assert_failed_without_asset_or_charge(self, media_type: str, original_quota: int) -> None:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask).where(
                    GenerationTask.user_id == self.user["id"],
                    GenerationTask.media_type == media_type,
                )
            )
            assets = list(
                session.scalars(
                    select(Asset).where(
                        Asset.user_id == self.user["id"], Asset.source == "generation"
                    )
                ).all()
            )
        self.assertEqual("failed", task.status)
        self.assertEqual("provider_result_invalid", task.error_code)
        self.assertEqual([], assets)
        self.assertEqual(original_quota, self._database_quota(media_type))

    def _payload(self, prompt: str) -> dict:
        return {
            "project_id": self.project["id"],
            "origin_canvas_id": self.canvas_id,
            "canvas_node_id": self.node["id"],
            "prompt": prompt,
        }

    def _database_quota(self, media_type: str) -> int:
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            return getattr(quota, f"{media_type}_quota")

    def _task_count(self) -> int:
        with get_session() as session:
            return len(
                list(
                    session.scalars(
                        select(GenerationTask).where(GenerationTask.user_id == self.user["id"])
                    ).all()
                )
            )

    @staticmethod
    def _new_client() -> TestClient:
        app = FastAPI()
        include_routers(app)
        return TestClient(app)

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
        self.assertEqual(200, response.status_code)
        return response.json()["user"]

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
