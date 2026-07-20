from __future__ import annotations

import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Barrier
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.registration import (
    RegistrationForbiddenError,
    register_password_user,
    register_wechat_user,
)
from controllers.store import DatabaseStore, configure_store, store
from core.security import hash_password
from models.base import get_session
from models.identity import Identity
from models.invitation import InvitationCode
from models.quota import Quota, QuotaLedger
from models.user import User
from tests.mysql_test_database import MySQLTestDatabase


class RegistrationTransactionTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.mysql_database = MySQLTestDatabase("revid_test_registration_transaction")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        configure_store(DatabaseStore())
        self.admin_id = store.ensure_admin_user(
            "registration-admin",
            hash_password("StrongPass123!"),
        )["id"]
        store.registration_settings.update(
            {
                "registration_mode": "invite_only",
                "wechat_login_enabled": True,
                "default_quotas": {"text": 7, "image": 5, "video": 3},
            }
        )

    def test_duplicate_username_or_email_does_not_consume_valid_invitation(self) -> None:
        store.create_user(
            "Existing User",
            "",
            username="existing-user",
            email="existing@example.com",
            password_hash=hash_password("StrongPass123!"),
        )
        store.create_invitation_code("DUPLICATE-SAFE", 2, None, None, self.admin_id)
        app = FastAPI()
        include_routers(app)

        with TestClient(app) as client:
            duplicate_username = client.post(
                "/auth/register",
                json={
                    "username": "existing-user",
                    "email": "new@example.com",
                    "password": "StrongPass123!",
                    "invitation_code": "DUPLICATE-SAFE",
                },
            )
            duplicate_email = client.post(
                "/auth/register",
                json={
                    "username": "new-user",
                    "email": "existing@example.com",
                    "password": "StrongPass123!",
                    "invitation_code": "DUPLICATE-SAFE",
                },
            )

        self.assertEqual(409, duplicate_username.status_code)
        self.assertEqual("Username already exists", duplicate_username.json()["detail"])
        self.assertEqual(409, duplicate_email.status_code)
        self.assertEqual("Email already exists", duplicate_email.json()["detail"])
        self.assertEqual(0, self._invitation_used_count("DUPLICATE-SAFE"))

    def test_single_use_invitation_allows_exactly_one_concurrent_registration(self) -> None:
        store.create_invitation_code("ONE-WINNER", 1, None, None, self.admin_id)
        barrier = Barrier(2)

        def attempt(index: int) -> str:
            barrier.wait()
            try:
                register_password_user(
                    username=f"concurrent-{index}",
                    email=f"concurrent-{index}@example.com",
                    password_hash=hash_password("StrongPass123!"),
                    invitation_code="ONE-WINNER",
                )
            except RegistrationForbiddenError:
                return "rejected"
            return "created"

        with ThreadPoolExecutor(max_workers=2) as executor:
            outcomes = list(executor.map(attempt, range(2)))

        self.assertEqual(["created", "rejected"], sorted(outcomes))
        self.assertEqual(1, self._invitation_used_count("ONE-WINNER"))
        with get_session() as session:
            created_count = session.scalar(
                select(func.count(User.id)).where(User.username.like("concurrent-%"))
            )
        self.assertEqual(1, created_count)

    def test_password_registration_rolls_back_user_quota_and_invitation_on_failure(self) -> None:
        store.create_invitation_code("PASSWORD-ROLLBACK", 1, None, None, self.admin_id)
        before_counts = self._registration_row_counts()

        with patch(
            "controllers.registration._apply_default_quotas",
            side_effect=RuntimeError("forced quota failure"),
        ):
            with self.assertRaisesRegex(RuntimeError, "forced quota failure"):
                register_password_user(
                    username="rollback-password",
                    email="rollback-password@example.com",
                    password_hash=hash_password("StrongPass123!"),
                    invitation_code="PASSWORD-ROLLBACK",
                )

        self._assert_no_registration_rows("rollback-password", None)
        self.assertEqual(before_counts, self._registration_row_counts())
        self.assertEqual(0, self._invitation_used_count("PASSWORD-ROLLBACK"))

    def test_wechat_registration_rolls_back_user_and_identity_on_identity_failure(self) -> None:
        store.create_invitation_code("IDENTITY-ROLLBACK", 1, None, None, self.admin_id)
        before_counts = self._registration_row_counts()

        with patch(
            "controllers.registration._add_wechat_identity",
            side_effect=RuntimeError("forced identity failure"),
        ):
            with self.assertRaisesRegex(RuntimeError, "forced identity failure"):
                register_wechat_user(
                    self._profile("rollback-identity"),
                    "IDENTITY-ROLLBACK",
                )

        self._assert_no_registration_rows(None, "rollback-identity")
        self.assertEqual(before_counts, self._registration_row_counts())
        self.assertEqual(0, self._invitation_used_count("IDENTITY-ROLLBACK"))

    def test_wechat_registration_rolls_back_identity_and_quota_on_quota_failure(self) -> None:
        store.create_invitation_code("QUOTA-ROLLBACK", 1, None, None, self.admin_id)
        before_counts = self._registration_row_counts()

        with patch(
            "controllers.registration._apply_default_quotas",
            side_effect=RuntimeError("forced quota failure"),
        ):
            with self.assertRaisesRegex(RuntimeError, "forced quota failure"):
                register_wechat_user(
                    self._profile("rollback-quota"),
                    "QUOTA-ROLLBACK",
                )

        self._assert_no_registration_rows(None, "rollback-quota")
        self.assertEqual(before_counts, self._registration_row_counts())
        self.assertEqual(0, self._invitation_used_count("QUOTA-ROLLBACK"))

    @staticmethod
    def _profile(openid: str) -> dict:
        return {
            "openid": openid,
            "nickname": f"user-{openid}",
            "avatar_url": "",
            "unionid": None,
        }

    @staticmethod
    def _invitation_used_count(code: str) -> int:
        with get_session() as session:
            invitation = session.scalar(
                select(InvitationCode).where(InvitationCode.code == code)
            )
            if invitation is None:
                raise AssertionError(f"Invitation {code} was not found")
            return invitation.used_count

    def _assert_no_registration_rows(
        self,
        username: str | None,
        provider_user_id: str | None,
    ) -> None:
        with get_session() as session:
            user_id = None
            if username is not None:
                user_id = session.scalar(
                    select(User.id).where(User.username == username)
                )
                self.assertIsNone(user_id)
            if provider_user_id is not None:
                identity = session.scalar(
                    select(Identity).where(
                        Identity.provider == "wechat_open",
                        Identity.provider_user_id == provider_user_id,
                    )
                )
                self.assertIsNone(identity)
                matching_user = session.scalar(
                    select(User.id).where(User.nickname == f"user-{provider_user_id}")
                )
                self.assertIsNone(matching_user)
                user_id = matching_user
            if user_id is not None:
                self.assertIsNone(
                    session.scalar(select(Quota).where(Quota.user_id == user_id))
                )

    @staticmethod
    def _registration_row_counts() -> tuple[int, int, int, int]:
        with get_session() as session:
            return (
                session.scalar(select(func.count(User.id))) or 0,
                session.scalar(select(func.count(Identity.id))) or 0,
                session.scalar(select(func.count(Quota.id))) or 0,
                session.scalar(select(func.count(QuotaLedger.id))) or 0,
            )


if __name__ == "__main__":
    unittest.main()
