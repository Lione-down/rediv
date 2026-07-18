from __future__ import annotations

import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api.router import include_routers
from controllers import generation_transactions as generation_controller
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.generation_task import GenerationTask
from models.quota import Quota
from settings.config import settings
from tests.mysql_test_database import MySQLTestDatabase


class _CountingImageProvider:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    async def generate_image(self, **kwargs) -> dict:
        self.calls.append(kwargs)
        return {
            "id": f"provider-image-{len(self.calls)}",
            "data": [{"url": "https://example.com/idempotent-image.png"}],
        }


class GenerationIdempotencyAdmissionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_generation_idempotency_admission")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = TestClient(self._app())
        store.registration_settings["registration_mode"] = "open"
        suffix = str(uuid4())
        self.user = self._register_user(f"generation-idempotency-{suffix}")
        self.headers = {"Authorization": f"Bearer {create_token({'sub': self.user['id'], 'role': 'user'})}"}
        self.project = store.create_project(self.user["id"], f"Idempotency {suffix}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.nodes = [
            store.create_node(self.project["id"], self.user["id"], "generation", {}, index * 400, 0, 320, 180)
            for index in range(3)
        ]
        self._settings = {
            "agnes_admission_global_limit": settings.agnes_admission_global_limit,
            "agnes_admission_per_user_limit": settings.agnes_admission_per_user_limit,
            "agnes_admission_image_limit": settings.agnes_admission_image_limit,
        }

    def tearDown(self) -> None:
        with get_session() as session:
            active_tasks = list(session.scalars(select(GenerationTask).where(
                GenerationTask.user_id == self.user["id"],
                GenerationTask.status.in_(("queued", "running")),
            )).all())
            for task in active_tasks:
                task.status = "failed"
                task.error_code = "test_cleanup"
                task.error_message = "Focused idempotency test cleanup"
            session.commit()
        self.client.close()
        for name, value in self._settings.items():
            setattr(settings, name, value)

    def test_duplicate_completed_delivery_returns_original_outcome_without_second_provider_call(self) -> None:
        provider = _CountingImageProvider()
        client_request_id = str(uuid4())
        payload = self._payload(self.nodes[0]["id"], client_request_id, "same request")
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            quota.image_quota = 1
            session.commit()

        with patch.object(backend_main, "_agnes", provider):
            first = self.client.post("/api/image-generate", json=payload, headers=self.headers)
            second = self.client.post("/api/image-generate", json=payload, headers=self.headers)

        self.assertEqual(200, first.status_code)
        self.assertEqual(200, second.status_code, second.text)
        self.assertEqual(1, len(provider.calls))
        self.assertEqual(first.json()["generation_task"]["id"], second.json()["generation_task"]["id"])
        self.assertEqual(client_request_id, second.json()["generation_task"]["client_request_id"])
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            count = session.scalar(select(func.count()).select_from(GenerationTask).where(
                GenerationTask.user_id == self.user["id"],
                GenerationTask.client_request_id == client_request_id,
            ))
        self.assertEqual(0, quota.image_quota)
        self.assertEqual(1, count)

    def test_request_id_reuse_with_different_prompt_fails_closed(self) -> None:
        provider = _CountingImageProvider()
        client_request_id = str(uuid4())
        with patch.object(backend_main, "_agnes", provider):
            first = self.client.post(
                "/api/image-generate",
                json=self._payload(self.nodes[0]["id"], client_request_id, "first prompt"),
                headers=self.headers,
            )
            conflict = self.client.post(
                "/api/image-generate",
                json=self._payload(self.nodes[0]["id"], client_request_id, "changed prompt"),
                headers=self.headers,
            )

        self.assertEqual(200, first.status_code)
        self.assertEqual(409, conflict.status_code)
        self.assertEqual("generation_request_mismatch", conflict.json()["detail"]["code"])
        self.assertEqual(1, len(provider.calls))

    def test_same_node_single_flight_and_global_capacity_fail_before_task_creation(self) -> None:
        settings.agnes_admission_global_limit = 1
        settings.agnes_admission_per_user_limit = 3
        settings.agnes_admission_image_limit = 3
        first = generation_controller.start_image_generation_request(
            user_id=self.user["id"], provider="agnes", model="agnes-image-2.1-flash",
            project_id=self.project["id"], origin_canvas_id=self.canvas_id,
            canvas_node_id=self.nodes[0]["id"], image_ids=None,
            request_parameters=self._request_parameters(), client_request_id=str(uuid4()),
            request_fingerprint="a" * 64,
        )
        with self.assertRaises(generation_controller.GenerationRequestInProgressError):
            generation_controller.start_image_generation_request(
                user_id=self.user["id"], provider="agnes", model="agnes-image-2.1-flash",
                project_id=self.project["id"], origin_canvas_id=self.canvas_id,
                canvas_node_id=self.nodes[0]["id"], image_ids=None,
                request_parameters=self._request_parameters(), client_request_id=str(uuid4()),
                request_fingerprint="b" * 64,
            )
        with self.assertRaises(generation_controller.GenerationProviderBusyError) as busy:
            generation_controller.start_image_generation_request(
                user_id=self.user["id"], provider="agnes", model="agnes-image-2.1-flash",
                project_id=self.project["id"], origin_canvas_id=self.canvas_id,
                canvas_node_id=self.nodes[1]["id"], image_ids=None,
                request_parameters=self._request_parameters(), client_request_id=str(uuid4()),
                request_fingerprint="c" * 64,
            )
        self.assertGreaterEqual(busy.exception.retry_after_seconds, 1)
        with get_session() as session:
            running = session.scalar(select(func.count()).select_from(GenerationTask).where(
                GenerationTask.user_id == self.user["id"],
                GenerationTask.status.in_(("queued", "running")),
            ))
        self.assertEqual(first.task["id"], first.task["id"])
        self.assertEqual(1, running)

    def test_media_capacity_is_atomic_across_competing_database_connections(self) -> None:
        settings.agnes_admission_global_limit = 3
        settings.agnes_admission_per_user_limit = 3
        settings.agnes_admission_image_limit = 1

        def start(index: int):
            return generation_controller.start_image_generation_request(
                user_id=self.user["id"], provider="agnes", model="agnes-image-2.1-flash",
                project_id=self.project["id"], origin_canvas_id=self.canvas_id,
                canvas_node_id=self.nodes[index]["id"], image_ids=None,
                request_parameters=self._request_parameters(), client_request_id=str(uuid4()),
                request_fingerprint=str(index + 1) * 64,
            )

        outcomes = []
        errors = []
        with ThreadPoolExecutor(max_workers=2) as executor:
            for future in [executor.submit(start, 0), executor.submit(start, 1)]:
                try:
                    outcomes.append(future.result())
                except Exception as error:
                    errors.append(error)
        self.assertEqual(1, len(outcomes))
        self.assertEqual(1, len(errors))
        self.assertIsInstance(errors[0], generation_controller.GenerationProviderBusyError)

    def _payload(self, node_id: str, client_request_id: str, prompt: str) -> dict:
        return {
            "client_request_id": client_request_id,
            "project_id": self.project["id"],
            "origin_canvas_id": self.canvas_id,
            "canvas_node_id": node_id,
            "prompt": prompt,
        }

    @staticmethod
    def _request_parameters() -> dict:
        return {
            "contract_version": 1, "media_type": "image", "model": "agnes-image-2.1-flash",
            "size": "1K", "aspect_ratio": "4:3", "image_ids": [],
        }

    @staticmethod
    def _app() -> FastAPI:
        app = FastAPI()
        include_routers(app)
        return app

    def _register_user(self, openid: str) -> dict:
        response = self.client.post("/auth/wechat/mock", json={
            "openid": openid, "nickname": openid, "avatar_url": "", "unionid": None,
            "invitation_code": None,
        })
        self.assertEqual(200, response.status_code)
        return response.json()["user"]


if __name__ == "__main__":
    unittest.main()
