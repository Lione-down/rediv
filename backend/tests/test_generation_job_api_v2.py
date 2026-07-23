from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.user import User
from tests.mysql_test_database import MySQLTestDatabase


class GenerationJobApiV2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_generation_job_api_v2")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)
        store.registration_settings["registration_mode"] = "open"
        suffix = str(uuid4())
        register = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": f"generation-job-api-{suffix}",
                "nickname": f"job-api-{suffix}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.assertEqual(200, register.status_code)
        self.user = register.json()["user"]
        token = create_token({"sub": self.user["id"], "role": "user"})
        self.headers = {"Authorization": f"Bearer {token}"}
        self.project = store.create_project(self.user["id"], f"Job API {suffix}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"],
            self.user["id"],
            "generation",
            {},
            0,
            0,
            320,
            180,
        )

    def tearDown(self) -> None:
        self.client.close()

    def _payload(self, *, client_request_id: str, prompt: str = "雨夜车站") -> dict:
        return {
            "client_request_id": client_request_id,
            "project_id": self.project["id"],
            "canvas_id": self.canvas_id,
            "node_id": self.node["id"],
            "media_type": "text",
            "provider_id": "agnes",
            "model_id": "agnes-2.0-flash",
            "input": {"prompt": prompt},
        }

    def test_submit_is_compact_idempotent_and_conflicts_on_changed_fingerprint(self) -> None:
        client_request_id = str(uuid4())
        first = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=client_request_id),
            headers=self.headers,
        )
        replay = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=client_request_id),
            headers=self.headers,
        )
        conflict = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=client_request_id, prompt="changed"),
            headers=self.headers,
        )

        self.assertEqual(202, first.status_code, first.text)
        self.assertEqual(202, replay.status_code, replay.text)
        self.assertEqual(first.json(), replay.json())
        self.assertEqual(
            {
                "job_id",
                "project_id",
                "canvas_id",
                "node_id",
                "media_type",
                "status",
                "model_id",
                "quota_revision",
                "version",
            },
            set(first.json()),
        )
        self.assertEqual("queued", first.json()["status"])
        self.assertEqual(409, conflict.status_code, conflict.text)
        self.assertEqual("generation_job_idempotency_conflict", conflict.json()["detail"]["code"])

    def test_idempotent_replay_precedes_new_admission_checks(self) -> None:
        client_request_id = str(uuid4())
        payload = self._payload(client_request_id=client_request_id)
        first = self.client.post(
            "/api/v2/generation-jobs",
            json=payload,
            headers=self.headers,
        )
        self.assertEqual(202, first.status_code, first.text)
        with get_session() as session:
            user = session.get(User, self.user["id"])
            user.generation_status = "frozen"
            session.commit()

        replay = self.client.post(
            "/api/v2/generation-jobs",
            json=payload,
            headers=self.headers,
        )

        self.assertEqual(202, replay.status_code, replay.text)
        self.assertEqual(first.json()["job_id"], replay.json()["job_id"])

    def test_status_delta_cancel_and_retry_never_return_internal_request_data(self) -> None:
        submit = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=str(uuid4())),
            headers=self.headers,
        )
        self.assertEqual(202, submit.status_code, submit.text)
        job_id = submit.json()["job_id"]

        status_response = self.client.get(
            f"/api/v2/generation-jobs/{job_id}",
            headers=self.headers,
        )
        delta_response = self.client.get(
            f"/api/v2/projects/{self.project['id']}/generation-jobs",
            params={"canvas_id": self.canvas_id, "limit": 100},
            headers=self.headers,
        )
        cancelled = self.client.post(
            f"/api/v2/generation-jobs/{job_id}/cancel",
            headers=self.headers,
        )
        retried = self.client.post(
            f"/api/v2/generation-jobs/{job_id}/retry",
            headers=self.headers,
        )

        self.assertEqual(200, status_response.status_code, status_response.text)
        self.assertEqual(200, delta_response.status_code, delta_response.text)
        self.assertEqual(200, cancelled.status_code, cancelled.text)
        self.assertEqual("cancelled", cancelled.json()["status"])
        self.assertEqual(200, retried.status_code, retried.text)
        self.assertEqual("queued", retried.json()["status"])
        self.assertGreater(retried.json()["version"], status_response.json()["version"])
        self.assertEqual([job_id], [item["job_id"] for item in delta_response.json()["items"]])
        dumped = str(
            {
                "status": status_response.json(),
                "delta": delta_response.json(),
                "cancel": cancelled.json(),
                "retry": retried.json(),
            }
        )
        for forbidden in (
            "request_parameters",
            "request_fingerprint",
            "provider_raw_response",
            "provider_request_snapshot",
        ):
            self.assertNotIn(forbidden, dumped)

    def test_delta_rejects_invalid_cursor_as_unprocessable(self) -> None:
        for cursor in ("%%%", "a"):
            with self.subTest(cursor=cursor):
                response = self.client.get(
                    f"/api/v2/projects/{self.project['id']}/generation-jobs",
                    params={"canvas_id": self.canvas_id, "after": cursor},
                    headers=self.headers,
                )

                self.assertEqual(422, response.status_code, response.text)
                self.assertEqual("Invalid generation job cursor", response.json()["detail"])

    def test_submit_rejects_model_outside_media_capability_authority(self) -> None:
        payload = self._payload(client_request_id=str(uuid4()))
        payload["media_type"] = "image"

        response = self.client.post(
            "/api/v2/generation-jobs",
            json=payload,
            headers=self.headers,
        )

        self.assertEqual(422, response.status_code, response.text)
        self.assertEqual(
            "Generation job model is not allowed for image",
            response.json()["detail"],
        )


if __name__ == "__main__":
    unittest.main()
