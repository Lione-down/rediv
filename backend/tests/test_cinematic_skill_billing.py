from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from api.generation_common import resolve_cinematic_generation_handoff
from api.provider_cost_acknowledgements import router

from core.cinematic_skill_billing import (
    CinematicSkillBillingError,
    acknowledgement_expiry,
    is_provider_acknowledged,
)
from core.security import current_user
from schemas.generation import CinematicGenerationHandoff


class CinematicSkillBillingTests(unittest.TestCase):
    def test_default_acknowledgement_is_24_hours_and_maximum_is_30_days(self):
        now = datetime(2026, 7, 18, 10, 0, tzinfo=UTC)
        self.assertEqual(now + timedelta(hours=24), acknowledgement_expiry(now=now, duration_hours=None))
        self.assertEqual(now + timedelta(days=30), acknowledgement_expiry(now=now, duration_hours=720))
        with self.assertRaises(CinematicSkillBillingError):
            acknowledgement_expiry(now=now, duration_hours=721)
        with self.assertRaises(CinematicSkillBillingError):
            acknowledgement_expiry(now=now, duration_hours=0)

    def test_acknowledgement_is_user_provider_isolated_and_expiry_fail_closed(self):
        now = datetime(2026, 7, 18, 10, 0, tzinfo=UTC)
        record = {
            "user_id": "user-a",
            "provider_id": "future-user-billed",
            "acknowledged_until": now + timedelta(hours=1),
            "cancelled_at": None,
        }
        self.assertTrue(is_provider_acknowledged(
            record,
            user_id="user-a",
            provider_id="future-user-billed",
            now=now,
        ))
        self.assertFalse(is_provider_acknowledged(record, user_id="user-b", provider_id="future-user-billed", now=now))
        self.assertFalse(is_provider_acknowledged(record, user_id="user-a", provider_id="other", now=now))
        self.assertFalse(is_provider_acknowledged(record, user_id="user-a", provider_id="future-user-billed", now=now + timedelta(hours=1)))
        self.assertFalse(is_provider_acknowledged(
            {**record, "cancelled_at": now},
            user_id="user-a",
            provider_id="future-user-billed",
            now=now,
        ))

    def test_authenticated_api_keeps_acknowledgement_user_provider_isolated(self):
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[current_user] = lambda: {"id": "user-a"}
        with patch("api.provider_cost_acknowledgements.acknowledgement_controller") as controller:
            controller.get_acknowledgement.return_value = {
                "user_id": "user-a", "provider_id": "future-provider",
                "acknowledged_until": None, "cancelled_at": None, "active": False,
            }
            controller.acknowledge_provider_cost.return_value = {
                "user_id": "user-a", "provider_id": "future-provider",
                "acknowledged_until": "2026-07-19T10:00:00Z", "cancelled_at": None, "active": True,
            }
            controller.cancel_acknowledgement.return_value = {
                "user_id": "user-a", "provider_id": "future-provider",
                "acknowledged_until": "2026-07-19T10:00:00Z", "cancelled_at": "2026-07-18T10:00:00Z", "active": False,
            }
            client = TestClient(app)
            self.assertFalse(client.get("/api/provider-cost-acknowledgements/future-provider").json()["active"])
            self.assertTrue(client.post(
                "/api/provider-cost-acknowledgements/future-provider", json={"duration_hours": 24},
            ).json()["active"])
            self.assertFalse(client.delete("/api/provider-cost-acknowledgements/future-provider").json()["active"])
            self.assertEqual(422, client.post(
                "/api/provider-cost-acknowledgements/future-provider", json={"duration_hours": 721},
            ).status_code)
            controller.acknowledge_provider_cost.assert_called_once_with("user-a", "future-provider", 24)
            client.close()

    @patch("api.generation_common.acknowledgement_controller.get_acknowledgement")
    @patch("api.generation_common.validate_cinematic_generation_handoff")
    @patch("api.generation_common.document_controller.get_document")
    def test_required_provider_missing_or_expired_acknowledgement_stops_before_transaction(
        self, get_document, validate_handoff, get_acknowledgement,
    ):
        get_document.return_value = {"revision": 1, "nodes": []}
        validate_handoff.return_value = {
            "prompt": "optimized", "image_ids": [], "request_digest": "a" * 64,
            "request_snapshot": {
                "canonical_request": {"skill_id": "revid.cinema-image"},
                "request_digest": "a" * 64,
            },
        }
        get_acknowledgement.return_value = {"active": False}
        handoff = CinematicGenerationHandoff.model_validate({
            "skill_id": "revid.cinema-image", "skill_version": 1, "canvas_revision": 1,
            "provider_id": "future-provider", "model_id": "future-model", "user_instruction": "prompt",
            "mentions": [], "generation_parameters": {"image_ids": [], "aspect_ratio": "4:3"},
            "submitted_preflight": {"requires_acknowledgement": True},
        })
        with self.assertRaises(HTTPException) as raised:
            resolve_cinematic_generation_handoff(
                handoff, user_id="user-a", project_id="project-a", canvas_id="canvas-a",
                media_type="image", provider_id="future-provider", model_id="future-model",
                prompt="optimized", image_ids=[], expected_control_parameters={"aspect_ratio": "4:3"},
            )
        self.assertEqual(409, raised.exception.status_code)
        get_acknowledgement.assert_called_once_with("user-a", "future-provider")


if __name__ == "__main__":
    unittest.main()
