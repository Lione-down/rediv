from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.auth import _login_or_register_wechat
from controllers.store import DatabaseStore, configure_store, store
from core.security import hash_password
from database import close_db, init_db


class InvitationCodeFlowTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(db_path)
        configure_store(DatabaseStore())
        self.admin_id = store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))["id"]

    def tearDown(self) -> None:
        close_db()
        self.temp_dir.cleanup()

    def test_open_mode_ignores_invalid_invitation_code(self) -> None:
        store.registration_settings["registration_mode"] = "open"

        response = _login_or_register_wechat(self._profile("open-user"), "INVALID-CODE")

        self.assertEqual("user-open-user", response.user["nickname"])
        self.assertEqual(store.registration_settings["default_quotas"], response.quotas)

    def test_invite_only_rejects_missing_invitation_code(self) -> None:
        store.registration_settings["registration_mode"] = "invite_only"

        with self.assertRaises(HTTPException) as context:
            _login_or_register_wechat(self._profile("missing-code"), None)

        self.assertEqual(403, context.exception.status_code)
        self.assertEqual("Invalid invitation code", context.exception.detail)

    def test_invite_only_rejects_invalid_invitation_code(self) -> None:
        store.registration_settings["registration_mode"] = "invite_only"

        with self.assertRaises(HTTPException) as context:
            _login_or_register_wechat(self._profile("invalid-code"), "BAD-CODE")

        self.assertEqual(403, context.exception.status_code)
        self.assertEqual("Invalid invitation code", context.exception.detail)

    def test_invite_only_rejects_expired_invitation_code_with_offset_timezone(self) -> None:
        store.registration_settings["registration_mode"] = "invite_only"
        expired_at = (datetime.now(UTC) - timedelta(minutes=5)).astimezone(timezone(timedelta(hours=8))).isoformat()
        invitation = store.create_invitation_code("EXPIRED", 2, expired_at, None, self.admin_id)

        with self.assertRaises(HTTPException) as context:
            _login_or_register_wechat(self._profile("expired-code"), "EXPIRED")

        self.assertEqual(403, context.exception.status_code)
        self.assertEqual("Invalid invitation code", context.exception.detail)
        self.assertEqual(0, invitation["used_count"])

    def test_invite_only_rejects_exhausted_invitation_code(self) -> None:
        store.registration_settings["registration_mode"] = "invite_only"
        invitation = store.create_invitation_code("LIMIT1", 1, None, None, self.admin_id)
        invitation["used_count"] = 1

        with self.assertRaises(HTTPException) as context:
            _login_or_register_wechat(self._profile("used-up"), "LIMIT1")

        self.assertEqual(403, context.exception.status_code)
        self.assertEqual("Invalid invitation code", context.exception.detail)

    def test_closed_mode_rejects_new_user_registration(self) -> None:
        store.registration_settings["registration_mode"] = "closed"

        with self.assertRaises(HTTPException) as context:
            _login_or_register_wechat(self._profile("closed-user"), None)

        self.assertEqual(403, context.exception.status_code)
        self.assertEqual("Registration is closed", context.exception.detail)

    def test_closed_mode_allows_existing_user_login(self) -> None:
        store.registration_settings["registration_mode"] = "open"
        first_login = _login_or_register_wechat(self._profile("existing-user"), None)
        store.registration_settings["registration_mode"] = "closed"

        second_login = _login_or_register_wechat(self._profile("existing-user"), None)

        self.assertEqual(first_login.user["id"], second_login.user["id"])

    @staticmethod
    def _profile(openid: str) -> dict:
        return {
            "openid": openid,
            "nickname": f"user-{openid}",
            "avatar_url": "",
            "unionid": None,
        }


if __name__ == "__main__":
    unittest.main()
